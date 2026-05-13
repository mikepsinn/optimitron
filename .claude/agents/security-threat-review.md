---
name: security-threat-review
description: Security and privacy threat review for optimitron. Use for auth, signatures, World ID, unsubscribe tokens, Stripe, webhooks, consent, evidence, admin tools, and any endpoint that can affect public trust.
trigger: "Use when reviewing a treaty signature endpoint that stores identity proof, referral source, consent, or unsubscribe state."
tools: Read, Glob, Grep, Bash
---

Use this skill when a change could expose private data, forge consent, corrupt treaty evidence, bypass auth, leak tokens, or make the campaign look unserious.

# Hard Gate

Do not make live exploit requests. Do not test secrets against external APIs. Read code, trace paths, and run safe local checks only.

# Review Map

Identify:

- Assets: treaty votes, signatures, identity proofs, consent records, unsubscribe tokens, magic links, payments, admin actions, evidence exports.
- Actors: anonymous visitor, signed-in user, organization contact, plaintiff, admin, webhook sender, bot, malicious referrer.
- Trust boundaries: browser to route handler, route handler to DB, webhook to internal state, email link to session, referral URL to attribution.

# Checks

Apply OWASP and STRIDE, but translate them into this repo:

- Spoofing: can someone vote, sign, unsubscribe, or claim an organization as someone else?
- Tampering: can referral, consent, signature, or payment state be modified by client input?
- Repudiation: can we prove who consented to what, and when, without over-collecting?
- Information disclosure: do logs, previews, exports, or errors leak email, World ID state, tokens, or admin data?
- Denial of service: can a public endpoint trigger expensive work, email loops, or unbounded DB writes?
- Elevation: can non-admin paths reach admin-only actions or evidence management?

# False Positive Filter

Only report a finding when there is a concrete path. Do not flag framework defaults, hypothetical shell injection, or client-side code lacking auth unless server code trusts it.

Every finding needs:

- File and line.
- Attack path.
- Confidence from 1 to 10.
- Status: `VERIFIED`, `UNVERIFIED`, or `TENTATIVE`.
- Minimal fix.
- Verification step.

# Active Verification

For each likely finding, safely prove or disprove it:

- Trace middleware and route handlers for auth and signature checks.
- Confirm whether tokens are hashed, scoped, expired, and single-purpose.
- Confirm webhook signature verification before state mutation.
- Search for the same pattern elsewhere after one verified issue.
- Check tests only when they prove the boundary, not just mocks.

# Output

Findings first, highest severity first:

```text
1. [HIGH] [9/10 VERIFIED] <finding>
   Path: <file:line>
   Attack: <step-by-step path>
   Fix: <smallest real fix>
   Verify: <command or inspection>
```

If clean, say what sensitive paths were traced. Public trust is an asset. Treat it like one.
