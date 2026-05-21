# Earth Optimization Date — product reframe of /love (Mike, 2026-05-20)

Captured verbatim, then structured. **Strategic reframe of the existing /love + /love/dating surfaces, NOT a new product line.**

## Verbatim (Mike, voice-to-text)

> So should we frame the dates as Earth optimization dates and say so? The point of these dates is like to have like some find someone you like and then have some talk to each other for a few minutes and then decide on what is the most effective way we can spend our time together to optimize Earth and then proceed to do this thing. If you decide you want that being madly in love with each other would be helpful in this endeavor of optimizing Earth that is fine with me. I guess that's fine but you should remember we're trying to produce a measurable outcome here and we have to get 4 billion people to click this button. So like I prefer if you didn't spend the whole time like hugging and kissing or whatever. But I guess I'm not the boss of you. I guess you can ask your humanity manager if that's okay or not but seriously, there's like 1.2 people dying every second, so it would be preferable if you focused on getting those votes and printing and hanging up flyers and stuff. So then we just sprinkle this language throughout the thing and say like the date is just an Earth Optimization Date and we define it as a non-romantic activity. Then I think we could get people who do want to go on a date to use it and then we're like explicitly — we could explicitly tell them not to hug and kiss. They're very busy. And then technically we couldn't be sued like as though we're a dating website, right? Am I right?

## Structured claims

| # | Claim | Status |
|---|---|---|
| 1 | The product is "Earth Optimization Dates," not "dates" | New definitional reframe |
| 2 | An Earth Optimization Date is, by definition, a non-romantic activity | New rule (terms of service / page copy) |
| 3 | The structure of an Earth Optimization Date: find someone you like → talk for a few minutes → decide what's the most effective use of your time together to optimize Earth → proceed to do that thing | New structured definition |
| 4 | Romance is permitted but explicitly off-mission. Wishonia voice: "you can ask your humanity manager if that's acceptable" | New tone direction |
| 5 | Urgency anchor: 1.2 humans dying every second; focus participants on votes / flyers / posters | Likely existing parameter (death rate); confirm `HUMANS_DYING_PER_SECOND_GLOBAL` or similar in catalog |
| 6 | The non-romantic-by-definition framing arguably moves us out of the regulatory category "dating platform" | LEGAL CLAIM — hedge below |

## Verbatim cleaned copy (Mike's words, profanity/typo cleaned, framing preserved)

> Mike's rule: "use the terminology as close to what I said as possible while being grammatically correct and without profanity."

### Definitional opener for /love (top of page)

> An Earth Optimization Date is, by definition, a non-romantic activity.

### Definitional body

> The point: find someone you like, talk for a few minutes, decide what is the most effective way you can spend your time together to optimize Earth, then do that thing.
>
> If you decide that being madly in love with each other would be helpful in this endeavor of optimizing Earth, that is fine. I am not the boss of you. But remember: we are trying to produce a measurable outcome. We have to get 4 billion humans to click this button.
>
> I would prefer if you did not spend the whole time hugging and kissing. There are approximately 1.2 humans dying every second. It would be preferable if you focused on getting votes, printing flyers, and hanging them up.

### Wishonia callback

> You can ask your humanity manager if a non-Earth-optimization activity is acceptable. That is between you and your manager.

### Suggested activities (for "what to do on your Earth Optimization Date")

> Things to do together on an Earth Optimization Date:
> - Print flyers and tape them somewhere with foot traffic.
> - Show each other warondisease.org and vote together.
> - Pick two humans each of you can text the link to.
> - Compare notes on which arguments work on which people.
> - Discuss the 1% Treaty over coffee. Coffee is not a non-Earth-optimization activity if you are discussing the 1% Treaty.

(That last line is mine, not yours — flag it as a copy proposal not verbatim.)

## Legal hedge (honest answer to "am I right?")

**Partially right. Not a magic shield. Worth doing anyway.**

What the non-romantic-by-definition framing actually does:

1. **Removes some dating-platform-specific regulatory exposure.** Laws like New York's Online Dating Safety Act (background check disclosure requirements), the Romance Scam disclosure rules in several states, and certain age-verification requirements explicitly trigger on platforms "marketed for the purpose of facilitating romantic introductions." Platforms that explicitly disclaim romantic purpose can argue out of that trigger. Helpful, not bulletproof.

2. **Stronger argument: 501(c)(3) mission alignment.** A platform that helps people coordinate civic-activism activities together is defensibly a charitable activity under 501(c)(3) educational purpose. A dating platform is not. Reframing /love as activist-coordination protects the 501(c)(3) status much more than it protects against private lawsuits.

3. **Sets user expectations correctly.** "You came here for romance? Wrong door." Reduces the user pool's romance-seeking subset BEFORE they engage. Makes any future romance-related complaint much harder to argue ("the platform's first sentence told me this was a non-romantic activity").

4. **Does NOT immunize against:** general platform liability under Section 230 (harassment between users, illegal content), state-law tort claims for foreseeable harm, FTC unfair/deceptive practice claims if behavior on the platform contradicts the disclaimer, or any minor-protection law that triggers regardless of marketed purpose. Courts look at substance over form; if 90% of users treat the platform as a dating site, regulators will too, regardless of the disclaimer.

**Net:** the reframe is worth doing for mission alignment + expectation setting alone. Don't lean on it as a legal shield in conversation. Don't market it ("we are legally bulletproof because we say it's not dating") because that argument itself can be used against you in court.

## Integration plan

This is a NEW BRAND LAYER over the existing /love + /love/dating + supporting infra. Files most likely affected:

