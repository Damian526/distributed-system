# SaaS Distributed Platform

A small e-commerce analytics platform. An API receives payments, a background worker
processes them and generates PDF reports, and a frontend dashboard shows everything.

This guide gets you running **locally, step by step**, even if you've never touched
this project before.

## What you need installed first

- **Node.js** (v20 or newer) — https://nodejs.org
- **Docker Desktop** (running) — https://www.docker.com/products/docker-desktop

That's it. Everything else (database, Redis, file storage) runs inside Docker.

## The pieces of this project

| Folder          | What it is                                              | Runs on port |
| --------------- | -------------------------------------------------------- | ------------ |
| `backend-api`   | The public API (receives requests, queues jobs)         | 3000         |
| `backend-worker`| Background worker (processes payments, builds PDFs)     | (no port)    |
| `frontend`      | The web dashboard you open in your browser              | 5173         |
| `docker-compose.yml` | Postgres (database), Redis (queue), MinIO (file storage) | 5433, 6379, 9000/9001 |

---

## Step 1 — Start the infrastructure (database, queue, storage)

From the project's root folder, run:

```bash
docker compose up -d
```

This starts Postgres, Redis, and MinIO in the background. Leave them running —
you only need to do this once per work session (or once ever, if you don't stop Docker).

To check everything started correctly:

```bash
docker compose ps
```

You should see `postgres`, `redis`, and `minio` all with a status of `healthy` or `running`.

---

## Step 2 — Install dependencies

Each folder has its own dependencies. Run `npm install` in each one:

```bash
cd backend-api && npm install && cd ..
cd backend-worker && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## Step 3 — Set up the database

The database needs its tables created, then filled with sample data so the
dashboard has something to show.

```bash
cd backend-api
npx prisma migrate dev
npx prisma db seed
cd ..
```

- `migrate dev` creates all the tables (customers, orders, reports).
- `db seed` fills the database with ~300 fake customers and ~8000 fake orders,
  so reports and charts actually have data to show.

You only need to do this once (re-run `db seed` any time you want fresh sample data).

> Environment variables (database URL, ports, API keys) are already configured
> in `.env.development` files in each folder — you don't need to create them yourself.

---

## Step 4 — Run the three apps

You need **three terminal windows/tabs** open at the same time, one per app.

**Terminal 1 — the API:**
```bash
cd backend-api
npm run start:dev
```
Wait until you see `API is running on http://localhost:3000`.

**Terminal 2 — the background worker:**
```bash
cd backend-worker
npm run start:dev
```
Wait until you see `Background Worker is alive and listening to Redis queues...`.

**Terminal 3 — the frontend:**
```bash
cd frontend
npm run dev
```
Wait until you see a `Local: http://localhost:5173/` link.

---

## Step 5 — Open the app

Go to **http://localhost:5173** in your browser. You should see the dashboard
with two tabs: **Raporty** (Reports) and **Checkout**.

- In **Raporty**, click "Generuj raport PDF" to generate a PDF report in the
  background — it will queue a job, the worker will pick it up, and a download
  link will appear once it's done.
- In **Checkout**, you can simulate a Stripe payment (opens Stripe's real test
  checkout page — use test card `4242 4242 4242 4242`, any future expiry, any CVC).

---

## Optional — testing real Stripe webhooks

If you want Stripe to actually notify your local API when a test payment
succeeds, you need the [Stripe CLI](https://stripe.com/docs/stripe-cli) running
in a 4th terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhooks
```

Copy the webhook signing secret it prints out into `backend-api/.env.development`
as `STRIPE_WEBHOOK_SECRET` (there is already a placeholder there).

---

## Stopping everything

- Stop the three `npm run start:dev` / `npm run dev` terminals with `Ctrl+C`.
- Stop the Docker services with:
  ```bash
  docker compose down
  ```
  (add `-v` at the end if you also want to wipe the database data)

---

## Troubleshooting

- **"Cannot connect to database"** → make sure `docker compose ps` shows Postgres
  as healthy, and that you ran `docker compose up -d` first.
- **Reports never finish ("PENDING" forever)** → make sure `backend-worker` is
  running (Terminal 2) — it's the one that actually processes the report jobs.
- **Port already in use** → something else on your machine is using port 3000,
  5173, 5433, 6379, or 9000. Stop that other process, or change the port in the
  relevant `.env.development` file.
