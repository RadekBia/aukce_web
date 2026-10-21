# Aukceee na dobrou Věc

Next.js 15 + Prisma auction listing app (Czech UI).

## Requirements

- Node.js 20+ (tested with 22)
- PostgreSQL 14+

## Quick start

```bash
cp .env.example .env
# edit DATABASE_URL to point at your Postgres database

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
| `npm run build` / `npm start` | Production build + start |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Insert sample auctions |

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Prisma Postgres URL (local or Railway public URL) |
| `ENABLE_UNAUTHENTICATED_AUCTION_CREATION` | no | Set to `true` only for local API testing of `POST /api/auctions`. UI create form stays gated. |

For **Railway Postgres**: create a Postgres plugin in a Railway project, copy `DATABASE_URL` into local `.env` (or set `RAILWAY_TOKEN` so the CLI can pull vars), then `npx prisma migrate deploy` and `npm run db:seed`. Do not commit secrets. Auth / Google SSO is deferred.

No auth provider, payments, or email services are wired yet.

## Bidding (local-dev)

On `/aukce/[id]`, enter a name or e-mail and an amount higher than the current price.
`POST /api/auctions/:id/bids` with `{ "bidder", "amount" }` stores `bidder` in `Bid.bidderId`.
This is **not** secure production identity — Google SSO remains deferred.

## Known gaps

- Creating auctions via UI is intentionally disabled until login/authorization exists.
- Bidder field is free-text (no verified identity yet).
- Railway deploy and Google SSO are deferred; local Postgres is the supported path for now.
