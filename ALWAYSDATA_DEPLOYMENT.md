# PoN2 - AlwaysData Deployment Guide

## 📋 Quick Reference

### Start Command für AlwaysData Node.js Site

```bash
npm install && npm run db:generate && npm run start:prod
```

**Oder alternativ (wenn Dependencies schon installiert):**
```bash
npm run start:prod
```

---

## 🔐 Environment-Variablen (Backend)

### Erforderliche ENV-Variablen für AlwaysData

```bash
# Database
DATABASE_URL="postgresql://y-b_pon2:hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9@postgresql-y-b.alwaysdata.net:5432/y-b_pon2_production?schema=public"

# Server
HOST=0.0.0.0
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://pon2.yellow-plane.com

# JWT
JWT_SECRET=57UjURKALW2kWtGA/5Z54nrLZLB93NodmFwPShIx8Ao=
JWT_EXPIRES_IN=7d

# AI Services (MÜSSEN ERSETZT WERDEN!)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# External Integrations (Optional)
GENEALOGY_NET_API_KEY=
MYHERITAGE_API_KEY=
PERPLEXITY_API_KEY=

# Budget Limits
DEFAULT_CASE_BUDGET_EUR=100
DEFAULT_MAX_API_CALLS_PER_SOURCE=50

# Logging
LOG_LEVEL=info

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Wichtige Hinweise zu ENV-Variablen:

1. **PORT**: AlwaysData setzt automatisch die PORT-Variable. Der Backend-Server bindet an diese.
2. **HOST**: Muss auf `0.0.0.0` gesetzt sein, damit AlwaysData den Server erreichen kann.
3. **CORS_ORIGIN**: Muss auf die Frontend-Domain zeigen (`https://pon2.yellow-plane.com`).
4. **DATABASE_URL**: Bereits konfiguriert für AlwaysData PostgreSQL.
5. **AI Keys**: MÜSSEN mit echten API-Keys ersetzt werden!

---

## 🌐 Frontend Environment-Variablen

```bash
VITE_API_URL=https://api.pon2.yellow-plane.com/api
```

**Wichtig**: Das Frontend muss auf die Backend-API-Domain zeigen (`api.pon2.yellow-plane.com`), nicht auf die Frontend-Domain!

---

## 🚀 AlwaysData Site-Konfiguration

### Backend (Node.js Site)

1. Gehe zu **Web** > **Sites** im AlwaysData Admin-Panel
2. Erstelle eine neue Site oder bearbeite eine bestehende:
   - **Name**: `pon2-backend`
   - **Typ**: Node.js
   - **Version**: 18.x oder höher
   - **Arbeitsverzeichnis**: `/home/y-b_pon2/pon2/backend`
   - **Befehl**: `npm run start:prod`
   - **Domain**: `api.pon2.yellow-plane.com`
   - **Umgebungsvariablen**: Füge alle oben genannten ENV-Variablen hinzu

### Frontend (Static Files Site)

1. Erstelle eine zweite Site:
   - **Name**: `pon2-frontend`
   - **Typ**: Static files (Apache)
   - **Root-Verzeichnis**: `/home/y-b_pon2/pon2/frontend/dist`
   - **Domain**: `pon2.yellow-plane.com`

### SSL/HTTPS

1. Gehe zu **Web** > **SSL**
2. Aktiviere **Let's Encrypt** für beide Domains:
   - `pon2.yellow-plane.com`
   - `api.pon2.yellow-plane.com`
3. Aktiviere "HTTPS erzwingen"

---

## 📦 Deployment-Prozess

### Erstmaliges Deployment

```bash
# SSH-Verbindung
ssh y-b_pon2@ssh-y-b.alwaysdata.net
# Passwort: hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9

# Deployment-Script ausführen
cd ~
git clone https://github.com/Martin212038201938/PoN2.git pon2
cd pon2
bash scripts/deploy-to-alwaysdata.sh
```

### Updates deployen

```bash
ssh y-b_pon2@ssh-y-b.alwaysdata.net
cd ~/pon2
bash scripts/deploy.sh
```

---

## 🔍 Health Check Endpoint

Der Backend-Server hat einen `/health` Endpoint, der den Server-Status überprüft:

**URL**: `https://api.pon2.yellow-plane.com/health`

