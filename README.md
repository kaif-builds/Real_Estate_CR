# RealEstateCRM

Full-stack real estate CRM — Next.js frontend + FastAPI backend.

## Architecture

| Layer | Stack |
|---|---|
| Frontend | Next.js 14 (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python 3.11+) + SQLAlchemy async + Alembic |
| Database | PostgreSQL (managed: Neon / Supabase / Vercel Postgres) |
| Deployment | Vercel — frontend as Next.js app, backend as Python serverless functions |
| Auth | Stub (mock headers) — real auth drops in later without changing routes |

## Deployment Strategy

**Two separate Vercel projects** from the same repo (recommended for independent scaling):

| Project | Root Directory | Framework |
|---|---|---|
| Frontend | `frontend/` | Next.js (auto-detected) |
| Backend | `backend/` | Python (via `vercel.json` + `@vercel/python`) |

Set `BACKEND_URL` on the frontend Vercel project to the backend's deployed URL.
Set `DATABASE_URL` on the backend Vercel project to your managed Postgres pooler endpoint.

---

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ and pip
- (Optional) PostgreSQL — SQLite works for local dev with zero setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# (Optional) Load dev seed data
python seed_dev.py

# Start backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Start dev server (proxies /api/* to localhost:8000)
npm run dev
```

Open http://localhost:3000. The floating DEV button (bottom-right) lets you switch mock auth roles.

---

## Environment Variables

Copy `.env.example` to `.env` in each directory and adjust:

### Backend (`backend/.env`)
```
DATABASE_URL=sqlite+aiosqlite:///./realestate_crm.db
SECRET_KEY=dev-secret-key
CORS_ORIGINS=http://localhost:3000
DEBUG=true
```

### Frontend (`frontend/.env.local`)
```
BACKEND_URL=http://localhost:8000
```

---

## Project Structure

```
├── backend/
│   ├── api/index.py          # Vercel serverless entry point
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── core/             # Config, auth, database
│   │   ├── api/              # Route modules
│   │   └── models/           # SQLAlchemy models + enums
│   ├── alembic/              # DB migrations
│   ├── vercel.json           # Backend Vercel config
│   ├── requirements.txt
│   ├── seed_dev.py           # Dev-only test data
│   └── seed_bootstrap.py     # Production bootstrap (1 admin)
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Layout + UI components
│   │   └── lib/              # Utilities, mock data, API client
│   ├── next.config.mjs
│   └── package.json
├── .env.example
└── TECHNICAL_SPEC.md
```
