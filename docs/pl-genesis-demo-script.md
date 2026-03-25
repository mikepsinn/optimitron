# PL Genesis Hackathon — Demo Video Script

**Target length**: 3–4 minutes
**Tone**: Wishonia narrating (deadpan, data-first, dry, alien observer)
**Aesthetic**: Sierra Online adventure game (Space Quest IV–VI era) — pixel art scenes, narrator text boxes, point-and-click verbs, death screens, score counter
**Slides**: ~29 (one concept per slide — count may change as we iterate)
**Implementation**: `packages/web/src/lib/demo-script.ts` → `hackathon` playlist

---

## The Sierra Framing

The entire demo is presented as a Sierra-style point-and-click adventure game. Wishonia is the narrator — same role as the Space Quest narrator who mocks Roger Wilco for dying in increasingly stupid ways. Except here, the dying is real and the stupid decisions are made by 8 billion people.

### Persistent UI Chrome (every slide)

```
┌──────────────────────────────────────────────────────────────┐
│  SCORE: 0 of 8,000,000,000    ◄ ►    ☠ 150,000/day          │
│──────────────────────────────────────────────────────────────│
│                                                              │
│                    [ PIXEL ART SCENE ]                       │
│                                                              │
│──────────────────────────────────────────────────────────────│
│  ┌──────────────────────────────────────────────────┐        │
│  │                                                  │        │
│  │  HALE    ████░░░░░░  63.3 → 69.8 yrs            │        │
│  │  INCOME  ██░░░░░░░░  $18.7K → $149K             │        │
│  │                                                  │        │
│  └──────────────────────────────────────────────────┘        │
│──────────────────────────────────────────────────────────────│
│ ┌──────┐                                                     │
│ │WISHON│  "Your government is a misaligned                   │
│ │  IA  │   superintelligence."                               │
│ │portrait                                                    │
│ └──────┘                                                     │
│  👁 LOOK   ✋ USE   🚶 WALK   💬 TALK   📦 INVENTORY        │
│  [ ][ ][ ][ ][ ][ ][ ][ ]  ← inventory slots               │
└──────────────────────────────────────────────────────────────┘
```

**Persistent HUD elements:**

- **Score counter** (top-left): `0 of 8,000,000,000`. Ticks up as the game progresses. Represents "lives aligned."
- **Death ticker** (top-right): `☠ 150,000/day` — always counting, always visible, relentless. Red digits.
- **Quest meters** (mid-bar): Two progress bars showing current → target for HALE and Median Income. These are the *win conditions*. Hidden in Act I. Appear at The Turn (Wishonia). Fill through Act II. Hit 100% on completion screen.
- **Narrator text box** (bottom): Blue gradient box. Wishonia's pixel portrait on the left (48×48, slightly animated — blinking, occasional eyebrow raise). Narration text typewriter-animates character by character (~30 chars/sec).
- **Verb bar + Inventory** (bottom edge): Look / Use / Walk / Talk icons. 8 inventory slots that fill as the player collects items. Decorative in auto-play, functional in interactive mode.
- **Cursor**: Sierra-style crosshair, changes contextually (eye, hand, boots, speech bubble). Tracks mouse to prove it's not a video.

### Score Progression

| Slide | Score | Why |
|-------|-------|-----|
| Act I (all) | 0 | Nothing has been done yet. Counter mocks the viewer. |
| Moronia | `GAME OVER` | Score resets to 0. Death screen. |
| Wishonia | `RESTORE GAME` | Score reappears. Quest meters appear. |
| The Fix | 100,000 | First hint of progress. |
| Acceleration | 1,000,000 | Momentum building. |
| Scoreboard | 5,000,000 | Win conditions defined. Quest meters pulse. |
| Allocate | 10,000,000 | Player engagement starts. |
| Vote | 100,000,000 | Critical mass approaching. |
| $0.06 | 200,000,000 | The asymmetry clicks. |
| Get Friends to Play | 500,000,000 | Network effect. |
| Prize Investment | 650,000,000 | Better than your retirement fund. |
| Prize Mechanism | 800,000,000 | Two paths, both green. |
| $194K/point | 1,000,000,000 | NOW the value makes sense. |
| You Cannot Lose | 1,500,000,000 | All three scenarios laid out. |
| Leaderboard | 3,000,000,000 | Accountability layer active. |
| Changed the Metric | 4,000,000,000 | System reprogrammed. |
| $15.7M | 6,000,000,000 | Act II climax. Personal upside lands. |
| The Close | 8,000,000,000 of 8,000,000,000 | Full alignment. "YOU HAVE WON." |

### Inventory Items (collected as you progress)

| Slot | Acquired At | Icon | Item | Tooltip |
|------|-------------|------|------|---------|
| 1 | The Fix | 📜 scroll | `1% TREATY` | "Redirect 1% of military spending to clinical trials." |
| 2 | Allocate | 🗳 ballot | `ALLOCATION` | "Your preferred budget split." |
| 3 | Vote | ✊ fist | `VOTE` | "Yes on the 1% Treaty." |
| 4 | Get Friends to Play | 🔗 chain | `REFERRAL LINK` | "Share with 2 friends. They share with 2 more." |
| 5 | Prize Mechanism | 🪙 gold coin | `PRIZE DEPOSIT` | "$100 deposited. Earning 17%/yr. Grows 11× even if targets missed." |
| 6 | $194K Per Point | 🥈🥈 silver pair | `VOTE POINTS ×2` | "$194K each if targets are hit. Earned by getting friends to play." |
| 7 | $15.7M | 📋 deed | `$15.7M CLAIM` | "Your lifetime income gain if the Treaty passes." |
| 8 | Leaderboard | 🔍 magnifier | `ALIGNMENT SCORE` | "See how your leaders rank vs your preferences." |

**Visual distinction between PRIZE and VOTE:**
- `PRIZE DEPOSIT` = **gold coin** (slot 5). You earn this by *depositing money*. Invested in innovative startups at 17%/yr. Payoff if targets missed: 11× back.
- `VOTE POINTS` = **silver tokens** (slot 6). You earn these by *getting friends to play*. Payoff if targets hit: $194K/point. The more friends who play, the bigger the prize pool, the more everyone is incentivized to make sure humanity wins.
- A player can hold *both*. The worked example (You Cannot Lose) shows $100 deposited + 2 friends playing = both items in inventory.

---

## Pacing & Trailer Structure

**Act I — The Horror (slides 1–9, ~80s)**
Dark pixel art scenes. EGA 16-color palette. Ominous chiptune. Score stays at 0. Quest meters hidden. Each slide is 8–10s. Fast cuts. Escalating dread: deaths → misalignment → absurd ratio → collapse clock → what collapse looks like → AI accelerating it → it's already happening to your paycheck → Moronia (GAME OVER).

**GAME OVER / RESTORE (slides 9–10)**
Moronia = death screen. Wishonia = restore from alternate save. EGA→VGA palette shift. Quest meters appear.

**Act II — The Quest (~7 min)**
VGA palette. Upbeat chiptune. Score climbs. Inventory fills. Six sections:

```
THE SOLUTION     THE GAME           THE MONEY              THE ACCOUNTABILITY
Fix              Allocate           Prize Investment (17%)  Leaderboard
→ Acceleration   → Vote             → Prize Mechanism       → Changed Metric
→ Compounding    → $0.06 asymmetry  → $194K/point
→ Plur.Ignorance → Get Friends      → Can't Lose
→ Scoreboard

THE ARMORY                                                  THE CLIMAX
dFDA · IABs · OPG · OBG · Storacha · Hypercerts · $WISH    $15.7M (Act II peak)
```

**Key rules:**
- Never introduce a *value* before the *mechanism that creates it* (Prize pool → VOTE point value)
- One concept per slide — if a slide explains two things, split it
- The Armory shows every piece of tech built for the hackathon — judges need to see these
- Personal upside ($15.7M) is the LAST thing before Act III — it's the gut punch that sends us into the close

**Act III — The Endgame (~1.5 min)**
Score approaching max. Architecture (credibility) → 10.7B lives (emotional scale) → Close → Title → Easter egg.

**Sound design:**
- Act I: Minor-key chiptune. Ticking clock undertone. Death ticker has a faint heartbeat pulse.
- Game Over: Sierra death jingle (dun-dun-dun-duuuun).
- Restore: Save-game "bwoing", then immediate bright major-key shift.
- Act II: Upbeat quest music. "Cha-ching" on inventory pickups. Quest meter fill has a rising pitch.
- Act III: Full heroic chiptune theme building to resolution. Final chord sustains, then silence.

---

## ACT I — THE HORROR

### Cold Open: Death Ticker (10s)

*Segment*: `script-0-cold-open` · *Component*: `death-count` · *BG*: foreground

**[3 seconds of black screen. Just the death counter ticking up. No narration. No Sierra chrome yet — just red numbers on black, counting. Then the UI fades in around it.]**

> "150,000 humans die every day from diseases that are theoretically curable. That is fifty-nine September 11ths. But nobody invades anybody about it because cancer does not have oil."

