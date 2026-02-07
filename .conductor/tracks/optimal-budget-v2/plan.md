# Plan: OBG Minimum Effective Spending + Efficient Frontier (v2)

## Priority: THIS IS THE PRODUCT. Focus here.

The key insight: more spending doesn't improve outcomes. The optimal level is the MINIMUM that doesn't produce worse outcomes.

- [x] 1. Add `findMinimumEffectiveSpending()` to `packages/obg` — decile analysis, find floor per category
- [x] 2. Add `efficientFrontier()` — rank countries by outcome-per-dollar
- [x] 3. Add `overspendRatio()` — current spending / floor level per category  
- [x] 4. Tests encoding expected findings (Japan/Korea efficient, US inefficient on health)
- [x] 5. Generate `reports/us-optimal-budget-v6.md` with minimum effective framing
- [x] 6. Generate JSON for web (`efficient-frontier.json` already exists from ad-hoc script)

## DEFERRED — Only add if needed
- ~~Wire partial correlations into OBG report~~ (already proven in scripts, adds complexity)
- ~~COVID sensitivity toggle~~ (nice-to-have, not core)
- ~~Confound flag per category~~ (the efficient frontier approach sidesteps this entirely)

## Principle: Complexity budget
Every function added must justify its existence. If a one-off script proved the point, don't library-ify it unless multiple consumers need it.
