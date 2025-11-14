# 🚀 PoN2 - Bereit für AlwaysData Deployment

## Status

✅ **Frontend**: Erfolgreich gebaut → `frontend/dist/`
⚠️  **Backend**: Muss auf dem Server gebaut werden (Prisma-Engine-Problem in lokaler Umgebung)
✅ **Deployment-Script**: Erstellt → `scripts/deploy-alwaysdata.sh`

## Warum muss das Backend auf dem Server gebaut werden?

Die Prisma-Engine-Binaries können in dieser lokalen Umgebung nicht heruntergeladen werden (403 Forbidden).
Auf dem alwaysdata-Server sollte dies kein Problem sein.

## 🎯 Deployment-Schritte auf AlwaysData

### 1. Per SSH zum Server verbinden

```bash
ssh [username]@ssh-[username].alwaysdata.net
```

### 2. Repository klonen oder pullen

Wenn noch nicht geklont:
```bash
cd ~/
git clone [YOUR_REPO_URL] pon2
cd pon2
```

Wenn bereits vorhanden:
```bash
cd ~/pon2
git pull origin claude/deploy-alwaysdata-01Aws7nuPqYCmonNru3qtUzc
```

### 3. Umgebungsvariablen konfigurieren

**Backend `.env` erstellen:**
```bash
cd ~/pon2/backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/pon2_production?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=8080
NODE_ENV="production"
JWT_SECRET="[GENERATE_RANDOM_STRING]"
JWT_EXPIRES_IN="7d"
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
DEFAULT_CASE_BUDGET_EUR=100
DEFAULT_MAX_API_CALLS_PER_SOURCE=50
LOG_LEVEL="info"
EOF
```

**Frontend `.env` erstellen:**
```bash
cd ~/pon2/frontend
cat > .env << 'EOF'
VITE_API_URL=https://[your-domain].alwaysdata.net/api
EOF
```

### 4. Deployment-Script ausführen

```bash
cd ~/pon2
chmod +x scripts/deploy-alwaysdata.sh
./scripts/deploy-alwaysdata.sh
```

Das Script führt automatisch aus:
- Installation aller Dependencies
- Prisma Client generieren
- Backend bauen
- Frontend bauen
- Datenbank-Setup (optional)

### 5. Backend mit PM2 starten

```bash
cd ~/pon2/backend
pm2 start dist/index.js --name pon2-backend
pm2 save
pm2 startup
```

### 6. Frontend konfigurieren

In alwaysdata Admin-Panel:
- **Web** > **Sites** > **Neue Site**
- **Typ**: Static files
- **Root**: `~/pon2/frontend/dist`

### 7. Verifizieren

```bash
# Backend Status prüfen
pm2 status
pm2 logs pon2-backend

# API testen
curl http://localhost:8080/health

# Frontend testen
curl https://[your-domain].alwaysdata.net
```

## 🔧 Fehlerbehebung

### Prisma-Fehler auf dem Server

Wenn Prisma-Generate auch auf dem Server fehlschlägt:
```bash
cd ~/pon2/backend
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

### Port bereits in Verwendung

```bash
pm2 stop pon2-backend
pm2 delete pon2-backend
pm2 start dist/index.js --name pon2-backend
```

### Datenbank-Verbindungsfehler

```bash
# Verbindung testen
psql $DATABASE_URL

# Schema neu anwenden
npm run db:push
```

## 📚 Weitere Dokumentation

Siehe `docs/deployment.md` für detaillierte Informationen zu:
- SSL/HTTPS Setup
- Nginx Reverse Proxy
- Backup-Strategie
- Performance-Optimierung
- Sicherheit

## 🎉 Nach erfolgreichem Deployment

Die App sollte unter folgenden URLs erreichbar sein:
- **Frontend**: `https://[your-domain].alwaysdata.net`
- **Backend API**: `https://[your-domain].alwaysdata.net/api`
- **Health Check**: `https://[your-domain].alwaysdata.net/api/health`

## 📝 Wichtige Hinweise

1. **Sicherheit**: Generieren Sie einen starken `JWT_SECRET`!
2. **API-Keys**: Fügen Sie echte API-Keys für OpenAI/Anthropic hinzu
3. **Database**: Stellen Sie sicher, dass PostgreSQL >= 14 mit pgvector Extension
4. **Node.js**: Version >= 18.0 erforderlich

---

**Viel Erfolg! Bei Fragen siehe `docs/deployment.md` oder die Logs mit `pm2 logs`**
