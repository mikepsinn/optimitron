---
name: h2ewd-copy
description: Protect Optimitron / War on Disease public copy from conversion regressions. Use before writing, rewriting, reviewing, or committing user-facing website, email, metadata, CTA, empty-state, dashboard, survey, referral, plaintiff, task, or partner copy in packages/web or docs/h2ewd surfaces.
---

# H2EWD Copy

## Overview

Use this skill to make public copy more likely to produce the target action:
vote, share, register a plaintiff, endorse, donate, complete a task, or trust a
quantified claim. Compare new copy against the old copy; do not judge it in
isolation.

## Hard Rule

Do not replace purpose, motivation, urgency, agency, or trust with mechanism-only
copy. Shorter is worse when it makes the action feel less valuable, less
autonomous, less urgent, or less clear.

## Workflow

1. Read `docs/h2ewd.md`, the old copy, and the surrounding rendered/source
   context.
2. Search existing source/manual copy before inventing wording. Prefer
   `searchManual` when the Optimitron MCP server is mounted; otherwise use the
   static manual index at `https://manual.warondisease.org/assets/json/search-index.json`
   or `rg` over `docs/`, `packages/web/src/app`, and `packages/web/src/components`.
3. Before editing existing copy, write this brief:

```md
Audience:
Desired action:
Motivation:
Old copy's strategic job:
Why the new copy increases the action:
Manual/source phrase checked:
Minimum question for Mike:
```

4. If audience, desired action, motivation, or source anchor is unclear, ask Mike
   one short question with a recommended default. Treat him as the copy merge
   gate, not as a person who should rewrite drafts from scratch.
5. Preserve user-supplied sharp language unless it creates a concrete legal,
   factual, or conversion problem. If changing it, explain why.
6. Use parameter/citation components for major numeric claims where available.
7. After editing, show the changed copy and ask Mike to approve it before commit.
   Do not set `COPY_REVIEW_APPROVED=1` unless he explicitly approved the copy.

## Review Smells

- The old copy answered "why"; the new copy only says "what can happen."
- The new copy makes the user feel assigned, managed, sold to, or judged.
- The copy explains internal workflow instead of the value to the human.
- The copy removes the treaty/plaintiff/damages/outcome frame for a generic app
  phrase.
- The copy is friendlier but less forceful, less specific, or less true.
- The copy sounds like nonprofit, consultant, or startup onboarding language.
