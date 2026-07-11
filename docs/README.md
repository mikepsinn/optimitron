# Documentation Map

One line per doc, stating what it exclusively owns. If two docs seem to cover
the same thing, the one listed here owns it — fix the other.

## Core (start here)

| Doc | Owns |
|---|---|
| [PRD.md](./PRD.md) | Product spec: the target-state vision for the four-layer optimization machine and the Daily Companion Loop. Never asserts current status. |
| [FEATURES.md](./FEATURES.md) | Feature registry: what exists today, with evidence and acceptance criteria. The ONLY doc allowed to assert maturity status. |
| [ROADMAP.md](./ROADMAP.md) | Sequencing: Now/Next/Later/Parked/Won't + the code-cleanup backlog (Appendix A). |
| [../TODO.md](../TODO.md) | Tactical working queue: in-flight, next-up, recently-landed, standing policy. |
| [../AGENTS.md](../AGENTS.md) | Canonical agent rules for all harnesses, incl. the ONE campaign priority list. |
| [../CLAUDE.md](../CLAUDE.md) | Claude-harness specifics: hooks, skills, MCP research tools, dev-server ops. |
| [../README.md](../README.md) | Public front door (Wishonia voice): pitch, quick start, package table, papers. |

## Architecture & models

| Doc | Owns |
|---|---|
| [TYPE_SYSTEM.md](./TYPE_SYSTEM.md) | Prisma-as-source-of-truth type flow across packages. |
| [TASK_MODEL.md](./TASK_MODEL.md) | Task/claim/lifecycle schema invariants. |
| [TASK_COMMUNICATION_MODEL.md](./TASK_COMMUNICATION_MODEL.md) | Model boundaries for Task/TaskComment/TaskCommunication/EmailLog/Activity, lifecycle, write rules. |
| [MCP_SERVER.md](./MCP_SERVER.md) | MCP tool reference + the canonical live EV formula. |
| [TREATY_REFERRAL_MODEL_AUDIT.md](./TREATY_REFERRAL_MODEL_AUDIT.md) | Referral/task/email model ownership launch contract. |
| [DATA_SOURCES.md](./DATA_SOURCES.md) | External dataset catalog + vendored economic-data story. |

## Ops & how-to

| Doc | Owns |
|---|---|
| [LOCAL_DB.md](./LOCAL_DB.md) | Local Postgres/Docker bootstrap. |
| [ANALYSIS_PIPELINE.md](./ANALYSIS_PIPELINE.md) | Budget/policy analysis generation pipeline + commands. |
| [PREVIEW_DATA_PRIVACY.md](./PREVIEW_DATA_PRIVACY.md) | Preview-DB anonymization mechanism and masked-column table. |
| [DEVELOPER_API_PLAN.md](./DEVELOPER_API_PLAN.md) | Developer OAuth/OpenAPI surface: shipped/now/next/not-yet. |
| [OPTIMIZE_EARTH_PROTOCOL.md](./OPTIMIZE_EARTH_PROTOCOL.md) | The protocol agents follow on "optimize earth". |

## Product surfaces & copy

| Doc | Owns |
|---|---|
| [questions.md](./questions.md) | Screen-by-screen spec of the treaty vote/share flow. |
| [treaty-flow-variants.md](./treaty-flow-variants.md) | Registry of A/B treaty-flow variants. |
| [h2ewd.md](./h2ewd.md) | Wishonia voice canon for persuasion copy (copy-gated by Mike). |
| [prize-docs.md](./prize-docs.md) | Long-form /prize page copy source (copy-gated by Mike). |
| [game-design-guidelines.md](./game-design-guidelines.md) | Pixel/CRT design system — game/demo screens ONLY. |

## Generated — do not edit by hand

| Doc | Source |
|---|---|
| [SCHEMA_USAGE_AUDIT.md](./SCHEMA_USAGE_AUDIT.md) | Generated from `generated/schema-usage-audit.json`. Regenerate; never hand-edit. |
| `generated/` | Build artifacts. |

## Directories

- `archive/` — historical docs, preserved unedited, excluded from checks.
- `plans/` — future plan docs (currently empty; agent plans live in `.claude/plans/`).

## Doc checks

Run from the repo root (Git Bash). Each grep must return zero hits:

```bash
# stale paths / dead links / stale claims — zero hits outside docs/archive
grep -rin "e:/code/optimitro[n]" --include="*.md" . --exclude-dir=node_modules | grep -v docs/archive
grep -rn "ARCHITECTURE\.m[d]" --include="*.md" . --exclude-dir=node_modules | grep -v docs/archive
grep -rn "1,73[7]\|across 8 package[s]" --include="*.md" . --exclude-dir=node_modules | grep -v docs/archive
grep -rn "packages/example[s]" --include="*.md" . --exclude-dir=node_modules | grep -v docs/archive

# registry integrity
grep -n "\*\*Status:\*\*" docs/FEATURES.md | grep -vE "implemented|partial|planned|vision|blocked|dead"
for id in $(grep -o "OPT-[A-Z]*-[0-9]*" docs/ROADMAP.md | sort -u); do grep -q "^### $id" docs/FEATURES.md || echo "ROADMAP cites unknown $id"; done

# single ownership of the campaign priority list (AGENTS.md only)
grep -rln "Increase treaty vote [c]onversion" *.md docs/*.md | grep -v archive
```
