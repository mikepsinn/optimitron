# Track Spec: Add Wishocracy Account Persistence to Web

## Background
The Optimitron web app already includes the Wishocracy allocation UI, but the copied flow was guest-only. Users could not create an account, save allocations to the database, or get a stable referral link after participating.

## Objective
Add the missing authentication and persistence pieces from Wishocracy so Optimitron users can sign in, submit allocations, resume progress, and share referral links.

## Scope
- Credentials-based account creation and sign-in for the web package.
- Prisma-backed persistence for:
  - user accounts
  - referral attribution
  - saved pairwise allocations
  - saved category selections
- Web UI updates for sign-in prompts, completion/share flows, and account visibility.
- Local guest progress sync on sign-in.

## Deliverables
- Prisma schema additions and matching `@optimitron/db` Zod validators/tests.
- NextAuth configuration and signup/auth API routes in `packages/web`.
- Vote flow updates that sync guest allocations into authenticated storage.
- Referral link helpers and completion/share UI.

## Acceptance Criteria
- A new user can sign up and immediately land in an authenticated session.
- Authenticated users can save and reload allocations/category selections.
- Guest progress syncs into the authenticated account after sign-in.
- Each authenticated user has a working referral link.
