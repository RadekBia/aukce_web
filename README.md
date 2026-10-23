# Aukceee na dobrou Věc

Next.js 15 + Prisma auction listing app (Czech UI).

## Requirements

- Node.js 20+ (tested with 22)
- PostgreSQL 14+ (local) or **Neon** (hosted)

## Quick start (local)

```bash
cp .env.example .env
# set DATABASE_URL and DIRECT_URL (same value for local Postgres)

npm install
npx prisma migrate deploy   # or: npm run db:migrate  (dev)
npm run db:seed             # sample auctions (idempotent if table already has rows)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js development server |
| `npm run build` | `prisma generate` → `prisma migrate deploy` → `next build` (Vercel-safe; migrate at **build** time, not cold start) |
| `npm start` | `next start` (local/prod Node host) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Insert sample auctions |

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Pooled Postgres URL (Neon pooled / local) |
| `DIRECT_URL` | yes | Direct Postgres URL for migrations (Neon direct; locally = `DATABASE_URL`) |
| `ENABLE_UNAUTHENTICATED_AUCTION_CREATION` | no | Default **ON** (`src/lib/flags.ts`). Set `false` to lock create. |
| (photos) | — | Stored in Neon (`AuctionImage` bytea), served at `/api/images/[id]`. No Blob token. |

### Neon + Vercel

1. Neon dashboard → copy **pooled** → `DATABASE_URL`, **direct** → `DIRECT_URL`.
2. Vercel project → Env vars (Production + Preview): paste both. Do **not** set the create-auction flag in Production.
3. Deploy from this PR branch / after merge. Build runs migrate deploy once per deploy.
4. Optional seed from laptop: `DATABASE_URL=… DIRECT_URL=… npm run db:seed`
5. Smoke: `/`, `/api/auctions`, `/aukce/nova` (create stays off in prod unless you intentionally set the flag on Preview).

Full runbook: project store `docs/aukce-setup.md`.

Railway is out of scope. Prefer **Neon + Vercel** for hosting.

## Bidding

On `/aukce/[id]`, enter **jméno**, **příjmení**, and an amount higher than the current price.
`POST /api/auctions/:id/bids` with `{ "firstName", "lastName", "amount" }` stores `"Jméno Příjmení"` as the bidder identity.

## Known gaps

- Create without login is open by default; lock with the env flag if needed.
- Bidder identity is first + last name (not verified login).
