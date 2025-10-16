# Campaign Analytics - Backend

This is the FastAPI backend for the Campaign Analytics project. It provides a small API to read campaign data from a PostgreSQL database.

## Quick start (Windows PowerShell)

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Create a PostgreSQL database and run the SQL in `database_setup.sql` to create sample data. Set `DATABASE_URL` before running.

Example DATABASE_URL (local):

```
postgresql://<user>:<password>@localhost:5432/campaigns_db
```

4. Create a `.env` file (or set environment variable) and run the app:

```powershell
# Example using Powershell set and run
$env:DATABASE_URL = "postgresql://user:pass@localhost:5432/campaigns_db"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

5. Health check:

Open http://localhost:8000/ in your browser. The UI (campaign-dashboard) expects the backend at `/campaigns`.

## Deployment (Heroku / Dokku)

This repo includes a `Procfile` which starts the app with Uvicorn. Ensure `DATABASE_URL` is set in the deployment environment.

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Notes
- The backend uses `psycopg2` to connect to PostgreSQL. For production, provide a proper `DATABASE_URL` and restrict CORS.
- If you need HTTPS or an API gateway, put this behind a reverse proxy (nginx) or a platform's router.
