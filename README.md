# CarFleet - Portale Prenotazione Auto Aziendali

Portale web moderno per la gestione e prenotazione delle auto aziendali, con area utente e area amministrativa.

## Stack Tecnologico

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, TanStack Query, FullCalendar
- **Backend**: NestJS, TypeScript, Prisma ORM, JWT Authentication, class-validator
- **Database**: PostgreSQL 16
- **DevOps**: Docker, Docker Compose

## Struttura progetto

```
project-root/
  docker-compose.yml
  .env / .env.example
  backend/            # NestJS API
    prisma/           # Schema e migrazioni
    src/
      modules/        # auth, users, vehicles, bookings, audit
      common/         # guards, decorators, filters, prisma
  frontend/           # Next.js App
    app/              # Pages (login, dashboard, vehicles, bookings, admin/*)
    components/       # Navbar, Sidebar, DataTable, StatusBadge, etc.
    services/         # API client (Axios)
    contexts/         # AuthContext
```

## Prerequisiti

- Docker e Docker Compose v2
- Git

## Avvio rapido

```bash
# 1. Copia le variabili d'ambiente
cp .env.example .env

# 2. Avvia i servizi
docker compose up --build

# 3. Esegui le migrazioni (prima volta)
docker compose exec backend npx prisma migrate dev --name init

# 4. Esegui il seed
docker compose exec backend npx prisma db seed
```

I servizi saranno disponibili su:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432

## Accesso

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@example.com | admin123 |
| Utente | mario.rossi@example.com | password123 |
| Utente | laura.bianchi@example.com | password123 |
| Utente | paolo.verdi@example.com | password123 |

## Comandi utili

```bash
# Avvio servizi
docker compose up -d

# Rebuild
docker compose up --build

# Log
docker compose logs -f backend
docker compose logs -f frontend

# Migrazioni Prisma
docker compose exec backend npx prisma migrate dev --name <nome>

# Prisma Studio (GUI database)
docker compose exec backend npx prisma studio

# Seed database
docker compose exec backend npx prisma db seed

# Stop servizi
docker compose down

# Stop e rimuovi volumi
docker compose down -v
```

## Sviluppo

Il codice sorgente risiede sulla macchina host nelle cartelle `backend/` e `frontend/`.
Docker monta queste cartelle tramite bind mount, quindi ogni modifica al codice si riflette automaticamente nei container (hot-reload attivo).

- I `node_modules` sono gestiti da volumi Docker separati per evitare conflitti tra host e container.
- Le migrazioni e il database sono persistenti nel volume `postgres-data`.

## Note produzione

Per un deployment in produzione:
1. Cambiare `JWT_SECRET` con un valore sicuro e casuale
2. Configurare CORS restrittivo nel backend
3. Usare HTTPS tramite reverse proxy (nginx/traefik)
4. Buildare il frontend con `next build` e usare `next start`
5. Buildare il backend con `nest build` e usare `node dist/main`
