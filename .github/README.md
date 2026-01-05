# GitHub Actions Workflows

Dieses Repository nutzt GitHub Actions für automatisches Deployment auf AlwaysData.

## 📁 Workflow-Dateien

- `workflows/deploy.yml` - Hauptworkflow für Frontend- und Backend-Deployment

## 🚀 Quick Start

### 1. GitHub Secrets konfigurieren

Siehe [SECRETS.md](./SECRETS.md) für die komplette Liste der erforderlichen Secrets.

**Kurzübersicht:**
```
FTP_SERVER=ftp-y-b.alwaysdata.net
FTP_USERNAME=y-b_pon2
FTP_PASSWORD=<your-password>

SSH_HOST=ssh-y-b.alwaysdata.net
SSH_USERNAME=y-b_pon2
SSH_PASSWORD=<your-password>
```

### 2. Automatisches Deployment aktivieren

Sobald die Secrets konfiguriert sind, wird bei jedem Push auf `main` automatisch deployed:

```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

### 3. Manuelles Deployment

Alternativ kannst du das Deployment manuell triggern:

1. Gehe zu **Actions** in deinem GitHub Repository
2. Wähle den Workflow **Deploy to AlwaysData**
3. Klicke auf **Run workflow**
4. Wähle den Branch (meist `main`)
5. Klicke auf **Run workflow**

## 🔄 Deployment-Prozess

### Frontend (Job 1)
1. ✅ Code auschecken
2. ✅ Node.js 18 installieren
3. ✅ Build-Artefakte säubern
4. ✅ Dependencies installieren
5. ✅ Frontend bauen (mit `VITE_API_URL`)
6. ✅ Via FTP nach AlwaysData hochladen

### Backend (Job 2)
1. ✅ Via SSH verbinden
2. ✅ Git Pull
3. ✅ Dependencies installieren
4. ✅ Prisma Client generieren
5. ✅ Datenbank-Migrationen ausführen
6. ✅ Backend bauen
7. ✅ PM2 Restart
8. ✅ Health-Check
9. ✅ Deployment verifizieren

## 📊 Workflow-Status ansehen

- Gehe zu **Actions** in deinem Repository
- Klicke auf den letzten Workflow-Run
- Sieh dir die Logs für Frontend- und Backend-Deployment an

## 🛠️ Workflow anpassen

Die Workflow-Datei liegt unter `.github/workflows/deploy.yml`.

**Wichtige Konfigurationen:**

```yaml
# Frontend-Build
env:
  VITE_API_URL: https://api.pon2.yellow-plane.com/api

# FTP Server-Pfad
server-dir: /www/pon2/frontend/dist/

# SSH Script
script: |
  cd ~/pon2
  git pull origin main
  # ...
```

## 🔒 Sicherheit

- **Secrets werden niemals in Logs angezeigt**
- Passwörter und API-Keys sind in GitHub Secrets gespeichert
- SSH und FTP nutzen verschlüsselte Verbindungen
- `.env`-Dateien auf dem Server werden nicht überschrieben

## 📝 Troubleshooting

### Deployment schlägt fehl

1. Prüfe die Logs in GitHub Actions
2. Prüfe die Secrets-Konfiguration
3. Teste SSH/FTP-Verbindung manuell:

```bash
# SSH testen
ssh y-b_pon2@ssh-y-b.alwaysdata.net

# FTP testen
ftp ftp-y-b.alwaysdata.net
```

### PM2 startet nicht

```bash
# Auf Server via SSH
pm2 list
pm2 logs pon2-backend
pm2 restart pon2-backend
```

### Health-Check schlägt fehl

```bash
# Auf Server
curl http://localhost:8080/health

# Logs prüfen
pm2 logs pon2-backend --lines 50
```

## 📚 Weitere Dokumentation

- [SECRETS.md](./SECRETS.md) - GitHub Secrets Konfiguration
- [../ALWAYSDATA_DEPLOYMENT.md](../ALWAYSDATA_DEPLOYMENT.md) - Allgemeine Deployment-Anleitung
- [../README.md](../README.md) - Projekt-Dokumentation

---

**Status**: ✅ GitHub Actions Workflow ready for deployment
