# Infrastructure

Deployment assets for the News Aggregator. Everything Docker- and Nginx-related
lives here — application code under `server/` and `client/` stays deployment-agnostic.

```
infra/
├── docker/
│   ├── server.Dockerfile      # Node API, multi-stage, non-root, healthcheck
│   ├── client.Dockerfile      # Vite build -> nginx:alpine
│   ├── docker-compose.yml     # mysql + server + client stack
│   └── .env.example           # compose-level vars (DB creds, published port)
└── nginx/
    └── nginx.conf             # SPA serving + /api reverse proxy, mounted at runtime
```

## Running the stack

```bash
cp infra/docker/.env.example infra/docker/.env   # DB credentials, HTTP_PORT
cp server/.env.example server/.env               # JWT/OAuth/news API secrets — fill in real values
docker compose -f infra/docker/docker-compose.yml up --build -d
```

The client container listens on `HTTP_PORT` (default `80`) and reverse-proxies
`/api/*` to the server container, so the SPA and API are served same-origin —
no CORS configuration needed in production.

- App: `http://localhost:${HTTP_PORT}`
- API health check: `http://localhost:${HTTP_PORT}/api/health`

To stop: `docker compose -f infra/docker/docker-compose.yml down` (add `-v` to
also drop the `mysql_data` volume — this deletes the database).

## Notes

- `infra/nginx/nginx.conf` is mounted read-only into the client container at
  runtime rather than baked into the image, so config changes don't require a
  rebuild — just `docker compose restart client`.
- `server.Dockerfile` runs as a non-root user and exposes a `/api/health`
  healthcheck that `docker-compose` and orchestrators (Kubernetes, ECS, etc.)
  can use for readiness/liveness probes.
- This compose file is a single-host production stack (suitable for a small
  VPS deployment). It does not set up TLS termination, horizontal scaling, or
  a managed database — see `docs/TODO.md` for what's still needed for a
  larger-scale production deployment.
