# 📚 Condominium Library

A full-stack community library management system for condominiums. Administrators can manage the book catalog, loans, and reservations, while residents can browse and reserve books directly from their smartphones — no app installation required.

---

## Features

### Public Area (Residents)

| Feature | Description |
|---|---|
| Public showcase | Homepage with catalog statistics, popular books, and announcements |
| Email lookup | Residents enter their email to view all their loans and reservations without logging in |
| Reader Portal | Authenticated area with a dashboard, catalog, loan history, and reservation queue |
| Book catalog | Search and filter by genre; residents can reserve books directly |
| My Loans | List of active loans, history, and due dates |
| My Reservations | Track reservations and queue position |
| Profile | Update contact information and password |

### Admin Area

| Feature | Description |
|---|---|
| Dashboard | Real-time metrics: total books, available, active loans, users |
| Catalog | Full CRUD for books with AI-powered search (Gemini) to auto-fill book data |
| Readers | Register and manage residents with individual loan history |
| Loans | Record checkouts/returns with quick filters: Overdue / Due in 3 days |
| Reservation Queue | Per-book queue management with tabs: Active, Expired, Waiting, History |
| WhatsApp Notification | Button that opens a WhatsApp conversation with a pre-filled message to notify the reader of availability |
| Reports | Return reports with filters by date range and status; CSV export |
| Announcements | Publish rules, notices, and alerts visible on the public page |
| Administrators | Manage users with access to the admin panel |

---

## Business Rules

- Books can only be loaned when **available** or **reserved** (in the latter case, only the reader at the front of the queue may check out)
- When a loan is registered, the book becomes **borrowed**; the reader's reservation is marked as **fulfilled**
- On return: if there is a queue → book becomes **reserved** and the first in line is notified; no queue → book returns to **available**
- Overdue loans are automatically marked as **overdue**
- Queue notifications expire in **3 days**; on expiry, the next person in line is promoted
- Only readers with **active** status can take out loans or make reservations

---

## Technical Specifications

### Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 24 |
| Backend | Express 5 (TypeScript) |
| Frontend | React 19 + Vite 7 (TypeScript) |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| Authentication | JWT (jsonwebtoken + bcryptjs) — separate flows for admins and readers |
| API | OpenAPI 3.0 with automatic hook generation via Orval |
| UI | Tailwind CSS + shadcn/ui + Lucide Icons |
| AI | Gemini AI (automatic book data lookup by ISBN or title) |
| Build | esbuild (production bundle) |

### Monorepo Structure

```
condominium-library/
├── artifacts/
│   ├── api-server/           # Express server (port 8080)
│   │   └── src/
│   │       ├── routes/       # API routes
│   │       ├── middlewares/  # Auth middleware (admin + reader)
│   │       └── index.ts      # Entry point
│   └── biblioteca/           # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── public/   # Public area
│           │   ├── reader/   # Reader portal (authenticated)
│           │   └── admin/    # Admin panel
│           ├── components/
│           ├── contexts/     # ReaderAuthContext, AdminAuthContext
│           └── App.tsx
├── lib/
│   ├── api-spec/             # openapi.yaml + Orval config
│   ├── api-client-react/     # Generated hooks (React Query)
│   ├── api-zod/              # Generated Zod schemas
│   ├── db/                   # Drizzle schema + PostgreSQL connection
│   └── integrations-gemini-ai/  # Gemini AI client
├── scripts/
│   └── src/seed.ts           # Demo data seed script
└── pnpm-workspace.yaml
```

### Database

| Table | Main fields |
|---|---|
| `admins` | id, name, email, passwordHash |
| `users` | id, name, email, phone, block, house, status, passwordHash |
| `books` | id, title, author, genre, isbn, publishedYear, imageUrl, description, status |
| `loans` | id, bookId, userId, status, loanDate, dueDate, returnDate |
| `reservations` | id, bookId, userId, position, status, notifiedAt, expiresAt |
| `library_notes` | id, title, content, type, active |

**Book status:** `draft` · `available` · `borrowed` · `reserved` · `lost` · `unavailable`

**Loan status:** `active` · `returned` · `overdue`

**Reservation status:** `waiting` · `notified` · `fulfilled` · `cancelled`

**Reader status:** `pending` · `active` · `inactive` · `blocked`

---

## API Endpoints

