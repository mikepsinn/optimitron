# UX Idiocy Scan - 2026-05-16

Scope: `packages/web/src/app/**/page.tsx`, `page.logged-out.md`, `page.logged-in.md`; skipped `admin/` and `dev/`.

Produced by background Codex scan agent `b1worvg2l` per Mike's request to "look at the markdown and find idiocy like this."

## Top 5 Fixes (ranked by impact)

- **HIGH: Anchor-only CTAs that scroll to next visible section** — `/humanity-v-government`, `/donate`, `/iab`, `/agencies/dtreasury`.
- **HIGH: Generic auth fallbacks** instead of route-specific locked-state copy — `/dashboard`, `/organizations`, `/plaintiffs/manage`, `/census`, `/profile`, `/settings`, `/check-in`.
- **HIGH: Hostile stale-link fallbacks** ("You lot can't even keep track of a URL") instead of recovery actions — `/organizations/[id]`, `/survey/[organizationSlug]`, `/civic/votes/[identifier]`, `/legislation/[slug]`, `/governments/[code]/politicians`.
- **MEDIUM: Dense optimizer language** ("maximize median healthy life years…") not glossed once and reused as "health and real income."
- **MEDIUM: Text walls** in front of conversion forms — `/treaty`, `/endorse`, `/court`, `/agencies/dgao`, `/prize`.

## Findings By Route

### `/humanity-v-government`
- **HIGH** `page.tsx:148-155`, `page.logged-out.md:25-27`. `[VOTE ON THE FINDING](#verdict)` is followed immediately by `VOTE ON THE FINDING`; it scrolls to the next section. Fix: remove the button or put verdict controls directly after intro. *(Already dispatched as part of `bqnxlx007`.)*
- **MEDIUM** `page.logged-out.md:52,59`. "Damages here are the counterfactual"; "duty, breach, causation…" Fix: plain gloss.

### `/donate`
- **HIGH** `page.tsx:42-48`, target `page.tsx:143`. Sticky mobile `Donate` only jumps to calculator and remains after target is visible. Fix: hide on intersection or trigger checkout.
- **MEDIUM** `page.logged-out.md:20`. "Your donation helps reach the humans…" Fix: say dollars-to-voters.
- **MEDIUM** `page.logged-out.md:18,38,58`. "high-efficiency pragmatic clinical trials," "Voter-equivalent reach," "Live derivation." Fix: plain labels.

### `/endorse`
- **HIGH** `page.logged-out.md:16-24,64+`. Form/action gets buried under after-joining copy, grant model, legal notes, and full treaty text. Fix: form + short "what happens after"; collapse treaty.
- **MEDIUM** `page.logged-out.md:48,51`. Legal caveat repeats within four lines. Fix: keep once.
- **LOW** `page.tsx:51-54`. Anchor-only CTA. Fix: "Back to organization form" or remove.

### `/treaty`
- **HIGH** `page.logged-out.md:17-53`. "quickly skim and sign" still starts with a long WHEREAS wall. Fix: summary and sign box first; full treaty collapsed.
- **MEDIUM** `page.logged-out.md:38`. Chained "which means" math. Fix: cost/capacity/timeline bullets.
- **LOW** `page.logged-out.md:18`. "citizenry would like…" can be cut or sharpened.

### `/declaration`
- **MEDIUM** `page.logged-out.md:27,41,62`. Repeated "median healthy life years and median after-tax inflation-adjusted income." Fix: define once, then "health and real income."
- **MEDIUM** `page.logged-out.md:43`. "patient sufferance… absolute Suboptimality." Fix: one parody line plus plain-English gloss.

### `/survey`
- **MEDIUM** `page.logged-in.md:17`. Survey prompt starts with dense optimizer phrase. Fix: "Which split best improves health and real income?"

### `/court`
- **MEDIUM** `page.logged-out.md:37-40`. Jurisdiction/personhood/market enforcement fog. Fix: "verified humans create the court; markets punish ignored judgments."

### `/signatories`
- **MEDIUM** `page.logged-in.md:36-40`, `page.logged-out.md:27-31`. Same long share sentence appears in copy plus share URLs. Fix: show message once; hide encoded URLs.
- **LOW** `page.logged-in.md:35`. "It cannot be completed without you." Fix: "Send this to two people."

### `/prize`
- **HIGH** `page.logged-in.md:16-22`. Disclaimer, arcade framing, `GAME OVER`, deposit, and sign-in collide. Fix: separate outreach prize from deposit game; no-deposit voter reward first.
- **MEDIUM** `page.logged-in.md:58-59`. Logged-in snapshot still says `SIGN IN`. Fix: show referral/status when logged in.

### `/dashboard`, `/organizations`, `/plaintiffs/manage`, `/census`, `/profile`, `/settings`, `/check-in`
- **HIGH/MEDIUM** Generic auth fallback. Examples: `dashboard/page.logged-out.md:16-18`, `organizations/page.logged-out.md:16`, `plaintiffs/manage/page.logged-out.md:16`. Fix: route-specific locked copy and one primary auth action.

### `/organizations/[id]`, `/survey/[organizationSlug]`
- **MEDIUM** `page.logged-out.md:18`. "Fascinating. You've managed to navigate to a page that doesn't exist." Fix: practical recovery.

### `/civic/votes/[identifier]`, `/legislation/[slug]`, `/governments/[code]/politicians`
- **HIGH** `page.logged-out.md:18`. "You lot can't even keep track of a URL." Fix: search/recovery links.

### `/agencies/dgao`
- **HIGH** `page.logged-out.md:18,61`, `page.tsx:151`. Vendor-stack wall: Hypercert, AT Protocol, Storacha, CID. Fix: lead with public receipts.

### `/governments`
- **MEDIUM** `page.logged-out.md:27,48`. `MIL/TRIALS`, `HALE`, `MIL/CAP PPP`. Fix: mobile cards with plain labels.

### `/agencies/dtreasury`
- **MEDIUM** `page.logged-out.md:58`. `[REGISTER FOR UBI](#connect)` only scrolls. Fix: open actual flow or label as connect step.
- **LOW** `page.logged-out.md:88-89`. "sign in" repeated without visible action. Fix: one button.

### `/legislation`
- **MEDIUM** `page.tsx:21`. "OBG and OPG outputs… repo content layer…" Fix: "Bills lawmakers can introduce."

### `/scoreboard`
- **MEDIUM** `page.logged-in.md:18,56`. Game-pressure filler. Fix: "Vote, share your link, or fund the prize pool."

### `/iab`
- **MEDIUM** `page.tsx:64`, target `page.tsx:206`. `Learn About IABs` only scrolls. Fix: `Read the Paper` or `Phase 1: Prize`.
- **MEDIUM** `page.logged-out.md:27`. `$41,000/patient/patient` typo.
