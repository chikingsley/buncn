# buncn

Shadcn component proof-of-concepts for Bun — tables, data grids, mail, and more.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** React + [React Router](https://reactrouter.com)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com)
- **Table package:** [TanStack/react-table](https://tanstack.com/table/latest)
- **Database:** Local [PostgreSQL](https://www.postgresql.org)
- **Query Layer:** Vanilla SQL via [`postgres`](https://github.com/porsager/postgres)
- **Validation:** [Zod](https://zod.dev)

## Examples

- **Data Grid** — Server-side pagination, sorting, filtering, cell editing, clipboard, keyboard navigation
- **Data Grid Live** — Real-time collaborative grid powered by TanStack DB
- **Mail** — 3-panel resizable email client with folder nav, search, and CRUD actions

## Running Locally

### Quick Setup (with docker)

1. **Clone the repository**

   ```bash
   git clone https://github.com/chikingsley/buncn
   cd buncn
   ```

2. **Copy the environment variables**

   ```bash
   cp .env.example .env
   ```

3. **Run the setup**

   ```bash
   bun run ollie
   ```

   This will install dependencies, start the Docker PostgreSQL instance, set up the database schema, and seed it with sample data.

### Manual Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/chikingsley/buncn
   cd buncn
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your database credentials.

4. **Choose your database approach:**

   **Option A: Use Docker PostgreSQL**

   ```bash
   bun run db:start
   bun run db:setup
   bun run dev
   ```

   **Option B: Use existing PostgreSQL database**

   ```bash
   # Update .env with your database URL
   bun run db:setup
   bun run dev
   ```

## Credits

- [shadcn/ui](https://github.com/shadcn-ui/ui) — UI components and original examples
- [sadmann7/tablecn](https://github.com/sadmann7/tablecn) — Original data table implementation
