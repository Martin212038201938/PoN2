# PoN2 - Deployment Guide für alwaysdata

## Überblick

Dieses Dokument beschreibt die Einrichtung und das Deployment der PoN2-App auf einem alwaysdata-Server.

## Voraussetzungen

- alwaysdata-Account mit SSH-Zugang
- Node.js >= 18.0
- PostgreSQL-Datenbank
- Redis (optional, für Job-Queue)

## 1. PostgreSQL-Datenbank einrichten

### In alwaysdata Admin-Panel:

1. Gehen Sie zu **Datenbanken** > **PostgreSQL**
2. Erstellen Sie eine neue Datenbank:
   - Name: `pon2_production`
   - Encoding: `UTF8`
   - Version: >= 14.0
3. Notieren Sie sich:
   - Datenbankname
   - Benutzername
   - Passwort
   - Host
   - Port

### pgvector Extension installieren:

Verbinden Sie sich per SSH und installieren Sie die pgvector Extension:

```bash
# In psql:
CREATE EXTENSION IF NOT EXISTS vector;
```

Wenn pgvector nicht verfügbar ist, kontaktieren Sie alwaysdata Support oder verwenden Sie eine alternative Vektorsuche-Lösung.

## 2. Projekt auf Server deployen

### Per SSH verbinden:

```bash
ssh [username]@ssh-[username].alwaysdata.net
```

### Repository klonen:

```bash
cd ~/
git clone [YOUR_REPO_URL] pon2
cd pon2
```

### Dependencies installieren:

```bash
npm install
```

## 3. Umgebungsvariablen konfigurieren

### Backend (.env):

Erstellen Sie `backend/.env`:

```bash
cd ~/pon2/backend
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/pon2_production?schema=public"

# Redis (optional)
REDIS_HOST="localhost"
REDIS_PORT=6379

# Server
PORT=8080
NODE_ENV="production"

# JWT
JWT_SECRET="[GENERIEREN SIE EINEN SICHEREN RANDOM STRING]"
JWT_EXPIRES_IN="7d"

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# External Integrations
GENEALOGY_NET_API_KEY=""
MYHERITAGE_API_KEY=""
PERPLEXITY_API_KEY=""

# Budget Limits
DEFAULT_CASE_BUDGET_EUR=100
DEFAULT_MAX_API_CALLS_PER_SOURCE=50

# Logging
LOG_LEVEL="info"
EOF
```

**Wichtig**: Ersetzen Sie alle Platzhalter mit echten Werten!

### Frontend (.env):

Erstellen Sie `frontend/.env`:

```bash
cd ~/pon2/frontend
cat > .env << 'EOF'
VITE_API_URL=https://[your-domain].alwaysdata.net/api
EOF
```

## 4. Datenbank initialisieren

```bash
cd ~/pon2/backend

# Prisma Client generieren
npm run db:generate

# Datenbank-Schema anwenden
npm run db:push

# Seed-Daten laden (optional, für Demo)
npm run db:seed
```

## 5. Backend und Frontend bauen

### Backend kompilieren:

```bash
cd ~/pon2/backend
npm run build
```

### Frontend bauen:

```bash
cd ~/pon2/frontend
npm run build
```

## 6. alwaysdata Website konfigurieren

### In alwaysdata Admin-Panel:

1. Gehen Sie zu **Web** > **Sites**
2. Erstellen Sie eine neue Site oder bearbeiten Sie eine bestehende:
   - **Typ**: Node.js
   - **Version**: 18.x oder höher
   - **Befehl**: `node ~/pon2/backend/dist/index.js`
   - **Arbeitsverzeichnis**: `~/pon2/backend`
   - **Umgebungsvariablen**: Fügen Sie die .env-Variablen hinzu

3. Für das Frontend (statische Dateien):
   - Erstellen Sie eine **zweite Site** oder einen **Alias**
   - **Typ**: Static files
   - **Root**: `~/pon2/frontend/dist`

### Alternative: Nginx Reverse Proxy

Wenn Sie Nginx verwenden, erstellen Sie eine Konfiguration:

```nginx
# Frontend (static)
location / {
    root /home/[username]/pon2/frontend/dist;
    try_files $uri $uri/ /index.html;
}

# Backend API
location /api {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 7. Process Management mit PM2 (empfohlen)

### PM2 installieren:

```bash
npm install -g pm2
```

### Backend starten:

```bash
cd ~/pon2/backend
pm2 start dist/index.js --name pon2-backend
pm2 save
pm2 startup
```

### Worker starten (optional):

```bash
pm2 start dist/workers/index.js --name pon2-worker
pm2 save
```

### PM2 Status prüfen:

```bash
pm2 list
pm2 logs pon2-backend
```

## 8. Logs und Monitoring

### Logs ansehen:

```bash
# PM2 Logs
pm2 logs pon2-backend

