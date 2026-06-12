# TutorConnect API

Backend REST API for the TutorConnect tuition marketplace.

## Stack

- Node.js + TypeScript
- Express
- Prisma + PostgreSQL
- JWT authentication
- Zod + OpenAPI 3.0 (`@asteasolutions/zod-to-openapi`)
- Scalar API reference UI

## Setup

```bash
npm install
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3001/api/v1/health | Health check |
| http://localhost:3001/api/v1/auth/login | Login |
| http://localhost:3001/api/v1/auth/me | Current user (auth required) |
| http://localhost:3001/api-docs | API docs (Scalar UI) |
| http://localhost:3001/api-docs.json | OpenAPI JSON spec |

## Auth

Stateless **JWT** bearer tokens.

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /auth/login` | No | Returns `{ token, user }` |
| `POST /auth/logout` | Yes | Client discards token (204) |
| `GET /auth/me` | Yes | Current user profile |

Send `Authorization: Bearer <token>` on protected routes.

| Status | Meaning |
|--------|---------|
| `401` | Missing, invalid, or expired token |
| `403` | Authenticated but wrong role (used by role middleware) |

## Demo credentials (after seed)

Password for all accounts: `Demo1234!`

| Email | Role |
|-------|------|
| sarah.chen@demo.com | Parent |
| raj.kumar@demo.com | Parent |
| alice.tan@demo.com | Tutor |
| benjamin.lim@demo.com | Tutor |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm run lint` | Type-check |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed demo data |

## Structure

```
src/
├── auth/
│   ├── schema/   # Zod schemas + OpenAPI paths
│   ├── routes/
│   └── service/
├── health/
│   ├── schema/
│   └── routes/
├── config/
├── lib/          # prisma, jwt, openapi registry
├── middleware/
├── routes/       # mounts module routers
├── app.ts
└── index.ts
```

Each module owns its Zod schemas (validation + docs). Shared OpenAPI registry lives in `lib/registry.ts`.

## Cases

| Endpoint | Auth | Role | Description |
|----------|------|------|-------------|
| `POST /cases` | Yes | Parent | Create a case |
| `GET /cases` | Yes | Any | List cases (paginated, searchable) |
| `GET /cases/:id` | Yes | Any | View case (owner or invited tutor) |
| `PATCH /cases/:id` | Yes | Parent | Update own case |
| `POST /cases/:id/invitations` | Yes | Parent | Invite a tutor |
| `DELETE /cases/:id/invitations/:tutorId` | Yes | Parent | Revoke invitation |

**Access control:** Parents see only their cases. Tutors see only invited cases. Unauthorized access to a specific case returns `404` (not `403`) to avoid leaking existence. Mutations by non-owners return `403`.

**Query params for `GET /cases`:** `page`, `limit`, `search`, `subject`, `level`, `status`

## Module roadmap

| Module | Status |
|--------|--------|
| 1. Backend init | Done |
| 2. Auth | Done |
| 3. Tuition cases + invitations | Done |
| 4. Documents | Done |
| 5. Tutor profiles + directory | Pending |

## Documents

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /cases/:caseId/documents` | Yes | Upload file (`multipart/form-data`, field: `file`) |
| `GET /cases/:caseId/documents` | Yes | List case documents |
| `GET /documents/:id/download` | Yes | Download (auth re-checked) |

**Allowed types:** pdf, docx, png, jpg — **max size:** 10 MB (`MAX_FILE_SIZE_MB`).

**Storage:** file bytes saved in PostgreSQL (`documents.data` BYTEA). Raw file data is never exposed in list responses.
