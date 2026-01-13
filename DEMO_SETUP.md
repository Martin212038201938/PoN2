# PoN2 Demo Setup Guide

## Problem-Diagnose

Das Portal funktionierte nicht, weil:
1. **Fehlende Seed-Datei** - Demo-Benutzer existierten nicht in der Datenbank
2. Die LoginPage zeigte `admin@pon2.de` / `detective@pon2.de`, aber diese Accounts waren nie erstellt worden

## Behobene Probleme

- [x] Seed-Datei `backend/db/seed.ts` erstellt mit:
  - 3 Demo-Benutzern (Admin + 2 Detektive)
  - 5 Beispiel-Cases in verschiedenen Status
  - 6 Beispiel-Personen mit Verknüpfungen
  - Kontaktdaten, Beziehungen, Research Waves
  - Beispiel-Artifacts und Dokumente

---

## Schnellstart: Portal demo-fähig machen

### Schritt 1: Datenbank vorbereiten

```bash
# SSH auf Server (AlwaysData)
ssh user@ssh-user.alwaysdata.net

# In das Projektverzeichnis wechseln
cd ~/pon2

# Dependencies installieren (falls nötig)
npm install

# Datenbank-Schema initialisieren
cd backend
npm run db:init

# Demo-Daten einfügen
npm run db:seed
```

### Schritt 2: Backend starten

```bash
# Mit PM2 (Produktion)
pm2 start ecosystem.config.cjs --env production
pm2 logs pon2-backend

# Oder direkt (Entwicklung)
cd backend
npm run dev
```

### Schritt 3: Frontend deployen

```bash
cd frontend
npm run build
# Statische Dateien nach /www/ kopieren
```

---

## Demo-Zugänge

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@pon2.de | password123 |
| Detektiv | detective@pon2.de | password123 |
| Detektiv 2 | detective2@pon2.de | password123 |

---

## Demo-Workflow: Was man zeigen kann

### 1. Login & Dashboard
- Login mit `detective@pon2.de`
- Dashboard zeigt Statistiken: 5 Fälle, verschiedene Status

### 2. Case Management
- **Fallliste**: Filtert nach Status (NEU, IN_RECHERCHE, etc.)
- **Fall-Details**: z.B. "ERB-2024-001 - Heinrich Müller"
  - Übersicht mit Verstorbenen-Daten
  - Verknüpfte Personen (potentielle Erben)
  - Research Artifacts (Recherche-Ergebnisse)
  - Dokumente (Korrespondenz)

### 3. Personen-Ansicht
- Potentielle Erben mit Wahrscheinlichkeit
- Kontaktdaten (Adresse, E-Mail, Telefon)
- Beziehungen (Geschwister, Eltern, Kinder)

### 4. Neuen Fall anlegen
- "Neuer Fall" Button
- Formular mit Verstorbenen-Daten ausfüllen
- Speichern und zeigen

---

## Technische Anforderungen

### Server (AlwaysData)
- Node.js 18+
- PostgreSQL-Datenbank
- PM2 für Prozess-Management

### Umgebungsvariablen (backend/.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/pon2
JWT_SECRET=sicheres-geheimnis-hier
NODE_ENV=production
# PORT wird NICHT in .env gesetzt - kommt von ecosystem.config.cjs (8100)
```

### Port-Konfiguration
**WICHTIG:** Der Port ist einheitlich auf **8100** gesetzt in:
- `ecosystem.config.cjs` (PM2)
- `backend/src/index.ts` (Fallback)
- `start-backend.sh` (Startup-Script)

AlwaysData Reverse Proxy muss auf Port **8100** zeigen!

---

## Bekannte Einschränkungen (für Demo erwähnen)

| Feature | Status | Hinweis |
|---------|--------|---------|
| Login/Auth | Funktioniert | Vollständig implementiert |
| Dashboard | Funktioniert | Zeigt echte Statistiken |
| Fallliste | Funktioniert | Mit Filterung & Pagination |
| Fall-Details | Funktioniert | Alle Tabs sichtbar |
| Personen | Funktioniert | Anzeige implementiert |
| Research starten | UI vorhanden | Backend-Logik als Platzhalter |
| AI-Integration | Geplant | Noch nicht implementiert |
| Strategie-Ausführung | Geplant | Datenbank-Schema ready |

**Für die Demo:** Fokus auf Case-Management und Personen-Ansicht legen.

---

## Troubleshooting

### Login schlägt fehl mit "Invalid credentials"
```bash
# Prüfen ob Users existieren
cd backend
npm run db:seed
```

### Backend startet nicht
```bash
# Logs prüfen
pm2 logs pon2-backend

# Häufige Probleme:
# - DATABASE_URL nicht gesetzt
# - PostgreSQL nicht erreichbar
# - Port bereits belegt
```

### Frontend zeigt Netzwerk-Fehler
```bash
# CORS_ORIGIN in .env prüfen
# API-URL in frontend/src/services/api.ts prüfen
```

---

## Zusammenfassung

Nach Ausführung von `npm run db:seed` sollte das Portal vollständig funktionieren:
1. Login mit Demo-Accounts möglich
2. Dashboard mit echten Zahlen
3. 5 Beispiel-Fälle zum Durchklicken
4. Personen mit Kontaktdaten und Beziehungen
