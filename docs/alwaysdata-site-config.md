# alwaysdata Site-Konfiguration für PoN2

## Schritt 1: Datenbank erstellen

SSH-Verbindung:
```bash
ssh y-b@ssh-y-b.alwaysdata.net "createdb pon2_prod"
```

Oder über das alwaysdata Admin-Panel:
1. Gehe zu **Datenbanken** > **PostgreSQL**
2. Klicke auf "Hinzufügen"
3. Name: `pon2_prod`
4. Encoding: `UTF8`

## Schritt 2: Site für Backend (Node.js) konfigurieren

### Im alwaysdata Admin-Panel:

1. Gehe zu **Web** > **Sites**
2. Klicke auf "Hinzufügen"

**Konfiguration:**
- **Name**: `PoN2 Backend`
- **Adressen**: `PoN2.yellow-plane.com`
- **Typ**: `Node.js`
- **Version**: `18` oder höher
- **Kommando**: `pm2 start ~/pon2/backend/dist/index.js --name pon2-backend --no-daemon`
- **Arbeitsverzeichnis**: `/home/y-b/pon2/backend`

**Umgebungsvariablen** (optional, falls nicht über .env):
```
NODE_ENV=production
PORT=3000
```

**Erweiterte Einstellungen:**
- **Neustart bei Änderung**: Aktiviert
- **Fehler-Log**: `/home/y-b/pon2/logs/error.log`

## Schritt 3: Static Files für Frontend konfigurieren

### Option A: Nginx Reverse Proxy (empfohlen)

Im alwaysdata Admin-Panel unter **Web** > **Sites** > **Erweitert**:

```nginx
# Frontend (React Static Files)
location / {
    root /home/y-b/pon2/frontend/dist;
    try_files $uri $uri/ /index.html;

    # Caching für Assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API Proxy
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# WebSocket Support (falls benötigt)
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

### Option B: Separate Sites

Falls Nginx nicht verfügbar ist, erstelle zwei separate Sites:

**Frontend Site:**
- **Name**: `PoN2 Frontend`
- **Adressen**: `PoN2.yellow-plane.com`
- **Typ**: `Statische Dateien`
- **Root**: `/home/y-b/pon2/frontend/dist`

**Backend Site:**
- **Name**: `PoN2 Backend API`
- **Adressen**: `api.PoN2.yellow-plane.com` (Subdomain)
- **Typ**: `Node.js`
- **Kommando**: siehe Schritt 2

Dann Frontend `.env.production` anpassen:
```
VITE_API_URL=https://api.PoN2.yellow-plane.com/api
```

## Schritt 4: SSL/HTTPS aktivieren

1. Gehe zu **Web** > **SSL/TLS**
2. Wähle die Domain `PoN2.yellow-plane.com`
3. Aktiviere **Let's Encrypt** (kostenlos)
4. Aktiviere **HTTPS erzwingen**

## Schritt 5: PM2 Setup (Alternative zum Site-Kommando)

Falls du PM2 manuell verwenden möchtest:

```bash
ssh y-b@ssh-y-b.alwaysdata.net
cd ~/pon2

# PM2 global installieren
npm install -g pm2

# Backend starten
cd backend
pm2 start dist/index.js --name pon2-backend

# PM2 beim Boot starten
pm2 startup
pm2 save

# Status prüfen
pm2 list
pm2 logs pon2-backend
```

**Wichtig:** Wenn du PM2 manuell verwendest, ändere die Site-Konfiguration:
- **Typ**: `Apache custom`
- **Kommando**: `# PM2 läuft bereits`

## Schritt 6: Domain DNS konfigurieren

Falls `PoN2.yellow-plane.com` eine Subdomain ist:

1. Gehe zu deinem DNS-Provider
2. Erstelle einen **CNAME** Record:
   - **Name**: `PoN2`
   - **Ziel**: `y-b.alwaysdata.net`
   - **TTL**: `3600`

Oder für A-Record:
1. Hole die IP von alwaysdata:
   ```bash
   dig y-b.alwaysdata.net +short
   ```
2. Erstelle einen **A** Record:
   - **Name**: `PoN2`
   - **IP**: `[IP von alwaysdata]`

## Schritt 7: Health Check

Nach dem Deployment, prüfe:

```bash
# Backend Health Check
curl https://PoN2.yellow-plane.com/api/health

# Frontend lädt
curl -I https://PoN2.yellow-plane.com

# PM2 Status
ssh y-b@ssh-y-b.alwaysdata.net "pm2 status"
```

## Schritt 8: Monitoring und Logs

### Logs ansehen:
```bash
ssh y-b@ssh-y-b.alwaysdata.net

# PM2 Logs
pm2 logs pon2-backend

# Application Logs
tail -f ~/pon2/backend/logs/combined.log
tail -f ~/pon2/backend/logs/error.log
```

### PM2 Monitoring:
```bash
pm2 monit
```

### Log Rotation:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Troubleshooting

### Backend startet nicht:
```bash
# Logs prüfen
ssh y-b@ssh-y-b.alwaysdata.net "pm2 logs pon2-backend --lines 50"

# Datenbank-Verbindung testen
ssh y-b@ssh-y-b.alwaysdata.net "cd ~/pon2/backend && npx prisma db pull"

# Port-Konflikte
ssh y-b@ssh-y-b.alwaysdata.net "netstat -tlnp | grep 3000"
```

### Frontend zeigt Fehler:
1. Prüfe Browser Console
2. Prüfe `VITE_API_URL` in `frontend/.env.production`
3. Prüfe CORS-Einstellungen im Backend
4. Prüfe Nginx Proxy-Konfiguration

### 502 Bad Gateway:
- Backend ist nicht gestartet → `pm2 restart pon2-backend`
- Falscher Port im Proxy → Prüfe nginx config
- Firewall blockiert → Kontaktiere alwaysdata Support

## Quick Commands

```bash
# Deploy ausführen
./deploy.sh

# Backend neu starten
ssh y-b@ssh-y-b.alwaysdata.net "pm2 restart pon2-backend"

# Logs ansehen
ssh y-b@ssh-y-b.alwaysdata.net "pm2 logs pon2-backend --lines 100"

# Status prüfen
ssh y-b@ssh-y-b.alwaysdata.net "pm2 status"
```

## Automatisiertes Deployment

Nach dem ersten Setup kannst du einfach deployen mit:

```bash
./deploy.sh
```

Das Script führt automatisch aus:
1. ✅ Code Sync
2. ✅ Dependencies Installation
3. ✅ Build (Backend + Frontend)
4. ✅ Database Migration
5. ✅ PM2 Restart
6. ✅ Health Check

---

**Viel Erfolg! 🚀**