*Visual*: Pixel art planet from space. Continents rendered in dark EGA reds and greys — no green, no blue ocean. Tiny pixel crosses dot the land masses. The death counter dominates the center in large red pixel font, ticking relentlessly. Sierra narrator box fades in below with Wishonia's portrait (neutral expression).

*Sierra verb*: `> LOOK AT planet` → "A Class-M planet experiencing a preventable extinction event. The inhabitants appear to be aware of this. They have chosen to do nothing."

---

### Misaligned Superintelligence (10s)

*Segment*: `script-1a-misaligned` · *Component*: `terminal` · *BG*: foreground

> "Your government is a misaligned superintelligence. It controls trillions of dollars, billions of lives, and the allocation of your civilisation's entire productive capacity. And it is optimising for the wrong objective function."

*Visual*: Pixel art command bridge (SQ1 Sarien ship). Five CRT monitors in a semicircle showing: military contracts scrolling, pharma stock tickers, healthcare waitlist numbers climbing, a "CITIZEN REQUESTS" inbox with 0 read / 4,294,967,296 unread. Central monitor displays "OBJECTIVE FUNCTION: RE-ELECTION" in blinking green text. "MISALIGNED SUPERINTELLIGENCE" overwrites it character by character. Scan lines roll.

*Sierra verb*: `> TALK TO computer` → "It does not respond. It has not responded to citizen input in approximately forty years."
`> USE keyboard` → "ACCESS DENIED. You are not a lobbyist."

---

### The Earth Optimization Game (12s)

*Segment*: `script-1b-objective` · *Component*: `game-title` · *BG*: foreground

> "The objective of the Earth Optimisation Game is to optimally allocate Earth's finite resources. Move the budget from things that make you poorer and deader — like explosions — to the things that would make you vastly healthier and wealthier — like pragmatic clinical trials. That is the entire game. Reallocate. Everything else follows."

*Visual*: Full Sierra title screen with the game's core mechanic visible from the start. Black background, twinkling pixel stars. "THE EARTH OPTIMIZATION GAME" in gold-embossed Sierra bitmap font, centered. Below the title, an animated pixel-art allocation slider — a horizontal bar with a pixel explosion icon (💥) on the left end and a pixel test tube icon (🧪) on the right. The slider handle sits almost entirely on the left (current: 99% explosions). As the narration says "move the budget," an animated hand drags the slider one notch rightward (to 98%). A tiny "+$27B → CURES" label pops up. The bar barely moves — but the test tube icon pulses brighter.

Below the slider: "A Point-and-Click Adventure in Civilisational Reallocation." Blinking "PRESS START" at the bottom.

*Sierra verb*: `> USE common sense ON government` → "I don't think that works here."
`> DRAG slider` → "You have just reallocated $27 billion from explosions to cures. The military did not notice. The sick did."

---

### 604:1 (8s)

*Segment*: `script-2b-ratio` · *Component*: `military-pie` · *BG*: foreground

> "Your governments currently spend $604 on the capacity for mass murder for every $1 they spend testing which medicines work. Your chance of dying from terrorism: 1 in 30 million. Your chance of dying from disease: 100%."

*Visual*: Pixel art — a Sierra-style scale/balance. Left pan: overflowing with pixel missiles, tanks, jets, bombs — crashed to the floor, bending the scale. Right pan: a single tiny pixel test tube floating near the ceiling. Above the scale: "$2,720,000,000,000" (left) vs "$4,500,000,000" (right). Below, a pixel-art pie chart where the clinical trials slice is literally one pixel wide. Legend: "MILITARY: 99.83%" / "CLINICAL TRIALS: 0.17%."

*Sierra verb*: `> LOOK AT tiny pile` → "That is the entire global clinical trials budget. Try not to blink or you'll miss it."
`> USE test tube` → "You cannot. It is being crushed by $2.72 trillion of military hardware."

---

### The Clock (10s)

*Segment*: `script-2c-clock` · *Component*: `collapse-clock` · *BG*: foreground

> "The parasitic economy — cybercrime, rent-seeking, military spending — grows at 15% per year. The productive economy grows at 3%. In 15 years, it becomes more rational to steal than to produce. This is the clock."

