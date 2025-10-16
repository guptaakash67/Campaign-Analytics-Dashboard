docker exec -i cam-postgres psql -U myuser -d campaigns_db < backend/database_setup.sql
# Campaign Analytics Dashboard

Small analytics dashboard with a FastAPI backend and a Next.js frontend.

Repository layout

- `backend/` — FastAPI + Uvicorn backend, DB schema `database_setup.sql`, `.env.example`.
- `campaign-dashboard/` — Next.js frontend (React + Tailwind).

Quick start (recommended)

1) Start Postgres (local or Docker). Example (Docker):

```powershell
docker run --name cam-postgres -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=campaigns_db -p 5432:5432 -d postgres:15
```

2) Backend

```powershell
cd D:\cam\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# set DATABASE_URL in .env (example):
# DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/campaigns_db
.\run.ps1 -Port 9000
```

3) Frontend

```powershell
cd D:\cam\campaign-dashboard
npm install
npm run dev
# open http://localhost:3000 and ensure NEXT_PUBLIC_API_URL points to http://localhost:9000 in .env.local
```

Notes

- The backend includes a development fallback (`backend/fallback_data.json`) used when Postgres is unreachable so the frontend still works. For production, configure `DATABASE_URL` and disable fallback.
- I converted the frontend from a nested submodule into a tracked folder so GitHub shows the files.

Want me to:
- Replace the create flow with a nicer modal (done).
- Add Docker Compose for full local stack.
- Remove the fallback and migrate fallback rows into Postgres.

Pick one and I'll implement it next.
