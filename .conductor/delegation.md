# Agent Delegation Guide

## Three-Tier Model

| Agent | Strengths | Cost | Best For |
|-------|-----------|------|----------|
| **Gemini CLI** | Free, unlimited, good at file generation | $0 | Datasets, boilerplate, refactors, simple analysis scripts |
| **Codex CLI** | Good coding, reads repo context | Low (ChatGPT credits) | Substantial code changes, multi-file edits, test writing |
| **Claude (subagent)** | Best reasoning, architecture | Highest | Analysis interpretation, architecture decisions, complex debugging |

## How to Delegate

### Gemini CLI (preferred for datasets + boilerplate)
```bash
cd /mnt/e/code/optimitron
gemini -p "Read .conductor/workflow.md, then .conductor/tracks/<track>/spec.md and plan.md. \
Pick the next unchecked item: <specific item>. \
Follow the data pattern in packages/data/src/datasets/us-drug-war.ts. \
Create the file, add export to index.ts, verify it builds with: pnpm --filter @optimitron/data run build" \
-y --output-format text
```

### Codex CLI (for code changes with tests)
```bash
cd /mnt/e/code/optimitron
codex exec "Read .conductor/tracks/<track>/spec.md and plan.md. \
Implement <specific task>. Write tests. Run pnpm check before finishing. \
Do NOT search the web — use your training data." --full-auto
```

### Claude Subagent (for analysis + interpretation)
Spawn via `sessions_spawn` with task pointing to the track:
```
Read .conductor/tracks/<track>/spec.md and plan.md.
Run analysis for <specific item>.
Send results to Mike on Telegram (target: 1762827333).
```

## Rules for All Agents
1. **One task per run** — don't combine unrelated work
2. **Read spec.md first** — understand the goal before coding
3. **Follow existing patterns** — look at similar files in the repo
4. **Build must pass** — `pnpm --filter @optimitron/<pkg> run build`
5. **No code without tests** (for Codex/Claude, not dataset generation)
6. **Commit with conventional commits** — `feat(data):`, `fix(optimizer):`, etc.
7. **Don't search the web for data** — use training knowledge, cite sources in JSDoc

## Dataset File Pattern
Every dataset in `packages/data/src/datasets/` follows this pattern:
```typescript
/**
 * Title and description
 * Sources: (with URLs)
 */
export interface DataPointType {
  year: number;
  /** Field description */
  fieldName: number;
  /** Nullable field (data starts later) */
  optionalField: number | null;
}

export const DATASET_NAME: DataPointType[] = [
  { year: 2000, fieldName: 1.0, optionalField: null },
  // ...
];
```

## Analysis Script Pattern
```typescript
import { runFullAnalysis, TimeSeries } from '@optimitron/optimizer';
import { DATASET_NAME } from '@optimitron/data';

function toTS(data: Array<{year: number; value: number}>, id: string, name: string): TimeSeries {
  return { variableId: id, variableName: name, unitName: 'units',
    measurements: data.map(d => ({ timestamp: new Date(`${d.year}-07-01`).getTime(), value: d.value })) };
}

// Convert, filter nulls, run analysis with onset 1yr / duration 3yr
```

## Critical Review Gate (Codex with High Thinking)

Before committing **analysis code or methodology changes**, run Codex as a reviewer:

```bash
cd /mnt/e/code/optimitron
codex exec "You are a critical reviewer. Examine this code/output for:
1. Methodological flaws (confounders, selection bias, ecological fallacy)
2. Statistical errors (wrong test, violated assumptions, multiple comparisons)
3. Data quality issues (missing years, interpolation artifacts, unit mismatches)
4. Conclusions that overreach the evidence
5. Code bugs or logic errors

Be harsh. Flag anything suspicious. Suggest fixes.

Files to review:
$(cat <file-to-review>)" --full-auto
```

### When to review:
- ✅ **Always**: Analysis scripts, optimizer changes, report generation, methodology code
- ✅ **Always**: New dataset files (verify source accuracy, check for obvious data errors)
- ⏭️ **Skip**: Boilerplate, docs, config, CI, simple refactors

### Review workflow:
1. Subagent/Gemini produces output
2. **Before committing**: Run Codex review on the output
3. If issues found: fix or document as known limitations
4. Commit with review notes in commit message if significant

## Monitoring
- Gemini progress: `~/.gemini/tmp/*/chats/session-*.json`
- Codex: background exec session — poll for output
- Claude subagents: `sessions_list` + `sessions_history`
