# 📚 Biblioteca do Condomínio

Sistema completo de gestão de biblioteca comunitária para condomínios. Permite que administradores gerenciem o acervo, empréstimos e reservas, e que moradores consultem e reservem livros pelo próprio smartphone — sem instalar nada.

---

## Funcionalidades

### Área Pública (Moradores)

| Funcionalidade | Descrição |
|---|---|
| Vitrine pública | Página inicial com estatísticas do acervo, livros populares e comunicados |
| Consulta por e-mail | Morador digita o e-mail e vê todos os seus empréstimos e reservas sem precisar de login |
| Portal do Leitor | Área autenticada com painel, catálogo, histórico de empréstimos e fila de reservas |
| Catálogo de livros | Pesquisa e filtro por gênero; morador pode reservar livros diretamente |
| Meus Empréstimos | Lista de empréstimos ativos, histórico e datas de devolução |
| Minhas Reservas | Acompanhamento das reservas e posição na fila de espera |
| Perfil | Atualização de dados de contato e senha |

### Área Administrativa

| Funcionalidade | Descrição |
|---|---|
| Dashboard | Métricas em tempo real: total de livros, disponíveis, empréstimos ativos, usuários |
| Acervo | CRUD completo de livros com busca por IA (Gemini) para preencher dados automaticamente |
| Leitores | Cadastro e gestão de moradores com histórico individual de empréstimos |
| Empréstimos | Registro de retiradas/devoluções com filtros rápidos: Em Atraso / Vencendo em 3 dias |
| Fila de Reservas | Gestão de fila por livro com abas: Ativas, Expiradas, Aguardando, Histórico |
| Notificação WhatsApp | Botão que abre conversa no WhatsApp com mensagem pronta ao notificar leitor da disponibilidade |
| Relatórios | Relatório de devoluções com filtros por período e status; exportação em CSV |
| Comunicados | Publicação de regras, informes e avisos visíveis na página pública |
| Administradores | Gestão de usuários com acesso ao painel admin |

---

## Regras de Negócio

- Livros só podem ser emprestados quando **disponível** ou **reservado** (neste caso, apenas quem está na frente da fila pode retirar)
- Ao registrar empréstimo, o livro vai para **emprestado**; reserva do leitor é marcada como **cumprida**
- Na devolução: se há fila → livro vai para **reservado** e o primeiro da fila é notificado; sem fila → livro volta a **disponível**
- Empréstimos vencidos são marcados como **atrasado** automaticamente
- Notificação de fila expira em **3 dias**; ao expirar, o próximo da lista é promovido
- Apenas leitores com status **ativo** podem realizar empréstimos e reservas

---

## Especificações Técnicas

### Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 24 |
| Backend | Express 5 (TypeScript) |
| Frontend | React 19 + Vite 7 (TypeScript) |
| Banco de dados | PostgreSQL + Drizzle ORM |
| Validação | Zod v4 + drizzle-zod |
| Autenticação | JWT (jsonwebtoken + bcryptjs) — fluxo separado para admins e leitores |
| API | OpenAPI 3.0 com geração automática de hooks via Orval |
| UI | Tailwind CSS + shadcn/ui + Lucide Icons |
| IA | Gemini AI (busca automática de dados do livro por ISBN ou título) |
| Build | esbuild (bundle para produção) |

### Estrutura do Monorepo

```
biblioteca-condominio/
├── artifacts/
│   ├── api-server/           # Servidor Express (porta 8080)
│   │   └── src/
│   │       ├── routes/       # Rotas da API
│   │       ├── middlewares/  # Auth middleware (admin + leitor)
│   │       └── index.ts      # Entry point
│   └── biblioteca/           # Frontend React + Vite
│       └── src/
│           ├── pages/
│           │   ├── public/   # Área pública
│           │   ├── reader/   # Portal do leitor (autenticado)
│           │   └── admin/    # Painel administrativo
│           ├── components/
│           ├── contexts/     # ReaderAuthContext, AdminAuthContext
│           └── App.tsx
├── lib/
│   ├── api-spec/             # openapi.yaml + config Orval
│   ├── api-client-react/     # Hooks gerados (React Query)
│   ├── api-zod/              # Schemas Zod gerados
│   ├── db/                   # Schema Drizzle + conexão PostgreSQL
│   └── integrations-gemini-ai/  # Cliente Gemini AI
├── scripts/
│   └── src/seed.ts           # Script de dados de demonstração
└── pnpm-workspace.yaml
```

### Banco de Dados

| Tabela | Campos principais |
|---|---|
| `admins` | id, name, email, passwordHash |
| `users` | id, name, email, phone, block, house, status, passwordHash |
| `books` | id, title, author, genre, isbn, publishedYear, imageUrl, description, status |
| `loans` | id, bookId, userId, status, loanDate, dueDate, returnDate |
| `reservations` | id, bookId, userId, position, status, notifiedAt, expiresAt |
| `library_notes` | id, title, content, type, active |

**Status de livro:** `draft` · `available` · `borrowed` · `reserved` · `lost` · `unavailable`

**Status de empréstimo:** `active` · `returned` · `overdue`

**Status de reserva:** `waiting` · `notified` · `fulfilled` · `cancelled`

**Status de leitor:** `pending` · `active` · `inactive` · `blocked`

---

## Endpoints da API

