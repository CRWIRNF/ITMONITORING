# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack monitoring dashboard ("Frisia Monitoring") for tracking Starlink connections, NinjaOne tickets, firewalls (SNMP), website availability, and system metrics. German-language UI. PostgreSQL backend with scheduled data collection via cron jobs.

## Commands

### Backend (from `backend/`)
```bash
npm run dev      # Dev server with hot reload (tsx watch), runs on :3001
npm run build    # TypeScript compilation (tsc)
npm start        # Production: runs dist/index.js
```

### Frontend (from `frontend/`)
```bash
npm run dev      # Vite dev server on :5173, proxies /api → localhost:3001
npm run build    # tsc && vite build → outputs to dist/
npm run preview  # Preview production build
```

### Database
Tables are auto-created on backend startup via `Model.createTable()` calls. No migration tool — schema changes are in model files.

## Architecture

```
backend/src/
  index.ts              # Express entry point, middleware setup, cron scheduling
  config/database.ts    # PostgreSQL pool (pg)
  models/               # Static async class methods (createTable, create, findById, etc.)
  services/             # External API integrations & business logic
  controllers/          # Request handlers
  routes/               # Express Router modules, mounted under /api
  middleware/auth.ts     # JWT verification + role extraction

frontend/src/
  main.tsx              # React 18 entry
  App.tsx               # React Router v6 with ProtectedRoute wrapper
  pages/                # One page per monitoring domain (Dashboard, Starlink, Ticketsystem, etc.)
  services/             # Axios-based API clients (one per backend domain)
  components/           # Layout, MonitoringCard, StatusBadge, VersionBell
  types/index.ts        # Shared TypeScript interfaces
```

### Key Patterns

- **Models**: Static class methods with raw SQL via `pg` pool — no ORM. Parameterized queries throughout.
- **Services**: Classes that encapsulate external API calls (Starlink → CastorMarine API, Tickets → NinjaOne OAuth2, Firewalls → SNMP).
- **Auth flow**: JWT in localStorage → Axios request interceptor adds `Authorization: Bearer` header → backend `authenticate` middleware validates → 401 triggers frontend redirect to `/login`.
- **Roles**: `admin`, `user`, `viewer` — role checked in middleware for privileged routes.
- **Scheduling**: `node-cron` jobs defined in `index.ts` with Europe/Berlin timezone. Starlink daily 3AM, websites/firewalls/system every 5min, tickets every 30min.
- **Caching**: In-memory caches with 5-minute TTL for ticketing data and top-creators (see `monitoringController.ts`).

### Data Retention
- Website checks: 24-hour rolling window
- System metrics: 7 days (cleanup daily at 6AM)
- Login history: 90 days
- Starlink/ticket history: indefinite
- Ticket monthly aggregation: backfilled on startup, hourly updates for current month

### External Integrations
- **Starlink**: Bearer token auth to `portal.apps.castormarine.com/api`
- **NinjaOne**: OAuth2 client credentials to `eu.ninjarmm.com`
- **Firewalls**: SNMP v2c/v3 to configured IPs (env `FIREWALL_IPS`)
- **Asana**: Implemented but disabled (routes/pages commented out)

## Environment

Backend requires `.env` (see `backend/.env.example`). Key variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection
- `JWT_SECRET` — minimum 32 chars, validated at startup
- `STARLINK_BEARER_TOKEN`, `NINJA_CLIENT_ID`, `NINJA_CLIENT_SECRET` — API credentials
- `ALLOWED_ORIGINS` — comma-separated CORS whitelist
- `FIREWALL_IPS` — comma-separated SNMP target IPs

## Security

Key security measures applied (see `SECURITY_FIXES_APPLIED.md` for full status):
- IP validation via `net.isIP()` before SNMP shell commands (prevents command injection)
- SQL column whitelist in dynamic queries (prevents SQL injection)
- JWT\_SECRET required at runtime (no fallback)
- Rate limiting, CORS whitelist, Helmet.js headers

**Still open:** CSRF protection, JWT migration to httpOnly cookies, default password rotation, error.message removal from responses.

## Versioning

Version tracked in `VERSION.json` at project root (current: 1.2.0). Frontend `VersionBell` component notifies users of updates. Changelog entries are in German.
