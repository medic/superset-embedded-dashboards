# Superset Embedded Dashboards

A portal that lets Community Health Assistants (CHAs) view Superset dashboards using their existing CHT credentials.

## How It Works

1. A CHA logs in with their **CHT username and password**.
2. The portal validates the credentials against the CHT instance and issues a signed **httpOnly JWT cookie**.
3. When the CHA opens a dashboard, the portal requests a **Superset guest token** scoped to the user's facility via Row-Level Security (RLS).
4. The Superset Embedded SDK renders the dashboard in an iframe using that guest token.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Embedding | @superset-ui/embedded-sdk |
| Auth tokens | jose / jsonwebtoken |
| HTTP client | Axios |
| Testing | Jest + ts-jest |
| Container | Docker (node:20-alpine, multi-stage) |
| Orchestration | Kubernetes |

## Prerequisites

- **Node.js 20+** and npm
- A running **CHT instance** (provides user authentication)
- A running **Apache Superset instance** with the Embedded SDK enabled and a service account configured

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd superset-embedded-dashboards

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env.local
# Edit .env.local with your values (see table below)

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CHT_DOMAIN` | Base URL of the CHT instance | `https://cht.example.com` |
| `SUPERSET_URL` | Base URL of the Superset instance (server-side) | `https://superset.example.com` |
| `SUPERSET_USERNAME` | Superset service account username | `embed-service-account` |
| `SUPERSET_PASSWORD` | Superset service account password | `changeme` |
| `COOKIE_SECRET` | Secret for signing session JWTs (min 32 chars) | `changeme-32-chars-minimum-random` |
| `DASHBOARDS` | JSON array of dashboard objects (`id` + `name`) | `[{"id":"uuid","name":"Performance"}]` |
| `NEXT_PUBLIC_SUPERSET_URL` | Superset URL exposed to the browser for iframe embedding | `https://superset.example.com` |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |

## Project Structure

```
├── k8s/                        # Kubernetes manifests
│   ├── deployment.yaml
│   └── service.yaml
├── src/
│   ├── middleware.ts            # Auth guard (JWT verification on all routes)
│   ├── app/
│   │   ├── login/page.tsx       # Login page
│   │   ├── dashboards/
│   │   │   ├── page.tsx         # Dashboard list
│   │   │   └── [id]/page.tsx    # Single dashboard view
│   │   └── api/
│   │       ├── auth/login/      # POST — authenticate via CHT
│   │       ├── auth/logout/     # POST — clear session cookie
│   │       ├── auth/session/    # GET  — return current session
│   │       ├── dashboards/      # GET  — list configured dashboards
│   │       ├── superset/token/  # POST — generate Superset guest token
│   │       └── health/          # GET  — health check
│   ├── components/
│   │   └── SupersetEmbed.tsx    # Superset iframe embed component
│   └── lib/
│       ├── cht-auth.ts          # CHT credential validation
│       ├── config.ts            # Typed env config loader
│       ├── session.ts           # JWT create / verify helpers
│       └── superset.ts          # Superset API client (auth + guest tokens)
├── Dockerfile                   # Multi-stage production build
├── .env.example
└── package.json
```

## Docker

```bash
# Build the image
docker build -t cha-dashboard-portal .

# Run the container
docker run -p 3000:3000 --env-file .env.local cha-dashboard-portal
```

## Kubernetes

The `k8s/` directory contains ready-to-use manifests:

- **`deployment.yaml`** — 2-replica deployment with readiness/liveness probes on `/api/health`, resource limits, and env vars sourced from a Secret (`cha-dashboard-secrets`) and ConfigMap (`cha-dashboard-config`).
- **`service.yaml`** — ClusterIP service exposing port 80 → 3000.

```bash
# Create the secret and configmap first, then apply
kubectl apply -f k8s/
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

Tests are located alongside their source files in `__tests__/` directories under `src/lib/` and `src/__tests__/`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | Public | Authenticate with CHT credentials, receive session cookie |
| `POST` | `/api/auth/logout` | Required | Clear the session cookie |
| `GET` | `/api/auth/session` | Required | Return the current session payload |
| `GET` | `/api/dashboards` | Required | List configured dashboards |
| `POST` | `/api/superset/token` | Required | Generate a Superset guest token for a dashboard |
| `GET` | `/api/health` | Public | Health check for K8s probes |

## Security

- **httpOnly cookies** — Session JWTs are stored in httpOnly, secure cookies to prevent XSS token theft.
- **Signed JWTs** — Sessions are signed with `COOKIE_SECRET` using HMAC-SHA256.
- **Middleware auth guard** — All routes except `/login`, `/api/auth/login`, and `/api/health` require a valid JWT.
- **Row-Level Security** — Superset guest tokens are scoped to the user's facility IDs, ensuring data isolation.
- **Input validation** — Login and token endpoints validate request bodies before processing.
- **Non-root container** — The Docker image runs as a dedicated `nextjs` user (UID 1001).
