# Longevitron

Longevitron calculates, for each country, the trials, the budget, and the laws that would raise average healthy life expectancy (HALE) the most. Every decimal, percentage, and money amount on the site cites a record from a saved source file, and an automated check verifies it.

- Spec: [docs/SPEC.md](docs/SPEC.md)
- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Similar existing work: [docs/PRIOR_ART.md](docs/PRIOR_ART.md)
- Agent rules: [AGENTS.md](AGENTS.md)

## Status

- Live: WHO HALE at birth for 185 countries, 2000–2023, with a country page for each.
- Live evals: record check and source check.
- Not yet built: the value-of-information model, the trial list, the budget, the laws, the other evals, and endorsements.

## Run

```bash
cd longevitron
pnpm install
pnpm dev            # http://localhost:3010
pnpm build && pnpm eval
```
