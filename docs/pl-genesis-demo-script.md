# PL Genesis Hackathon — Demo Video Script

**Target length**: 3–4 minutes
**Tone**: Wishonia narrating (deadpan, data-first, dry, alien observer)
**Aesthetic**: Sierra Online adventure game (Space Quest IV–VI era) — pixel art scenes, narrator text boxes, point-and-click verbs, death screens, score counter
**Slides**: 25 (one concept per slide)
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

**Four persistent HUD elements:**

- **Score counter** (top-left): `0 of 8,000,000,000`. Ticks up as the game progresses. Represents "lives aligned."
- **Death ticker** (top-right): `☠ 150,000/day` — always counting, always visible, relentless. Red digits.
- **Quest meters** (mid-bar): Two progress bars showing current → target for HALE and Median Income. These are the *win conditions*. They start empty in Act I, fill as the plan is explained in Act II, and hit 100% on the completion screen. They answer the question "what does winning look like?"
- **Narrator text box** (bottom): Blue gradient box. Wishonia's pixel portrait on the left (48×48, slightly animated — blinking, occasional eyebrow raise). Narration text typewriter-animates character by character (~30 chars/sec, Sierra default).
- **Verb bar + Inventory** (bottom edge): Look / Use / Walk / Talk icons. 8 inventory slots that fill as the player collects items. Both decorative in auto-play, functional in interactive mode.
- **Cursor**: Sierra-style crosshair, changes contextually (eye, hand, boots, speech bubble). Tracks mouse to prove it's not a video.

### Score Progression

| Slide | Score | Why |
|-------|-------|-----|
| 1–6 (Act I) | 0 | Nothing has been done yet. Counter mocks the viewer. |
| 6 (Moronia) | `GAME OVER` | Score resets to 0. Death screen. |
| 7 (Wishonia) | `RESTORE GAME` | Score reappears. Quest meters appear for the first time. |
| 8 (The Fix) | 100,000 | First hint of progress. |
| 9 (Acceleration) | 1,000,000 | Momentum building. |
| 11 (Scoreboard) | 5,000,000 | Win conditions defined. Quest meters pulse. |
| 12 (Allocate) | 10,000,000 | Player engagement starts. |
| 13 (Vote) | 100,000,000 | Critical mass approaching. |
| 14 ($0.06) | 200,000,000 | The asymmetry clicks. |
| 15 (Get Friends to Play) | 500,000,000 | Network effect. |
| 16 (Prize) | 750,000,000 | Financial mechanism explained. |
| 17 ($194K/point) | 1,000,000,000 | NOW the value makes sense — pool is understood. |
| 18 (You Cannot Lose) | 1,500,000,000 | Both paths are green. |
| 19 ($15.7M) | 2,000,000,000 | Personal upside lands. |
| 20 (Leaderboard) | 4,000,000,000 | Accountability layer active. |
| 21 (Metric) | 6,000,000,000 | System reprogrammed. |
| 24–25 (Close) | 8,000,000,000 of 8,000,000,000 | Full alignment. "YOU HAVE WON." Quest meters hit 100%. |

### Inventory Items (collected as you progress)

Items appear in the 8 inventory slots as the player "picks them up." Each item has a distinct pixel-art icon and a one-line tooltip on hover.

| Slot | Acquired | Icon | Item | Tooltip |
|------|----------|------|------|---------|
| 1 | Slide 8 | 📜 scroll | `1% TREATY` | "Redirect 1% of military spending to clinical trials." |
| 2 | Slide 12 | 🗳 ballot | `ALLOCATION` | "Your preferred budget split." |
| 3 | Slide 13 | ✊ fist | `VOTE` | "Yes on the 1% Treaty." |
| 4 | Slide 15 | 🔗 chain | `REFERRAL LINK` | "Share with 2 friends. They share with 2 more." |
| 5 | Slide 16 | 🪙 gold coin | `PRIZE DEPOSIT` | "$100 deposited. Grows 11× even if targets missed." |
| 6 | Slide 17 | 🥈🥈 silver pair | `VOTE POINTS ×2` | "$194K each if targets are hit. Earned by getting friends to play." |
| 7 | Slide 19 | 📋 deed | `$15.7M CLAIM` | "Your lifetime income gain if the Treaty passes." |
| 8 | Slide 20 | 🔍 magnifier | `ALIGNMENT SCORE` | "See how your leaders rank vs your preferences." |

**Visual distinction between PRIZE and VOTE:**
- `PRIZE DEPOSIT` = **gold coin** (slot 5). You earn this by *depositing money*. Payoff if targets missed: 11× back.
- `VOTE POINTS` = **silver tokens** (slot 6). You earn these by *getting friends to play*. Payoff if targets hit: $194K/point. The more friends who play, the bigger the prize pool, the more everyone is incentivized to make sure humanity wins.
- A player can hold *both*. The worked example (slide 16) shows $100 deposited + 2 friends playing = both items in inventory.

---

## Pacing & Trailer Structure

**Act I — The Horror (slides 1–6, ~55s)**
Dark pixel art scenes. EGA 16-color palette. Ominous chiptune. The narrator describes terrible things in a calm, slightly amused tone. Score stays at 0. Quest meters are hidden — the player doesn't know what winning looks like yet. Each slide is 8–10s. Fast cuts.

**GAME OVER / RESTORE (slides 6–8)**
Moronia = death screen. Full Sierra "GAME OVER" with restore/restart/quit. Wishonia = restore from an alternate save file. Palette shifts from EGA 16 to VGA 256. Quest meters appear for the first time. The biggest tonal shift in the demo.

**Act II — The Quest (slides 8–21, ~130s)**
Brighter pixel art. VGA palette. Upbeat chiptune. Coin-collect sounds on inventory pickups. Score climbs. Quest meters fill. Each slide is 8–12s. Narrative arc:

