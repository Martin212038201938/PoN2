# PoN2 - Lokale Entwicklungsumgebung einrichten

## Voraussetzungen

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis (optional, für Job-Queue)
- Git

## 1. Repository klonen

```bash
git clone [REPO_URL]
cd PoN2
```

## 2. Dependencies installieren

```bash
# Root dependencies
npm install

# Installiert automatisch alle Workspace-Dependencies (backend, frontend)
```

## 3. PostgreSQL-Datenbank einrichten

### Datenbank erstellen:

```bash
# PostgreSQL starten
# macOS/Homebrew:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql

# Datenbank erstellen
createdb pon2_dev

# Optional: pgvector Extension installieren
psql pon2_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Wenn pgvector nicht verfügbar ist, kommentieren Sie die Extension in `backend/prisma/schema.prisma` aus:

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  // extensions = [pgvector(map: "vector")]  # Auskommentieren
}
```

## 4. Redis einrichten (optional)

```bash
# macOS/Homebrew:
brew install redis
brew services start redis

# Linux:
sudo apt install redis-server
sudo systemctl start redis
```

Redis wird für die Job-Queue (BullMQ) benötigt. Wenn nicht verfügbar, können Recherche-Jobs synchron ausgeführt werden.

## 5. Umgebungsvariablen konfigurieren

### Backend:

```bash
cd backend
cp .env.example .env
```

Bearbeiten Sie `backend/.env`:

```env
DATABASE_URL="postgresql://localhost:5432/pon2_dev?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=3000
NODE_ENV="development"
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"
OPENAI_API_KEY=""  # Optional
ANTHROPIC_API_KEY=""  # Optional
LOG_LEVEL="info"
```

### Frontend:

```bash
cd ../frontend
cp .env.example .env
```

Bearbeiten Sie `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## 6. Datenbank initialisieren

```bash
cd backend

# Prisma Client generieren
npm run db:generate

# Datenbank-Schema erstellen
npm run db:push

# Seed-Daten laden (Demo-Fälle und -User)
npm run db:seed
```

Nach dem Seed-Script sind folgende Demo-User verfügbar:

- **Admin**: `admin@pon2.de` / `password123`
- **Detektiv**: `detective@pon2.de` / `password123`

## 7. Entwicklungsserver starten

### Option 1: Alles gleichzeitig (empfohlen)

```bash
# Im Root-Verzeichnis
npm run dev
```

Startet:
- Backend API auf http://localhost:3000
- Frontend auf http://localhost:5173

### Option 2: Separat starten

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Terminal 3 - Worker (optional):
```bash
cd backend
npm run worker
```

## 8. Anwendung testen

1. Öffnen Sie http://localhost:5173
2. Melden Sie sich an mit:
   - Email: `detective@pon2.de`
   - Passwort: `password123`
3. Erkunden Sie das Dashboard und die Demo-Fälle

## 9. Prisma Studio (Datenbank-GUI)

```bash
cd backend
npm run db:studio
```

Öffnet Prisma Studio auf http://localhost:5555 - eine Web-GUI zum Durchsuchen und Bearbeiten der Datenbank.

## 10. Entwicklungs-Workflows

### Datenbank-Schema ändern:

1. Bearbeiten Sie `backend/prisma/schema.prisma`
2. Führen Sie aus:
   ```bash
   npm run db:push
   npm run db:generate
   ```

### Neue API-Route hinzufügen:

1. Erstellen Sie Controller in `backend/src/controllers/`
2. Erstellen Sie Route in `backend/src/routes/`
3. Registrieren Sie Route in `backend/src/index.ts`

### Neue Frontend-Page hinzufügen:

1. Erstellen Sie Component in `frontend/src/pages/`
2. Fügen Sie Route in `frontend/src/App.tsx` hinzu
3. Fügen Sie Navigation in `frontend/src/components/Layout.tsx` hinzu

## 11. Testing

```bash
# Backend Tests
cd backend
npm test

# Frontend Tests
cd frontend
npm test

# Linting
npm run lint
```

## 12. Build für Produktion

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Troubleshooting

### Port bereits belegt:

```bash
# Backend-Port ändern
# In backend/.env: PORT=3001

# Frontend-Port ändern
# In frontend/vite.config.ts: server.port = 5174
```

### Prisma-Fehler:

```bash
# Client neu generieren
cd backend
rm -rf node_modules/.prisma
npm run db:generate

# Datenbank zurücksetzen
npm run db:push -- --force-reset
npm run db:seed
```

### Module nicht gefunden:

```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

## Nützliche Befehle

```bash
# Datenbank zurücksetzen
cd backend
npx prisma migrate reset

# Logs anschauen
tail -f backend/logs/combined.log

# Alle Prozesse stoppen
pkill -f "node|vite"
```

## Weitere Ressourcen

- [Prisma Dokumentation](https://www.prisma.io/docs)
- [React Query Dokumentation](https://tanstack.com/query/latest)
- [Vite Dokumentation](https://vitejs.dev)
- [Express Dokumentation](https://expressjs.com)

---

**Viel Erfolg bei der Entwicklung! 🚀**
