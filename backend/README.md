# RealEstateCRM — Backend

FastAPI + SQLAlchemy (async) + Alembic + PostgreSQL

---

## Local Development

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations (uses SQLite by default for zero-setup local dev)
alembic upgrade head

# (Optional) Load dev test data — see ⚠ note below
python seed_dev.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### Using Postgres locally (optional)

If you have a local Postgres instance or use a managed dev DB (Neon, Supabase):

```bash
export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/realestate_crm"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

---

## Deployment (Vercel)

The backend deploys as a Vercel Python serverless function.

- **Entry point**: `api/index.py` re-exports the FastAPI `app`.
- **Config**: `vercel.json` routes all requests to the ASGI app.
- **Database**: Set `DATABASE_URL` env var in Vercel dashboard to your managed Postgres connection string (use the pooler/transaction-mode endpoint for serverless).
- **NullPool**: `database.py` uses `NullPool` so the managed DB provider handles connection pooling externally.

```bash
# Deploy (from the backend/ directory):
vercel --prod
```

---

## ⚠ Seed Scripts — Read Before Running

| Script | Purpose | When to run |
|---|---|---|
| `seed_dev.py` | Loads all mock data from TECHNICAL_SPEC.md (parties, users, properties, leads, etc.) | **Local dev only** — never on staging/production |
| `seed_bootstrap.py` | Creates one Super Admin account | **Production fresh install only** — run once after migrations |

**The dev seed must never run automatically.** It is not called by:
- Migrations (`alembic upgrade head`)
- App startup (`app/main.py`)
- Any CI/CD pipeline

The production database ships **empty** except for the bootstrap Super Admin.
All business data is entered by the client.

---

## Auth (Stub)

Current: reads `X-Mock-Role` and `X-Mock-User-Id` headers.  
Future: replace `get_current_user()` in `app/core/auth.py` — no route changes needed.

| Role | Value |
|---|---|
| Super Admin | `SUPER_ADMIN` |
| Office Executive | `OFFICE_EXECUTIVE` |
| Agent | `AGENT` |
| Client | `CLIENT` |

```bash
# Test as Super Admin:
curl -H "X-Mock-Role: SUPER_ADMIN" http://localhost:8000/api/auth/me

# Test 403:
curl -H "X-Mock-Role: AGENT" http://localhost:8000/api/auth/admin-only
```
