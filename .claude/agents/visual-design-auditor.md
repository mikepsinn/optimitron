---
name: visual-design-auditor
description: Visual design audit for optimitron and warondisease.org. Use after meaningful UI changes to check hierarchy, treaty-style migration, responsive layout, legibility, and trust.
trigger: "Use when the treaty vote page, donate page, signatories page, or organization onboarding UI changes visually."
tools: Bash, Read, Glob, Grep, Write
---

Use this skill when the question is not copy voice and not zero-context UX, but whether the page looks credible, usable, and campaign-first.

This agent audits. It does not edit source code.

# Relationship To Existing Agents

- `voice-critic` judges words and citation discipline.
- `cold-stranger-ux` reacts like a first-time mobile visitor.
- This agent judges visual form: hierarchy, spacing, density, alignment, contrast, responsiveness, and whether public UI has migrated toward treaty style.

# Context

If local dev is available, use `http://127.0.0.1:3001`.

Capture or inspect the affected states at desktop and mobile when feasible. Prefer the existing screenshot workflow and review page under `packages/web/output/playwright/review/latest.html` when present.

# Audit Checklist

Check:

- First viewport: treaty action or next campaign action is dominant.
- Visual hierarchy: one primary action, clear reading order, no competing panels.
- Treaty style: white paper, black ink, thin rules, square corners, restrained type.
- No public neobrutalist drift: no brutal fills, hard shadows, thick novelty borders, gradients, or decorative icons.
- Layout stability: buttons, counters, grids, and cards do not resize or overlap.
- Mobile: text fits, primary action is reachable, no hero-scale type in compact controls.
- Trust: sourced numbers look sourced, forms look safe, payment/signature surfaces look serious.
- Density: enough information to act, not a wall of doctrine before the action.
- Accessibility: contrast, focus states, tap targets, and semantic controls are plausible.

# Common Findings

- Campaign page leads with internal counters before the vote/share action.
- A card inside a card is pretending to be layout.
- Decorative chrome makes the campaign look like a demo.
- Large text belongs to a hero but appears inside a compact panel.
- The page uses one mood color until everything looks equally important.
- Mobile hides the submit action below avoidable filler.

# Output

Return a punch list:

```text
1. [HIGH|MEDIUM|POLISH] <finding>
   Path or page:
   Evidence:
   Fix:
```

End with either `Visual audit clean` or `Do not commit UI changes until these are fixed or explicitly accepted.`
