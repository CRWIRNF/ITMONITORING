# Monitoring System

Ein umfassendes Monitoring-System für verschiedene Dienste und Websites.

## Funktionen

- **Dashboard**: Schnellübersicht über alle überwachten Systeme
- **Starlink-Monitoring**: Überwachung von Starlink-Verbindungen
- **Ticketsystem-Monitoring**: Überwachung des Ticketsystems
- **Firewall-Monitoring**: Überwachung von Firewalls
- **Website-Monitoring**: Überwachung von Websites
- **Authentifizierung**: Login-System mit Admin- und User-Rollen

## Tech Stack

### Backend
- Node.js mit Express
- TypeScript
- PostgreSQL
- JWT-Authentifizierung

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Setup

### Voraussetzungen
- Node.js (v18+)
- PostgreSQL
- npm oder yarn

### Installation

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Datenbank-Zugangsdaten
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Datenbank-Setup

1. PostgreSQL-Datenbank erstellen:
```sql
CREATE DATABASE monitoring;
```

2. Das Schema wird beim ersten Start automatisch erstellt

## Standard-Zugangsdaten

Nach dem ersten Setup:
- **Admin**: admin@monitoring.local / admin123
- **User**: user@monitoring.local / user123

**Wichtig**: Ändern Sie diese Passwörter nach dem ersten Login!

## Entwicklung

- Backend läuft auf: http://localhost:3000
- Frontend läuft auf: http://localhost:5173

## API-Dokumentation

### Authentifizierung
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrierung (nur Admin)
- `GET /api/auth/me` - Aktueller User

### Monitoring
- `GET /api/monitoring/starlink` - Starlink-Status
- `GET /api/monitoring/ticketsystem` - Ticketsystem-Status
- `GET /api/monitoring/firewalls` - Firewall-Status
- `GET /api/monitoring/websites` - Website-Status
- `GET /api/monitoring/dashboard` - Dashboard-Übersicht