# Anwendungs-Logs
tail -f ~/pon2/backend/logs/combined.log
tail -f ~/pon2/backend/logs/error.log
```

### Log-Rotation einrichten:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 9. SSL/HTTPS einrichten

In alwaysdata Admin-Panel:

1. Gehen Sie zu **Web** > **SSL**
2. Aktivieren Sie **Let's Encrypt** für Ihre Domain
3. Erzwingen Sie HTTPS-Redirects

## 10. Backup-Strategie

### Datenbank-Backup:

Erstellen Sie ein Backup-Script `~/pon2/scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups/pon2
mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > $BACKUP_DIR/pon2_$DATE.sql
gzip $BACKUP_DIR/pon2_$DATE.sql

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### Cron-Job einrichten:

```bash
crontab -e

# Täglich um 2 Uhr morgens
0 2 * * * ~/pon2/scripts/backup-db.sh
```

## 11. Updates deployen

### Update-Prozess:

```bash
cd ~/pon2

# Code aktualisieren
git pull

# Dependencies aktualisieren
npm install

# Backend neu bauen
cd backend
npm run build

# Frontend neu bauen
cd ../frontend
npm run build

# Prisma Client aktualisieren
cd ../backend
npm run db:generate

# Datenbank migrieren (wenn nötig)
npm run db:migrate

# Backend neu starten
pm2 restart pon2-backend
```

### Zero-Downtime Deployment:

```bash
# Erstellen Sie ein Deployment-Script
cat > ~/pon2/scripts/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd ~/pon2
git pull

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building backend..."
cd backend
npm run build

echo "🎨 Building frontend..."
cd ../frontend
npm run build

echo "🔄 Updating database..."
cd ../backend
npm run db:generate

echo "♻️  Restarting backend..."
pm2 restart pon2-backend --update-env

echo "✅ Deployment completed!"
EOF

chmod +x ~/pon2/scripts/deploy.sh
```

## 12. Fehlerbehebung

### Backend startet nicht:

```bash
# Logs prüfen
pm2 logs pon2-backend

# Datenbank-Verbindung testen
cd ~/pon2/backend
npx prisma db pull

# Port-Konflikte prüfen
netstat -tlnp | grep 8080
```

### Frontend zeigt API-Fehler:

1. Prüfen Sie `frontend/.env` - ist `VITE_API_URL` korrekt?
2. Prüfen Sie CORS-Einstellungen in `backend/src/index.ts`
3. Prüfen Sie Nginx/Proxy-Konfiguration

### Datenbank-Verbindungsfehler:

```bash
# Verbindung testen
psql $DATABASE_URL

# Firewall-Regeln prüfen (alwaysdata sollte intern erlauben)
```

## 13. Performance-Optimierung

### PostgreSQL-Tuning:

- Erhöhen Sie `shared_buffers`
- Aktivieren Sie Connection Pooling
- Erstellen Sie Indizes für häufige Queries

### Node.js Optimierung:

```bash
# In PM2
pm2 start dist/index.js --name pon2-backend -i max  # Cluster-Modus
```

### Frontend Caching:

Nginx Caching-Header:

```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 14. Sicherheit

### Checklist:

- ✅ JWT_SECRET ist ein starker, zufälliger String
- ✅ DATABASE_URL enthält keine Credentials in Logs
- ✅ HTTPS ist aktiviert und erzwungen
- ✅ API-Keys sind in .env, nicht im Code
- ✅ CORS ist korrekt konfiguriert
- ✅ Rate-Limiting ist aktiviert (siehe backend/src/index.ts)
- ✅ Input-Validation ist implementiert (Zod)

### Firewall:

```bash
# Nur erforderliche Ports öffnen
# SSH (22), HTTP (80), HTTPS (443)
# PostgreSQL sollte nur intern erreichbar sein
```

## Support

Bei Problemen:

1. Prüfen Sie die Logs: `pm2 logs`
2. Testen Sie die Datenbank-Verbindung
3. Verifizieren Sie alle Umgebungsvariablen
4. Kontaktieren Sie alwaysdata Support bei Infrastruktur-Problemen

---

**Viel Erfolg mit PoN2! 🎉**
