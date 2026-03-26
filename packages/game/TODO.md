# Earth Optimization Game — Hackathon TODO

## Deadline: ~4-5 days remaining

---

## Phase 1: Ship the Video (NOW)

- [ ] Read through all 50 slide narrations in sequence — check flow, cut filler
- [ ] Generate TTS narration audio (`pnpm generate:narration`)
- [ ] Record video with `pnpm dev` + `pnpm record`
- [ ] Review recording, adjust timing/pacing per slide

## Phase 2: Add Web App Links

Add `ctaUrl` field to key slides pointing to the live web app. These show as
clickable buttons ("TRY IT") during the presentation and in the video description.

| Slide | Link To | Route |
|-------|---------|-------|
| `allocate` | Wishocracy pairwise survey | `/agencies/dcongress/wishocracy` |
| `your-budget` | Budget optimization page | `/agencies/domb` |
| `referendum` | Referendum voting | `/agencies/dcongress/referendums` |
| `arsonist-board` | Politician alignment scores | `/agencies/dfec/alignment` |
| `policy-engine` | Policy scoring | `/agencies/dcbo` |
| `budget-optimizer` | Budget optimizer | `/agencies/domb` |
| `fda-queue` | dFDA page | (TBD) |
| `dfda-fix` | dFDA page | (TBD) |
| `storacha` | Transparency & audit | `/agencies/dgao` |
| `hypercerts` | Hypercerts page | `/agencies/dgao` |
| `replace-irs` | dIRS page | `/agencies/dtreasury/dirs` |
| `replace-welfare` | dSSA page | `/agencies/dtreasury/dssa` |
| `replace-fed` | dFED page | `/agencies/dtreasury/dfed` |
| `close` | Play the game | `/prize` |

## Phase 3: Embed Live Features (if time permits)

Try embedding a couple of the most impressive web app pages directly into the
game at key moments. Candidates (in priority order):

1. **Budget slider** (`/agencies/domb`) — during the `allocate` slide, the
   player drags a real slider instead of watching ASCII art
2. **Referendum vote** (`/prize`) — during the `referendum` slide, the player
   casts a real vote with World ID
3. **Policy scoring** (`/agencies/dcbo`) — during the `policy-engine` slide,
   show real Bradford Hill scores

Approach: iframe with postMessage auth handoff, or Farcaster-style frames.
This is stretch — only attempt after video is recorded and links are added.

## Phase 4: Post-Hackathon (later)

- [ ] Extract core web app features into standalone SDKs/packages
- [ ] Build proper frame/embed protocol so anyone can integrate features
- [ ] Replace ASCII art with pixel art components where it improves the experience
- [ ] Add interactive Sierra verb system (point-and-click on elements)
- [ ] Multiplayer leaderboard (live player count, vote totals)

---

## Architecture Notes

This repo has been copied to `packages/game` in the optimitron monorepo.
The monorepo web app lives at `packages/web`. Key routes to reference:

| Feature | Web App Route | Monorepo Package |
|---------|--------------|-----------------|
| Causal inference engine | — | `@optimitron/optimizer` |
| Optimal Policy Generator | `/agencies/dcbo` | `@optimitron/opg` |
| Optimal Budget Generator | `/agencies/domb` | `@optimitron/obg` |
| Pairwise preferences | `/agencies/dcongress/wishocracy` | `@optimitron/wishocracy` |
| Earth Optimization Prize | `/prize` | `@optimitron/treasury-prize` |
| Incentive Alignment Bonds | `/iab` | `@optimitron/treasury-iab` |
| $WISH Token | `/agencies/dtreasury` | `@optimitron/treasury-wish` |
| Storacha/IPFS storage | `/agencies/dgao` | `@optimitron/storage` |
| Hypercerts | `/agencies/dgao` | `@optimitron/hypercerts` |
| Politician alignment | `/agencies/dfec/alignment` | (in web app) |
| Government rankings | `/governments` | (in web app) |
| Cross-country compare | `/compare` | (in web app) |
