# Workspace

## Overview

Biblioteca do Condomínio — a full-stack community library management system for condominiums.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (separate flows for admins vs readers), bcryptjs
- **AI**: Gemini via `@workspace/integrations-gemini-ai`

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── biblioteca/         # React + Vite frontend (preview at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-gemini-ai/  # Gemini AI client
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Auth middleware: `src/middlewares/auth.ts` — JWT auth for admins and readers
- Routes: `src/routes/index.ts` mounts all sub-routers
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-gemini-ai`

#### Route files:
- `health.ts` — `GET /api/healthz`
- `auth.ts` — `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `books.ts` — `GET/POST /api/books`, `GET/PATCH/DELETE /api/books/:id`
- `users.ts` — `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id`
- `loans.ts` — `GET/POST /api/loans`, `GET /api/loans/:id`, `PATCH /api/loans/:id/return`
- `reservations.ts` — `GET/POST /api/reservations`, `PATCH/DELETE /api/reservations/:id`, `PATCH /api/reservations/:id/notify`
- `reader.ts` — all `/api/reader/*` routes (login, me, dashboard, loans, reservations, profile, lookup)
- `dashboard.ts` — `GET /api/dashboard` (public stats)
- `notes.ts` — `GET/POST /api/notes`, `PATCH/DELETE /api/notes/:id`
- `admins.ts` — `GET/POST /api/admins`, `DELETE /api/admins/:id`
- `gemini.ts` — `POST /api/gemini/book-search`

#### Auth design:
- Admin JWT: 7d expiry, type: "admin", payload: `{ adminId, email }`
- Reader JWT: 30d expiry, type: "reader", payload: `{ userId, email }`
- Not interchangeable — middlewares check `type` field

#### Business rules:
- Books with loan history cannot be deleted (set status to `unavailable` instead)
- Reservation queue uses FIFO positions (integer starting at 1)
- Default loan due date: 15 days from loan date
- Only active readers can borrow or reserve books
- When a book is returned, the next `waiting` reservation is promoted to `notified` (3-day expiry)

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- Tables: `admins`, `users`, `books`, `loans`, `reservations`, `library_notes`
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`)

#### Schema enums:
- `user_status`: pending | active | inactive | blocked
- `book_status`: draft | available | borrowed | reserved | lost | unavailable
- `loan_status`: active | returned | overdue
- `reservation_status`: waiting | notified | fulfilled | cancelled
- `note_type`: rule | info | announcement

Production migrations: `pnpm --filter @workspace/db run push` (dev: `push-force`)

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `lib/integrations-gemini-ai` (`@workspace/integrations-gemini-ai`)

Gemini AI client using `@google/genai`. Exports `ai` (GoogleGenAI instance), `generateImage`, and batch utilities.

- Requires env vars: `AI_INTEGRATIONS_GEMINI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY`
- The `@google/genai` package is bundled by esbuild (not externalized)

### `artifacts/biblioteca` (`@workspace/biblioteca`)

React + Vite frontend for the Biblioteca do Condomínio system. Served at `/`.

- Entry: `src/main.tsx` → `src/App.tsx`
- Routing: Wouter with three layout components: `PublicLayout`, `ReaderLayout`, `AdminLayout`
- Auth: Two separate JWT contexts: `AdminAuthContext` (7d token) and `ReaderAuthContext` (30d token), stored in `localStorage`
- Components: Monolithic `src/components/ui.tsx` with Button, Card, Input, etc. plus `src/components/layouts.tsx`
- Pages:
  - Public: `/` (homepage with stats), `/lookup` (email lookup)
  - Reader: `/reader/login`, `/reader/dashboard`, `/reader/catalog`, `/reader/loans`, `/reader/reservations`, `/reader/profile`
  - Admin: `/admin/login`, `/admin/dashboard`, `/admin/books`, `/admin/readers`, `/admin/loans`, `/admin/reservations`, `/admin/reports`, `/admin/notes`, `/admin/admins`
- UI strings: Centralized in `src/lib/constants.ts` (`STRINGS` object) for future i18n
- API client: Uses `@workspace/api-client-react` with `setBaseUrl` and `setAuthTokenGetter` for auth injection
- Gemini AI: Admin book form has "AI Search" button that calls the Gemini endpoint to auto-fill book data
- WhatsApp integration: Reservation notify action opens `wa.me` link with pre-formatted message
- CSV export: Client-side via `papaparse` on the reports page

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`.

- `seed` — populates the database with 2 admins, 10 readers, 20 books, 8 loans, 4 reservations, 5 notes
  - Admin credentials: `admin@biblioteca.com` / `admin123`
  - Reader credentials: `carlos@email.com` / `reader123`

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection (provided by Replit)
- `JWT_SECRET` — JWT signing secret
- `PORT` — server port (provided by Replit)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini AI proxy base URL
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini AI API key
