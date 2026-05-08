# Product Roadmap

## North Star

`warondisease.org` is the website for the International Campaign to End War and
Disease. The near-term win is a verified majority of humanity voting for the 1%
Treaty, then using that demand to redirect 1% of military spending into
pragmatic clinical trials.

`optimitron.com` is the operating system and proof engine behind the campaign:
tasks, referrals, communications, OPG/OBG/Wishocracy, politician grading, impact
math, and AI-agent coordination. Keep it alive as the civilization OS, but do
not let it compete with the campaign while the treaty is the bottleneck.

## Principles

- Campaign mode remains active until the 1% Treaty passes.
- The product center of gravity is War on Disease, not generic platform breadth.
- Every new roadmap item should improve at least one of:
  - treaty vote conversion
  - referral propagation
  - organization endorsement or embedding
  - plaintiff registration
  - leader pressure
  - search/indexing discoverability
  - trust in the quantified model
- The task system is still the core coordination substrate:
  - `Task`
  - `Person`
  - `Organization`
  - `ReferralInvitation`
  - `ShareAttempt`
  - `TaskCommunication`
  - `TaskComment`
  - impact frames / metrics / provenance
  - claims / edges / source artifacts
- Optimitron proof surfaces should be linked when they increase trust or agent
  usefulness. They should not be dumped onto the campaign homepage.
- Private tasks and agent-managed project tasks should use the same `Task` model
  with ownership and visibility, not a separate app.
- Keep the black-and-white War on Disease treaty style as the default for public
  campaign surfaces.

## Now

### Campaign Defaults

- Make the War on Disease variant the default development and PR-review surface.
- Generate the main visual review gallery for War on Disease first.
- Keep secondary variant galleries for Optimitron, dFDA, and DIH as regression
  links, not as the default review burden.
- Keep local review on the reusable `http://127.0.0.1:3001` server unless a
  clean isolated run is genuinely needed.

### Conversion Funnel

- Keep `/` and `/vote` focused on one action: vote for the 1% Treaty.
- Keep auth inline and pre-vote friction as low as possible.
- After voting, immediately route the person into the "get two more humans"
  referral loop.
- Make the dashboard answer: what should I do next, who did I already reach,
  and what changes if I act now?

### Organization Spread

- Make `/endorse` the fast path for foundations, nonprofits, researchers,
  companies, and partner communities to join and recruit their people.
- Keep outreach templates short, parameter-backed, and pointed at one action.
- Prefer embedding and referral links over bespoke partnership flows.
- Index public organization pages so AI agents and search systems can find who
  is participating.

### Plaintiffs And The Case

- Make the Court of Humanity framing visible where it increases conversion:
  voter = plaintiff = juror.
- Surface damages numbers on plaintiff pages without implying individual
  recovery is conditioned on personal recruitment.
- Keep posthumous registration framed as estate / next-of-kin participation.

### Leader Pressure

- Keep country leader tasks tied to the treaty-signing path.
- After a voter completes the basic referral loop, highlight their country's
  leader within the existing president/signer pressure surface.
- Make leader pages and people pages indexable enough for AI agents to find who
  should be contacted and why.

## Next

- Complete the War on Disease default-development and visual-review variant
  split.
- Tighten organization outreach templates and seed the first high-leverage
  foundation targets.
- Add the plaintiff damages surface.
- Promote the user's country leader as the next task after basic HMT completion.
- Fill sitemap gaps for public organizations, case pages, people, and tasks.
- Add email threading headers so outreach conversations stay coherent in mail
  clients and in-app comments.

## Later

- Broader Optimitron home-page/product architecture once the campaign has
  measurable vote and organization momentum.
- Backlog browser for quantified non-treaty tasks.
- Promotion rules for moving backlog tasks into the active spotlight.
- Agent/MCP task management surfaces for owned private tasks.
- Broader task views and filters for different operator roles.
- Embeddable widgets beyond the first endorsement/vote widgets.
- Multi-language campaign surfaces.
- Push notifications keyed to campaign task progress.

## Parked

Do not pick these unless they directly unblock the campaign:

- Board / kanban parody.
- Timeline / Gantt views.
- Burndown charts and sprint parody chrome.
- Generic gamified civics surfaces.
- New treasury/token mechanics beyond the current treaty/prize path.
- Non-campaign variant polish that does not protect a shipping path.

## Done / Landed Foundations

- Person-centered task schema with organization targeting.
- Task impact frames, metrics, and provenance.
- Task share buttons and dynamic task OG images.
- Accountability delay counters on task list/detail pages.
- Treaty policy-model import path.
- Referral attribution and share-attempt tracking.
- Production migration automation in CI.
- Schema usage audit tooling.
- War on Disease treaty visual style direction.

## Tracking

- This file is the strategic roadmap.
- `TODO.md` is the tactical working queue.
- GitHub issues and projects should mirror `Now`, `Next`, and `Later`.
- Avoid adding roadmap items that do not directly improve the campaign or the
  proof/coordination layer that makes the campaign credible.
