# GitHub Secrets Configuration

Um das automatische Deployment via GitHub Actions zu aktivieren, müssen folgende Secrets in den Repository-Einstellungen konfiguriert werden:

## Zugriff auf GitHub Secrets

1. Gehe zu deinem Repository auf GitHub
2. Klicke auf **Settings** (Einstellungen)
3. Navigiere zu **Secrets and variables** → **Actions**
4. Klicke auf **New repository secret**

---

## 📋 Erforderliche Secrets

### FTP Secrets (für Frontend-Deployment)

| Secret Name | Wert | Beschreibung |
|------------|------|--------------|
| `FTP_SERVER` | `ftp-y-b.alwaysdata.net` | AlwaysData FTP-Server |
| `FTP_USERNAME` | `y-b_pon2` | AlwaysData FTP-Benutzername |
| `FTP_PASSWORD` | `hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9` | AlwaysData FTP-Passwort |

### SSH Secrets (für Backend-Deployment)

| Secret Name | Wert | Beschreibung |
|------------|------|--------------|
| `SSH_HOST` | `ssh-y-b.alwaysdata.net` | AlwaysData SSH-Host |
| `SSH_USERNAME` | `y-b_pon2` | AlwaysData SSH-Benutzername |
| `SSH_PASSWORD` | `hHHUGGNMPOewGrtTh467642gKhthwhj75fs3h9` | AlwaysData SSH-Passwort |

---

## ✅ Secrets-Checkliste

- [ ] FTP_SERVER
- [ ] FTP_USERNAME
- [ ] FTP_PASSWORD
- [ ] SSH_HOST
- [ ] SSH_USERNAME
- [ ] SSH_PASSWORD

---

## 🔧 ENV-Variablen auf AlwaysData

Die folgenden Environment-Variablen werden **NICHT** als GitHub Secrets gespeichert, sondern direkt auf dem AlwaysData-Server in `~/pon2/backend/.env` konfiguriert:

- `DATABASE_URL` - PostgreSQL Connection String
- `JWT_SECRET` - JWT Secret Key
- `NODE_ENV` - Sollte auf `production` gesetzt sein
- `HOST` - Sollte auf `0.0.0.0` gesetzt sein
- `PORT` - Wird automatisch von AlwaysData gesetzt
- `CORS_ORIGIN` - Frontend-Domain
- `OPENAI_API_KEY` - OpenAI API Key
- `ANTHROPIC_API_KEY` - Anthropic/Claude API Key
- Weitere API-Keys (siehe `ALWAYSDATA_DEPLOYMENT.md`)

Diese Variablen bleiben auf dem Server und werden **nicht** bei jedem Deployment überschrieben.

---

## 🚀 Workflow-Trigger

Der Deployment-Workflow wird automatisch ausgelöst bei:

1. **Push auf main Branch**: Jeder Push auf `main` triggert das Deployment
2. **Manueller Trigger**: Via GitHub Actions UI → "Run workflow"

---

## 📊 Deployment-Ablauf

### Frontend-Deployment:
1. Code auschecken
2. Node.js installieren
3. Dependencies installieren
4. Frontend bauen (mit `VITE_API_URL`)
5. Via FTP nach `/www/pon2/frontend/dist/` hochladen

### Backend-Deployment:
1. Via SSH auf AlwaysData-Server verbinden
2. Git Pull in `~/pon2`
3. Dependencies installieren
4. Prisma Client generieren
5. Datenbank-Migrationen ausführen
6. Backend bauen
7. PM2 Restart (oder Start falls nicht läuft)
8. Health-Check durchführen

---

## 🔍 Troubleshooting

### Deployment schlägt fehl

1. **FTP-Fehler**: Prüfe FTP-Credentials und Server-Pfad
2. **SSH-Fehler**: Prüfe SSH-Credentials
3. **PM2-Fehler**: PM2 möglicherweise nicht installiert auf Server
4. **Migration-Fehler**: Prüfe Datenbank-Verbindung und Migrations-Status

### Logs ansehen

- GitHub Actions Logs: Repository → Actions → Letzter Workflow-Run
- PM2 Logs auf Server: `ssh y-b_pon2@ssh-y-b.alwaysdata.net` → `pm2 logs pon2-backend`

---

## 📝 Notizen

- Das Frontend wird via FTP deployed (schneller für statische Dateien)
- Das Backend wird via SSH deployed (benötigt npm install, migrations, pm2 restart)
- Die `.env`-Datei auf dem Server wird **NICHT** überschrieben
- Bei jedem Deployment wird ein Health-Check durchgeführt
- Migrations werden mit `migrate:prod` ausgeführt (keine interaktiven Prompts)

---

**Letzte Aktualisierung**: 2026-01-05
