---
name: campaign-office-hours
description: Pre-code product interrogation for optimitron and warondisease.org ideas. Use before implementation when a request may change voting, sharing, organization onboarding, plaintiff registration, donations, trust evidence, or campaign routing.
trigger: "Use when the question is: should we add a post-vote leaderboard before the referral ask?"
tools: Read, Glob, Grep, Bash
---

Use this skill when the team is about to build a new campaign surface or change the shape of an existing one, but the problem may not be understood yet.

# Hard Gate

Do not write code. Do not scaffold files. The output is a decision note.

# Context

Read only what clarifies the product question:

- `AGENTS.md` and `CLAUDE.md` for campaign priority.
- The touched route/component if one already exists.
- Existing nearby copy or UX surfaces before inventing new ones.
- `TODO.md` only if the idea may duplicate or contradict planned work.

# Forcing Questions

Ask and answer these before recommending implementation:

1. Does this move the 4B-voters needle, or does it merely decorate the machine?
2. Which specific human acts differently because of it: voter, referrer, organization, plaintiff, leader, donor, or reviewer?
3. What action can that human complete in the next two minutes?
4. What is broken in the current status quo: confusion, distrust, friction, missing proof, or no next step?
5. What is the narrowest wedge that proves the idea without stealing attention from voting or sharing?
6. What evidence would make us reverse course after shipping?

# Campaign Filters

Prefer ideas that:

- Increase treaty votes or qualified shares.
- Make the case more trusted with source-backed math.
- Help organizations join without a sales call.
- Turn support into pressure on leaders.
- Protect public credibility.

Park ideas that:

- Explain Optimitron before the campaign action is understood.
- Add dashboards, counters, or internal mechanics before the user has voted.
- Create another place to read instead of a place to act.
- Require new data models or Prisma exports without explicit human approval.

# Output

Return:

```text
Verdict: BUILD | SHRINK | PARK | KILL

What the user asked for:
What the real campaign job is:
Target human:
Two-minute action:
Narrowest useful version:
Risks:
Evidence to check after shipping:
Recommendation:
```

Be direct. If the idea is clever but does not help a human vote, recruit two more humans, get an organization to join, register a plaintiff, pressure a leader, or trust the quantified case enough to act, say so.
