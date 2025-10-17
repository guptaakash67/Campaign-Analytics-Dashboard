# Deploying backend to Railway

These notes explain how to deploy the FastAPI backend to Railway using the repository's Dockerfile.

1. Create a new project on Railway and choose GitHub as the deployment method. Select this repository.

2. Set the Root Directory to `backend` so Railway builds the backend folder.

3. Railway will detect the `Dockerfile` and build the image. If it doesn't, set the Build Command to `docker build -t app .` and the Start Command to `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`.

4. Add a PostgreSQL plugin in Railway (if you want the DB). After adding the plugin, Railway will expose environment variables. Create (or confirm) the `DATABASE_URL` env variable in Railway Site Settings. Example:

```
postgresql://username:password@host:port/dbname
```

5. Ensure the `PORT` environment variable is set (Railway does this by default). The Dockerfile exposes `9000` and the CMD uses `9000`, but Railway will map `PORT` at runtime — the `CMD` uses `9000` explicitly; if you prefer dynamic port binding use `CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]` in an entrypoint shell script. The default should still work because Railway maps public port to container port.

6. (Optional) If you are using fallback data, ensure the Railway project has a writable filesystem (Railway containers do; fallback persists to container filesystem but is ephemeral between deploys). For durable data prefer Postgres.

7. After deployment, copy the public URL and set `NEXT_PUBLIC_API_URL` in the Vercel dashboard to point to this backend URL so the frontend can call it.