*Visual*: Pixel art — stone castle wall (King's Quest aesthetic) with a massive clock face. Two hands racing: red "PARASITIC (15%/yr)" spinning fast, green "PRODUCTIVE (3%/yr)" crawling behind. Below, a pixel-art line chart shows the two trajectories crossing — red overtaking green — with a flashing "X" at "2040: COLLAPSE THRESHOLD." Digital countdown ticks: "YEARS REMAINING: 14 yrs 247 days 8 hrs..."

*Sierra verb*: `> USE time machine` → "You don't have one. That's rather the point."
`> LOOK AT clock` → "Every civilisation that reached this threshold collapsed. Soviet Union. Yugoslavia. Argentina. Zimbabwe. You are next unless you change the trajectory."

---

### Global Failed State (10s)

*Segment*: `script-2d-failed-state` · *Component*: `failed-state` · *BG*: foreground

> "When stealing becomes more rational than producing, people stop producing. This is not a theory. Somalia. Venezuela. Lebanon. The productive people leave or die. The ones who remain have nothing left to steal. So they steal from each other. The entire economy becomes extraction. Nothing gets built. Nothing gets maintained. Nothing gets cured. That is where the clock ends. Not in one country. Everywhere."

*Visual*: Pixel art — a Sierra city scene, but decaying in real-time. The scene starts as a functioning pixel town (shops, roads, people walking). As the narration progresses, pixel-art decay spreads: storefronts board up, pixel thieves appear on rooftops, roads crack, a hospital's red cross sign flickers and dies, pixel people flee offscreen or huddle in corners. The palette desaturates toward the Moronia greys. In the corner, a world map shows red spreading from a few countries to all continents — the same color as the parasitic economy line from The Clock. Text overlay: "WHEN DESTRUCTION > PRODUCTION: GLOBAL FAILED STATE."

*Sierra verb*: `> LOOK AT city` → "Somalia but everywhere. Venezuela but permanent. Lebanon but with no neighbouring country to flee to. When the whole planet crosses the threshold, there is nowhere left to go."
`> HELP` → "There is no help command in a failed state. That is what makes it a failed state."

---

### The AI Hacker Spiral (10s)

*Segment*: `script-2e-ai-hackers` · *Component*: `ai-spiral` · *BG*: foreground

> "It gets worse. North Korea, Russia, and criminal syndicates are already using AI to generate autonomous hacking agents. Millions of them. They steal to fund more compute. More compute creates more hackers. More hackers steal more. This is a recursive exponential loop. Your species built the tools for its own extraction. And every dollar stolen funds the next generation of thieves."

*Visual*: Pixel art — a dark server room (SQ-style villain lair). A single pixel-art robot hacker sits at a terminal. It splits into two. Those two split into four. The screen fills with multiplying hacker bots — a visual echo of the doubling model from the Get Friends to Play slide, but evil. A counter ticks: "AI HACKERS: 1... 2... 4... 1,024... 1,048,576... ∞." Below, a loop diagram animates:

```
  ┌──→ STEAL $$$  ──→ BUY COMPUTE ──→ TRAIN MORE HACKERS ──┐
  │                                                          │
  └──────────────────────────────────────────────────────────┘
  RECURSIVE EXPONENTIAL THEFT
```

The loop spins faster and faster. The stolen amount counter ticks up. The productive economy bar from The Clock shrinks visibly in the HUD.

*Sierra verb*: `> LOOK AT hackers` → "Each one creates two more. The doubling model, but for destruction. Twenty-eight rounds of this does not create a movement. It creates an extinction."
`> UNPLUG server` → "You cannot unplug a distributed botnet. That is rather the point of distributed systems. Your species built this too."

---

### Your Paycheck Already Got Stolen (8s)

*Segment*: `script-2f-paycheck-theft` · *Component*: `paycheck-theft` · *BG*: foreground

> "You do not have to wait for the collapse. It already started. Your central bank has destroyed 97% of the dollar's purchasing power since 1913. If wages had kept pace, the median family would earn $528,000 a year. The actual number is $77,500. The difference went to fund endless war and bail out the banks that lost your money. Your paycheck is being stolen every year. They just call it monetary policy so you do not notice."

*Visual*: Pixel art — a Sierra pay window / merchant's counter. A pixel worker receives a stack of gold coins ("YOUR PAYCHECK: $77,500"). But as the coins land, they shrink — each one dissolving by ~3% as a tiny pixel vacuum labeled "CENTRAL BANK" siphons off value. Above the worker, a ghost-image shows what the paycheck SHOULD be: a massive gold pile labeled "$528,000 — IF WAGES KEPT PACE." The gap between the real pile and the ghost pile is enormous. Pixel arrows show where the difference went: "→ ENDLESS WAR" "→ BANK BAILOUTS" "→ MILITARY CONTRACTORS." The worker doesn't react — they can't see the ghost pile. They think the small pile is normal.

*Sierra verb*: `> LOOK AT paycheck` → "$77,500. Your species calls this a 'good salary.' It is 15% of what it would be if your central bank had not spent a century funding wars with your purchasing power."
`> LOOK AT ghost pile` → "$528,000. That is what the median family would earn if productivity gains had been passed to workers instead of printed away. The theft is invisible because it happens at 2% per year. Compound interest works for thieves too."

---

### Moronia: GAME OVER (10s)

*Segment*: `script-3a-moronia` · *Component*: `moronia` · *BG*: foreground

> "Moronia was a planet that spent 604 times more on weapons than on curing disease. It no longer exists. Their allocation ratio correlates with yours at 94.7%."

*Visual*: Pixel art — barren, cracked planet surface. Red-black sky. Shattered buildings. Leafless pixel trees. Craters. Ash drifting. After narration, screen FREEZES. Sierra death jingle plays. Image desaturates to greyscale. Death dialog drops in:

```
┌─────────────────────────────────────┐
│          G A M E   O V E R          │
│                                     │
│  Moronia allocated 604× more to     │
│  weapons than curing disease.       │
│                                     │
│  Correlation with Earth: 94.7%.     │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌──────┐  │
│  │ RESTORE │ │ RESTART │ │ QUIT │  │
│  └─────────┘ └─────────┘ └──────┘  │
└─────────────────────────────────────┘
```

Score resets to `0`. Death counter *keeps ticking*.

---

## THE TURN — RESTORE GAME

### Wishonia: RESTORE FROM ALTERNATE SAVE (10s)

*Segment*: `script-3b-wishonia` · *Component*: `wishonia-slide` · *BG*: cyan

**[Cursor moves to "RESTORE" and clicks. Death dialog dissolves. Save-game file browser slides in:]**

```
┌─────────────────────────────────────┐
│  R E S T O R E   G A M E           │
│                                     │
│  ▸ earth_2026.sav      (current)   │
│  ▸ moronia_final.sav    ☠ (dead)   │
│  ▸ wishonia_year_0.sav  ★ ◄◄◄     │
│                                     │
│  ┌──────────┐ ┌────────┐           │
│  └──────────┘ └────────┘           │
└─────────────────────────────────────┘
```

**[Clicks "wishonia_year_0.sav". "Bwoing" restore sound.]**

> "Wishonia redirected 1% of its murder budget to clinical trials 4,297 years ago. That is where I am from. It is considerably nicer."

*Visual*: INSTANTANEOUS hard cut. Palette explodes from EGA 16-color to VGA 256. Bright cyan sky, fluffy pixel clouds, green rolling hills, gleaming pixel cities with parks and hospitals (no military bases). Pixel birds fly. Rivers flow. Health/happiness meters maxed. Quest meters (HALE / Income) appear for the FIRST TIME, empty, pulsing gently.

Score reappears. Inventory is empty. The quest begins.

---

## ACT II — THE QUEST

### Part 1: The Solution

### The Fix (10s)

*Segment*: `script-4a-fix` · *Component*: `one-percent-shift` · *BG*: yellow

> "The fix is not complicated. Redirect 1% of global military spending — $27 billion a year — to clinical trials. That is going from spending 99% on bombs to 98% on bombs. Radical, I know."

*Visual*: Pixel art — Wishonia's control room. Massive wall-mounted lever with display: "MILITARY: 99%" / "CURES: 1%". Animated pixel hand nudges it one notch. Display updates: "MILITARY: 98%" / "CURES: 2%." The slot is one pixel different. Comic "that's it?" pause. Pixel-art scroll "1% TREATY" drops into inventory slot 1 with "cha-ching." Quest meter for INCOME nudges slightly.

*Sierra verb*: `> USE lever` → "You nudge it 1%. The military-industrial complex does not notice. Twenty-seven billion dollars just got redirected and nobody felt a thing."

**Score**: `100,000` · **Inventory**: +`1% TREATY` (slot 1)

---

### 12.3× Acceleration (10s)

*Segment*: `script-4b-acceleration` · *Component*: `trial-acceleration` · *BG*: cyan

> "This would increase clinical trial capacity by 12.3 times. It would compress the time to cure all diseases from 443 years to 36 years. The maths is not in dispute."

*Visual*: Pixel art — two hourglasses on a workshop bench. Left: enormous, "STATUS QUO", plaque "443 YEARS", tiny sand trickle. Right: compact, "1% TREATY", plaque "36 YEARS", sand pouring 12× faster. Pixel scientist between them, pointing at right one, shrugging. Multiplier badge: "×12.3 CAPACITY." HALE quest meter fills slightly.

*Sierra verb*: `> LOOK AT left hourglass` → "443 years. Your grandchildren's grandchildren's grandchildren would still be waiting."
`> LOOK AT right hourglass` → "36 years. Most of you would live to see it. If you started today."

**Score**: `1,000,000`

---

### The Compounding Loop (12s)

*Segment*: `script-4b2-compounding` · *Component*: `gdp-trajectory` · *BG*: yellow

> "Here is how that turns into wealth. Disease currently drags down 13% of global GDP — fifteen trillion dollars a year in lost productivity and medical costs. Every disease you cure unlocks a permanent slice of that. Freed workers produce more. More production generates more tax revenue. More revenue funds more trials. More trials cure more diseases. It compounds. Healthcare spending returns three times more economic activity per dollar than military spending. At current trajectory, your economy grows at 2.5%. Redirect the spending, cure the diseases, and it compounds at 17.9%. Over twenty years, that is the difference between $12,500 per person and $339,000 per person. That is not a fantasy. That is compound interest applied to not killing people."

*Visual*: Pixel art — a Sierra "machine schematic" diagram. A positive feedback loop rendered as a pixel-art cycle with animated arrows flowing clockwise:

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ THE COMPOUNDING LOOP                                │
│                                                         │
│        ┌──────────────┐                                 │
│    ┌──→│ REDIRECT $27B │──→ CURE DISEASES ──┐           │
│    │   │ TO TRIALS     │    (44× cheaper)    │           │
│    │   └──────────────┘                      ▼           │
│    │                              ┌─────────────────┐   │
│    │                              │ UNLOCK 13% GDP  │   │
│    │                              │ ($15T/yr freed) │   │
│    │                              └────────┬────────┘   │
│    │                                       ▼            │
│    │   ┌──────────────┐         MORE PRODUCTIVITY       │
│    └───│ BIGGER BUDGET │◄──── MORE TAX REVENUE ◄────┘   │
│        └──────────────┘                                 │
│                                                         │
│  💥 Military:  $1 in → $0.60 out  (0.6× multiplier)    │
│  🧪 Healthcare: $1 in → $1.80 out (1.8× multiplier)    │
│                                                         │
│  Status quo growth:  2.5% / year → $12.5K per person    │
│  Treaty growth:     17.9% / year → $339K per person     │
│  Wishonia growth:   25.4% / year → $1.16M per person    │
│                                                         │
│  Timeline: 20 years. Same species. Different allocation. │
└─────────────────────────────────────────────────────────┘
```

The loop animates continuously — pixel arrows circling, each cycle faster than the last (visually representing compounding). Below the loop, three pixel-art GDP trajectory lines diverge upward: grey (status quo, barely rising), green (Treaty, steep), gold (Wishonia, exponential). The GdpTrajectoryChart component renders in Sierra pixel style. The divergence between the lines gets dramatically wider with each year — by year 20 they're not even on the same scale.

*Sierra verb*: `> LOOK AT loop` → "Every disease cured makes the economy bigger. A bigger economy funds more cures. More cures make it bigger still. Your species calls this a virtuous cycle. You have mostly been running the vicious version."
`> COMPARE trajectories` → "Same planet. Same people. Same twenty years. The only difference is where you point the money. $12,500 versus $339,000. Compound interest does not care about your politics. It only cares about your allocation."

**Score**: `2,000,000`

---

### Pluralistic Ignorance (10s)

*Segment*: `script-4c-ignorance` · *Component*: `pluralistic-ignorance` · *BG*: background

> "The problem is not that nobody wants this. The problem is that everybody wants it but thinks nobody else will agree to it. This is called pluralistic ignorance, and it is your civilisation's most expensive bug. How expensive? Health innovation delays: $34 trillion a year. Migration restrictions: $57 trillion. Lead poisoning: $6 trillion. Underfunded science: $4 trillion. Total: $101 trillion per year in unrealised potential. That is 88% of global GDP wasted because your governments cannot coordinate."

*Visual*: Pixel art — town square (King's Quest village). Thirty pixel villagers, each with a green ✓ thought bubble. But each is turned away, arms crossed, looking at the ground — can't see anyone else's bubble. One villager in center has yellow `!` quest marker (the player). Sierra info box shows the breakdown:

```
┌──────────────────────────────────────────┐
│  🐛 BUG REPORT: pluralistic_ignorance.exe │
│  Status: ACTIVE                          │
│                                          │
│  Health innovation delays:  $34T         │
│  Migration restrictions:    $57T         │
│  Lead poisoning:             $6T         │
│  Underfunded science:        $4T         │
│  ─────────────────────────────           │
│  TOTAL ANNUAL COST:        $101T         │
│  (88% of global GDP)                     │
└──────────────────────────────────────────┘
```

*Sierra verb*: `> TALK TO crowd` → "They all want the same thing. They just don't know they all want the same thing. Your job is to make the demand visible."

---

### The Scoreboard: Quest Objectives (10s)

*Segment*: `script-4d-scoreboard` · *Component*: `quest-objectives` · *BG*: background

**[Quest notification: "QUEST OBJECTIVES REVEALED"]**

> "The entire game comes down to two numbers. Healthy life expectancy: currently 63.3 years, target 69.8. Median income: currently $18,700, target $149,000. Move these two numbers and everything else follows. That is the scoreboard. Everything on this site exists to move it."

*Visual*: Pixel art — large Sierra quest log/journal open on a wooden desk:

```
┌──────────────────────────────────────────────┐
│  📖 QUEST LOG — EARTH OPTIMIZATION           │
│                                              │
│  OBJECTIVE 1: HEALTHY LIFE EXPECTANCY        │
│  ─────────────────────────────────────       │
│  Current:  63.3 years                        │
│  Target:   69.8 years (+6.5)                 │
│  Progress: ████████░░░░░░░░░░░░  0%          │
│                                              │
│  OBJECTIVE 2: GLOBAL MEDIAN INCOME           │
│  ─────────────────────────────────────       │
│  Current:  $18,700 / year                    │
│  Target:   $149,000 / year (8×)              │
│  Progress: ██░░░░░░░░░░░░░░░░░░  0%          │
│                                              │
│  DEADLINE: 2040 (14 years)                   │
│  REWARD:   8,000,000,000 lives aligned       │
│                                              │
│  "Move these two numbers. Everything else    │
│   follows." — Wishonia                       │
└──────────────────────────────────────────────┘
```

Quest meters in HUD pulse and glow — the viewer now understands what they're tracking.

*Sierra verb*: `> READ quest log` → "Two numbers. That is all. Your species has made this extraordinarily complicated. It is not."

**Score**: `5,000,000`

---

### Part 2: The Game

### Level 1: Allocate (15s)

*Segment*: `script-5a-allocate` · *Component*: `level-allocate` · *BG*: yellow

**[Quest notification: "⚔ LEVEL 1 — Allocate your civilisation's resources."]**

> "Step one: allocate. You see two budget categories. Drag the slider toward the one you'd spend more on. Explosions or pragmatic clinical trials. Ten comparisons. Your choices build a complete budget allocation using eigenvector decomposition — the same maths your species invented in 1977 and mostly uses to rank American football teams."

*Visual*: Pixel art — Sierra "duel" layout. RPG battle, but combatants are budget categories:

**TOP HALF — The Matchup (animated, 3 rounds):**

Round 1:
```
┌─────────────────┐    VS    ┌─────────────────┐
│  💥 EXPLOSIONS   │          │  🧪 CLINICAL     │
│                 │          │     TRIALS       │
│  $2.72T / year  │          │  $4.5B / year    │
│  604× more than │  ◄━━━━►  │  Cures diseases  │
│  the other one  │  [SLIDER] │  $929 per patient │
│                 │          │                  │
│  ROI: negative  │          │  ROI: 12.3× more │
│  (more death)   │          │  trial capacity  │
└─────────────────┘          └─────────────────┘
```

Cursor grabs slider, drags firmly toward CLINICAL TRIALS. Green burst. "COMPARISON 1 of 10 ✓."
Round 2 snaps in: "MILITARY BASES vs DISEASE RESEARCH" — slider right.
Round 3: "FIGHTER JETS vs HOSPITAL BEDS" — slider right.
Each round ~1 second. Speed sells "this is fast."

**BOTTOM HALF — Your Allocation Builds:**

Pixel-art horizontal bar chart grows. Each comparison adjusts a bar. After 3 rounds: "Clinical Trials: 31% · Education: 22% · Infrastructure: 18% · Military: 4%..." Bars in different pixel colors. Final text: "10 comparisons. 2 minutes. You just designed a coherent national budget."

Ballot drops into inventory slot 2.

*Sierra verb*: `> DRAG slider` → "Interesting. You'd rather cure cancer than build a ninth aircraft carrier. Your politicians may want to take notes."
`> LOOK AT allocation chart` → "Eigenvector decomposition. Stable preference weights from ten comparisons. Your species invented this in 1977. Used it for football. We use it for civilisation."

**Score**: `10,000,000` · **Inventory**: +`ALLOCATION` (slot 2)

---

### Level 2: Vote on the Treaty (12s)

*Segment*: `script-5b-vote` · *Component*: `level-vote` · *BG*: pink

> "Step two: the 1% Treaty Referendum. Should all governments redirect 1% of military spending to pragmatic clinical trials? Yes or no. One click. Thirty seconds. This is the question that changes the allocation."

*Visual*: Screen dims to spotlight. Single oversized Sierra dialog box:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   📜 THE 1% TREATY REFERENDUM                    │
│                                                  │
│   Should all governments redirect 1% of          │
│   military spending to pragmatic clinical trials? │
│                                                  │
│   Current allocation: 💥 99% → 🧪 1%             │
│   Proposed:           💥 98% → 🧪 2%             │
│                                                  │
│       ┌──────────┐         ┌──────────┐          │
│       │   YES    │         │    NO    │          │
│       └──────────┘         └──────────┘          │
└──────────────────────────────────────────────────┘
```

Cursor hovers YES. 1.5 seconds silence. Clicks.

**CELEBRATION (2s):** Dialog explodes with pixel confetti. Fanfare. Score jumps 10M → 100M. Banner: "VOTE RECORDED ✓". The allocation slider from the title screen nudges one tick rightward — the global slider moved because *you* voted.

Raised-fist drops into inventory slot 3.

New dialog slides in from right:

```
┌────────────────────────────────────────┐
│  🎉 YOU'RE IN THE GAME!               │
│                                        │
│  Player #4,847 of 4B needed            │
│  Get your friends to play:             │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ optimitron.com/r/player1        │   │
│  └─────────────────────────────────┘   │
│                                        │
│  Every friend who plays through your   │
│  link = 1 VOTE point ($194K if we win) │
│                                        │
│  ┌────────────────┐  ┌──────────────┐  │
│  │  📋 COPY LINK  │  │  📱 SHARE    │  │
│  └────────────────┘  └──────────────┘  │
└────────────────────────────────────────┘
```

*Sierra verb*: `> CLICK yes` → "Congratulations. You have just done more for civilisation than most parliaments manage in a decade."
`> CLICK no` → "Interesting. You prefer the current ratio of 604 dollars on explosions per dollar on cures. The narrator judges you silently."

**Score**: `100,000,000` · **Inventory**: +`VOTE` (slot 3)

---

### $0.06 (8s)

*Segment*: `script-5b2-asymmetry` · *Component*: `asymmetry` · *BG*: foreground

> "That vote took thirty seconds. At the global average hourly income, your time cost six cents. The upside if the Treaty passes: fifteen point seven million dollars. Per person. That is a ratio of two hundred and forty-five million to one. On my planet we just call it arithmetic."

*Visual*: Pixel art — Sierra merchant's shop. Wishonia behind counter in merchant robes. Left side: tiny copper pixel coin on velvet pad, "$0.06 — 30 seconds of your time." Right side: comically enormous gold pile extending off-screen, "$15,700,000 — lifetime income gain." Trade arrow between them. Flashing pixel text: "EXCHANGE RATE: 245,000,000 : 1." Wishonia's portrait: one eyebrow raised.

*Sierra verb*: `> TRADE 30 seconds FOR $15.7 million` → "The merchant stares at you. 'This is the most lopsided trade in the history of commerce. And I have been trading for 4,297 years.'"
`> HAGGLE` → "There is nothing to haggle. The trade is already infinitely in your favour."

**Score**: `200,000,000`

---

### Level 3: Get All Your Friends to Play (15s)

*Segment*: `script-5c-share` · *Component*: `level-share` · *BG*: yellow

**[Quest notification: "⚔ LEVEL 3 — Get your friends to play. Tell two people."]**

> "Step three: get all your friends to play. Send them your link. When they play through your link, you earn one VOTE point. They get their own link and do the same. The target is 4 billion players. Sounds ambitious? 4 billion people already drive to a polling station, wait in line, and vote for free — in elections where their individual vote is worth 1 in 30 million and the winner ignores them anyway. You are asking those same people to click some buttons on a website to get 10× richer. The participation barrier is not the hard part. And every new player who deposits grows the prize pool — which makes everyone more incentivized to make sure humanity actually wins."

*Visual*: Pixel art — split into two halves.

**LEFT — The Concrete Action:**
Pixel-art phone screen showing a text message thread. Player's message: "Play this → optimitron.com/r/player1". Friends "Sarah" and "Mike" reply: "🎮 I'm playing! My link: .../r/sarah" and "🎮 I'm playing! My link: .../r/mike." Notifications pop: "+1 VOTE POINT" "+1 VOTE POINT." Three platform icons below (text, WhatsApp, Twitter). A prize pool counter ticks up as each friend joins.

**RIGHT — The Comparison That Kills the Objection:**
A Sierra side-by-side comparison — the kind you'd see when comparing two items in your inventory:

```
┌──────────────────────────┐  ┌──────────────────────────┐
│  🗳 REGULAR VOTING        │  │  🎮 PLAYING THIS GAME    │
│                          │  │                          │
│  Drive to polling station│  │  Click buttons on website│
│  Wait in line            │  │  30 seconds              │
│  1 in 30M chance of      │  │  Each point worth $194K  │
│  being the tiebreaker    │  │  Everyone gets 10× richer│
│  Winner ignores you      │  │  Winner = you            │
│  Cost: free              │  │  Cost: free              │
│  Reward: nothing         │  │  Reward: $15.7M          │
│                          │  │                          │
│  People who do this: 4B  │  │  People needed: 4B       │
└──────────────────────────┘  └──────────────────────────┘
```

The left card is greyed out and dull. The right card glows green. The bottom line — "People who do this: 4B" vs "People needed: 4B" — is the punchline. The target audience already exists. They already proved they'll participate in collective action for nothing. You're offering them something better.

Chain-link drops into inventory slot 4.

*Sierra verb*: `> TEXT sarah` → "'Play this game.' Sarah opens the link. Plays. Gets her own link. Sends it to two more friends. The prize pool just grew. Your VOTE points just got more valuable."
`> COMPARE voting` → "4 billion people already do something harder for nothing. You are asking them to do something easier for $15.7 million. This is not a marketing challenge. It is arithmetic."

**Score**: `500,000,000` · **Inventory**: +`REFERRAL LINK` (slot 4)

---

### Part 3: The Money

### Better Than Your Retirement Fund (10s)

*Segment*: `script-6a-investment` · *Component*: `prize-investment` · *BG*: pink

> "Step four: deposit into the Earth Optimization Prize Pool. The pool is not sitting in a savings account. It is invested across the most innovative startup companies on Earth — achieving 17% annual growth. Your retirement fund is parked in sclerotic rent-seeking corporations earning 8%. The prize pool outperforms it by double. You were going to invest that money anyway. Invest it here, where the returns are better AND the side effect is curing all disease."

*Visual*: Pixel art — Sierra merchant's investment counter. Two options side by side:

```
┌──────────────────────────────────────────────────────┐
│  💰 INVESTMENT COMPARISON                            │
│                                                      │
│  ┌────────────────────────┐  ┌────────────────────┐  │
│  │  YOUR RETIREMENT FUND  │  │  PRIZE POOL        │  │
│  │                        │  │                    │  │
│  │  Old corporations      │  │  Innovative startups│  │
│  │  Rent-seeking, slow    │  │  High-growth, new   │  │
│  │  Return: 8% / year     │  │  Return: 17% / year │  │
│  │                        │  │                    │  │
│  │  $100 → $317 (15 yrs)  │  │  $100 → $1,110     │  │
│  │                        │  │  (15 yrs)          │  │
│  │  Side effect: nothing  │  │  Side effect:       │  │
│  │                        │  │  curing all disease │  │
│  └────────────────────────┘  └────────────────────┘  │
│                                                      │
│  The goal: build the biggest prize pool in history.  │
│  So every player on Earth is incentivized to win.    │
└──────────────────────────────────────────────────────┘
```

Right option glows green. Left looks grey and dull.

*Sierra verb*: `> COMPARE returns` → "8% in a retirement fund versus 17% in the prize pool. Your financial advisor will not tell you about this because your financial advisor works for the 8% companies."
`> DEPOSIT gold coin` → "Your money is now invested in companies building the future, instead of companies extracting rent from the past. Also, the side effect is saving civilisation."

**Score**: `650,000,000`

---

### How the Prize Works (10s)

*Segment*: `script-6b-mechanism` · *Component*: `prize-mechanism` · *BG*: cyan

> "Deposit $100. Two things can happen. If Earth hits its targets by 2040, the pool unlocks and VOTE point holders split it — every friend you got to play is now worth $194,000 to you. If Earth misses, depositors get their money back plus all the yield that accrued — $100 becomes $1,110. Both paths pay. There is no path where you lose."

*Visual*: Pixel art — branching path (Sierra maze fork). Player's avatar at crossroads holding gold coin. Treasure chest at fork: "PRIZE POOL SMART CONTRACT." Two paths:

```
                         ┌─ 🌍 TARGETS HIT ──→ [pixel utopia]
                         │   Pool unlocks.
  YOU ($100) → [CHEST] ──┤   VOTE holders split it.
                         │
                         └─ ❌ TARGETS MISSED ─→ [pile of 11× gold]
                             Your $100 → $1,110 back.
                             (11× over 15 years at 17%)
```

BOTH paths glow green. No red path. No skull. Gold coin drops into inventory slot 5.

*Sierra verb*: `> LOOK AT paths` → "Both are green. In one path, your friends who played get paid. In the other, you get eleven times your money back. Your species has a word for this: 'free option.'"
`> LOOK AT chest` → "A dominant assurance contract. It multiplies your gold whether you win or lose. The only losing move is to not put anything in."

**Score**: `800,000,000` · **Inventory**: +`PRIZE DEPOSIT` (slot 5)

---

### $194K Per Point (10s)

*Segment*: `script-6c-vote-value` · *Component*: `vote-point-value` · *BG*: yellow

> "Now for the VOTE points. Every friend you got to play earned you one point. If the world's retirement savings compound in the prize pool at 17% instead of 8%, the pool reaches $774 trillion. Split across 4 billion players, each VOTE point is worth $194,000. Two friends playing: $387,000. Ten friends: $1.9 million. Points cannot be bought. They can only be earned by getting real people to play the game. The more friends you bring in, the bigger the prize pool gets, the more valuable everyone's points become."

*Visual*: Pixel art — Sierra character stats screen:

```
┌────────────────────────────────────────────┐
│  ⚔️ CHARACTER — VOTE POINT LEDGER          │
│                                            │
│  POINTS EARNED:    2 (from friends playing)│
│  VALUE PER POINT:  $194,000                │
│  TOTAL IF HIT:     $387,000                │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  FRIENDS PLAYING TABLE              │  │
│  │  ───────────────────────────        │  │
│  │  2 friends   →  $387,000            │  │
│  │  5 friends   →  $970,000            │  │
│  │  10 friends  →  $1,940,000          │  │
│  │  50 friends  →  $9,700,000          │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ⚠ Points are NON-TRADABLE.               │
│  ⚠ Cannot be purchased. Ever.             │
│  ⚠ Earned ONLY by getting friends to play.│
│                                            │
│  More players → bigger pool → bigger prize │
│  → more incentive to make sure Earth wins  │
└────────────────────────────────────────────┘
```

Two silver tokens drop into inventory slot 6. Flywheel line at bottom rendered as pixel-art cycle arrow.

*Sierra verb*: `> LOOK AT points` → "Non-transferable. Non-purchasable. Earned by getting friends to play. The game gets more valuable the more people are in it. That is not a bug. It is the design."
`> SELL points` → "They cannot be sold. If they could be bought, the rich would own the game. The only way to earn them is to get another human being to care."

**Score**: `1,000,000,000` · **Inventory**: +`VOTE POINTS ×2` (slot 6)

---

### You Cannot Lose (10s)

*Segment*: `script-6d-free-option` · *Component*: `prize-free-option` · *BG*: pink

> "But wait — if humanity wins, doesn't my deposit go to VOTE holders instead of back to me? Yes. And here is why that is fine. First: get even two friends to play and you have VOTE points worth $387,000 — far more than your deposit. Second: if humanity wins, everyone is 10× richer. Your $100 deposit vanishes into a world where your lifetime income just increased by $15.7 million. You do not mourn the $100. You are too busy being a multimillionaire in a civilisation that cured all disease. The only way to lose is not to play."

*Visual*: Sierra summary/stats screen — three outcomes:

```
┌───────────────────────────────────────────────────────┐
│  📊 WORKED EXAMPLE — $100 DEPOSIT + 2 FRIENDS PLAYING │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ✅ HUMANITY WINS                                │  │
│  │     Your deposit: goes to VOTE holders (not you) │  │
│  │     Your VOTE points: 2 × $194K = $387,000      │  │
│  │     Your lifetime income: +$15.7 MILLION         │  │
│  │     Everyone is 10× richer. You don't miss $100. │  │
│  │     NET: +$16,087,000                            │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ✅ HUMANITY MISSES (targets not hit)            │  │
│  │     VOTE points: expire ($0)                     │  │
│  │     Your deposit: $100 → $1,110 (11× yield)     │  │
│  │     Still outperforms your retirement fund (3.5×)│  │
│  │     NET: +$1,010                                 │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ❌ DID NOT PLAY                                 │  │
│  │     $0 returned. $0 earned.                      │  │
│  │     Still paying $12,600/yr dysfunction tax.     │  │
│  │     Missed $15.7M in lifetime income.            │  │
│  │     NET: -$15,700,000 (opportunity cost)         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  Two out of three outcomes are wins.                  │
│  The third one is your fault.                         │
└───────────────────────────────────────────────────────┘
```

First ✅ box glows brightest — BEST outcome. "+$15.7 MILLION" overwhelms "deposit goes to VOTE holders." ❌ box dim red — the real loss is the opportunity cost.

*Sierra verb*: `> WORRY ABOUT deposit` → "Your deposit goes to VOTE holders if humanity wins. You also got $15.7 million richer. On my planet we call this a good trade."
`> LOOK AT outcomes` → "Two green. One red. The red one is the one where you did nothing. That is the only scenario where you lose."

**Score**: `1,500,000,000`

---

### Part 4: The Accountability

### The Leaderboard (10s)

*Segment*: `script-8-leaderboard` · *Component*: `government-leaderboard` · *BG*: background

> "Every politician ranked by the ratio of spending they have voted for: mass murder capacity versus clinical trial funding. A single number. Public. Immutable. On-chain."

*Visual*: Pixel art — Sierra high-score table on ornate wooden frame (inn's notice board, King's Quest). Title: "ALIGNMENT HIGH SCORES." Each row: pixel country flag, politician name, alignment score as pixel bar graph. Top rows green (high alignment). Bottom rows red (low). Table scrolls upward. Column headers: "RANK / NATION / LEADER / ALIGNMENT SCORE / MILITARY:TRIALS RATIO."

Magnifying glass drops into inventory slot 8.

*Sierra verb*: `> LOOK AT leaderboard` → "Some of these scores are impressively low. It takes real commitment to be this misaligned."
`> SORT BY worst` → "Sorting by worst score. The competition for last place is fierce."

**Score**: `3,000,000,000` · **Inventory**: +`ALIGNMENT SCORE` (slot 8). Inventory is now FULL.

---

### We Changed the Metric (8s)

*Segment*: `script-8b-metric` · *Component*: `metric-changed` · *BG*: foreground

> "Your leaders are not evil. They are just optimising for the wrong metric. We changed the metric."

*Visual*: Pixel art — close-up of high-score table. Header "RE-ELECTION PROBABILITY" visible. Pixel red X slashes through it. New header typewriters in: "CITIZEN ALIGNMENT SCORE." Numbers scramble and resettle. Rankings shuffle. Top entry blinks green.

Single devastating line in narrator box. Maximum whitespace. Typewriter slower than usual — each word lands.

**Score**: `4,000,000,000`

---

### Part 5: The Armory

> *"Those are the quest objectives and the accountability system. Now here is every weapon you have to win."*

### The Decentralized FDA (12s)

*Segment*: `script-armory-dfda` · *Component*: `dfda` · *BG*: cyan

> "Your FDA makes treatments wait 8.2 years after they have already been proven safe. Just sitting there. Being safe. While 102 million people died waiting. The decentralized FDA runs pragmatic trials at $929 per patient instead of $41,000. Same patients. Real-world conditions instead of artificial ones. 44 times cheaper. 12.3 times more trial capacity. The drugs that did pass the FDA's review? Vioxx killed 55,000. OxyContin killed 500,000. Total executives jailed: zero. We can do better. We are doing better."

*Visual*: Pixel art — Sierra side-by-side comparison. Two pixel-art hospitals:

```
┌────────────────────────────┐  ┌────────────────────────────┐
│  🏥 TRADITIONAL FDA         │  │  🧪 DECENTRALIZED FDA       │
│                            │  │                            │
│  Cost: $41,000 / patient   │  │  Cost: $929 / patient      │
│  Time: 8.2 years after     │  │  Time: real-time           │
│         proven safe        │  │                            │
│  Capacity: 1.9M slots/yr   │  │  Capacity: 23.4M slots/yr  │
│  Diseases cured: 15/yr     │  │  Diseases cured: all of    │
│                            │  │  them in 36 years          │
│  Deaths from delay:        │  │  Deaths from delay:        │
│  102 million               │  │  zero                      │
│  Executives jailed: 0      │  │  Code is auditable.        │
└────────────────────────────┘  └────────────────────────────┘
```

Left hospital is crumbling, pixel bureaucrats visible through windows stamping papers. Right hospital is gleaming, pixel patients walking in one door and walking out healthy from another. Storacha logo visible on the data storage rack inside.

*Sierra verb*: `> LOOK AT queue` → "8.2 years. The drugs are sitting on a shelf. They work. The FDA knows they work. The patients are dying in the waiting room. This is not caution. It is manslaughter by committee."
`> USE decentralized FDA` → "Same patients, real conditions, real data, no eight-year queue. The technology exists. The only thing missing was the funding. That is what the 1% Treaty provides."

**Score**: `4,200,000,000`

---

### Incentive Alignment Bonds (12s)

*Segment*: `script-armory-iab` · *Component*: `iab` · *BG*: pink

> "Incentive Alignment Bonds. Sell one billion dollars of these. Use the proceeds to fund the 1% Treaty campaign. When the treaty passes, it generates $27 billion per year. That revenue splits: 80% to clinical trials — the actual public good. 10% back to bond holders — your return on investment. 10% to a SuperPAC that funds politicians algorithmically based on their Alignment Score. Not based on who they had dinner with."

*Visual*: Pixel art — Sierra merchant/crafting screen. An NPC "IAB TRADER" behind a counter. A flow diagram rendered as a crafting recipe:

```
┌─────────────────────────────────────────────────────┐
│  ⚗️ INCENTIVE ALIGNMENT BONDS — CRAFTING RECIPE      │
│                                                     │
│  INPUT:                                             │
│  ┌──────────────────┐                               │
│  │ BONDS: $1 BILLION │                              │
│  └────────┬─────────┘                               │
│           ▼                                         │
│  ┌──────────────────┐                               │
│  │ TREATY PASSES    │                               │
│  │ → $27B/yr inflow │                               │
│  └────────┬─────────┘                               │
│           ▼                                         │
│  OUTPUT (annual):                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ 80%      │ │ 10%      │ │ 10%              │    │
│  │ TRIALS   │ │ BOND     │ │ ALIGNMENT        │    │
│  │ $21.6B   │ │ HOLDERS  │ │ SUPERPAC         │    │
│  │          │ │ $2.7B    │ │ $2.7B            │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
│                                                     │
│  Campaign cost: $1B. Annual return: $27B. Forever.  │
└─────────────────────────────────────────────────────┘
```

The three output slots glow as they fill. Solidity contract icon visible on the bond. Hypercert badge on the trials output.

*Sierra verb*: `> BUY bonds` → "The campaign costs one billion. The treaty generates twenty-seven billion per year. Indefinitely. Your financial advisor would call this a good deal. If your financial advisor understood anything other than index funds."
`> LOOK AT superpac` → "Politicians funded by algorithm, not by dinner. The algorithm only has one input: did you vote to help people or did you vote to kill them? Simple."

**Score**: `4,500,000,000`

---

### The Optimal Policy Generator (10s)

*Segment*: `script-armory-opg` · *Component*: `opg` · *BG*: yellow

> "For the politicians who actually want to align: the Optimal Policy Generator. Feed it time-series data from hundreds of jurisdictions. It uses domain-agnostic causal inference — Bradford Hill criteria, temporal alignment, predictor impact scores — to answer one question: which policies actually increased median income and healthy life years? Not which policies were popular. Not which policies had good branding. Which ones worked. The data exists. Nobody bothered to run it through a causal inference engine until now."

*Visual*: Pixel art — King's Quest VI puzzle room / Wishonia's workshop. A machine labeled "OPTIMAL POLICY GENERATOR" with:
- Input slot: "INSERT JURISDICTION" — a pixel scroll labeled "UNITED STATES" feeds in
- Processing display: Bradford Hill scoring bars animate, temporal alignment charts cross-correlate
- Output slot: A pixel scroll emerges labeled "POLICY RECOMMENDATIONS — RANKED BY CAUSAL IMPACT"

Below the machine, a before/after: "PORTUGAL: Decriminalized all drugs, 2001. Overdose deaths: -80%." vs "USA: War on Drugs, $47B/yr. Overdose deaths: +1,700%." The machine found this. Your politicians ignored it.

*Sierra verb*: `> USE policy generator` → "It analyses what actually worked. Across every jurisdiction with data. No ideology. No party. Just outcomes. A novel concept for your species."
`> INSERT united states` → "Generating recommendations. Warning: results may conflict with current policy on approximately everything."

**Score**: `4,700,000,000`

---

### The Optimal Budget Generator (10s)

*Segment*: `script-armory-obg` · *Component*: `obg` · *BG*: cyan

> "The Optimal Budget Generator does the same thing for spending. Every budget category. Every jurisdiction. How much should you spend on education to maximise outcomes? The answer is not 'more.' It is a specific number derived from diminishing returns analysis across comparable jurisdictions. Singapore spends a quarter of what America spends on healthcare and their people live six years longer. The optimal budget is not the biggest budget. It is the smartest one."

*Visual*: Pixel art — a Sierra control panel with budget dials. Each dial is a budget category (HEALTH, EDUCATION, DEFENSE, INFRASTRUCTURE). The machine auto-adjusts the dials to optimal positions based on outcome data. A before/after comparison shows:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│  🇺🇸 USA (CURRENT)       │  │  🇺🇸 USA (OPTIMIZED)     │
│                         │  │                         │
│  Healthcare: $4.5T      │  │  Healthcare: $1.1T      │
│  Outcomes: ranked 37th  │  │  Outcomes: ranked 1st   │
│                         │  │                         │
│  Defense: $886B         │  │  Defense: $200B         │
│  Wars since 1945: 13    │  │  Wars needed: 0         │
│                         │  │                         │
│  Education: $800B       │  │  Education: $600B       │
│  Test scores: declining │  │  Test scores: +40%      │
└─────────────────────────┘  └─────────────────────────┘
```

The optimized column uses less money and gets better outcomes on every line. The difference is highlighted in green.

*Sierra verb*: `> OPTIMIZE budget` → "Less money, better outcomes. On every single line item. Your species has been doing this backwards for approximately a century."
`> COMPARE singapore` → "A quarter of the spending. Six more years of life. It is like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible."

**Score**: `5,000,000,000`

---

### Storacha: Immutable Evidence (8s)

*Segment*: `script-armory-storacha` · *Component*: `storacha` · *BG*: background

> "Every data point, every policy outcome, every budget analysis is stored on Storacha — content-addressed, immutable, permanent. No government can delete it. No lobbyist can edit it. No administration can classify it. The data is public because the data is the point. If your government could delete the evidence, they would. They cannot. It is on IPFS."

*Visual*: Pixel art — a Sierra vault/archive room. Pixel-art filing cabinets, but instead of drawers they have glowing IPFS content-addressed blocks. Each block has a CID hash visible. A pixel government official tries to reach for a block — a force field repels them. A "CONTENT-ADDRESSED" badge pulses. Storacha and IPFS/Filecoin logos visible. A pixel document labeled "FDA DELAY: 102M DEATHS" sits in a block — immutable, permanent, unfalsifiable.

*Sierra verb*: `> DELETE evidence` → "ACCESS DENIED. Content-addressed storage cannot be altered. That is the point. Your government's legal team has been notified and is reportedly quite upset."
`> LOOK AT vault` → "Every outcome. Every budget. Every vote. Every death. Permanent. Public. Immutable. On my planet, this is called a filing cabinet. On yours, it is called radical transparency."

**Score**: `5,200,000,000`

---

### Hypercerts: Verifiable Impact (8s)

*Segment*: `script-armory-hypercerts` · *Component*: `hypercerts` · *BG*: pink

> "Every claim of impact gets a Hypercert — a verifiable, on-chain attestation that says exactly what was done, by whom, with what result. No more 'we spent the money on healthcare' with no proof it worked. Every clinical trial funded by the treaty gets a Hypercert. Every life saved is attested. Every dollar tracked from deposit to outcome. If a charity tells you they saved ten thousand lives, you ask for the Hypercert. If they do not have one, they did not save ten thousand lives."

*Visual*: Pixel art — Sierra achievement/badge screen. A grid of Hypercert badges, each one a pixel-art certificate with: trial name, patients treated, outcome measured, CID hash linking to Storacha data. One badge animates being minted: "TRIAL #4,847: Malaria vaccine pragmatic trial. 12,000 patients. 94% efficacy. Verified on-chain." A pixel stamp of approval lands on it. The badge links visually to a Storacha block from the previous slide — the data backing the claim.

*Sierra verb*: `> VERIFY claim` → "Verifiable. Auditable. On-chain. The opposite of 'trust me, we spent it wisely.'"
`> LOOK AT badge` → "This Hypercert says 12,000 people received a malaria vaccine. The clinical data is content-addressed on Storacha. The funding trail is on-chain in Solidity. Every link is auditable. Your current system's equivalent is a PDF that says 'trust us.'"

**Score**: `5,400,000,000`

---

### The $WISH Token (10s)

*Segment*: `script-armory-wish` · *Component*: `wish-token` · *BG*: yellow

> "The $WISH token replaces three things your government does badly. One: taxation. A flat 0.5% transaction tax replaces your entire IRS. No 74,000-page tax code. No 83,000 employees. Revenue collection as a protocol feature. Two: welfare. Universal Basic Income distributed automatically via World ID. Everyone at the poverty line, no bureaucracy. Three: monetary policy. Algorithmic zero-percent inflation — captured productivity gains prevent the inflationary theft that destroyed 97% of your dollar. Your central bank's job, done by a smart contract, in four lines of code."

*Visual*: Pixel art — Sierra "three items" comparison. Three pixel government buildings on the left, crumbling and overcrowded. Three corresponding smart contract icons on the right, clean and glowing:

```
┌─────────────────────────────────────────────────────┐
│  💰 $WISH TOKEN — THREE REPLACEMENTS                 │
│                                                     │
│  ┌───────────────┐         ┌───────────────────┐    │
│  │ 🏛 THE IRS     │   →    │ 📜 0.5% TX TAX    │    │
│  │ 74,000 pages  │         │ 4 lines of code   │    │
│  │ 83,000 people │         │ 0 employees       │    │
│  └───────────────┘         └───────────────────┘    │
│  ┌───────────────┐         ┌───────────────────┐    │
│  │ 🏛 WELFARE     │   →    │ 📜 UBI via         │    │
│  │ 83 programs   │         │ World ID          │    │
│  │ 6 agencies    │         │ automatic         │    │
│  └───────────────┘         └───────────────────┘    │
│  ┌───────────────┐         ┌───────────────────┐    │
│  │ 🏛 FED RESERVE │   →    │ 📜 0% INFLATION    │    │
│  │ -97% since    │         │ algorithmic       │    │
│  │ 1913          │         │ productivity-     │    │
│  │               │         │ anchored          │    │
│  └───────────────┘         └───────────────────┘    │
│                                                     │
│  Tax + Welfare + Money = 3 smart contracts.         │
│  Your government uses 200,000 employees for this.   │
└─────────────────────────────────────────────────────┘
```

Each left building crumbles as the right contract glows brighter. Solidity logo visible on all three contracts.

*Sierra verb*: `> LOOK AT IRS` → "74,000 pages of tax code. 83,000 employees. All replaceable by a flat 0.5% transaction tax in four lines of Solidity. The four lines are auditable. The 74,000 pages are not."
`> COMPARE inflation` → "Your central bank destroyed 97% of the dollar since 1913. This smart contract maintains zero percent inflation by anchoring to productivity growth. It cannot print money to fund wars because it does not have a print function."

**Score**: `5,600,000,000`

---

### Billions of Brains (10s)

*Segment*: `script-armory-brains` · *Component*: `i-pencil` · *BG*: foreground

> "You are looking at this and thinking: this is impossibly complicated. Decentralized clinical trials, smart contracts, causal inference engines, immutable storage, algorithmic governance — who is going to build all of this? The answer: you do not need to know. Nobody knows how to make a pencil. Not one person on Earth. The wood comes from one country, the graphite from another, the rubber from a third, the paint from a fourth. Millions of people each doing one tiny step. No one coordinates them. The price system does. That is what the prize pool is. Four billion people, each with VOTE points worth $194,000, will figure out how to build a decentralized FDA the same way they figured out how to build a pencil. You do not need a plan. You need an incentive. The incentive is $774 trillion."

*Visual*: Pixel art — a Sierra "I, Pencil" sequence. A pixel pencil sits in the center of the screen. Zoom lines expand outward from it showing the supply chain: a pixel lumberjack, a pixel miner, a pixel factory worker, a pixel painter — each in a different pixel country. None of them know each other. Lines connect them all to the pencil. Then the pencil morphs into a pixel test tube (clinical trial), and the supply chain morphs too: a pixel developer writing Solidity, a pixel doctor running a trial, a pixel data scientist on Storacha, a pixel patient getting treated, a pixel auditor minting a Hypercert. Same structure. Same principle. Nobody coordinates them. The prize pool does.

Below, a counter: "BRAINS INCENTIVIZED: 4,000,000,000. VOTE POINT VALUE: $194,000. PRIZE POOL: $774 TRILLION." The numbers pulse.

*Sierra verb*: `> LOOK AT pencil` → "Nobody knows how to make this. Millions of people each contribute one step. The market coordinates them. The prize pool does the same thing, except instead of pencils it produces cures."
`> WORRY ABOUT complexity` → "Your species built the internet without a central plan. It built Wikipedia without paying anyone. It will build this because $194,000 per person is a better incentive than either of those had."

**Score**: `5,800,000,000`

---

### Part 6: The Climax

### Your $15.7 Million (10s)

*Segment*: `script-7-personal-upside` · *Component*: `personal-upside` · *BG*: yellow

> "If the 1% Treaty passes, your lifetime income gains are $15.7 million. Per person. Not per country. Per person. You currently lose $12,600 a year to political dysfunction — that is your share of the $101 trillion bug. This is not philanthropy. This is the largest investment opportunity in the history of your species. And the cost of not playing is $15.7 million."

*Visual*: Pixel art — three Sierra save-game slots, each with tiny pixel scene and stats:

```
┌────────────────────────────────────────────────────┐
│  💾 SAVE SLOTS — CHOOSE YOUR TIMELINE              │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ SLOT 1: STATUS QUO                  [LOADED] │  │
│  │ [grey city, smog, tiny people]               │  │
│  │ Lifetime income:  $1.34M                     │  │
│  │ HALE gain:        +0 years                   │  │
│  │ Dysfunction tax:  -$12,600/yr                │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ SLOT 2: 1% TREATY                    ◄◄◄    │  │
│  │ [bright city, parks, hospitals]              │  │
│  │ Lifetime income:  $15.7M  (12×)              │  │
│  │ HALE gain:        +6.5 years                 │  │
│  │ Dysfunction tax:  eliminated                 │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ SLOT 3: WISHONIA TRAJECTORY                  │  │
│  │ [pixel utopia, gleaming towers, forests]     │  │
│  │ Lifetime income:  $54.3M  (40×)              │  │
│  │ HALE gain:        +15.7 years                │  │
│  │ Dysfunction tax:  what is that               │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  You are currently on Slot 1.                      │
│  You chose it by not choosing.                     │
└────────────────────────────────────────────────────┘
```

Each slot has pixel-art scene matching its trajectory. Glowing deed drops into inventory slot 7.

*Sierra verb*: `> LOOK AT slot 1` → "Status quo. $1.34 million lifetime income. You are losing $12,600 a year to a system bug."
`> LOOK AT slot 3` → "$54.3 million. My planet chose this 4,297 years ago. We have not regretted it."
`> LOAD slot 2` → "You cannot load it from here. You have to earn it. That is rather the point of the game."

**Score**: `6,000,000,000` · **Inventory**: +`$15.7M CLAIM` (slot 7)

---

## ACT III — THE ENDGAME

### Under the Hood (8s)

*Segment*: `script-10-architecture` · *Component*: `architecture-stats` · *BG*: background

> "Under the hood: 15 packages, 2,600+ tests, domain-agnostic causal inference, full TypeScript monorepo. Storacha for immutable content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. Everything is auditable. Nothing relies on trusting us."

*Visual*: Pixel art — Wishonia's engineering bay / space station engine room. Five pixel monitors: (1) code scrolling — "15 PACKAGES", (2) green checkmarks cascading — "2,600+ TESTS", (3) blockchain viz — "SOLIDITY", (4) content-addressed blocks — "STORACHA", (5) hypercert badges — "HYPERCERTS." Wishonia in center with clipboard.

*Sierra verb*: `> LOOK AT source code` → "Open source. Auditable. Unlike your government's budget. Or their promises."
`> LOOK AT tests` → "2,600 tests. All passing. On my planet this is the bare minimum. Here it appears to be remarkable."

---

### 10.7 Billion Lives (10s)

*Segment*: `script-10b-lives` · *Component*: `lives-saved` · *BG*: cyan

> "150,000 deaths per day. 212 years of treatment acceleration from the combined trial capacity increase and efficacy lag elimination. A third of those deaths are avoidable with earlier cures. Multiply it out: 10.7 billion lives. More than the total number of humans who have ever lived in a single century. Every share, every vote, every conversation moves the probability. The question is not whether your effort matters. It is how many hundred million lives it is worth."

*Visual*: Pixel art — planet from the Cold Open returns, but transforming. Cemetery crosses being replaced one by one — each morphs into a tiny pixel person standing up, grey to green. Counter ticks: "LIVES SAVED: 10,700,000,000." Planet's palette shifts from EGA dark to VGA bright. Quest meters nearly full. Death ticker slowing.

*Sierra verb*: `> COUNT lives` → "More than the total number of humans who have ever lived. That is what is at stake. No pressure."

**Score**: `7,500,000,000`

---

### The Close (12s)

*Segment*: `script-11-close` · *Component*: `close` · *BG*: pink

> "Your governments are the most powerful artificial intelligences your species has ever built. They process more information, control more resources, and make more consequential decisions than any LLM. And they are misaligned."

*Visual*: Full planet view from space. Halfway transformed — bright continents where pixel people stand, dark where crosses remain. Death counter still ticking but slower. Stars twinkling. Wishonia's portrait shifts from sardonic to something approaching sincerity — the only time in the entire demo. Dramatic pause after "misaligned." Two seconds of just the image breathing.

**[Beat. Then:]**

> "The Earth Optimization Game. Alignment software for the most powerful AIs on your planet — the ones made of people."

*Visual*: Sierra title screen returns from the Earth Optimization Game slide — same gold font, same starfield. Score: `8,000,000,000 of 8,000,000,000`. Quest meters: 100%. All 8 inventory slots full and glowing. Final dialog:

```
┌─────────────────────────────────────────┐
│  C O N G R A T U L A T I O N S !       │
│                                         │
│  You have completed                     │
│  THE EARTH OPTIMIZATION GAME            │
│                                         │
│  Final score:  8,000,000,000            │
│  Lives saved:  all of them              │
│  HALE:         69.8 years ✓             │
│  Income:       $149,000 ✓              │
│  Time played:  3 minutes                │
│  Inventory:    8/8                       │
│                                         │
│  ┌────────────────────┐                 │
│  │    PLAY NOW →      │                 │
│  └────────────────────┘                 │
│                                         │
│  optimitron.com       github.com/...    │
└─────────────────────────────────────────┘
```

Music resolves to a single held chord. "PLAY NOW" pulses. Silence.

**Score**: `8,000,000,000`

---

### Post-Credits Easter Egg (5s)

*Segment*: `script-easter-egg` · *Component*: `easter-egg` · *BG*: foreground

**[2 seconds of black. UI chrome disappears. Total darkness. Then just the narrator box fades in:]**

> "Oh, and if you're wondering — yes, this is the actual game. You're playing it right now. The demo was level one."

*Visual*: Narrator text box on pure black. Wishonia's portrait: faintest smirk — one pixel of mouth moved upward. Cursor blinks. Nothing else. Hold 3 seconds, then fade.

---

## Sections Available in Other Playlists

| Section | Available In |
|---------|--------------|
| Agency report cards (every US agency graded) | `youtube-agency-grades` |
| Historical waste (War on Terror, War on Drugs) | `full-demo` |
| Government lies (Tuskegee, MK-Ultra, Gulf of Tonkin, WMDs) | `youtube-government-lies` |
| 50,300× cost-effectiveness vs bed nets | `investor` |
| Country comparisons (Singapore, Japan, body count) | `youtube-governments` |

---

## Technical Notes

### Sierra Implementation
- **Resolution**: 320×200 upscaled to 1920×1080 with nearest-neighbor (no smoothing)
- **Color palette**: EGA 16-color for Act I, VGA 256 for Acts II–III (palette upgrade IS the tonal shift at Wishonia)
- **Font**: Sierra bitmap for narrator box. Arcade font for headers/score/quest meters.
- **Text speed**: ~30 chars/sec typewriter. Click to skip.
- **Cursor**: Custom CSS — eye (look), hand (use), boots (walk), speech bubble (talk)
- **Sound**: Chiptune soundtrack. Death jingle for Game Over. "Cha-ching" for items. Rising pitch on quest meters.
- **Portrait**: Wishonia 48×48 pixel art, slightly animated (blinking, eyebrow, one smirk in post-credits)
- **Quest meters**: HALE + Income progress bars. Hidden Act I. Appear at Wishonia. Fill through Act II. 100% at completion.

### General
- Each slide is a full-viewport component — no scrolling, no page navigation
- `/demo?playlist=hackathon` plays all slides with auto-advance
- **Cold open**: Death ticker starts 3s before Sierra chrome appears
- **The Turn**: Moronia → Wishonia — death jingle → restore sound → EGA→VGA → quest meters appear
- **Title bookend**: "THE EARTH OPTIMIZATION GAME" in title screen (intro) and The Close (end)
- **Narrative ordering**: Never introduce a value before its mechanism. Prize pool → VOTE point value.
- **One concept per slide**: If a slide explains two things, split it.
- **Act II climax**: $15.7M personal upside is the LAST slide before Act III — it's the gut punch.
- **Post-credits**: Easter Egg plays after 2s black gap
- TTS narration via `packages/web/src/lib/demo-tts.ts`
- Politician leaderboard uses real data — the numbers are the joke
