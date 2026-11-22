# Nyati Project Intelligence

Project intelligence dashboard for **Nyati Evania** (Tower A / A Block) and **Nyati Elenor** (Lullanagar, Pune).

- Project selector (top right) switches every page between the two projects.
- **Nyati Evania** — R1 estimate, work packages (editable, saved in the browser), BOQ, risk center, Aluform floor tracker, site reports and weekly reports.
- **Nyati Elenor** — figures from the Progress Review Presentation PLN/407 (upto October 2026): status, monthly progress, Q3 target vs actual, Aluform casting, building-wise cost, purchasing and contractor deployment.
- **AI Assistant** — chat button at the bottom right on every page. It knows both projects and the app's pages, and answers with exact figures, comparisons, strategy and where to find things in the app. Powered by Google Gemini on the server (the API key never reaches the browser).

## Requirements

- Node.js 20.19+ (22 LTS recommended)
- A Gemini API key — <https://aistudio.google.com/apikey>

## Configuration

```bash
cp .env.example .env
# then edit .env and set GEMINI_API_KEY=...
```

The server reads `.env.local` and `.env` (never `.env.example`). Real environment variables take precedence. See [.env.example](.env.example) for all options (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `AI_RATE_LIMIT`, `PORT`).

## Run locally (development)

```bash
npm install
npm run dev        # http://localhost:3000 with hot reload
```

## Production

```bash
npm ci
npm run build      # builds the client into dist/ and bundles the server into server.js
npm start          # serves on $PORT (default 3000)
```

- Health check: `GET /api/health` → `{"status":"ok","aiConfigured":true}`
- AI endpoints (`/api/assistant`, `/api/weekly-summary`) are rate-limited per IP (default 40 requests / 5 min).

### Vercel

The repo includes [vercel.json](vercel.json): Vercel builds the React app into `dist/` (served from its CDN) and runs all `/api/*` routes as one serverless function ([api/index.ts](api/index.ts)), which reuses the same Express API as the Node server ([server/app.ts](server/app.ts)).

1. Import the repository in Vercel (framework preset: Vite — picked up from `vercel.json`).
2. **Project → Settings → Environment Variables:** add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `AI_RATE_LIMIT`).
3. Deploy. Check `https://<your-app>.vercel.app/api/health` → `{"status":"ok","aiConfigured":true}`.

No other variables are needed — the app has no login and no external data source.

### Docker

```bash
docker build -t nyati-project-intelligence .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key nyati-project-intelligence
```

The image runs as a non-root user, listens on `$PORT` (8080 by default) and includes a health check. It works as-is on container hosts such as Google Cloud Run, Render, Railway or Fly.io — set `GEMINI_API_KEY` in the host's environment/secrets settings.
