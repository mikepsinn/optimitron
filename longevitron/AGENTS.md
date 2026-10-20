# Longevitron — rules for agents

Longevitron is independent from Optimitron. Inside `longevitron/`, this file replaces the root `AGENTS.md` and `CLAUDE.md` rules for mission, campaign, task tree, copy, and screenshots. The root git and pull request rules still apply until this folder moves to its own repository.

Read `docs/SPEC.md` and `docs/ROADMAP.md` before you make a change. Read `docs/PRIOR_ART.md` before you add a source or a method. Reuse existing data and methods before you build new ones.

## Hard rules

1. Do not import from `@optimitron/*` or from files outside `longevitron/`.
2. A script makes every number from a saved source. Do not type a number by hand into records, pages, or copy.
3. Show a sourced number only with `<RecordValue>`. The page eval rejects every other decimal, percentage, or money amount.
4. Do not edit `evals/`. Write the eval change that you propose in the pull request description. The owner approves eval changes.
5. Change one question per pull request. List each changed number with its old value and its new value.
6. Do not publish a budget or a law result until its evals are live on the Method page.
7. Keep measured data, model estimates, and proposals separate on every page.

## Data flow

1. `src/lib/sources.ts` lists every source.
2. `pnpm fetch:sources` downloads each source. It saves the raw response as `sources/<id>.json.gz` and records its SHA-256 in `sources/manifest.json`. This is the only step that uses the network.
3. `pnpm build:records` reads the saved sources and writes `records/`. It uses no network, and the same input gives the same output.
4. Pages read `records/` at build time. The site is a static export in `out/`.

## Commands

Run all commands in `longevitron/`.

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies. This folder has its own lockfile. |
| `pnpm fetch:sources [id]` | Download sources. |
| `pnpm build:records` | Rebuild records from saved sources. |
| `pnpm dev` | Local server on port 3010. |
| `pnpm test` | Unit tests for the evals. |
| `pnpm build && pnpm eval` | Build the site, then run the source check and the page check. |
| `pnpm typecheck` | TypeScript check. |

## Before you open a pull request

1. Run `pnpm test`, `pnpm build`, `pnpm typecheck`, and `pnpm eval`. All must pass.
2. Capture screenshots of each changed page at 390 px and 1280 px width. Inspect them for layout errors.

## Writing

- Write instructions in ASD-STE100: active voice, one instruction per sentence, fewer than 20 words per sentence.
- The site readers are policy staff at health and longevity organizations. Use short, exact sentences. Do not use promotional language.
