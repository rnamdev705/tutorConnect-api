# TutorConnect API

Backend REST API for the TutorConnect tuition marketplace.

## Stack

- Node.js + TypeScript
- Express
- Prisma + PostgreSQL
- Swagger UI (OpenAPI 3.0)

## Setup

```bash
npm install
cp .env.example .env   # set DATABASE_URL
npm run db:generate
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3001/api/v1/health | Health check |
| http://localhost:3001/api-docs | Swagger UI |
| http://localhost:3001/api-docs.json | OpenAPI JSON |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm run lint` | Type-check |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations (when models are added) |
| `npm run db:push` | Push schema to DB |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed demo users, cases, profiles |

## Demo credentials (after seed)

| Email | Password | Role |
|-------|----------|------|
| parent1@demo.com | Demo1234! | Parent |
| parent2@demo.com | Demo1234! | Parent |
| tutor1@demo.com | Demo1234! | Tutor |
| tutor2@demo.com | Demo1234! | Tutor |

## Structure

```
src/
├── config/       # env, OpenAPI
├── lib/          # Prisma client
├── middleware/   # error handling
├── routes/       # API routes
├── app.ts
└── index.ts
prisma/
└── schema.prisma
```
