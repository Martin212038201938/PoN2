# PoN2 - Professional Inheritance Detective App

A comprehensive application supporting professional inheritance investigators with AI-powered automated research agents to handle large volumes of estate cases efficiently.

## 🎯 Core Value Proposition

**For Detectives**: "I can process large volumes of heir searches with minimal manual effort through a network of automated, self-learning research agents, ultimately identifying probable heirs with verifiable research."

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + TypeScript + Express
- Prisma ORM + PostgreSQL (with pgvector extension)
- BullMQ for job queuing
- JWT authentication

**Frontend:**
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- TanStack Query + React Router
- Recharts for visualizations

### Project Structure

```
pon2/
├── backend/          # API server, job workers, integrations
├── frontend/         # React web application
├── shared/           # Shared TypeScript types
└── docs/             # Documentation
```

## 🚀 Quick Start

### Automatisches Setup (empfohlen)

```bash
./scripts/setup-dev.sh
```

Das Script richtet automatisch ein:
- Installiert alle Dependencies
- Erstellt PostgreSQL-Datenbank
- Konfiguriert Umgebungsvariablen
- Wendet Datenbank-Schema an
- Lädt Demo-Daten

### Manuelles Setup

#### 1. Voraussetzungen

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis (optional, für Job-Queue)

#### 2. Installation

```bash
# Repository klonen
git clone [REPO_URL]
cd PoN2

# Dependencies installieren
npm install

# Datenbank erstellen
createdb pon2_dev

# Environment-Dateien erstellen
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Datenbank einrichten
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

#### 3. Entwicklungsserver starten

```bash
# Im Root-Verzeichnis
npm run dev
```

Öffnen Sie:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Prisma Studio**: `cd backend && npm run db:studio`

#### 4. Demo-Zugänge

Nach dem Seed-Script:
- **Admin**: `admin@pon2.de` / `password123`
- **Detektiv**: `detective@pon2.de` / `password123`

### Detaillierte Dokumentation

- **Setup-Guide**: [docs/setup.md](docs/setup.md)
- **Architektur**: [docs/architecture.md](docs/architecture.md)
- **Deployment**: [docs/deployment.md](docs/deployment.md)

## 📋 Key Features

### Phase 1: Core Workflows

1. **Case Management**
   - Create cases from Bundesanzeiger references
   - Automatic first research wave
   - Multi-stage research iterations

2. **AI-Powered Research Agents**
   - genealogy.net integration
   - MyHeritage integration
   - Perplexity deep research
   - Self-learning strategy optimization

3. **Person & Relationship Management**
   - Automatic extraction from research artifacts
   - Relationship graph visualization
   - Probability scoring for heirs

4. **Document Generation**
   - Automated court inquiry drafts
   - Result reports with chain of reasoning
   - PDF export functionality

5. **Budget & Cost Control**
   - Per-case budget limits
   - API call throttling
   - Cost tracking and alerts

## 👥 User Roles

- **Detective**: Create cases, review results, approve strategies, contact heirs
- **Admin**: Full system configuration, user management, integration settings

## 🗄️ Data Model

- **Case**: Estate case with deceased person data, status, budget
- **Person**: Individuals (deceased, heirs, relatives)
- **ContactInfo**: Addresses, phones, emails, social media
- **Relationship**: Family connections with proof sources
- **ResearchArtifact**: Raw and structured research results (vectorized)
- **Strategy**: Search strategies with success metrics
- **Document**: Correspondence (incoming/outgoing)
- **Integration**: External service configurations

## 🔒 Security & Privacy

- Role-based access control
- Sensitive data encryption
- Audit logging
- GDPR compliance considerations

## 📦 Deployment

Configured for deployment on alwaysdata hosting:
- PostgreSQL database
- Node.js application server
- Static frontend assets

See `docs/deployment.md` for detailed instructions.

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

Internal project - contact admin for contribution guidelines.