```
# Saúde
GET    /api/healthz                      Verificação de saúde da API

# Autenticação de administrador
POST   /api/auth/login                   Login do administrador
POST   /api/auth/logout                  Logout (invalida sessão no cliente)
GET    /api/auth/me                      Dados do admin autenticado

# Administradores
GET    /api/admins                       Listar admins
POST   /api/admins                       Criar admin
DELETE /api/admins/:id                   Remover admin

# Livros
GET    /api/books                        Listar livros (search, status, genre, page, limit)
POST   /api/books                        Criar livro
GET    /api/books/:id                    Detalhes + histórico de empréstimos e reservas
PATCH  /api/books/:id                    Atualizar livro
DELETE /api/books/:id                    Remover livro (proibido se há histórico de empréstimo)

# Leitores (admin)
GET    /api/users                        Listar leitores (search, status, page, limit)
POST   /api/users                        Cadastrar leitor
GET    /api/users/:id                    Perfil + histórico de empréstimos
PATCH  /api/users/:id                    Atualizar leitor
DELETE /api/users/:id                    Remover leitor

# Empréstimos (admin)
GET    /api/loans                        Listar empréstimos (status, userId, bookId, dueSoon, dueDateFrom, dueDateTo)
POST   /api/loans                        Registrar empréstimo
GET    /api/loans/:id                    Detalhes do empréstimo
PATCH  /api/loans/:id/return             Devolver livro

# Fila de reservas (admin)
GET    /api/reservations                 Listar reservas (bookId, userId, status)
POST   /api/reservations                 Adicionar leitor à fila
PATCH  /api/reservations/:id             Ações: notify / cancel / fulfill / advance
DELETE /api/reservations/:id             Remover da fila
PATCH  /api/reservations/:id/notify      Registrar notificação WhatsApp (atualiza notifiedAt)

# Dashboard administrativo
GET    /api/dashboard                    Métricas em tempo real (livros, empréstimos, leitores)

# Comunicados
GET    /api/notes                        Listar comunicados ativos (público)
GET    /api/notes?all=true               Listar todos os comunicados (requer auth admin)
POST   /api/notes                        Criar comunicado (requer auth admin)
PATCH  /api/notes/:id                    Atualizar comunicado (requer auth admin)
DELETE /api/notes/:id                    Remover comunicado (requer auth admin)

# IA — Gemini (requer auth admin)
POST   /api/gemini/book-search           Busca dados do livro por título ou ISBN

# Portal do leitor — Autenticação
POST   /api/reader/auth/login            Login do leitor
GET    /api/reader/auth/me               Dados do leitor autenticado

# Portal do leitor — Consulta pública
POST   /api/reader/lookup                Consulta por e-mail sem login (retorna empréstimos e reservas)

# Portal do leitor — Área autenticada
GET    /api/reader/dashboard             Resumo do painel do leitor
GET    /api/reader/loans                 Empréstimos ativos e histórico do leitor logado
GET    /api/reader/reservations          Reservas do leitor logado
POST   /api/reader/reservations          Reservar livro (apenas leitores ativos)
DELETE /api/reader/reservations/:id      Cancelar reserva
PATCH  /api/reader/profile               Atualizar telefone e/ou senha
```

---

## Instalação e Execução Local

### Pré-requisitos

- Node.js 24 ou superior
- pnpm 9 ou superior — instalar com: `npm install -g pnpm`
- PostgreSQL em execução local (ou URL de conexão remota)

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repositorio>
cd biblioteca-condominio
pnpm install
```

### 2. Configurar variáveis de ambiente

Crie o arquivo `artifacts/api-server/.env`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/biblioteca
JWT_SECRET=sua-chave-secreta-aqui
PORT=8080
NODE_ENV=development
```

Crie o arquivo `artifacts/biblioteca/.env`:

```env
VITE_API_URL=http://localhost:8080
```

Para usar a busca com Gemini AI, configure também:

```env
AI_INTEGRATIONS_GEMINI_BASE_URL=https://...
AI_INTEGRATIONS_GEMINI_API_KEY=sua-chave
```

### 3. Criar o banco de dados e aplicar o schema

```bash
# Aplica o schema Drizzle no banco de dados
pnpm --filter @workspace/db run push
```

### 4. Popular com dados de demonstração (opcional)

```bash
pnpm --filter @workspace/scripts run seed
```

Isso cria:
- **Administrador:** `admin@biblioteca.com` / senha `admin123`
- Leitores, livros, empréstimos e reservas de exemplo

### 5. Iniciar em modo de desenvolvimento

```bash
# Terminal 1 — API Server
PORT=8080 pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/biblioteca run dev
```

Acesse em: `http://localhost:3000`

### 6. Build para produção

```bash
# Build do frontend
pnpm --filter @workspace/biblioteca run build

# Build do servidor (bundle esbuild)
pnpm --filter @workspace/api-server run build
```

Para rodar em produção:

```bash
NODE_ENV=production PORT=8080 node artifacts/api-server/dist/index.mjs
```

---

## Desenvolvimento

### Atualizar a API (fluxo OpenAPI → hooks gerados)

Ao modificar `lib/api-spec/openapi.yaml`, regenere os hooks e schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Atualizar o banco de dados

Após alterar schemas em `lib/db/src/schema/`:

```bash
pnpm --filter @workspace/db run push
```

---

## Acesso ao Sistema

| Área | URL | Credencial |
|---|---|---|
| Página pública | `/` | — |
| Consulta rápida (leitor) | `/leitor` | E-mail cadastrado |
| Portal do leitor | `/leitor/login` | E-mail + senha do cadastro |
| Painel administrativo | `/admin/login` | `admin@biblioteca.com` / `admin123` |
