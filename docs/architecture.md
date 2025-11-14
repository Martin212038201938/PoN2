# PoN2 - Architektur-Dokumentation

## System-Übersicht

PoN2 ist eine Full-Stack-Webanwendung zur professionellen Erbenermittlung mit KI-gestützten Rechercheagenten.

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  React + TypeScript + TailwindCSS + TanStack Query  │
└─────────────────┬───────────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────────┐
│                    Backend                           │
│    Node.js + Express + TypeScript + Prisma ORM     │
├──────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Auth     │  │ Case     │  │ Research       │   │
│  │ Service  │  │ Service  │  │ Agent Service  │   │
│  └──────────┘  └──────────┘  └────────────────┘   │
└──────────┬────────────────┬──────────────┬─────────┘
           │                │              │
    ┌──────▼─────┐   ┌─────▼─────┐   ┌───▼────┐
    │ PostgreSQL │   │   Redis   │   │External│
    │ + pgvector │   │  (BullMQ) │   │  APIs  │
    └────────────┘   └───────────┘   └────────┘
```

## Tech-Stack

### Backend
- **Runtime**: Node.js >= 18.0
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 14+ (mit pgvector Extension)
- **Job Queue**: BullMQ + Redis
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **State Management**:
  - Zustand (global state)
  - TanStack Query (server state)
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Charts**: Recharts

## Datenbank-Schema

### Kernentitäten

```mermaid
erDiagram
    USER ||--o{ CASE : creates
    USER ||--o{ CASE : assigned_to
    CASE ||--o{ PERSON_CASE : has
    PERSON ||--o{ PERSON_CASE : belongs_to
    PERSON ||--o{ CONTACT_INFO : has
    PERSON ||--o{ RELATIONSHIP : from
    PERSON ||--o{ RELATIONSHIP : to
    CASE ||--o{ RESEARCH_WAVE : has
    RESEARCH_WAVE ||--o{ STRATEGY_EXECUTION : contains
    STRATEGY ||--o{ STRATEGY_EXECUTION : executes
    RESEARCH_WAVE ||--o{ RESEARCH_ARTIFACT : produces
    CASE ||--o{ DOCUMENT : has
    CASE ||--o{ COMMENT : has
```

### Wichtige Relationen

1. **Case ↔ Person**: Many-to-Many über `PersonCase`
   - Eine Person kann in mehreren Fällen vorkommen
   - Ein Fall hat mehrere Personen (Erblasser, potenzielle Erben, Verwandte)

2. **Person ↔ Relationship**: Self-referential Many-to-Many
   - Modelliert Verwandtschaftsbeziehungen
   - `fromPerson` und `toPerson` können beliebige Personen sein

3. **Case → ResearchWave → StrategyExecution → ResearchArtifact**
   - Hierarchische Struktur der Recherche-Durchführung
   - Tracking von Kosten und Erfolgsmetriken auf jeder Ebene

## API-Architektur

### RESTful Endpoints

#### Authentication
```
POST   /api/auth/register     - Neuen Benutzer registrieren
POST   /api/auth/login        - Anmelden und Token erhalten
GET    /api/auth/me           - Aktuellen Benutzer abrufen
```

#### Cases
```
GET    /api/cases                      - Liste aller Fälle (mit Pagination/Filter)
GET    /api/cases/:id                  - Einzelnen Fall abrufen
POST   /api/cases                      - Neuen Fall erstellen
PUT    /api/cases/:id                  - Fall aktualisieren
DELETE /api/cases/:id                  - Fall löschen
POST   /api/cases/:id/start-research   - Recherche starten
POST   /api/cases/:id/close            - Fall schließen
GET    /api/cases/:id/persons          - Personen des Falls
GET    /api/cases/:id/artifacts        - Recherche-Artefakte
GET    /api/cases/:id/documents        - Dokumente
GET    /api/cases/:id/research-waves   - Recherchewellen
```

#### Dashboard
```
GET    /api/dashboard/stats   - Aggregierte Statistiken
```

### Middleware-Stack

1. **helmet**: Security-Header
2. **cors**: Cross-Origin Resource Sharing
3. **express.json**: Body Parsing
4. **Logger**: Request-Logging (Winston)
5. **Authentication**: JWT-Validierung (für geschützte Routes)
6. **Validation**: Zod-Schema-Validierung
7. **Error Handler**: Zentrale Fehlerbehandlung

## Frontend-Architektur

### Verzeichnisstruktur

```
frontend/src/
├── components/          # Wiederverwendbare UI-Komponenten
│   └── Layout.tsx      # Hauptlayout mit Navigation
├── pages/              # Route-basierte Page-Komponenten
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── CasesPage.tsx
│   ├── CaseDetailPage.tsx
│   └── CreateCasePage.tsx
├── services/           # API-Services
│   └── api.ts         # Axios-Client mit Interceptors
├── stores/            # Zustand State Management
│   └── authStore.ts   # Auth-State (User, Token, Login/Logout)
├── hooks/             # Custom React Hooks
├── types/             # TypeScript Type Definitions
├── utils/             # Utility-Funktionen
│   ├── cn.ts         # className utility (clsx + tailwind-merge)
│   └── format.ts     # Formatierungs-Funktionen (Date, Currency)
├── App.tsx           # Root-Komponente mit Routing
├── main.tsx          # Entry Point
└── index.css         # Global Styles + Tailwind
```

### State Management

#### Server State (TanStack Query)
- API-Daten (Cases, Persons, Artifacts)
- Automatisches Caching und Refetching
- Optimistic Updates
- Loading/Error States

Beispiel:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['cases', page, filters],
  queryFn: () => api.getCases({ page, ...filters }),
});
```

#### Client State (Zustand)
- Authentication State (User, Token)
- UI State (Modal-Status, Theme, etc.)

Beispiel:
```typescript
const { user, login, logout } = useAuthStore();
```

### Routing

Protected Routes werden durch die `ProtectedRoute`-Komponente gesichert:

```typescript
<Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="dashboard" element={<DashboardPage />} />
  <Route path="cases" element={<CasesPage />} />
  ...
</Route>
```

## Recherche-Agenten-System (geplant)

### Architektur

```
┌─────────────────────────────────────────┐
│        Research Orchestrator            │
│  (analysiert Fall, plant Strategien)    │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴──────────┐
       │    BullMQ Queue   │
       └───────┬───────────┘
               │
    ┌──────────┴──────────────┐
    │                         │
┌───▼────┐              ┌─────▼─────┐
│Worker 1│              │ Worker N  │
└───┬────┘              └─────┬─────┘
    │                         │
    └────────┬─────────────────┘
             │
    ┌────────▼─────────────┐
    │  Integration Layer   │
    ├──────────────────────┤
    │ • Genealogy.net      │
    │ • MyHeritage         │
    │ • Perplexity AI      │
    │ • Custom Scrapers    │
    └──────────────────────┘
```

### Strategy-Pattern

Jede `Strategy` definiert:
- **Prompt-Template**: Mit Platzhaltern für Falldaten
- **Target-Integration**: Welcher Service genutzt wird
- **Parameter**: Suchtiefe, Filter, etc.
- **Success-Metrics**: Bewertung der Ergebnisse

Beispiel-Strategy:
```javascript
{
  name: "Grundrecherche genealogische Portale",
  promptTemplate: "Suche nach {{lastName}} {{firstName}}, geboren {{birthDate}} in {{birthPlace}}",
  targetIntegration: "genealogy.net",
  parameters: {
    searchDepth: 2,
    includeVariants: true
  }
}
```

### Worker-Prozess

1. **Job abholen** aus Queue
2. **Strategy laden** und Template rendern
3. **API-Call** an Integration
4. **Parsing** der Rohdaten
5. **Extraktion** strukturierter Daten (Personen, Relationen)
6. **Artifact speichern** in DB
7. **Kosten tracken** und Budget prüfen
8. **Erfolg bewerten** und Strategy-Metriken aktualisieren

### KI-Integration für Strategiegenerierung

```
┌──────────────────────────────────────────┐
│         Strategy Generator AI            │
│  (OpenAI/Claude)                         │
├──────────────────────────────────────────┤
│ Input:                                   │
│ • Bisherige Artefakte                    │
│ • Erfolgreiche Strategien ähnlicher Fälle│
│ • Fall-Kontext                           │
├──────────────────────────────────────────┤
│ Output:                                  │
│ • Neue kreative Suchstrategien           │
│ • Priorisierung bestehender Strategien   │
│ • Hypothesen zu Erbenketten              │
└──────────────────────────────────────────┘
```

## Sicherheit

### Authentication & Authorization

- **JWT-Token**: HttpOnly empfohlen (oder localStorage mit XSS-Schutz)
- **RBAC**: Detective vs. Admin Rollen
- **Password Hashing**: bcrypt mit Salt
- **Token-Expiry**: Konfigurierbar (default 7 Tage)

### Input Validation

Alle API-Eingaben werden validiert mit **Zod**:

```typescript
const createCaseSchema = z.object({
  body: z.object({
    caseNumber: z.string().min(1),
    deceasedFirstName: z.string().min(1),
    // ...
  }),
});
```

### SQL Injection Protection

Prisma ORM verwendet parameterisierte Queries → automatischer Schutz.

### XSS Protection

- Helmet Security Headers
- React automatisches Escaping
- Content Security Policy (CSP) in Produktion empfohlen

## Performance-Optimierung

### Backend

1. **Database Indexing**:
   - Indizes auf häufig gesuchten Feldern (caseNumber, status, email)
   - Composite Indizes für Filter-Kombinationen

2. **Connection Pooling**: Prisma nutzt automatisch Connection Pooling

3. **Pagination**: Alle Listen-Endpoints mit Pagination

4. **Caching**: Redis für Session-Cache und Job-Queue

### Frontend

1. **Code Splitting**: React Lazy Loading für Routes
2. **Image Optimization**: Lazy Loading, WebP-Format
3. **TanStack Query Caching**: Reduzierte API-Calls
4. **Memoization**: React.memo für teure Komponenten

### Vektorsuche

pgvector ermöglicht semantische Suche über Artefakte:

```sql
-- Ähnliche Artefakte finden
SELECT * FROM research_artifacts
ORDER BY embedding <-> '[query_embedding]'
LIMIT 10;
```

## Monitoring & Logging

### Logs

- **Winston Logger**: Strukturierte Logs in JSON
- **Log-Levels**: error, warn, info, debug
- **Log-Files**:
  - `logs/error.log` - Nur Fehler
  - `logs/combined.log` - Alle Logs
- **Log-Rotation**: Empfohlen mit PM2 oder Winston-Daily-Rotate-File

### Metriken

Zu überwachende Metriken:
- API-Response-Zeiten
- Datenbank-Query-Performance
- Job-Queue-Länge
- API-Kosten pro Fall
- Erfolgsrate von Strategien

## Erweiterbarkeit

### Neue Integration hinzufügen

1. **Integration-Eintrag** in DB erstellen
2. **Adapter-Klasse** implementieren:
   ```typescript
   interface IntegrationAdapter {
     search(query: string, params: any): Promise<SearchResult>;
     parseResponse(raw: any): StructuredData;
   }
   ```
3. **Worker** registriert Adapter
4. **Strategien** können neue Integration nutzen

### Neue Features

Das modulare Design ermöglicht einfaches Hinzufügen von:
- Neuen Datenquellen (Integrationen)
- Neuen Recherche-Strategien
- Neuen Dokumenten-Templates
- Neuen Visualisierungen (Stammbaum-Graph)
- Export-Formaten (PDF, Excel)

## Deployment-Optionen

1. **alwaysdata** (primär dokumentiert)
2. **Vercel/Netlify** (Frontend) + **Heroku/Railway** (Backend)
3. **Docker** + **Docker Compose**
4. **Kubernetes** (für Skalierung)

Siehe `docs/deployment.md` für Details.

---

**Diese Architektur ist darauf ausgelegt, skalierbar, wartbar und erweiterbar zu sein.**
