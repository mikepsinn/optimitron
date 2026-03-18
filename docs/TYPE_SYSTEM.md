# Type System — Single Source of Truth

## Principle

The Prisma schema (`packages/db/prisma/schema.prisma`) is the **canonical definition** of all data models. Types flow FROM the schema TO consuming packages — never the other direction.

## Two Layers of Types

### Layer 1: DB Models (Prisma)
Full database models with IDs, foreign keys, timestamps, audit fields.
```typescript
// Prisma Measurement: full DB row
{
  id: string;
  userId: string;
  globalVariableId: string;
  value: number;
  startAt: DateTime;
  unitId: string;
  sourceName: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  deletedAt: DateTime | null;
}
```

### Layer 2: Library Types (Optimizer/Wishocracy/etc.)
Minimal interfaces for pure computation. No DB concerns.
```typescript
// Optimizer Measurement: just what the math needs
{
  timestamp: number | string;
  value: number;
  source?: string;
  unit?: string;
}
```

### How They Connect

The **web/API layer** converts between them:
```typescript
// In packages/web or API routes:
import type { Measurement as DbMeasurement } from '@optimitron/db';
import type { Measurement as OptimizerMeasurement } from '@optimitron/optimizer';

function toOptimizerMeasurement(db: DbMeasurement): OptimizerMeasurement {
  return {
    timestamp: db.startAt.getTime(),
    value: db.value,
    source: db.sourceName,
  };
}
```

This separation is **intentional**:
- Library types stay minimal and domain-agnostic
- DB types carry full context for persistence
- Conversion happens at the boundary (web/API layer)
- Libraries work in browser (no Prisma runtime needed)

## Package Type Ownership

| Package | Defines | Imports from |
|---------|---------|-------------|
| `db` | All Prisma models, Zod schemas | Nothing |
| `optimizer` | Measurement, TimeSeries, PredictorConfig, CorrelationResult | Nothing (self-contained) |
| `wishocracy` | PairwiseComparison, PreferenceWeight, AlignmentScore | Nothing (self-contained) |
| `opg` | PolicyInput, PolicyResult, PolicyReport | `optimizer` types |
| `obg` | BudgetInput, BudgetResult, BudgetReport | `optimizer` types |
| `data` | ParsedHealthRecord, ImportSummary | Nothing (self-contained) |
| `web` | (none — consumes all) | Everything + conversion layer |

## Rules

1. **Library packages define their own minimal types** — optimized for computation
2. **DB package defines full persistence types** — optimized for storage
3. **Web/API layer converts between them** — the glue
4. **Libraries NEVER import @prisma/client** — no Node.js runtime dependency
5. **Libraries MAY import `type` from db** for shared enums or constants
6. **All new DB models start in schema.prisma** — it's the source of truth

## Enum Handling

Prisma enums use UPPER_CASE (`ZERO`, `VALUE`). TypeScript code uses lowercase (`'zero'`, `'value'`).
Conversion utilities live in `@optimitron/db`:
- `fillingTypeToPrisma(optimizerType)` → Prisma enum
- `fillingTypeFromPrisma(prismaType)` → optimizer string

## Migration Path

When adding a new concept:
1. Add the model to `schema.prisma` first
2. Define the minimal library type in the relevant package
3. Add the conversion function in `packages/web/src/lib/converters.ts`
4. Write tests for both the library function AND the conversion
