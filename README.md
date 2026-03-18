# CarFleet - Portale Prenotazione Auto Aziendali

Portale web per la gestione e prenotazione delle auto aziendali di SNT Informatica, con vista agenda giornaliera, area utente e area amministrativa.

## Stack Tecnologico

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, TanStack Query
- **Backend**: NestJS, TypeScript, Prisma ORM, JWT Authentication, class-validator
- **Database**: PostgreSQL 16
- **DevOps**: Docker, Docker Compose

## Infrastruttura

| Macchina | IP | Ruolo |
|---|---|---|
| proxy | 192.168.251.68 | Nginx reverse proxy pubblico |
| docker-vm | 192.168.251.69 | Host Docker containers |

**URL pubblico**: `https://auto.sntinformatica.it:10443`

Il proxy Nginx inoltra tutto il traffico alla porta 3000 del frontend.
Le chiamate API vengono gestite tramite Next.js rewrites (`/api/*` → `backend:4000`).

## Struttura progetto

```
project-root/
  docker-compose.yml
  backend/            # NestJS API
    prisma/           # Schema e migrazioni
    auto-seed.js      # Seed automatico al primo avvio (solo se DB vuoto)
    src/
      modules/        # auth, users, vehicles, bookings, audit
      common/         # guards, decorators, filters, prisma
  frontend/           # Next.js App
    app/              # Pages (login, agenda, dashboard, admin/*)
    components/       # Navbar, Sidebar, DataTable, StatusBadge, etc.
    services/         # API client (Axios)
    contexts/         # AuthContext
    public/           # Logo S&NT e assets statici
```

## Prerequisiti

- Docker e Docker Compose v2
- Git

## Avvio rapido

```bash
# 1. Avvia i servizi (migrazioni e seed automatici al primo avvio)
docker compose up --build -d

# 2. Verifica che i container siano attivi
docker compose ps
```

I servizi saranno disponibili su:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432

Al primo avvio:
- Le migrazioni Prisma vengono applicate automaticamente
- Se il database è vuoto, il seed viene eseguito automaticamente (tramite `auto-seed.js`)

## Autenticazione

Il login avviene tramite **username** (non email).

Per creare o gestire gli utenti, accedere all'area admin → Gestione Utenti.

## Funzionalità principali

### Utente
- **Agenda giornaliera**: vista con fasce orarie (07:00–20:00), colonne per veicolo, prenotazioni come blocchi colorati
- **Mini-calendario**: navigazione rapida tra i giorni
- **Prenotazione rapida**: click su cella vuota per prenotare
- **Le mie prenotazioni**: storico e cancellazione prenotazioni

### Admin
- **Dashboard**: statistiche generali
- **Gestione Veicoli**: CRUD completo con stato (disponibile/manutenzione/non disponibile)
- **Gestione Prenotazioni**: approvazione, rifiuto, completamento
- **Gestione Utenti**: creazione con username, modifica, disattivazione, eliminazione
- **Audit Log**: registro delle azioni

## Comandi utili

```bash
# Avvio servizi
docker compose up -d

# Rebuild pulito
docker compose build --no-cache && docker compose up -d

# Log
docker compose logs -f backend
docker compose logs -f frontend

# Migrazioni Prisma
docker compose exec backend npx prisma migrate deploy

# Prisma Studio (GUI database)
docker compose exec backend npx prisma studio

# Reset completo (cancella DB e volumi)
docker compose down -v && docker compose up --build -d
```

## Note tecniche

- **bcryptjs** al posto di bcrypt (compatibilità Alpine Linux)
- **OpenSSL** aggiunto nel Dockerfile backend (richiesto da Prisma)
- Le variabili `NEXT_PUBLIC_API_URL` è vuota nel container → il frontend usa path relativi `/api`
- I `node_modules` sono gestiti da volumi Docker separati
- Le migrazioni e il database sono persistenti nel volume `postgres-data`
- Hot-reload attivo in sviluppo (bind mount delle cartelle sorgente)

## Note produzione

1. Cambiare `JWT_SECRET` con un valore sicuro e casuale
2. Configurare CORS restrittivo nel backend
3. HTTPS gestito dal reverse proxy Nginx sulla `.68`