```
# Health
GET    /api/healthz                      API health check

# Admin authentication
POST   /api/auth/login                   Admin login
POST   /api/auth/logout                  Logout (invalidates session on client)
GET    /api/auth/me                      Authenticated admin data

# Administrators
GET    /api/admins                       List admins
POST   /api/admins                       Create admin
DELETE /api/admins/:id                   Delete admin

# Books
GET    /api/books                        List books (search, status, genre, page, limit)
POST   /api/books                        Create book
GET    /api/books/:id                    Details + loan and reservation history
PATCH  /api/books/:id                    Update book
DELETE /api/books/:id                    Delete book (forbidden if loan history exists)

# Readers (admin)
GET    /api/users                        List readers (search, status, page, limit)
POST   /api/users                        Register reader
GET    /api/users/:id                    Profile + loan history
PATCH  /api/users/:id                    Update reader
DELETE /api/users/:id                    Delete reader

# Loans (admin)
GET    /api/loans                        List loans (status, userId, bookId, dueSoon, dueDateFrom, dueDateTo)
POST   /api/loans                        Register loan
GET    /api/loans/:id                    Loan details
PATCH  /api/loans/:id/return             Return book

# Reservation queue (admin)
GET    /api/reservations                 List reservations (bookId, userId, status)
POST   /api/reservations                 Add reader to queue
PATCH  /api/reservations/:id             Actions: notify / cancel / fulfill / advance
DELETE /api/reservations/:id             Remove from queue
PATCH  /api/reservations/:id/notify      Record WhatsApp notification (updates notifiedAt)

# Admin dashboard
GET    /api/dashboard                    Real-time metrics (books, loans, readers)

# Announcements
GET    /api/notes                        List active announcements (public)
GET    /api/notes?all=true               List all announcements (requires admin auth)
POST   /api/notes                        Create announcement (requires admin auth)
PATCH  /api/notes/:id                    Update announcement (requires admin auth)
DELETE /api/notes/:id                    Delete announcement (requires admin auth)

# AI — Gemini (requires admin auth)
POST   /api/gemini/book-search           Look up book data by title or ISBN

# Reader portal — Authentication
POST   /api/reader/auth/login            Reader login
GET    /api/reader/auth/me               Authenticated reader data

# Reader portal — Public lookup
POST   /api/reader/lookup                Email lookup without login (returns loans and reservations)

# Reader portal — Authenticated area
GET    /api/reader/dashboard             Reader dashboard summary
GET    /api/reader/loans                 Active loans and history for the logged-in reader
GET    /api/reader/reservations          Reservations for the logged-in reader
POST   /api/reader/reservations          Reserve a book (active readers only)
DELETE /api/reader/reservations/:id      Cancel reservation
PATCH  /api/reader/profile               Update phone number and/or password
```

---

## Local Setup

### Prerequisites

- Node.js 24 or higher
- pnpm 9 or higher — install with: `npm install -g pnpm`
- PostgreSQL running locally (or a remote connection URL)

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd condominium-library
pnpm install
```

### 2. Configure environment variables

Create `artifacts/api-server/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/biblioteca
JWT_SECRET=your-secret-key-here
PORT=8080
NODE_ENV=development
```

Create `artifacts/biblioteca/.env`:

```env
PORT=3000
BASE_PATH=/
VITE_API_URL=http://localhost:8080
```

> **Required frontend variables:** `PORT` sets the Vite dev server port; `BASE_PATH` sets the application route prefix (use `/` for local development). Both are required by `vite.config.ts`.

To enable Gemini AI book search, also add to the API server `.env`:

```env
AI_INTEGRATIONS_GEMINI_BASE_URL=https://...
AI_INTEGRATIONS_GEMINI_API_KEY=your-key
```

### 3. Create the database and apply the schema

```bash
# Pushes the Drizzle schema to the database
pnpm --filter @workspace/db run push
```

### 4. Seed demo data (optional)

```bash
pnpm --filter @workspace/scripts run seed
```

This creates:
- **Administrator:** `admin@biblioteca.com` / password `admin123`
- Sample readers, books, loans, and reservations

### 5. Start in development mode

```bash
# Terminal 1 — API Server
PORT=8080 pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/biblioteca run dev
```

Access at: `http://localhost:3000`

### 6. Build for production

```bash
# Build the frontend
pnpm --filter @workspace/biblioteca run build

# Build the server (esbuild bundle)
pnpm --filter @workspace/api-server run build
```

To run in production:

```bash
NODE_ENV=production PORT=8080 node artifacts/api-server/dist/index.mjs
```

---

## Development

### Update the API (OpenAPI → generated hooks)

After modifying `lib/api-spec/openapi.yaml`, regenerate the hooks and schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Update the database

After changing schemas in `lib/db/src/schema/`:

```bash
pnpm --filter @workspace/db run push
```

---

## Access

| Area | URL | Credentials |
|---|---|---|
| Public page | `/` | — |
| Quick lookup (reader) | `/leitor` | Registered email |
| Reader portal | `/leitor/login` | Email + registered password |
| Admin panel | `/admin/login` | `admin@biblioteca.com` / `admin123` |
