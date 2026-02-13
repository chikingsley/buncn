# BunCN

Pre-built [Shadcn/UI](https://ui.shadcn.com) blocks and components, ported and optimized for Bun full-stack environments.

## Why This Exists

Shadcn/UI is incredible, but deploying a full-stack app using it inside a Bun container is a different story. Standard Next.js setups don't translate cleanly — there's configuration friction around bundling, server-side rendering, API routes, and containerization that adds up fast.

BunCN eliminates that friction. Every block here is pre-configured and tested against a Bun-native server with React Router, Tailwind CSS v4, and PostgreSQL. Clone it, grab the blocks you need, or use the whole thing as a starter for your next project.

## Blocks

### Available Now

| Block | Description |
|-------|-------------|
| **Data Grid** | Server-side pagination, sorting, filtering, cell editing, clipboard, keyboard navigation |
| **Data Grid Live** | Real-time collaborative grid powered by TanStack DB |
| **Mail** | 3-panel resizable email client with folder nav, search, labels, and full CRUD |
| **Tasks Table** | Task management with status/priority filtering, row selection, and CRUD actions |

### Porting Next

These are official Shadcn blocks and high-value community patterns we plan to port:

**Official Shadcn Blocks**
- Dashboard (sidebar + charts + data table)
- Sidebar variants (collapsible, icon-only, file tree, calendar, nested)
- Login / Signup pages (forms, social providers, two-column layouts)

**High-Value Community Patterns**
- Charts (area, bar, line, pie, radar — via Recharts)
- Settings pages
- Kanban boards
- Calendar views
- File upload interfaces
- Rich text editors (Plate, ProseMirror-based)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | [Bun](https://bun.sh) |
| **Frontend** | React 19 + [React Router](https://reactrouter.com) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **UI** | [Shadcn/UI](https://ui.shadcn.com) (36+ components) |
| **Tables** | [TanStack Table](https://tanstack.com/table) |
| **Database** | PostgreSQL via [`postgres`](https://github.com/porsager/postgres) |
| **Validation** | [Zod](https://zod.dev) |
| **Server** | `Bun.serve()` — no Express, no Node |

## What Changed from Next.js

Moving from a standard Next.js + Shadcn setup to Bun full-stack required these structural changes:

| Concern | Next.js | BunCN (Bun) |
|---------|---------|-------------|
| **Server** | Next.js built-in | `Bun.serve()` native HTTP server |
| **Routing** | File-based (`app/` dir) | React Router with lazy-loaded routes |
| **API Routes** | `app/api/` convention | Manual route matching in `src/server/index.ts` |
| **Bundling** | Next.js/Webpack/Turbopack | `bun build` with `bun-plugin-tailwind` |
| **CSS** | Next.js PostCSS pipeline | Tailwind v4 via `bun-plugin-tailwind` |
| **Server Components** | Built-in RSC support | Client-only React — data fetched via API |
| **Image Optimization** | `next/image` | Standard `<img>` tags (bring your own CDN) |
| **Head/Metadata** | `next/head` or Metadata API | Manual `<head>` management |
| **Environment Variables** | `NEXT_PUBLIC_` prefix convention | Zod-validated `src/env.ts` |
| **HMR** | Built-in | `bun --hot` flag |
| **Containerization** | Multi-stage Dockerfile with Next standalone | Single `bun build` output, runs directly |

## Getting Started

### Quick Setup

```bash
git clone https://github.com/chikingsley/buncn
cd buncn
cp .env.example .env
bun run ollie
```

This installs dependencies, starts a Docker PostgreSQL instance, runs migrations, and seeds sample data.

### Start Developing

```bash
bun run dev
```

The server starts at `http://localhost:3000` with hot reload.

### Manual Setup

If you have an existing PostgreSQL instance:

```bash
bun install
cp .env.example .env
# Update .env with your database credentials
bun run db:setup
bun run dev:local
```

### Production Build

```bash
bun run build
cd dist/app && NODE_ENV=production bun --env-file=../../.env index.js
```

## Project Structure

```text
src/
├── app/                    # Block implementations
│   ├── data-grid/          # Data grid block
│   ├── data-grid-live/     # Real-time grid block
│   ├── mail/               # Mail client block
│   └── components/         # Tasks table block
├── components/
│   ├── ui/                 # Base Shadcn components
│   ├── data-grid/          # Reusable grid components
│   ├── data-table/         # Reusable table components
│   └── layouts/            # Layout wrappers
├── db/                     # Schema, migrations, seeds
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
├── routes/                 # Page components
├── server/                 # Bun API server
├── styles/                 # Global CSS
└── types/                  # TypeScript definitions
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with Docker PostgreSQL |
| `bun run dev:local` | Start dev server (bring your own DB) |
| `bun run build` | Production build |
| `bun run ollie` | Full setup (install + DB + migrate + seed) |
| `bun run check` | Lint and format check |
| `bun run fix` | Auto-fix lint and format issues |
| `bun run typecheck` | TypeScript type checking |
| `bun run db:reset` | Tear down and rebuild the database |
| `bun run shadcn` | Add Shadcn components |

## Roadmap

### Phase 1: Block Expansion
- Port official Shadcn blocks (dashboard, sidebar, login, signup)
- Add chart examples (area, bar, line, pie via Recharts)
- Build settings pages, kanban boards, and calendar views

### Phase 2: Documentation
- Detailed architectural comparison: Next.js vs Bun full-stack
- Containerization and deployment guide (Docker, Fly.io, Railway)
- Per-block documentation with usage examples

### Phase 3: Registry
- Research and implement a BunCN component registry
- `bunx buncn add <block>` CLI for pulling blocks into existing projects
- Version tracking against Bun and Shadcn updates

### Phase 4: Community
- Accept community block contributions
- Integrate popular community patterns (from the 127+ Shadcn registries)
- Benchmark Bun full-stack vs Next.js performance

## Adapted From

BunCN's current blocks are ported from two sources. This section documents what came from where and what changed in the process.

### Data Table & Data Grid — from [sadmann7/shadcn-table](https://github.com/sadmann7/tablecn)

The original is a Next.js App Router project using Drizzle ORM, React Server Components, and `unstable_cache` / `revalidateTag` for caching.

**What we kept:**
- TanStack Table column definitions, filter operators, and sorting logic
- Data grid components: cell variants (short-text, long-text, number, select, multi-select, checkbox, date, URL, file), virtualization, keyboard navigation, clipboard, undo/redo, context menu, search
- Data table components: pagination, column headers, toolbar, faceted filters, date filters, slider filters, sort/filter lists, view options, skeleton
- Custom hooks: `useDataTable`, `useDataGrid` and its sub-hooks (keyboard, editing, clipboard, selection, navigation, search, focus, undo-redo)
- URL state management via nuqs
- Zod validation schemas

**What we changed:**

| Layer | Original (Next.js) | BunCN (Bun) |
|-------|-------------------|-------------|
| **ORM** | Drizzle ORM with typed schema builders | Vanilla SQL via `postgres` library |
| **Data fetching** | RSC with `unstable_cache`, `Promise` passed to client via `React.use()` | Client-side `fetch()` to REST API endpoints |
| **Mutations** | `"use server"` actions with `revalidateTag()` cache invalidation | `fetch()` to REST API + custom event emitter for UI refresh |
| **Server** | Next.js built-in server | `Bun.serve()` with manual route matching |
| **Database schema** | Drizzle `pgTable` with `pgTableCreator` prefix | Raw SQL `CREATE TABLE` migrations |
| **Filter engine** | Drizzle ORM filter builder (`filterColumns.ts`) | Hand-written SQL WHERE clause builder with parameterized queries |
| **Routing** | File-based App Router (`app/page.tsx`, `app/data-grid/page.tsx`) | React Router with lazy-loaded route components |
| **Rate limiting** | Upstash Redis (`@upstash/ratelimit`) | Removed (not needed for self-hosted) |
| **File uploads** | UploadThing integration | Removed (placeholder in grid) |
| **Env validation** | `@t3-oss/env-nextjs` | Zod schema in `src/env.ts` |
| **Caching** | `unstable_cache()` + `revalidateTag()` | No server-side caching (direct DB queries) |
| **Table prefix** | `tablecn_` | `buncn_` |

**What we added:**
- Bun-native HTTP server with all REST API endpoints (`/api/tasks`, `/api/skaters`)
- SQL migrations and seed scripts runnable via `bun run db:setup`
- Docker Compose for local PostgreSQL
- Event-driven UI refresh (`tasks:changed` custom events)

### Mail Client — from [shadcn/ui mail example](https://github.com/shadcn-ui/ui/tree/main/deprecated/www/app/(app)/examples/mail)

The original is a **UI-only demo** — 7 files, 17 hardcoded emails, no database, no working actions. Most buttons (`Reply`, `Forward`, `Archive`, `Trash`, `Search`) are non-functional stubs.

**What we kept:**
- 3-panel resizable layout (nav, list, display) using `react-resizable-panels`
- Component structure: `Mail`, `MailNav`, `MailList`, `MailDisplay`, `AccountSwitcher`
- Visual design: badge variants, unread indicators, avatar with initials, relative timestamps
- Shadcn/UI component usage: Tabs, ScrollArea, Tooltip, Popover, DropdownMenu, Calendar, etc.

**What we changed:**

| Layer | Original (Shadcn) | BunCN (Bun) |
|-------|-------------------|-------------|
| **Data source** | Hardcoded array of 17 mails in `data.tsx` | PostgreSQL `buncn_mails` table with full schema |
| **State management** | Jotai atom for selected mail | React state + event-driven refetch |
| **Search** | Non-functional `<Input>` | Working client-side filter on subject and sender |
| **Folder navigation** | Dead `href="#"` links with hardcoded counts | Functional folder switching with live DB counts |
| **Archive / Junk / Trash** | Button stubs (no handlers) | Working — moves mail between folders via API |
| **Delete** | Not implemented | Working — permanent deletion via API |
| **Read/Unread** | Static boolean, no toggle | Visual indicator with real DB state |
| **Layout persistence** | `document.cookie` | `localStorage` |
| **Server dependency** | `next/headers` for cookie reading | No server component dependencies |
| **Panel collapse** | Cookie-persisted threshold | localStorage-persisted with 10% width threshold |

**What we added:**
- Full database layer: schema, migrations, seed data
- REST API: `GET/PATCH/DELETE /api/mails`, `GET /api/mails/folder-counts`
- Server-side query builder with folder filtering, search, and unread-only mode
- Custom event system (`mails:changed`) for cross-component data refresh
- Zod validation schemas for mail operations
- 8 label types (work, personal, important, social, updates, forums, shopping, promotions)
- 6 working folders (inbox, drafts, sent, junk, trash, archive) with real counts

**What's still UI-only:**
- Reply, Reply All, Forward
- Snooze
- Account switching (dropdown works, but all accounts show same data)
- Mark as unread, Star thread, Add label, Mute thread

## Credits

- [shadcn/ui](https://github.com/shadcn-ui/ui) — UI components and original mail example
- [sadmann7/shadcn-table](https://github.com/sadmann7/tablecn) — Original data table and data grid implementation
- [Vercel](https://vercel.com) — React best practices referenced throughout
