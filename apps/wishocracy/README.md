# @apps/wishocracy

Pairwise public-priority allocation application for [wishocracy.org](https://wishocracy.org).

## Run locally

The app imports `@optimitron/wishocracy` and `@optimitron/db` from their compiled output, so build them first. From the repo root:

```bash
pnpm build:app-dependencies
```

Next.js reads `.env` files from this folder, not the repo root. Start the app on port 3013 with the root `.env`:

```bash
pnpm --filter @apps/wishocracy exec dotenv -e ../../.env -- cross-env NEXTAUTH_URL=http://localhost:3013 pnpm run dev
```

Or copy `.env.example` to `.env.local` in this folder and set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL=http://localhost:3013`. Then `pnpm --filter @apps/wishocracy dev` works on its own.

Without `NEXTAUTH_SECRET`, every page redirects to `/api/auth/error`.

## Pages that need the database

`/results` and `/dashboard` read saved answers. If the database is not reachable, `/results` shows a "results didn't load" message.

In development, these review fixtures render without a database. They use synthetic answers, not real data:

- `/results?visual=1`: public results
- `/results?visual=personal`: results with a sample person's answers
- `/results?visual=empty`: no answers yet
- `/?visual=complete`: finished pairing

## Tests

```bash
pnpm --filter @apps/wishocracy test:unit
```
