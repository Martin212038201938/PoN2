#!/bin/bash
# PoN2 Diagnose Script
# Hochladen auf Server und ausführen: bash diagnose.sh

echo "========================================"
echo "  PoN2 DIAGNOSE SCRIPT"
echo "  $(date)"
echo "========================================"
echo ""

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Pfad zum Backend
BACKEND_DIR="$HOME/pon2/backend"
ENV_FILE="$BACKEND_DIR/.env"

echo "1. UMGEBUNGSVARIABLEN PRUEFEN"
echo "----------------------------------------"

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}[OK]${NC} .env Datei existiert: $ENV_FILE"

    # DATABASE_URL
    if grep -q "DATABASE_URL" "$ENV_FILE"; then
        DB_URL=$(grep "DATABASE_URL" "$ENV_FILE" | head -1)
        echo -e "${GREEN}[OK]${NC} DATABASE_URL ist gesetzt"
        # Zeige nur Host (keine Credentials)
        echo "     Host: $(echo $DB_URL | sed 's/.*@\([^:\/]*\).*/\1/')"
    else
        echo -e "${RED}[FEHLER]${NC} DATABASE_URL fehlt!"
    fi

    # JWT_SECRET
    JWT_SECRET=$(grep "^JWT_SECRET" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
    if [ -n "$JWT_SECRET" ] && [ "$JWT_SECRET" != "your-secret-key-change-in-production" ]; then
        echo -e "${GREEN}[OK]${NC} JWT_SECRET ist gesetzt (Laenge: ${#JWT_SECRET} Zeichen)"
    else
        echo -e "${RED}[FEHLER]${NC} JWT_SECRET fehlt oder ist der Default-Wert!"
        echo "     Das ist wahrscheinlich das Problem!"
    fi

    # PORT
    PORT=$(grep "^PORT" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | xargs)
    echo -e "${GREEN}[INFO]${NC} PORT: ${PORT:-3000}"

    # NODE_ENV
    NODE_ENV=$(grep "^NODE_ENV" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | xargs)
    echo -e "${GREEN}[INFO]${NC} NODE_ENV: ${NODE_ENV:-nicht gesetzt}"

else
    echo -e "${RED}[FEHLER]${NC} .env Datei existiert NICHT: $ENV_FILE"
    echo "     Das ist das Problem! Erstelle die .env Datei."
fi

echo ""
echo "2. PM2 STATUS"
echo "----------------------------------------"

if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""

    # Prüfe ob pon2-backend läuft
    if pm2 describe pon2-backend &> /dev/null; then
        STATUS=$(pm2 describe pon2-backend | grep "status" | head -1)
        if echo "$STATUS" | grep -q "online"; then
            echo -e "${GREEN}[OK]${NC} pon2-backend laeuft"
        else
            echo -e "${RED}[FEHLER]${NC} pon2-backend laeuft NICHT"
            echo "     Status: $STATUS"
        fi
    else
        echo -e "${RED}[FEHLER]${NC} pon2-backend ist nicht in PM2 registriert"
    fi
else
    echo -e "${YELLOW}[WARNUNG]${NC} PM2 ist nicht installiert"
fi

echo ""
echo "3. DATENBANK VERBINDUNG TESTEN"
echo "----------------------------------------"

cd "$BACKEND_DIR" 2>/dev/null

if [ -f "$ENV_FILE" ]; then
    # Lade .env
    export $(grep -v '^#' "$ENV_FILE" | xargs)

    # Teste DB-Verbindung mit Node
    node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    pool.query('SELECT COUNT(*) as count FROM users')
        .then(r => {
            console.log('\x1b[32m[OK]\x1b[0m Datenbankverbindung erfolgreich');
            console.log('     Anzahl Benutzer: ' + r.rows[0].count);
            pool.end();
        })
        .catch(e => {
            console.log('\x1b[31m[FEHLER]\x1b[0m Datenbankverbindung fehlgeschlagen');
            console.log('     ' + e.message);
            pool.end();
        });
    " 2>/dev/null || echo -e "${YELLOW}[WARNUNG]${NC} Node-Test fehlgeschlagen"
fi

echo ""
echo "4. ADMIN BENUTZER PRUEFEN"
echo "----------------------------------------"

if [ -f "$ENV_FILE" ]; then
    cd "$BACKEND_DIR" 2>/dev/null
    export $(grep -v '^#' "$ENV_FILE" | xargs)

    node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    pool.query(\"SELECT id, email, role, \\\"isActive\\\", \\\"firstName\\\", \\\"lastName\\\" FROM users WHERE email = 'admin@pon2.de'\")
        .then(r => {
            if (r.rows.length > 0) {
                const u = r.rows[0];
                console.log('\x1b[32m[OK]\x1b[0m Admin-Benutzer gefunden:');
                console.log('     Email: ' + u.email);
                console.log('     Name: ' + u.firstName + ' ' + u.lastName);
                console.log('     Role: ' + u.role);
                console.log('     Aktiv: ' + u.isActive);
            } else {
                console.log('\x1b[31m[FEHLER]\x1b[0m Admin-Benutzer NICHT gefunden!');
                console.log('     Fuehre aus: npm run db:seed');
            }
            pool.end();
        })
        .catch(e => {
            console.log('\x1b[31m[FEHLER]\x1b[0m ' + e.message);
            pool.end();
        });
    " 2>/dev/null
fi

echo ""
echo "5. LOGIN ENDPOINT TESTEN (lokal)"
echo "----------------------------------------"

# Finde den Port
PORT=$(grep "^PORT" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | xargs)
PORT=${PORT:-8100}

echo "Teste Login auf localhost:$PORT..."

RESPONSE=$(curl -s -X POST "http://localhost:$PORT/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@pon2.de","password":"password123"}' \
    -w "\n%{http_code}" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}[OK]${NC} Login erfolgreich! (HTTP $HTTP_CODE)"
    echo "     Token erhalten: $(echo $BODY | grep -o '"token":"[^"]*"' | cut -c10-30)..."
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}[FEHLER]${NC} Login fehlgeschlagen (HTTP $HTTP_CODE)"
    echo "     Antwort: $BODY"
    echo "     Moegliche Ursache: Falsches Passwort oder Benutzer nicht aktiv"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}[FEHLER]${NC} Server-Fehler (HTTP $HTTP_CODE)"
    echo "     Antwort: $BODY"
    echo "     Pruefe die PM2 Logs!"
elif [ -z "$HTTP_CODE" ] || [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}[FEHLER]${NC} Backend nicht erreichbar auf Port $PORT"
    echo "     Ist das Backend gestartet? Pruefe pm2 status"
else
    echo -e "${YELLOW}[WARNUNG]${NC} Unerwartete Antwort (HTTP $HTTP_CODE)"
    echo "     Antwort: $BODY"
fi

echo ""
echo "6. PM2 LOGS (letzte 20 Zeilen)"
echo "----------------------------------------"

if command -v pm2 &> /dev/null; then
    pm2 logs pon2-backend --lines 20 --nostream 2>/dev/null || echo "Keine Logs verfuegbar"
fi

echo ""
echo "========================================"
echo "  ZUSAMMENFASSUNG"
echo "========================================"

# Sammle Probleme
PROBLEMS=""

if [ ! -f "$ENV_FILE" ]; then
    PROBLEMS="$PROBLEMS\n- .env Datei fehlt"
fi

JWT_SECRET=$(grep "^JWT_SECRET" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-secret-key-change-in-production" ]; then
    PROBLEMS="$PROBLEMS\n- JWT_SECRET nicht konfiguriert"
fi

if ! pm2 describe pon2-backend 2>/dev/null | grep -q "online"; then
    PROBLEMS="$PROBLEMS\n- Backend laeuft nicht"
fi

if [ -n "$PROBLEMS" ]; then
    echo -e "${RED}Gefundene Probleme:${NC}"
    echo -e "$PROBLEMS"
    echo ""
    echo "Loesungsvorschlaege:"
    echo "  1. Falls JWT_SECRET fehlt:"
    echo "     echo 'JWT_SECRET=\"$(openssl rand -hex 32)\"' >> $ENV_FILE"
    echo "     pm2 restart pon2-backend"
    echo ""
    echo "  2. Falls Backend nicht laeuft:"
    echo "     cd $BACKEND_DIR && pm2 start dist/index.js --name pon2-backend"
    echo ""
    echo "  3. Falls Admin-Benutzer fehlt:"
    echo "     cd $BACKEND_DIR && npm run db:seed"
else
    echo -e "${GREEN}Keine offensichtlichen Probleme gefunden.${NC}"
    echo "Falls Login trotzdem nicht funktioniert, pruefe:"
    echo "  - Frontend VITE_API_URL Konfiguration"
    echo "  - CORS Einstellungen"
    echo "  - Browser Console auf Fehler"
fi

echo ""
echo "========================================"
