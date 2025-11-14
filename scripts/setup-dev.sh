#!/bin/bash

# PoN2 Development Setup Script
# Automatisierte Einrichtung der lokalen Entwicklungsumgebung

set -e  # Exit on error

echo "🚀 PoN2 - Development Setup"
echo "=============================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion für farbige Ausgabe
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# 1. Prüfe Voraussetzungen
echo "1. Prüfe Voraussetzungen..."

if ! command -v node &> /dev/null; then
    print_error "Node.js ist nicht installiert. Bitte installieren Sie Node.js >= 18.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js Version $NODE_VERSION ist zu alt. Bitte aktualisieren Sie auf >= 18.0"
    exit 1
fi
print_success "Node.js $(node -v) gefunden"

if ! command -v npm &> /dev/null; then
    print_error "npm ist nicht installiert"
    exit 1
fi
print_success "npm $(npm -v) gefunden"

if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL ist nicht installiert"
    print_info "Installieren Sie PostgreSQL: https://www.postgresql.org/download/"
    exit 1
fi
print_success "PostgreSQL gefunden"

# 2. Installiere Dependencies
echo ""
echo "2. Installiere Dependencies..."
npm install
print_success "Dependencies installiert"

# 3. Datenbank einrichten
echo ""
echo "3. Datenbank einrichten..."

# Prüfe ob Datenbank existiert
if psql -lqt | cut -d \| -f 1 | grep -qw pon2_dev; then
    print_info "Datenbank 'pon2_dev' existiert bereits"
    read -p "Möchten Sie die Datenbank neu erstellen? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        dropdb pon2_dev 2>/dev/null || true
        createdb pon2_dev
        print_success "Datenbank neu erstellt"
    fi
else
    createdb pon2_dev
    print_success "Datenbank 'pon2_dev' erstellt"
fi

# Versuche pgvector zu installieren (optional)
if psql pon2_dev -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null; then
    print_success "pgvector Extension installiert"
else
    print_info "pgvector Extension nicht verfügbar (optional)"
fi

# 4. Environment-Variablen einrichten
echo ""
echo "4. Environment-Variablen einrichten..."

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    # Ersetze DATABASE_URL
    sed -i.bak 's|postgresql://username:password@localhost:5432/pon2|postgresql://localhost:5432/pon2_dev|g' backend/.env
    rm -f backend/.env.bak
    print_success "backend/.env erstellt"
else
    print_info "backend/.env existiert bereits"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    print_success "frontend/.env erstellt"
else
    print_info "frontend/.env existiert bereits"
fi

# 5. Prisma Setup
echo ""
echo "5. Prisma Setup..."
cd backend

# Prisma Client generieren
npm run db:generate
print_success "Prisma Client generiert"

# Datenbank-Schema anwenden
npm run db:push
print_success "Datenbank-Schema angewendet"

# Seed-Daten laden
read -p "Möchten Sie Demo-Daten laden? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npm run db:seed
    print_success "Seed-Daten geladen"
    echo ""
    print_info "Demo-Zugänge:"
    echo "   Admin:     admin@pon2.de / password123"
    echo "   Detektiv:  detective@pon2.de / password123"
fi

cd ..

# 6. Abschluss
echo ""
echo "=============================="
echo -e "${GREEN}✓ Setup erfolgreich abgeschlossen!${NC}"
echo ""
echo "Nächste Schritte:"
echo "  1. Starten Sie die Entwicklungsserver:"
echo "     ${YELLOW}npm run dev${NC}"
echo ""
echo "  2. Öffnen Sie die Anwendung:"
echo "     Frontend: ${YELLOW}http://localhost:5173${NC}"
echo "     Backend:  ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "  3. Optional: Prisma Studio öffnen:"
echo "     ${YELLOW}cd backend && npm run db:studio${NC}"
echo ""
echo "Dokumentation:"
echo "  - Setup:        docs/setup.md"
echo "  - Architektur:  docs/architecture.md"
echo "  - Deployment:   docs/deployment.md"
echo ""
echo "Viel Erfolg! 🎉"
