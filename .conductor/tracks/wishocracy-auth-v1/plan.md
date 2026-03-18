# Plan: Add Wishocracy Account Persistence to Web

1. [x] Extend the Prisma schema for web auth and saved Wishocracy state.
   - Added `User`, `Vote`, `WishocraticAllocation`, `WishocraticCategorySelection`, and `VoteAnswer`.
   - Updated `@optimitron/db` Zod validators and tests for the new models.
2. [x] Add server auth and signup plumbing in the web package.
   - Added `next-auth` credentials config, Prisma helpers, signup route, session typing, and referral utilities.
3. [x] Replace guest-only vote UI with auth-aware persistence.
   - Reworked the vote state hook to load database state, sync guest progress, and keep referral prompts/session data in the UI.
4. [x] Add completion/share/account UX for saved allocations.
   - Replaced stub auth cards, added referral-link sharing, and exposed session controls in the navbar.
5. [x] Document the runtime configuration needed for local auth.
   - Updated `packages/web/.env.example` with database/auth base URL settings.
6. [x] Add focused regression tests and local DB support for the new auth path.
   - Added `packages/web` Vitest config plus tests for referral helpers, guest state hydration, and allocation API normalization/authorization.
   - Added a root `docker-compose.yml` and `db:up` / `db:down` scripts for local Postgres-backed auth development.
