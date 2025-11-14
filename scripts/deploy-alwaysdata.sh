#!/bin/bash

################################################################################
# PoN2 Deployment Script für Alwaysdata
#
# Dieses Script automatisiert den Deployment-Prozess auf den Alwaysdata-Server
#
# Voraussetzungen:
# - SSH-Key für y-b@ssh-y-b.alwaysdata.net ist konfiguriert
# - rsync ist installiert
# - Node.js und npm sind lokal installiert
################################################################################

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfiguration
SSH_HOST="ssh-y-b.alwaysdata.net"
SSH_USER="y-b"
REMOTE_PATH="~/www"  # Passe dies an dein Alwaysdata-Verzeichnis an
REMOTE_BACKEND_PATH="$REMOTE_PATH/backend"
REMOTE_FRONTEND_PATH="$REMOTE_PATH/frontend"

# Logging Funktionen
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${GREEN}==>${NC} $1\n"
}

# Prüfe ob SSH-Verbindung funktioniert
check_ssh_connection() {
    log_step "Prüfe SSH-Verbindung..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "${SSH_USER}@${SSH_HOST}" exit 2>/dev/null; then
        log_info "SSH-Verbindung erfolgreich"
        return 0
    else
        log_error "SSH-Verbindung fehlgeschlagen"
        log_error "Stelle sicher, dass dein SSH-Key für ${SSH_USER}@${SSH_HOST} konfiguriert ist"
        return 1
    fi
}

# Frontend bauen
build_frontend() {
    log_step "Baue Frontend..."
    npm run build --workspace=frontend
    log_info "Frontend erfolgreich gebaut"
}

# Backend kompilieren
build_backend() {
    log_step "Kompiliere Backend..."
    npm run build --workspace=backend
    log_info "Backend erfolgreich kompiliert"
}

# Dateien per rsync hochladen
deploy_files() {
    log_step "Lade Dateien auf Server hoch..."

    # Frontend deployen
    log_info "Deploye Frontend..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.env' \
        --exclude '*.log' \
        frontend/dist/ \
        "${SSH_USER}@${SSH_HOST}:${REMOTE_FRONTEND_PATH}/"

    # Backend deployen
    log_info "Deploye Backend..."
    rsync -avz \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.env' \
        --exclude '*.log' \
        --exclude 'src' \
        --exclude 'tests' \
        backend/ \
        "${SSH_USER}@${SSH_HOST}:${REMOTE_BACKEND_PATH}/"

    log_info "Dateien erfolgreich hochgeladen"
}

# Auf dem Server npm install ausführen
install_dependencies() {
    log_step "Installiere Backend-Dependencies auf dem Server..."
    ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_BACKEND_PATH} && npm install --production"
    log_info "Dependencies erfolgreich installiert"
}

# Node.js-Prozess neustarten
restart_node_process() {
    log_step "Starte Node.js-Prozess neu..."

    # Versuche PM2 neu zu starten (falls verwendet)
    ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_BACKEND_PATH} && (pm2 restart pon2 || pm2 start dist/index.js --name pon2) 2>/dev/null" || {
        log_warn "PM2 nicht gefunden, versuche direkten Neustart..."

        # Alternative: Prozess per PID-File oder pkill neustarten
        ssh "${SSH_USER}@${SSH_HOST}" "pkill -f 'node.*dist/index.js' || true && cd ${REMOTE_BACKEND_PATH} && nohup node dist/index.js > output.log 2>&1 &"
    }

    log_info "Node.js-Prozess neugestartet"
}

# Deployment-Status prüfen
check_deployment() {
    log_step "Prüfe Deployment-Status..."

    # Prüfe ob Dateien existieren
    ssh "${SSH_USER}@${SSH_HOST}" "test -f ${REMOTE_BACKEND_PATH}/dist/index.js && test -d ${REMOTE_FRONTEND_PATH}" && {
        log_info "Deployment erfolgreich verifiziert"
        return 0
    } || {
        log_error "Deployment-Verifikation fehlgeschlagen"
        return 1
    }
}

# Hauptfunktion
main() {
    echo "╔════════════════════════════════════════════════╗"
    echo "║   PoN2 Deployment Script für Alwaysdata       ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""

    # Prüfe ob wir im richtigen Verzeichnis sind
    if [ ! -f "package.json" ]; then
        log_error "package.json nicht gefunden. Bitte führe das Script aus dem Projekt-Root aus."
        exit 1
    fi

    # SSH-Verbindung prüfen
    if ! check_ssh_connection; then
        exit 1
    fi

    # Builds erstellen
    build_frontend
    build_backend

    # Dateien deployen
    deploy_files

    # Dependencies installieren
    install_dependencies

    # Prozess neustarten
    restart_node_process

    # Status prüfen
    check_deployment

    echo ""
    log_info "═══════════════════════════════════════════════"
    log_info "Deployment erfolgreich abgeschlossen! 🚀"
    log_info "═══════════════════════════════════════════════"
    echo ""
}

# Script ausführen
main "$@"
