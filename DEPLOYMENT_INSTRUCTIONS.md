# PoN2 - AlwaysData Deployment Instructions

## Quick Start

SSH in den AlwaysData Server und führe folgendes aus:

```bash
ssh y-b_pon2@ssh-y-b.alwaysdata.net
# Passwort: hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9

# Deployment-Script direkt ausführen:
curl -s https://raw.githubusercontent.com/Martin212038201938/PoN2/claude/deploy-pon2-alwaysdata-018EkqmRp1zpHFjyVp6P1Xvg/scripts/deploy-to-alwaysdata.sh | bash
```

## Oder manuell:

```bash
# 1. Repository klonen
cd ~
git clone https://github.com/Martin212038201938/PoN2.git pon2
cd pon2

# 2. Deployment ausführen
bash scripts/deploy-to-alwaysdata.sh
```

## Nach dem Deployment

### 1. AlwaysData Website konfigurieren

#### Backend (Node.js)
- Gehe zu **Web** > **Sites**
- Erstelle eine neue Site:
  - **Name**: pon2-backend
  - **Typ**: Node.js
  - **Version**: 18.x oder höher
  - **Befehl**: `pm2 start ~/pon2/backend/dist/index.js --name pon2-backend`
  - **Port**: 8080
  - **Domain**: api.pon2.yellow-plane.com (oder Subdomain deiner Wahl)

#### Frontend (Static Files)
- Erstelle eine zweite Site:
  - **Name**: pon2-frontend
  - **Typ**: Static files
  - **Root**: `~/pon2/frontend/dist`
  - **Domain**: pon2.yellow-plane.com

#### Reverse Proxy Setup (Alternative)
Falls du einen Reverse Proxy verwendest:

```nginx
# Frontend
location / {
    root /home/y-b_pon2/pon2/frontend/dist;
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

### 2. API Keys konfigurieren

Bearbeite `~/pon2/backend/.env` und füge deine API Keys hinzu:

```bash
nano ~/pon2/backend/.env
```

Ersetze die Platzhalter:
- `OPENAI_API_KEY="sk-..."`
- `ANTHROPIC_API_KEY="sk-ant-..."`

Dann Backend neu starten:
```bash
pm2 restart pon2-backend
```

### 3. SSL/HTTPS aktivieren

- Gehe zu **Web** > **SSL**
- Aktiviere **Let's Encrypt** für deine Domain
- Erzwinge HTTPS-Redirects

### 4. Datenbank testen

```bash
cd ~/pon2/backend
npx prisma studio
```

Oder direkt mit psql:
```bash
psql postgresql://y-b_pon2:PASSWORD@postgresql-y-b.alwaysdata.net:5432/y-b_pon2_production
```

## Updates deployen

Nach der initialen Installation, für zukünftige Updates:

```bash
ssh y-b_pon2@ssh-y-b.alwaysdata.net
cd ~/pon2
bash scripts/deploy.sh
```

## PM2 Befehle

```bash
# Status anzeigen
pm2 list

# Logs anschauen
pm2 logs pon2-backend

# Backend neu starten
pm2 restart pon2-backend

# Backend stoppen
pm2 stop pon2-backend

# Backend starten
pm2 start pon2-backend
```

## Troubleshooting

### Backend startet nicht

```bash
# Logs prüfen
pm2 logs pon2-backend --lines 100

# Manuell testen
cd ~/pon2/backend
node dist/index.js
```

### Datenbank-Verbindungsfehler

```bash
# Datenbank-Verbindung testen
cd ~/pon2/backend
npx prisma db pull
```

### Frontend zeigt weiße Seite

1. Prüfe Browser-Konsole auf Fehler
2. Prüfe `VITE_API_URL` in `frontend/.env`
3. Prüfe CORS-Einstellungen im Backend

## Konfiguration

### Datenbank Details
- **Host**: postgresql-y-b.alwaysdata.net
- **Database**: y-b_pon2_production
- **User**: y-b_pon2
- **Port**: 5432

### Domain
- **Frontend**: https://pon2.yellow-plane.com
- **Backend API**: https://pon2.yellow-plane.com/api

### Backend
- **Port**: 8080
- **Process Manager**: PM2
- **Log Location**: `~/.pm2/logs/`

## Support

Bei Problemen:
1. Prüfe PM2 Logs: `pm2 logs pon2-backend`
2. Prüfe AlwaysData Logs im Admin-Panel
3. Teste Datenbank-Verbindung
4. Verifiziere alle Umgebungsvariablen

---

**Deployment erstellt am**: 2025-11-15
**Git Branch**: claude/deploy-pon2-alwaysdata-018EkqmRp1zpHFjyVp6P1Xvg
