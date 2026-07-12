# Local Database

Optimitron uses PostgreSQL for the web/API layer. The repo includes a local Docker Compose service and committed Prisma migrations.

## Defaults

The local Postgres container listens on `localhost:5432` with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optimitron
```

This matches the root `.env.example`.

Keep the root `.env` pointed at this local database for normal development.
Production credentials belong in Vercel/GitHub secrets or an explicit one-off
shell session, not in the default local `.env`.

The web dev server refuses to start against a non-local `DATABASE_URL` unless
`OPTIMITRON_ALLOW_REMOTE_DEV_DATABASE=1` is set. Use that override only for an
intentional remote or preview database session.

The same dev guard refuses live Stripe keys in local dev unless
`OPTIMITRON_ALLOW_LIVE_STRIPE_DEV=1` is set. Use Stripe test-mode keys locally,
or leave Stripe keys blank for UI-only review.

## Bootstrap

1. Copy `.env.example` to `.env`.
2. Run:

```bash
pnpm db:setup
```

That will:
- start Docker Compose and wait for Postgres health
- apply committed Prisma migrations
- run the seed script

## Useful Commands

```bash
pnpm db:up
pnpm db:down
pnpm db:logs
pnpm db:deploy
pnpm db:test
pnpm db:migrate
pnpm db:sync:managed-data -- --apply
pnpm db:reset
```

## Restore from backup

Nightly encrypted production dumps land in the R2 bucket
(`optimitron-db-backups`, see `.github/workflows/db-backup.yml`) under
`backups/YYYY/MM/DD/` as a pair:

- `dump.zst.enc` — pg_dump custom format, zstd-compressed, AES-256-CTR encrypted
- `key.rsa` — the session key (`KEYHEX:IVHEX`), RSA-OAEP(sha256)-encrypted to
  the offline backup public key

CI never sees the private key, so decryption (and the full restore drill) is a
manual step with the offline `backup_private.pem`, run quarterly:

```bash
# 1. Recover the session key (file contains "KEYHEX:IVHEX")
openssl pkeyutl -decrypt -inkey backup_private.pem \
  -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 \
  -in key.rsa -out session-key.txt
KEY_HEX=$(cut -d: -f1 session-key.txt)
IV_HEX=$(cut -d: -f2 session-key.txt)

# 2. Decrypt + decompress
openssl enc -d -aes-256-ctr -K "$KEY_HEX" -iv "$IV_HEX" \
  -in dump.zst.enc -out dump.zst
zstd -d dump.zst -o db.dump

# 3. Restore (target an empty database or a throwaway Neon branch)
pg_restore --no-owner --no-privileges -d "$DATABASE_URL" db.dump
```

Shred `session-key.txt` afterwards. Restore into local Docker or a throwaway
Neon branch — never over production without an explicit decision.

## Notes

- `pnpm db:migrate` is for creating new development migrations after schema changes.
- `pnpm db:deploy` applies committed migrations without prompting for new ones.
- The seed script is idempotent and safe to rerun.
- `pnpm db:test` starts the local Docker Postgres if needed, applies committed
  migrations, and runs the DB-backed integration test suite.
- Do not sync raw production data into local development. If production-shaped
  data is needed, use a masked Neon preview branch after the anonymization
  workflow in `docs/PREVIEW_DATA_PRIVACY.md` has passed.