**Erfolgreiche Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T12:00:00.000Z",
  "uptime": 1234.56,
  "environment": "production",
  "database": "connected"
}
```

**Fehler-Response (503):**
```json
{
  "status": "error",
  "timestamp": "2026-01-05T12:00:00.000Z",
  "uptime": 1234.56,
  "environment": "production",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

---

## 🛠️ Troubleshooting

### Backend startet nicht

```bash
# PM2 Logs ansehen
pm2 logs pon2-backend

# Manuell testen
cd ~/pon2/backend
npm run start:prod

# Environment-Variablen prüfen
cat ~/pon2/backend/.env
```

### Datenbank-Verbindungsfehler

```bash
# Datenbank-Verbindung testen
cd ~/pon2/backend
npx prisma db pull

# Direkt mit psql verbinden
psql "postgresql://y-b_pon2:hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9@postgresql-y-b.alwaysdata.net:5432/y-b_pon2_production"
```

### Frontend zeigt weiße Seite / API-Fehler

1. **Browser-Konsole prüfen**: F12 → Console
2. **CORS-Fehler**:
   - Prüfe `CORS_ORIGIN` in Backend `.env`
   - Muss auf Frontend-Domain zeigen
3. **API-URL falsch**:
   - Prüfe `VITE_API_URL` in Frontend `.env`
   - Muss auf `https://api.pon2.yellow-plane.com/api` zeigen

### CORS-Fehler beheben

Wenn im Browser folgende Fehler erscheinen:
```
Access to XMLHttpRequest at 'https://api.pon2.yellow-plane.com/api/...'
from origin 'https://pon2.yellow-plane.com' has been blocked by CORS policy
```

**Lösung:**
```bash
# Backend .env anpassen
ssh y-b_pon2@ssh-y-b.alwaysdata.net
nano ~/pon2/backend/.env

# Sicherstellen, dass CORS_ORIGIN gesetzt ist:
CORS_ORIGIN=https://pon2.yellow-plane.com

# Backend neu starten
cd ~/pon2/backend
pm2 restart pon2-backend
```

---

## 📊 PM2 Befehle

```bash
# Status anzeigen
pm2 list

# Logs anschauen (live)
pm2 logs pon2-backend

# Logs der letzten 100 Zeilen
pm2 logs pon2-backend --lines 100

# Backend neu starten
pm2 restart pon2-backend

# Backend neu starten mit neuen ENV-Variablen
pm2 restart pon2-backend --update-env

# Backend stoppen
pm2 stop pon2-backend

# Backend starten
pm2 start pon2-backend

# Backend aus PM2 entfernen
pm2 delete pon2-backend

# PM2 Konfiguration speichern (auto-restart nach Reboot)
pm2 save
pm2 startup
```

---

## 🔄 Update-Workflow

Nach Code-Änderungen:

```bash
# 1. Lokal committen und pushen
git add .
git commit -m "Update XYZ"
git push

# 2. Auf Server deployen
ssh y-b_pon2@ssh-y-b.alwaysdata.net
cd ~/pon2
bash scripts/deploy.sh
```

Das Deploy-Script macht automatisch:
- Git Pull
- Dependencies installieren
- Backend bauen
- Frontend bauen
- Prisma Client generieren
- Backend neu starten

---

## 📱 URLs & Zugänge

### Live-URLs
- **Frontend**: https://pon2.yellow-plane.com
- **Backend API**: https://api.pon2.yellow-plane.com
- **Health Check**: https://api.pon2.yellow-plane.com/health

### SSH-Zugang
```bash
ssh y-b_pon2@ssh-y-b.alwaysdata.net
Passwort: hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9
```

### PostgreSQL-Datenbank
```
Host: postgresql-y-b.alwaysdata.net
Port: 5432
Database: y-b_pon2_production
User: y-b_pon2
Password: hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9
```

### Demo-Zugänge (nach Seed)
```
Admin:
Email: admin@pon2.de
Passwort: password123

Detektiv:
Email: detective@pon2.de
Passwort: password123
```

---

## 🔒 Sicherheits-Checkliste

- [ ] JWT_SECRET ist ein sicherer Random-String (bereits generiert)
- [ ] HTTPS ist aktiviert und erzwungen
- [ ] API-Keys sind nicht im Code, nur in .env
- [ ] CORS ist korrekt konfiguriert (nur Frontend-Domain erlaubt)
- [ ] Database-URL ist nicht in Logs sichtbar
- [ ] Production-Mode aktiviert (`NODE_ENV=production`)

---

## 📝 Wichtige Hinweise

1. **API-Keys**: Die Platzhalter `sk-...` und `sk-ant-...` MÜSSEN mit echten API-Keys ersetzt werden!
2. **PORT**: AlwaysData setzt automatisch die PORT-Variable. Der Server bindet daran.
3. **HOST**: Muss `0.0.0.0` sein, damit AlwaysData den Server erreichen kann.
4. **Domains**:
   - Frontend: `pon2.yellow-plane.com`
   - Backend: `api.pon2.yellow-plane.com`
5. **PM2**: Der Backend-Server läuft mit PM2 Process Manager für automatische Restarts.

---

## 🎯 Nächste Schritte nach Deployment

1. **API-Keys hinzufügen**:
   ```bash
   ssh y-b_pon2@ssh-y-b.alwaysdata.net
   nano ~/pon2/backend/.env
   # Ersetze sk-... mit echten Keys
   pm2 restart pon2-backend
   ```

2. **Health Check testen**:
   ```bash
   curl https://api.pon2.yellow-plane.com/health
   ```

3. **Frontend testen**:
   - Öffne https://pon2.yellow-plane.com
   - Teste Login mit Demo-Zugängen

4. **Datenbank seed** (optional):
   ```bash
   cd ~/pon2/backend
   npm run db:seed
   ```

---

**Deployment erstellt am**: 2026-01-05
**Status**: Ready for Production ✅