```
THE PROBLEM         THE SOLUTION        THE MECHANISM         THE STAKES
Fix → Acceleration  Scoreboard targets  Allocate/Vote/Share  Prize → VOTE value
→ Pluralistic       → What winning      → $0.06 asymmetry    → Can't Lose → $15.7M
  Ignorance           looks like        → Doubling model      → Leaderboard → Metric
```

**Key ordering rule**: Never introduce a *value* before explaining the *mechanism that creates it*. Prize pool before VOTE point value. Treaty before personal upside.

**Act III — The Endgame (slides 22–25, ~45s)**
Score approaching max. Quest meters approaching 100%. Architecture credibility. Emotional close. Title card. Post-credits.

**Sound design:**
- Act I: Minor-key chiptune (SQ3 Monochrome Boys). Ticking clock undertone. Death ticker has a faint heartbeat pulse.
- Game Over: Sierra death jingle (dun-dun-dun-duuuun).
- Restore: Save-game "bwoing", then immediate bright major-key shift.
- Act II: Upbeat quest music (King's Quest VI village theme). "Cha-ching" on inventory pickups. Quest meter fill has a rising pitch.
- Act III: Full heroic chiptune theme building to resolution. Final chord sustains, then silence.

---

## ACT I — THE HORROR

### Slide 1 — Cold Open: Death Ticker (10s)

*Segment*: `script-0-cold-open` · *Component*: `death-count` · *BG*: foreground

**[3 seconds of black screen. Just the death counter ticking up. No narration. No context. No Sierra chrome yet — just red numbers on black, counting. Then the UI fades in around it.]**

> "150,000 humans die every day from diseases that are theoretically curable. That is fifty-nine September 11ths. But nobody invades anybody about it because cancer does not have oil."

*Visual*: Pixel art planet from space. The continents are rendered in dark EGA reds and greys — no green, no blue ocean, no signs of life. Tiny pixel crosses dot the land masses. The death counter dominates the center of the scene in large red pixel font, ticking relentlessly. The Sierra narrator box fades in below with Wishonia's portrait (neutral expression) and the narration typewriters in.

*Sierra verb*: `> LOOK AT planet` → "A Class-M planet experiencing a preventable extinction event. The inhabitants appear to be aware of this. They have chosen to do nothing."

---

### Slide 2 — Misaligned Superintelligence (10s)

*Segment*: `script-1a-misaligned` · *Component*: `terminal` · *BG*: foreground

> "Your government is a misaligned superintelligence. It controls trillions of dollars, billions of lives, and the allocation of your civilisation's entire productive capacity. And it is optimising for the wrong objective function."

*Visual*: Pixel art command bridge (SQ1 Sarien ship). Five CRT monitors arranged in a semicircle, each showing a different data stream: military contracts scrolling, pharma stock tickers, healthcare waitlist numbers climbing, a "CITIZEN REQUESTS" inbox with 0 read / 4,294,967,296 unread. The central monitor displays "OBJECTIVE FUNCTION: RE-ELECTION" in blinking green text. As the narration plays, the text glitches and "MISALIGNED SUPERINTELLIGENCE" overwrites it character by character. Scan lines roll across all screens.

*Sierra verb*: `> TALK TO computer` → "It does not respond. It has not responded to citizen input in approximately forty years."
`> USE keyboard` → "ACCESS DENIED. You are not a lobbyist."

---

### Slide 3 — The Earth Optimization Game (12s)

*Segment*: `script-1b-objective` · *Component*: `game-title` · *BG*: foreground

> "The objective of the Earth Optimisation Game is to optimally allocate Earth's finite resources. Move the budget from things that make you poorer and deader — like explosions — to the things that would make you vastly healthier and wealthier — like pragmatic clinical trials. That is the entire game. Reallocate. Everything else follows."

*Visual*: Full Sierra title screen, but with the game's core mechanic visible from the start. Black background, twinkling pixel stars. "THE EARTH OPTIMIZATION GAME" in gold-embossed Sierra bitmap font, centered. Below the title, an animated pixel-art allocation slider — a horizontal bar with a pixel explosion icon (💥) on the left end and a pixel test tube icon (🧪) on the right. The slider handle sits almost entirely on the left (current allocation: 99% explosions). As the narration says "move the budget," an animated hand drags the slider one notch rightward (to 98%). A tiny "+$27B → CURES" label pops up. The bar barely moves — but the test tube icon pulses brighter.

Below the slider: "A Point-and-Click Adventure in Civilisational Reallocation." A blinking "PRESS START" prompt at the bottom.

The slider immediately tells the viewer: this game is about dragging resources from one end to the other. That's it. That's the game.

*Sierra verb*: `> USE common sense ON government` → "I don't think that works here."
`> DRAG slider` → "You have just reallocated $27 billion from explosions to cures. The military did not notice. The sick did."

---

### Slide 4 — 604:1 (8s)

*Segment*: `script-2b-ratio` · *Component*: `military-pie` · *BG*: foreground

> "Your governments currently spend $604 on the capacity for mass murder for every $1 they spend testing which medicines work. Your chance of dying from terrorism: 1 in 30 million. Your chance of dying from disease: 100%."

*Visual*: Pixel art — a Sierra-style scale/balance in the center of the screen. Left pan: overflowing with pixel missiles, tanks, jets, and bombs — the pan has crashed to the floor, bending the scale. Right pan: a single tiny pixel test tube floating near the ceiling. Above the scale in pixel font: "$2,720,000,000,000" (left) vs "$4,500,000,000" (right). Below the scale, a pixel-art pie chart where the clinical trials slice is literally one pixel wide — you can barely see it. The legend reads: "MILITARY: 99.83%" / "CLINICAL TRIALS: 0.17%."

*Sierra verb*: `> LOOK AT tiny pile` → "That is the entire global clinical trials budget. Try not to blink or you'll miss it."
`> USE test tube` → "You cannot. It is being crushed by $2.72 trillion of military hardware."

---

### Slide 5 — The Clock (10s)

*Segment*: `script-2c-clock` · *Component*: `collapse-clock` · *BG*: foreground

> "The parasitic economy — cybercrime, rent-seeking, military spending — grows at 15% per year. The productive economy grows at 3%. In 15 years, it becomes more rational to steal than to produce. This is the clock."

*Visual*: Pixel art — a stone castle wall (King's Quest aesthetic) with a massive clock face in the center. But the clock has two hands racing: a red hand labeled "PARASITIC (15%/yr)" spinning fast, and a green hand labeled "PRODUCTIVE (3%/yr)" crawling behind. Below the clock, a pixel-art line chart shows the two trajectories crossing — red overtaking green — with a flashing "X" at the intersection point labeled "2040: COLLAPSE THRESHOLD." A digital countdown timer ticks in the corner: "YEARS REMAINING: 14 yrs 247 days 8 hrs..." The background darkens as the narration progresses.

*Sierra verb*: `> USE time machine` → "You don't have one. That's rather the point."
`> LOOK AT clock` → "Every civilisation that reached this threshold collapsed. Soviet Union. Yugoslavia. Argentina. Zimbabwe. You are next unless you change the trajectory."

---

### Slide 6 — Moronia: GAME OVER (10s)

*Segment*: `script-3a-moronia` · *Component*: `moronia` · *BG*: foreground

> "Moronia was a planet that spent 604 times more on weapons than on curing disease. It no longer exists. Their allocation ratio correlates with yours at 94.7%."

*Visual*: Pixel art — a barren, cracked planet surface. Red-black sky. Shattered buildings. Leafless pixel trees. Craters. No movement except ash particles drifting. This is what 16-color despair looks like. After the narration finishes, the screen FREEZES. The Sierra death jingle plays (dun-dun-dun-duuuun). The image desaturates to greyscale. The classic death dialog box drops in from the top:

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

Score resets to `0`. The death counter *keeps ticking* — it doesn't stop for Game Over.

---

## THE TURN — RESTORE GAME

### Slide 7 — Wishonia: RESTORE FROM ALTERNATE SAVE (10s)

*Segment*: `script-3b-wishonia` · *Component*: `wishonia-slide` · *BG*: cyan

**[The cursor moves to "RESTORE" and clicks. The death dialog dissolves. A save-game file browser slides in:]**

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

**[Cursor clicks "wishonia_year_0.sav". A "bwoing" restore sound. Then:]**

> "Wishonia redirected 1% of its murder budget to clinical trials 4,297 years ago. That is where I am from. It is considerably nicer."

*Visual*: INSTANTANEOUS hard cut to lush pixel art paradise. The palette explodes from EGA 16-color to VGA 256. Bright cyan sky with fluffy pixel clouds. Green rolling hills. Gleaming pixel cities with visible parks and hospitals (no military bases). Pixel birds fly across the screen. Rivers flow. The health/happiness meters in the HUD bar are both maxed — green, full, glowing. The quest meters (HALE / Income) appear for the FIRST TIME, empty, pulsing gently: "these are what you need to fill."

Score reappears. Inventory is empty. The quest begins.

---

## ACT II — THE QUEST

### Slide 8 — The Fix (10s)

*Segment*: `script-4a-fix` · *Component*: `one-percent-shift` · *BG*: yellow

> "The fix is not complicated. Redirect 1% of global military spending — $27 billion a year — to clinical trials. That is going from spending 99% on bombs to 98% on bombs. Radical, I know."

*Visual*: Pixel art — Wishonia's control room. A massive wall-mounted lever with a pixel display showing "MILITARY: 99%" / "CURES: 1%". An animated pixel hand reaches in from the right and nudges the lever exactly one notch. The display updates: "MILITARY: 98%" / "CURES: 2%." The lever barely moves — the slot it clicks into is one pixel different from where it was. A comic "that's it?" pause. Then a pixel-art scroll labeled "1% TREATY" materializes and drops into inventory slot 1 with a "cha-ching" sound. The quest meter for INCOME nudges slightly.

*Sierra verb*: `> USE lever` → "You nudge it 1%. The military-industrial complex does not notice. Twenty-seven billion dollars just got redirected and nobody felt a thing."

**Score**: `100,000` · **Inventory**: +`1% TREATY` (slot 1)

---

### Slide 9 — 12.3× Acceleration (10s)

*Segment*: `script-4b-acceleration` · *Component*: `trial-acceleration` · *BG*: cyan

> "This would increase clinical trial capacity by 12.3 times. It would compress the time to cure all diseases from 443 years to 36 years. The maths is not in dispute."

*Visual*: Pixel art — two side-by-side hourglass contraptions on a workshop bench. Left hourglass is enormous, labeled "STATUS QUO" with a plaque reading "443 YEARS" and a tiny trickle of sand. Right hourglass is compact, labeled "1% TREATY" with a plaque reading "36 YEARS" and sand pouring in a visible stream — 12× faster. An animated pixel scientist stands between them, pointing at the right one and shrugging as if to say "obviously." A multiplier badge animates in: "×12.3 CAPACITY." The HALE quest meter fills slightly.

*Sierra verb*: `> LOOK AT left hourglass` → "443 years. Your grandchildren's grandchildren's grandchildren would still be waiting."
`> LOOK AT right hourglass` → "36 years. Most of you would live to see it. If you started today."

**Score**: `1,000,000`

---

### Slide 10 — Pluralistic Ignorance (10s)

*Segment*: `script-4c-ignorance` · *Component*: `pluralistic-ignorance` · *BG*: background

> "The problem is not that nobody wants this. The problem is that everybody wants it but thinks nobody else will agree to it. This is called pluralistic ignorance, and it is your civilisation's most expensive bug."

*Visual*: Pixel art — a town square (King's Quest village). Thirty tiny pixel villagers standing around, each with a green ✓ thought bubble above their head. But each villager is turned away from the others, arms crossed, looking at the ground — they can't see anyone else's thought bubble. One villager in the center has a yellow `!` quest marker floating above them (the player's avatar). The thought bubbles are visible to the viewer but not to the villagers. A Sierra info box in the corner reads: "BUG REPORT: pluralistic_ignorance.exe — Status: ACTIVE — Cost: $101T/year."

*Sierra verb*: `> TALK TO crowd` → "They all want the same thing. They just don't know they all want the same thing. Your job is to make the demand visible."

---

### Slide 11 — The Scoreboard: Quest Objectives (10s)

*Segment*: `script-4d-scoreboard` · *Component*: `quest-objectives` · *BG*: background

**[A quest notification pops Sierra-style: "QUEST OBJECTIVES REVEALED"]**

> "The entire game comes down to two numbers. Healthy life expectancy: currently 63.3 years, target 69.8. Median income: currently $18,700, target $149,000. Move these two numbers and everything else follows. That is the scoreboard. Everything on this site exists to move it."

*Visual*: Pixel art — a large Sierra-style quest log/journal, open on a wooden desk. Two quest objectives are written in ornate pixel handwriting:

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

The quest meters in the persistent HUD pulse and glow — the viewer now understands what they're tracking. They start at 0% and will fill throughout the rest of the demo.

*Sierra verb*: `> READ quest log` → "Two numbers. That is all. Your species has made this extraordinarily complicated. It is not."

**Score**: `5,000,000`

---

### Slide 12 — Level 1: Allocate (15s)

*Segment*: `script-5a-allocate` · *Component*: `level-allocate` · *BG*: yellow

**[Quest notification drops in: "⚔ LEVEL 1 — Allocate your civilisation's resources."]**

> "Step one: allocate. You see two budget categories. Drag the slider toward the one you'd spend more on. Explosions or pragmatic clinical trials. Ten comparisons. Your choices build a complete budget allocation using eigenvector decomposition — the same maths your species invented in 1977 and mostly uses to rank American football teams."

*Visual*: Pixel art — the screen is divided into a Sierra "duel" layout. This plays like an RPG battle, but the combatants are budget categories:

**TOP HALF — The Matchup (animated, 3 rounds shown):**

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

A big horizontal slider sits between the two cards. The cursor grabs the slider handle and drags it firmly toward CLINICAL TRIALS. A green burst animates. "COMPARISON 1 of 10 ✓" appears.

Round 2 snaps in: "MILITARY BASES vs DISEASE RESEARCH" — slider dragged right again.
Round 3 snaps in: "FIGHTER JETS vs HOSPITAL BEDS" — slider dragged right again.
Each round takes ~1 second. The speed sells the "this is fast" message.

**BOTTOM HALF — Your Allocation Builds in Real-Time:**

A pixel-art horizontal bar chart grows from left to right. With each comparison, a new bar extends or adjusts — you can see your budget allocation taking shape as you play. After 3 rounds, the chart already shows: "Clinical Trials: 31% · Education: 22% · Infrastructure: 18% · Military: 4%..." The bars have different pixel colors (cyan for health, yellow for education, pink for infrastructure, red for military — shrinking).

A final text flashes: "10 comparisons. 2 minutes. You just designed a coherent national budget." A ballot item drops into inventory slot 2.

*Sierra verb*: `> DRAG slider` → "Interesting. You'd rather cure cancer than build a ninth aircraft carrier. Your politicians may want to take notes."
`> LOOK AT allocation chart` → "Eigenvector decomposition. Stable preference weights from ten comparisons. Your species invented this in 1977. Used it for football. We use it for civilisation."

**Score**: `10,000,000` · **Inventory**: +`ALLOCATION` (slot 2)

---

### Slide 13 — Level 2: Vote on the Treaty (12s)

*Segment*: `script-5b-vote` · *Component*: `level-vote` · *BG*: pink

> "Step two: the 1% Treaty Referendum. Should all governments redirect 1% of military spending to pragmatic clinical trials? Yes or no. One click. Thirty seconds. This is the question that changes the allocation."

*Visual*: Pixel art — the screen dims to a spotlight. Everything fades except a single, oversized Sierra dialog box in the center. This is the most important dialog box in the game:

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
│                                                  │
│       ┌──────────┐         ┌──────────┐          │
│       │   YES    │         │    NO    │          │
│       └──────────┘         └──────────┘          │
│                                                  │
└──────────────────────────────────────────────────┘
```

The cursor hovers over YES. Dramatic pause — 1.5 seconds of silence. Clicks.

**CELEBRATION SEQUENCE (2 seconds):**
The dialog box explodes outward with pixel confetti. A fanfare plays. The score counter jumps from 10M to 100M in a rapid tick-up animation. A pixel banner drops from the top: "VOTE RECORDED ✓". The allocation bar from slide 3 (the one in the title screen) visually nudges one tick rightward — the global slider moved because *you* voted.

A raised-fist item drops into inventory slot 3 with a triumphant sound.

Then — immediately — a new Sierra dialog slides in from the right, setting up the next beat:

```
┌────────────────────────────────────────┐
│  🎉 YOU'RE IN THE GAME!               │
│                                        │
│  Player #4,847 of 268M needed          │
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

This transitions directly into the next slide — the link is now in hand.

*Sierra verb*: `> CLICK yes` → "Congratulations. You have just done more for civilisation than most parliaments manage in a decade."
`> CLICK no` → "Interesting. You prefer the current ratio of 604 dollars on explosions per dollar on cures. The narrator judges you silently."

**Score**: `100,000,000` · **Inventory**: +`VOTE` (slot 3)

---

### Slide 14 — $0.06 (10s)

*Segment*: `script-5b2-asymmetry` · *Component*: `asymmetry` · *BG*: foreground

> "That vote took thirty seconds. At the global average hourly income, your time cost six cents. The upside if the Treaty passes: fifteen point seven million dollars. Per person. That is an upside-to-downside ratio of two hundred and forty-five million to one. Your species calls this a no-brainer. On my planet we just call it arithmetic."

*Visual*: Pixel art — a Sierra merchant's shop. Wishonia stands behind a wooden counter in merchant robes. On the left side of the counter: a single tiny copper pixel coin on a velvet pad, labeled "$0.06" with subtext "30 seconds of your time." On the right side: a comically enormous pile of gold that extends off-screen in every direction, labeled "$15,700,000" with subtext "lifetime income gain." A pixel trade arrow connects them. Above the counter, in flashing pixel text: "EXCHANGE RATE: 245,000,000 : 1." Wishonia's portrait in the narrator box has one eyebrow raised.

*Sierra verb*: `> TRADE 30 seconds FOR $15.7 million` → "The merchant stares at you. 'This is the most lopsided trade in the history of commerce. And I have been trading for 4,297 years.'"
`> HAGGLE` → "There is nothing to haggle. The trade is already infinitely in your favour."

**Score**: `200,000,000`

---

### Slide 15 — Level 3: Get All Your Friends to Play (15s)

*Segment*: `script-5c-share` · *Component*: `level-share` · *BG*: yellow

**[Quest notification: "⚔ LEVEL 3 — Get your friends to play. Tell two people."]**

> "Step three: get all your friends to play. Send them your link. When they play through your link, you earn one VOTE point. They get their own link and do the same. Tell two friends. They each tell two more. Twenty-eight rounds of this reaches 268 million players — the 3.5% tipping point. No campaign in history that reached this threshold has ever failed. And every new player who deposits grows the prize pool — which makes everyone more incentivized to make sure humanity actually wins."

*Visual*: Pixel art — split into two halves.

**LEFT HALF — The Concrete Action:**
A pixel-art phone screen showing a text message thread. The player's message reads: "Play this → optimitron.com/r/player1". Two pixel chat bubbles appear from friends — "Sarah" and "Mike" — each showing "🎮 I'm playing! My link: .../r/sarah" and "🎮 I'm playing! My link: .../r/mike." Notifications pop: "+1 VOTE POINT" then "+1 VOTE POINT." The player now has 2 points.

Below the phone, three platform icons — text message, WhatsApp, Twitter — showing the share action. This is the concrete "how" — not abstract theory, but *texting your friend a URL and watching them join the game*.

**RIGHT HALF — The Exponential Effect:**
The doubling tree grows upward from the phone. One person → 2 → 4 → 8 → 16. The tree accelerates, branches splitting faster and faster. Generation counter ticks: "Round 5: 32... Round 10: 1,024... Round 15: 32,768... Round 20: 1,048,576..." The tree fills the right half of the screen. A horizontal red line labeled "TIPPING POINT: 268M PLAYERS (3.5%)" flashes when the tree hits it. Below the tree, a pixel-art prize pool counter grows in lockstep — "PRIZE POOL: $10K... $1M... $100M... $10B..." — the pool inflates as the player count rises. Text: "28 rounds. 8 months. The more people play, the bigger the prize pool, the more everyone has at stake."

A chain-link item drops into inventory slot 4.

*Sierra verb*: `> TEXT sarah` → "'Play this game.' Sarah opens the link. Plays. Gets her own link. Sends it to two more friends. The prize pool just grew. Your VOTE points just got more valuable."
`> LOOK AT prize pool` → "Every new player who deposits makes the pool bigger. A bigger pool means more incentive for everyone to make sure the targets are hit. This is called a virtuous cycle. Your species usually creates the other kind."

**Score**: `500,000,000` · **Inventory**: +`REFERRAL LINK` (slot 4)

---

### Slide 16 — The Prize Pool: The Biggest Pot in History (15s)

*Segment*: `script-6-prize` · *Component*: `prize-worked-example` · *BG*: pink

> "Step four: deposit into the Earth Optimization Prize Pool. The goal is to build the biggest prize pool in the history of the planet — so that every player on Earth is insanely incentivized to make sure humanity actually wins. The pool is not sitting in a savings account. It is invested across the most innovative startup companies on Earth — achieving 17% annual growth. Your retirement fund is parked in sclerotic rent-seeking corporations earning 8%. The prize pool outperforms it by double. So move a portion of your retirement savings into the pool. You were going to invest that money anyway. Invest it here, where the returns are better AND the side effect is curing all disease."

*Visual*: Pixel art — a Sierra merchant's investment counter with two options displayed side by side:

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
│  Every deposit grows the pool. A bigger pool means   │
│  more incentive for every player to make Earth win.  │
└──────────────────────────────────────────────────────┘
```

The right option glows green. The left option looks grey and dull. A gold coin drops into inventory slot 5 as the player "deposits." Below the comparison, a pixel-art flywheel diagram spins: "More deposits → bigger pool → stronger incentive → more players → more deposits."

*Sierra verb*: `> DEPOSIT gold coin` → "The chest grows. Your money is now invested in companies that are actually building the future, instead of companies that are extracting rent from the past. Also, the side effect is saving civilisation. Your retirement fund cannot say that."
`> COMPARE returns` → "8% in a retirement fund versus 17% in the prize pool. Your financial advisor will not tell you about this because your financial advisor works for the 8% companies."

**Score**: `750,000,000` · **Inventory**: +`PRIZE DEPOSIT` (slot 5)

---

### Slide 17 — $194K Per Point (10s)

*Segment*: `script-6b-vote-value` · *Component*: `vote-point-value` · *BG*: cyan

> "Now for the VOTE points. Every friend you got to play earned you one point. Each point is worth $194,000 if the targets are hit. Two friends playing: $387,000. Ten friends: $1.9 million. Points cannot be bought. They can only be earned by getting real people to play the game. The more friends you bring in, the bigger the prize pool gets, the more valuable everyone's points become. This is not a referral bonus. It is an incentive to build the biggest coordination game on Earth."

*Visual*: Pixel art — a Sierra character stats/equipment screen. The player's pixel avatar stands on the left with their inventory visible. On the right, a detailed stats panel:

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

Two silver pixel tokens drop into inventory slot 6 with a double coin-collect sound. The bottom line of the stats panel — "More players → bigger pool → bigger prize → more incentive to make sure Earth wins" — is the flywheel, rendered as a pixel-art cycle arrow.

*Sierra verb*: `> LOOK AT points` → "Non-transferable. Non-purchasable. Earned by getting friends to play. The game gets more valuable the more people are in it. That is not a bug. It is the design."
`> SELL points` → "They cannot be sold. If they could be bought, the rich would own the game. The only way to earn them is to get another human being to care. That is the point."

**Score**: `1,000,000,000` · **Inventory**: +`VOTE POINTS ×2` (slot 6)

---

### Slide 18 — You Cannot Lose (12s)

*Segment*: `script-6c-free-option` · *Component*: `prize-free-option` · *BG*: yellow

> "But wait — if humanity wins, doesn't my deposit go to VOTE holders instead of back to me? Yes. And here is why that is fine. First: get even two friends to play and you have VOTE points worth $387,000 — far more than your deposit. Second: if humanity wins, everyone is 10× richer. Your $100 deposit vanishes into a world where your lifetime income just increased by $15.7 million. You do not mourn the $100. You are too busy being a multimillionaire in a civilisation that cured all disease. The break-even probability is one in fifteen thousand. The only way to lose is not to play."

*Visual*: Pixel art — a Sierra summary/stats screen, but now with THREE green paths instead of two:

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
│  │     Still outperforms your retirement fund (3.2×)│  │
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
│  Break-even probability: 0.007%                       │
│  (one in fifteen thousand)                            │
│  Your lottery ticket odds: 1 in 300,000,000           │
│  This is 20,000× better odds with no downside.        │
└───────────────────────────────────────────────────────┘
```

The first ✅ box is the biggest — it glows brightest green, because this is the BEST outcome. The "Your deposit: goes to VOTE holders (not you)" line is present but immediately overwhelmed by "+$15.7 MILLION" and "Everyone is 10× richer." The second ✅ box is solid green. The ❌ box is dim red with a "-$15,700,000" in stark text — not losing money, but losing the OPPORTUNITY. The opportunity cost is the real loss.

*Sierra verb*: `> CALCULATE odds` → "One in fifteen thousand. Your species buys lottery tickets at one in three hundred million. This is twenty thousand times better odds. And the downside scenario is still 11× your money."
`> WORRY ABOUT deposit` → "Your deposit goes to VOTE holders if humanity wins. You also got $15.7 million richer. On my planet we call this a good trade."

**Score**: `1,500,000,000`

---

### Slide 19 — Your $15.7 Million (10s)

*Segment*: `script-7-personal-upside` · *Component*: `personal-upside` · *BG*: pink

> "If the 1% Treaty passes, your lifetime income gains are $15.7 million. Per person. Not per country. Per person. You currently lose $12,600 a year to political dysfunction — that is your share of the $101 trillion bug. This is not philanthropy. This is the largest investment opportunity in the history of your species. And the cost of not playing is $15.7 million."

*Visual*: Pixel art — three Sierra save-game slots, each showing a tiny pixel scene preview and stat lines. This is the "choose your timeline" screen:

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

Each slot has a tiny pixel-art scene that matches its trajectory — grey/smoggy for status quo, bright/green for Treaty, gleaming/utopian for Wishonia. A glowing deed drops into inventory slot 7.

*Sierra verb*: `> LOOK AT slot 1` → "Status quo. $1.34 million lifetime income. You are losing $12,600 a year to a system bug."
`> LOOK AT slot 3` → "$54.3 million. My planet chose this 4,297 years ago. We have not regretted it."
`> LOAD slot 2` → "You cannot load it from here. You have to earn it. That is rather the point of the game."

**Score**: `2,000,000,000` · **Inventory**: +`$15.7M CLAIM` (slot 7)

---

### Slide 20 — The Leaderboard (10s)

*Segment*: `script-8-leaderboard` · *Component*: `government-leaderboard` · *BG*: background

> "Every politician ranked by the ratio of spending they have voted for: mass murder capacity versus clinical trial funding. A single number. Public. Immutable. On-chain."

*Visual*: Pixel art — a Sierra high-score table rendered on an ornate wooden frame (like an inn's notice board in King's Quest). Title bar: "ALIGNMENT HIGH SCORES." Each row has: a pixel country flag, a politician name, and an alignment score rendered as a pixel bar graph. The top rows have green bars (high alignment). The bottom rows have red bars (low alignment). The table scrolls slowly upward, revealing more entries. Country flags are recognizable 8×8 pixel versions. Column headers: "RANK / NATION / LEADER / ALIGNMENT SCORE / MILITARY:TRIALS RATIO."

A magnifying glass drops into inventory slot 8.

*Sierra verb*: `> LOOK AT leaderboard` → "Some of these scores are impressively low. It takes real commitment to be this misaligned."
`> SORT BY worst` → "Sorting by worst score. The competition for last place is fierce."

**Score**: `4,000,000,000` · **Inventory**: +`ALIGNMENT SCORE` (slot 8). Inventory is now FULL.

---

### Slide 21 — We Changed the Metric (8s)

*Segment*: `script-8b-metric` · *Component*: `metric-changed` · *BG*: foreground

> "Your leaders are not evil. They are just optimising for the wrong metric. We changed the metric."

*Visual*: Pixel art — close-up of the high-score table from slide 20, zoomed in on the column headers. The header "RE-ELECTION PROBABILITY" is visible. A pixel red X slashes through it with an animation. A new column header typewriters in beside it: "CITIZEN ALIGNMENT SCORE." The numbers in the column scramble and resettle — rankings shuffle. Some politicians rise; others fall. The top-ranked entry blinks green.

Single devastating line in the narrator box. Maximum whitespace. Let it breathe. The narrator text typewriters slower than usual here — each word lands.

**Score**: `6,000,000,000`

---

## ACT III — THE ENDGAME

### Slide 22 — Under the Hood (10s)

*Segment*: `script-10-architecture` · *Component*: `architecture-stats` · *BG*: background

> "Under the hood: 15 packages, 2,600+ tests, domain-agnostic causal inference, full TypeScript monorepo. Storacha for immutable content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. Everything is auditable. Nothing relies on trusting us."

*Visual*: Pixel art — Wishonia's engineering bay / space station engine room. Five pixel monitors in a row, each showing a different system: (1) code scrolling — "15 PACKAGES", (2) green checkmarks cascading — "2,600+ TESTS PASSING", (3) a blockchain visualization — "SOLIDITY CONTRACTS", (4) content-addressed blocks linking — "STORACHA STORAGE", (5) hypercert badges stacking — "HYPERCERTS." A pixel-art Wishonia stands in the center pointing at the monitors with a clipboard. Below, inventory-style item cards in a grid list the tech stack.

*Sierra verb*: `> LOOK AT source code` → "Open source. Auditable. Unlike your government's budget. Or their promises."
`> LOOK AT tests` → "2,600 tests. All passing. On my planet this is the bare minimum. Here it appears to be remarkable."

---

### Slide 23 — 10.7 Billion Lives (8s)

*Segment*: `script-10b-lives` · *Component*: `lives-saved` · *BG*: cyan

> "10.7 billion lives saved over the acceleration window. 5.65 billion disability-adjusted life years per percentage point you shift the probability. Every share, every vote, every conversation moves that number. The question is not whether your effort matters. It is how many hundred million lives it is worth."

*Visual*: Pixel art — the planet from slide 1 returns, but transforming. The cemetery crosses that covered the continents are being replaced one by one — each cross morphs into a tiny pixel person standing up, turning from grey to green. A counter in the center ticks upward: "LIVES SAVED: 10,700,000,000." The number is so large it fills the Sierra stat box edge to edge. The planet's color palette slowly shifts from EGA dark tones to the VGA bright tones of Wishonia. The quest meters are nearly full. The death ticker in the HUD is slowing.

*Sierra verb*: `> COUNT lives` → "More than the total number of humans who have ever lived. That is what is at stake. No pressure."

**Score**: `7,000,000,000`

---

### Slide 24 — The Close (12s)

*Segment*: `script-11-close` · *Component*: `close` · *BG*: pink

> "Your governments are the most powerful artificial intelligences your species has ever built. They process more information, control more resources, and make more consequential decisions than any LLM. And they are misaligned."

*Visual*: Pixel art — full planet view, pulled back to space. The planet is now halfway transformed — some continents bright and alive (where the pixel people stand), others still dark (where crosses remain). The death counter is still ticking, but visibly slower. Stars twinkle. Wishonia's portrait in the narrator box shifts from sardonic to something approaching sincerity — the only time in the entire demo. Dramatic pause after "misaligned." Two seconds of just the image breathing.

**Score**: `7,500,000,000`

---

### Slide 25 — Title Drop (8s)

*Segment*: `script-11b-title` · *Component*: `title-drop` · *BG*: foreground

> "The Earth Optimization Game. Alignment software for the most powerful AIs on your planet — the ones made of people."

*Visual*: The Sierra title screen from slide 3 returns — same gold-embossed font, same starfield, same composition. But everything has changed. The score now reads `8,000,000,000 of 8,000,000,000`. The quest meters show 100% on both HALE and Income. All 8 inventory slots are full and glowing. The final dialog box drops in:

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
│  optimitron.com    github.com/...     │
└─────────────────────────────────────────┘
```

Music resolves to a single held chord. The "PLAY NOW" button pulses. Then silence.

---

### Slide 26 — Post-Credits Easter Egg (5s)

*Segment*: `script-easter-egg` · *Component*: `easter-egg` · *BG*: foreground

**[2 seconds of black. The UI chrome disappears. Total darkness. Then just the narrator box fades in on black:]**

> "Oh, and if you're wondering — yes, this is the actual game. You're playing it right now. The demo was level one."

*Visual*: Just the narrator text box on pure black. Wishonia's pixel portrait has the faintest smirk — one pixel of mouth moved upward. A cursor blinks at the end of the text. Nothing else. Hold for 3 seconds, then fade.

---

## Extended Slides (5-min version)

These slides slot in after slide 21 for a longer cut. They add the financial infrastructure, cost-effectiveness evidence, and policy tools — important for investors and Protocol Labs judges, but too dense for the 3-minute hook.

### Slide E1 — 50,300× More Cost-Effective (10s)

*Segment*: `ext-cost-effectiveness` · *BG*: background

> "The cost per disability-adjusted life year for this campaign is $0.00177. Bed nets — the gold standard of cost-effective intervention — cost $89 per DALY. This is 50,300 times more cost-effective. Even if you adjust for political uncertainty at 1% success probability, it is still 503 times more cost-effective than bed nets. The maths is not ambiguous."

*Visual*: Pixel art — a Sierra shop comparison screen. Two items displayed on a merchant counter with price tags:

```
┌────────────────────────────────────────────────┐
│  COST-EFFECTIVENESS SHOP                       │
│                                                │
│  ┌──────────────────┐  ┌────────────────────┐  │
│  │ 🪰 BED NETS      │  │ 📜 1% TREATY       │  │
│  │                  │  │                    │  │
│  │ $89 / DALY      │  │ $0.00177 / DALY    │  │
│  │ ★★★★★           │  │ ★ × 50,300         │  │
│  │ "Gold standard"  │  │ "New standard"     │  │
│  └──────────────────┘  └────────────────────┘  │
│                                                │
│  The Treaty is 50,300× more cost-effective.    │
│  Risk-adjusted (1% prob): still 503×.          │
└────────────────────────────────────────────────┘
```

*Sierra verb*: `> BUY bed nets` → "Excellent choice. Now buy 50,300 of them. Or just fund one treaty campaign."

---

### Slide E2 — Incentive Alignment Bonds (15s)

*Segment*: `ext-iab` · *BG*: cyan

> "Now for the part your lobbyists really won't enjoy. Incentive Alignment Bonds. Sell one billion dollars of these. Use the proceeds to fund the 1% Treaty campaign. Create a Special Purpose Vehicle that receives treaty inflows — 1% of military spending per year, $27 billion annually. Distribute: 80% to clinical trials, 10% to bond holders, 10% to a SuperPAC."

*Visual*: Pixel art — a Sierra merchant screen. A pixel NPC labeled "IAB TRADER" stands behind an ornate counter. A flow diagram rendered as an item crafting recipe: `BONDS ($1B)` + `TREATY PASSED` → three output slots: `80% CLINICAL TRIALS ($21.6B)` + `10% BOND HOLDERS ($2.7B)` + `10% SUPERPAC ($2.7B)`. Each output has a tiny pixel icon.

*Sierra verb*: `> BUY bonds FROM merchant` → "A wise investment. The campaign costs one billion. The treaty generates twenty-seven billion per year. Indefinitely."

---

### Slide E3 — The SuperPAC (10s)

*Segment*: `ext-superpac` · *BG*: pink

> "The SuperPAC funds politicians algorithmically — based on their Citizen Alignment Score. Politicians earn campaign funding by voting for the treaty and increasing the reallocation. Not by attending donor dinners."

*Visual*: Pixel art — the leaderboard from slide 20, but now pixel gold coins are raining from the top of the screen. They flow to the highest-ranked politicians — more coins for higher scores. The lowest-ranked politicians receive nothing; their slots dim. Where a lobbyist character would normally stand, there's a pixel gear/brain icon labeled "SMART CONTRACT." A crossed-out pixel lobbyist sits in the corner, holding an empty dinner invitation.

*Sierra verb*: `> TALK TO lobbyist` → "The lobbyist has been replaced by a smart contract. It does not accept dinner invitations. Or bribes. Or phone calls."

---

### Slide E4 — Optimal Policy Tools (12s)

*Segment*: `ext-policy-tools` · *BG*: yellow

> "For the politicians who want to align: the Optimal Budget Generator and Optimal Policy Generator. Time-series data across hundreds of jurisdictions — which policies actually increased median income and healthy life years. Not which policies were popular. Which ones worked. All free. All open. All citable."

*Visual*: Pixel art — a King's Quest VI puzzle room. Three machines on a workbench: (1) "POLICY GENERATOR" with an input slot reading "INSERT JURISDICTION" and an output slot producing a pixel scroll, (2) "BUDGET OPTIMIZER" with dials and a bar chart display, (3) "OUTCOME COMPARATOR" showing two pixel city scenes side by side with stats. Wishonia stands nearby with a wrench, maintaining the machines. Pixel charts on the wall show before/after comparisons across jurisdictions.

*Sierra verb*: `> USE policy generator` → "It analyses what actually worked. A novel concept for your species."
`> INSERT jurisdiction` → "Generating optimal policy recommendations. This will take approximately four seconds. Your legislature takes approximately four years."

---

## Sections Cut from All Versions

| Section | Why Cut | Available In |
|---------|---------|--------------|
| Agency report cards | Long-form evidence — YouTube series | `youtube-agency-grades` playlist |
| Historical waste (War on Terror, War on Drugs) | Supporting evidence — too detailed for pitch | `full-demo` playlist |
| Viral doubling model (detailed) | Math detail — better as its own video | `youtube-prize` playlist |
| $WISH token / UBI mechanics | Separate financial instrument — own video | `youtube-treasury` playlist |
| FDA invisible graveyard | Deep evidence — too heavy for pitch | `full-demo` playlist |
| Government lies (Tuskegee, MK-Ultra, etc.) | Powerful but off-topic for hackathon | `youtube-government-lies` playlist |

---

## Technical Notes

### Sierra Implementation
- **Resolution**: Render pixel art at 320×200 (authentic), upscale to 1920×1080 with nearest-neighbor (no smoothing)
- **Color palette**: EGA 16-color for Act I (slides 1–6), VGA 256-color for Acts II–III (the palette upgrade IS the tonal shift at slide 7)
- **Font**: Sierra-style bitmap font for narrator box text. Arcade font for headers/score/quest meters.
- **Text speed**: Typewriter animation at ~30 chars/sec (Sierra default). Player can click to skip.
- **Cursor**: Custom CSS cursors — eye (look), hand (use), walk (boots), talk (speech bubble)
- **Sound**: Chiptune soundtrack. Sierra death jingle for Game Over. "Cha-ching" for inventory items. Rising pitch on quest meter fills.
- **Portrait**: Wishonia pixel art portrait (48×48 minimum) — slightly animated (blinking, occasional eyebrow raise, one smirk in the post-credits)
- **Quest meters**: Two horizontal progress bars (HALE + Income) always visible. Fill incrementally as solutions are presented. Hit 100% only on the completion screen.

### General
- Record at 1080p minimum
- Each slide is a full-viewport component — no scrolling, no page navigation
- The `/demo?playlist=hackathon` URL plays all slides in sequence with auto-advance
- **Cold open**: Slide 1 death ticker starts counting 3s BEFORE Sierra chrome appears
- **The Turn**: Moronia → Wishonia (slide 6 → 7) — death jingle → restore sound → EGA→VGA palette shift → quest meters appear
- **Title bookend**: "THE EARTH OPTIMIZATION GAME" appears in slide 3 (intro) and slide 25 (close)
- **Narrative ordering rule**: Never introduce a value before the mechanism that creates it (Prize pool → VOTE point value, not the reverse)
- **Post-credits**: Slide 26 plays after a 2s black gap — reward for people who don't click away
- Collapse countdown ticks in real-time (slide 5)
- TTS narration generated per-segment via `packages/web/src/lib/demo-tts.ts`
- Politician leaderboard uses real data — the numbers are the joke