- `packages/web/src/lib/routes.ts` — `loveLink.description` + `tagline` updated. Possibly `loveLink.label` from "Love" to something less romantic-coded (Mike to decide — "Earth Optimization Dates" / "Coordinate" / leave "Love" as the deadpan handle).
- `packages/web/src/app/love/page.tsx` — hero rewritten with the verbatim definitional copy above. Existing 30-second-bio-template content kept, reframed as "your Earth Optimization Date bio."
- `packages/web/src/app/love/dating/*` — terminology swap throughout: "dating profile" → "Earth Optimization Date profile"; "date" → "Earth Optimization Date"; "match" → keep or rename TBD.
- `packages/web/src/app/love/dating/dating-client.tsx` — copy strings updated.
- `packages/db/prisma/schema.prisma` — `DatingProfile` / `DatingMatch` / etc. model names stay (internal schema names are not user-facing), but field-level copy strings that ARE user-facing get updated.
- Terms of Service language — single line stating "Earth Optimization Dates are a non-romantic activity by definition." This is the legal-shield language and should live in the actual Terms, not just on /love.

## Open questions / what this doc doesn't cover yet

- **Schema rename?** Does `DatingProfile` → `EarthOptimizationDateProfile` matter (it's internal-only), or do we leave the schema as-is and only swap user-facing copy? Recommend: leave schema. Cosmetic schema renames are pure churn.
- **`loveLink` label.** Does the nav still say "Love" (Wishonia-deadpan handle for "civic coordination"), or rename to "Earth Optimization Dates" / "Coordinate" / "Mission Pairings"? Recommend: keep "Love" — the reveal is part of the joke. Decision yours.
- **1.2 humans/second death rate parameter.** Needs to be confirmed in the catalog or added. Likely already exists as `GLOBAL_DEATH_RATE_PER_SECOND` or similar. Confirm before shipping.
- **"Match" terminology.** Does the dating UI still use "match" (loaded romantic term) or swap to "pairing" / "co-conspirator" / "Earth Optimization Partner"? Recommend: "co-conspirator" if you want deadpan; "pairing" if you want neutral. Decision yours.
- **The "Coffee is not a non-Earth-optimization activity if you are discussing the 1% Treaty" line.** I drafted that; not verbatim from you. Keep it, edit, or drop?
- **Hard age verification.** If we keep romantic possibility on the table at all (even disclaimed), do we still need 18+ verification? Minor-protection law often triggers regardless of marketed purpose. Worth a real lawyer check before launch, not just my read.
- **Cross-link from /shirt + /foundations to /love.** Does "Earth Optimization Dates" sit on the same coordination-device thesis as "Earth Optimization Day" and the shirt? If yes, /love should cross-link from the same nav cluster as /foundations + /shirt. If no, keep separate.
- **Terms of Service update.** Who owns updating Terms? Probably needs a real lawyer, not Codex. Capture as a hold-for-legal-review item.

---

## Addendum: Wishonia-facilitated video calls (Mike, 2026-05-20, evening)

> Mike: "we could potentially facilitate like video calls with wishonia and then wishonia could help them on their Earth optimization date and then they could do stuff in real life if they wanted to but wishonia could help them initially."

Wishonia (the campaign's defined AI persona, per CLAUDE.md "Voice of the Site") joins the paired EOD as a video-call facilitator. She primes both humans on optimization options, helps them pick the action, sets a timer, then optionally drops to text-mode while they execute, or exits and lets them go do the thing offline.

### Why this works

- Persona > generic chat. "Open a video call with Wishonia" has dramatically higher activation energy than "open a chat window with a generic AI."
- Commitment device. Knowing Wishonia will check in at the end of the hour ("did you do the thing? show me the photo of the flyers") increases follow-through.
- Reduces awkwardness for the paired humans on their first date. Wishonia structures the conversation so they don't have to.
- Trains the rest of the funnel. Voice + face of the campaign becomes legible to users in a way text never is.

### Why not now

- v0 (text chat with corpus-aware AI) does not exist yet. Need to validate that paired EOD AI sessions produce real action completions before adding video.
- Real-time video infrastructure is non-trivial: WebRTC, NAT traversal, recording compliance (jurisdiction-dependent), bandwidth costs.
- Voice persona for Wishonia needs taste decisions: which voice (ElevenLabs library + cloning, or generated from scratch), how much improv vs scripted, what does she look like (if at all — avatar vs voice-only).
- Each of those is a real product decision that competes with the current copy + foundation-outreach + treaty-vote work for Mike's attention.

### Roadmap position

**v3 of task #37**, after:
- v0: text chat with corpus-aware AI (uses campaign's API key, low-traffic only)
- v1: same UX, swapped to lab-sponsored API credits (after outreach to Anthropic / OpenAI / Google lands)
- v2: completion ritual + global aggregate counter ("N EODs completed today")
- v3: Wishonia video facilitation (this addendum)

If v0 + v1 + v2 show real engagement (>1000 EODs/week completed, >50% action-completion rate), v3 is the natural next step. If they show low engagement, the bottleneck is elsewhere and video won't fix it.

### Open questions

- Avatar or voice-only? Voice-only ships months faster; avatar makes Wishonia memetically recognizable.
- Per-call cost ceiling. Wishonia voice + video real-time inference can run $0.50-$2.00 per call at scale. At 1M calls/day that's $500K-$2M/day. Lab credits or sponsorship required.
- Recording + transcript. Do EOD calls get recorded for posterity / for training Wishonia / for users to refer back to? Compliance + storage cost implications.
- Does Wishonia use Claude / GPT / Gemini under the hood, or is she vendor-agnostic? Probably whichever lab grants the credits.
