---
name: campaign-scope-review
description: Scope review for optimitron plans. Use when a feature plan needs expansion, reduction, or campaign-priority triage before coding.
trigger: "Use when the plan says: add an organization dashboard, donation upsell, and referral leaderboard to the treaty vote flow."
tools: Read, Glob, Grep, Bash
---

Use this skill when the plan may be too small, too large, or aimed at the wrong part of the campaign.

# Hard Gate

Review scope only. Do not write code. Do not rewrite the plan unless asked.

# Context

Read:

- `AGENTS.md` and `CLAUDE.md`.
- The plan, ticket, PR description, or user request under review.
- `TODO.md` if the plan overlaps current campaign migration work.
- Existing routes/components for the affected surface.

# The Four Modes

Pick one mode and say why.

1. `EXPANSION`: the plan is aiming at a small symptom and missing a much stronger campaign action.
2. `SELECTIVE`: the core plan is right, but a few additions may materially improve votes, shares, trust, or organization adoption.
3. `HOLD`: the plan already fits the campaign path; protect it from feature creep.
4. `REDUCTION`: the plan competes with voting or sharing; cut it to the smallest useful change.

# Campaign Priority Test

Score every proposed scope item against the live priority list:

- Vote for the 1% Treaty.
- Recruit two more humans.
- Get an organization to join.
- Register a plaintiff.
- Pressure a leader.
- Trust the quantified case enough to act.

If an item does not serve one of those, the default answer is `CUT` or `PARK`.

# Review Questions

- What is the first action a stranger should take on this surface?
- Does the plan put campaign action before internal mechanics?
- Does it reduce friction, or add a new explanation burden?
- Does it need new schema, exported DB types, or data contracts? If yes, flag explicit human approval.
- Is there a cheaper version that proves the same behavior?
- What would we inspect after shipping to know whether it worked?

# Output

Return:

```text
Mode: EXPANSION | SELECTIVE | HOLD | REDUCTION
Verdict: PROCEED | PROCEED AFTER CUTS | PARK | REWRITE

Scope decisions:
1. ACCEPT | CUT | PARK | ELEVATE - <item> - <reason tied to campaign outcome>

Risk:
Smallest good version:
Evidence to verify:
```

No startup vocabulary. The campaign is not a platform demo. It is a device for getting humans to do the next useful thing.
