# Longevitron

Longevitron calculates, for each country, the budget and the laws that would raise average healthy life expectancy (HALE) the most. Every number on the site comes from a saved source file and passes an automated check.

- Spec: [docs/SPEC.md](docs/SPEC.md)
- Agent rules: [AGENTS.md](AGENTS.md)

## Status

- Live: WHO HALE at birth for 185 countries, 2000–2023, with a country page for each.
- Live evals: record check and source check.
- Not yet built: the budget model, the laws, the other evals, and endorsements.

## Run

```bash
cd longevitron
pnpm install
pnpm dev            # http://localhost:3010
pnpm build && pnpm eval
```
