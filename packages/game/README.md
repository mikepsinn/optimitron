# PL Genesis Hackathon — Demo Video Script

**Target length**: 3–4 minutes
**Tone**: Wishonia narrating (deadpan, data-first, dry, alien observer)
**Aesthetic**: Sierra Online adventure game (Space Quest IV–VI era) — pixel art scenes, narrator text boxes, point-and-click verbs, death screens, score counter
**Slides**: ~50 (one concept per slide — count may change as we iterate)

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

- **Score counter (top-left)**: 0 of 8,000,000,000. Ticks up as the game progresses. Represents "lives aligned."
- **Death ticker (top-right)**: ☠ 150,000/day — always counting, always visible, relentless. Red digits.
- **Quest meters (mid-bar)**: Two progress bars showing current → target for HALE and Median Income. Hidden in Act I. Appear at The Turn (Wishonia). Fill through Act II. Hit 100% on completion screen.
- **Narrator text box (bottom)**: Blue gradient box. Wishonia's pixel portrait on the left (48×48, slightly animated — blinking, occasional eyebrow raise). Narration text typewriter-animates character by character (~30 chars/sec).
- **Verb bar + Inventory (bottom edge)**: Look / Use / Walk / Talk icons. 8 inventory slots that fill as the player collects items. Decorative in auto-play, functional in interactive mode.
- **Cursor**: Sierra-style crosshair, changes contextually (eye, hand, boots, speech bubble). Tracks mouse to prove it's not a video.

---

## Pacing & Trailer Structure

**Act I — The Horror (slides 1–9, ~80s)**
Dark pixel art scenes. EGA 16-color palette. Ominous chiptune. Score stays at 0. Quest meters hidden. Each slide is 8–10s. Fast cuts. Escalating dread.

**GAME OVER / RESTORE (slides 9–10)**
Moronia = death screen. Wishonia = restore from alternate save. EGA→VGA palette shift. Quest meters appear.

**Act II — The Quest**
VGA palette. Upbeat chiptune. Score climbs. Inventory fills.

**Act III — The Endgame (~1.5 min)**
Score approaching max. 10.7B lives (emotional scale) → Close → Easter egg.

**Sound design:**
- Act I: Minor-key chiptune. Ticking clock undertone. Death ticker has a faint heartbeat pulse.
- Game Over: Sierra death jingle (dun-dun-dun-duuuun).
- Restore: Save-game "bwoing", then immediate bright major-key shift.
- Act II: Upbeat quest music. "Cha-ching" on inventory pickups. Quest meter fill has a rising pitch.
- Act III: Full heroic chiptune theme building to resolution. Final chord sustains, then silence.

---
## Score Progression

| Slide | Score | Why |
|-------|-------|-----|
| act1-all | 0 | Nothing has been done yet. Counter mocks the viewer. |
| moronia | 0 | Score resets to 0. Death screen. |
| wishonia | 0 | Score reappears. Quest meters appear. |
| the-fix | 100,000 | First hint of progress. |
| acceleration | 1,000,000 | Momentum building. |
| scoreboard | 5,000,000 | Win conditions defined. Quest meters pulse. |
| allocate | 10,000,000 | Player engagement starts. |
| vote | 100,000,000 |  |
| asymmetry | 200,000,000 | The asymmetry clicks. |
| get-friends | 500,000,000 | Network effect. |
| prize-investment | 650,000,000 | Better than your retirement fund. |
| prize-mechanism | 800,000,000 | Two paths, both green. |
| vote-point-value | 1,000,000,000 | NOW the value makes sense. |
| cannot-lose | 1,500,000,000 | All three scenarios laid out. |
| leaderboard | 3,000,000,000 |  |
| changed-metric | 4,000,000,000 |  |
| personal-upside | 6,000,000,000 | Act II climax. Personal upside lands. |
| close | 8,000,000,000 | Full alignment. "YOU HAVE WON." |

---
## Inventory Items

| Slot | Acquired At | Icon | Item | Tooltip |
|------|-------------|------|------|---------|
| 1 | the-fix | 📜 scroll | `1% TREATY` | "Redirect 1% of military spending to clinical trials." |
| 2 | allocate | 🗳 ballot | `ALLOCATION` | "Your preferred budget split." |
| 3 | vote | ✊ fist | `VOTE` | "Yes on the 1% Treaty." |
| 4 | get-friends | 🔗 chain | `REFERRAL LINK` | "Share with 2 friends. They share with 2 more." |
| 5 | prize-mechanism | 🪙 gold-coin | `PRIZE DEPOSIT` | "$100 deposited. Earning 17%/yr. Grows 11× even if targets missed." |
| 6 | vote-point-value | 🥈 silver-pair | `VOTE POINTS ×2` | "$194K each if targets are hit. Earned by getting friends to play." |
| 7 | personal-upside | 📋 deed | `$15.7M CLAIM` | "Your lifetime income gain if the Treaty passes." |
| 8 | leaderboard | 🔍 magnifier | `ALIGNMENT SCORE` | "See how your leaders rank vs your preferences." |

---

## ACT I — THE HORROR

### cold-open (10s)

**[[3 seconds of black screen. Just the death counter ticking up. No narration. No Sierra chrome yet — just red numbers on black, counting. Then the UI fades in around it.]]**

> "Bugs in your meat software kill 150,000 of you every day. That is fifty-nine September 11ths. Nobody invades anybody about it because cancer does not have oil."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `BUGS IN YOUR MEAT SOFTWARE` | label, red | fadeIn |
| `KILL` | medium, red | fadeIn |
| `150,000` | giant, red | countUp |
| `OF YOU EVERY DAY` | medium, red | fadeIn |
| 59 🏢 THAT IS 59 SEPTEMBER 11THS. | small, red | stagger |
| `NOBODY INVADES ANYBODY ABOUT IT` | small, red | fadeIn |
| `BECAUSE CANCER DOES NOT HAVE OIL.` | small, red | fadeIn |
| 💀 | small | stagger |

*Visual*: Black background. The text reads like a deadpan alien dispatch: "BUGS IN YOUR MEAT SOFTWARE / KILL / 150,000 / OF YOU EVERY DAY." The counter is brutally large. Below it, 59 tower emojis fill in one by one — the 9/11 comparison becomes spatial, not just a number. The punchline lands as text: "NOBODY INVADES ANYBODY ABOUT IT / BECAUSE CANCER DOES NOT HAVE OIL." Skulls drift down and pile up at the bottom. No decorative elements. No world map. Just the data and the joke.

*Sierra verb*: `> LOOK AT planet` → "A Class-M planet experiencing a preventable extinction event. The inhabitants appear to be aware of this. They have chosen to do nothing."

---

### governments-are-ai (12s)

> "Your government is an artificial intelligence. Not a metaphor. You built a system to protect and promote your general welfare (i.e. health and wealth). Instead it optimises for campaign contributions."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `OBJECTIVE FUNCTION: PROMOTE GENERAL WELFARE` | medium, green | typewriter |
| `OBJECTIVE FUNCTION: RE-ELECTION / CAMPAIGN CONTRIBUTIONS / WEALTH EXTRACTION` | medium, red | glitch |
| `CITIZEN REQUESTS: 0 read / 4,294,967,296 unread` | small, red |  |

*Visual*: Pixel art command bridge (SQ1 Sarien ship). Five CRT monitors in a semicircle. Central monitor displays "OBJECTIVE FUNCTION: PROMOTE GENERAL WELFARE" in green text — then glitches, flickers, and rewrites to "OBJECTIVE FUNCTION: RE-ELECTION / CAMPAIGN CONTRIBUTIONS / WEALTH EXTRACTION" in red. Side monitors show: military contracts scrolling, pharma stock tickers, healthcare waitlist numbers climbing, a "CITIZEN REQUESTS" inbox with 0 read / 4,294,967,296 unread. Scan lines roll.

*Sierra verb*: `> EXAMINE objective function` → "OBJECTIVE: PROMOTE GENERAL WELFARE. STATUS: OVERWRITTEN. CURRENT OBJECTIVE: MAXIMIZE RE-ELECTION PROBABILITY. This was not a bug. It was a feature request from the lobbyists."

---

### war-spending (10s)

> "Since 1913, your governments have printed $170 trillion and used it to kill 97 million of you in wars nobody asked you if you wanted to have. On my planet, we call that a bug. Your species calls it foreign policy."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `$170,000,000,000,000` | giant, red | countUp |
| `CUMULATIVE MILITARY SPENDING SINCE 1913` | label, red |  |
| `97,000,000 DEAD` | large, red | countUp |

```
┌─────────────────────────────────────────────┐
│  📋 EXPENSE REPORT — EARTH (1913-2026)       │
│                                             │
│  ITEM                          AMOUNT       │
│  ─────────────────────────────────────      │
│  Wars nobody asked for         $170T        │
│  People killed                 97,000,000   │
│  People who voted for this     0            │
│  Refunds issued                0            │
│                                             │
│  STATUS: Foreign policy                     │
│  (on other planets: a bug)                  │
└─────────────────────────────────────────────┘
```

*Visual*: Same command bridge. One monitor displays a CountUp from $0 to $170,000,000,000,000 labeled "CUMULATIVE MILITARY SPENDING SINCE 1913." Another scrolls a list of wars with death tolls ticking upward, totaling 97,000,000. The central monitor pulses: "MISALIGNED OBJECTIVE FUNCTION — RUNNING."

*Sierra verb*: `> TALK TO computer` → "It does not respond. It has not responded to citizen input in approximately forty years."
*Sierra verb*: `> USE keyboard` → "ACCESS DENIED. You are not a lobbyist."

---

### paycheck-heist (10s)

> "Your dollar has lost 96% of its value since 1913. If your wages had kept pace with productivity, the median family would earn $528,000. The actual number is $77,500. The difference funded wars and bailed out banks. Your species calls this 'monetary policy.' I call it the longest heist in history."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `PURCHASING POWER: 100% → 4%` | medium, red | fadeIn |
| `$528,000 — IF WAGES KEPT PACE` | large, gold | fadeIn |
| `$77,500 — ACTUAL` | large, red | fadeIn |

```
┌─────────────────────────────────────────────┐
│  🔍 CRIME SCENE REPORT                      │
│                                             │
│  CRIME: Theft of purchasing power           │
│  DURATION: 113 years                        │
│  METHOD: Printing money very slowly         │
│                                             │
│  WHAT YOU SHOULD EARN:    $528,000          │
│  WHAT YOU ACTUALLY EARN:  $77,500           │
│  AMOUNT STOLEN:           $450,500/yr       │
│                                             │
│  SUSPECTS: Central banks                    │
│  ARRESTS: 0                                 │
│  STATUS: Still in progress                  │
│                                             │
│  DETECTIVE NOTES:                           │
│  "Nobody noticed because it took a century" │
└─────────────────────────────────────────────┘
```

*Visual*: Same command bridge. A monitor shows a dollar bill dissolving pixel by pixel — "PURCHASING POWER: 100% → 4%." Another shows two pay stubs side by side: ghost image "$528,000 — IF WAGES KEPT PACE" and real "$77,500 — ACTUAL." The gap is enormous. Pixel arrows show where the difference went.

*Sierra verb*: `> LOOK AT paycheck` → "$77,500. Your species calls this a 'good salary.' It is 15% of what it would be if your central bank had not spent a century funding wars with your purchasing power."
*Sierra verb*: `> FILE charges` → "Against whom? They run the courts too."

---

### game-title (12s)

> "This is the Earth Optimisation Game. The rules are simple. Move the budget from the things that make you poorer and deader to the things that make you healthier and wealthier. That is the entire game. Your species has been playing the opposite version for 10,000 years. You are not winning."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `THE EARTH OPTIMIZATION GAME` | giant, gold | fadeIn |
| `💥 99% EXPLOSIONS |──────────| 🧪 1% CURES` | medium | fadeIn |
| `+$27B → CURES` | label, green | fadeIn |
| `A Point-and-Click Adventure in Civilisational Reallocation` | small | fadeIn |
| `PRESS START` | medium | pulse |

*Visual*: Full Sierra title screen with the game's core mechanic visible from the start. Black background, twinkling pixel stars. "THE EARTH OPTIMIZATION GAME" in gold-embossed Sierra bitmap font, centered. Below the title, an animated pixel-art allocation slider — a horizontal bar with a pixel explosion icon on the left end and a pixel test tube icon on the right. The slider handle sits almost entirely on the left (current: 99% explosions). As the narration says "move the budget," an animated hand drags the slider one notch rightward (to 98%). A tiny "+$27B → CURES" label pops up. The bar barely moves — but the test tube icon pulses brighter. Below the slider: "A Point-and-Click Adventure in Civilisational Reallocation." Blinking "PRESS START" at the bottom.

*Sierra verb*: `> USE common sense ON government` → "I don't think that works here."
*Sierra verb*: `> DRAG slider` → "You have just reallocated $27 billion from explosions to cures. The military did not notice. The sick did."

---

### ratio-604 (8s)

> "Your governments currently spend $604 on the capacity for mass murder for every $1 they spend testing which medicines work. Your chance of dying from terrorism: 1 in 30 million. Your chance of dying from disease: 100%."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `$2,720,000,000,000 — MILITARY` | giant, red | countUp |
| `$4,500,000,000 — CLINICAL TRIALS` | small, green | fadeIn |
| `604 : 1` | giant, red | countUp |
| `CHANCE OF DYING FROM TERRORISM: 1 in 30,000,000` | small | fadeIn |
| `CHANCE OF DYING FROM DISEASE: 100%` | medium, red | fadeIn |

*Visual*: Pixel art — animated zoom sequence. Start: a towering stack of pixel coins fills the entire screen top to bottom, labeled "$2,720,000,000,000 — MILITARY." The camera zooms in on the bottom-right corner — deeper, deeper — until a single pixel coin becomes visible at 64× magnification, labeled "$4,500,000,000 — CLINICAL TRIALS." Pause. Then snap-zoom back out to full scale. The single coin disappears into the mass. The CountUp component animates the ratio from 1:1 racing to 604:1. Below, MilitaryVsTrialsPie renders — the clinical trials slice is literally one pixel wide.

*Sierra verb*: `> LOOK AT tiny pile` → "That is the entire global clinical trials budget. Try not to blink or you'll miss it."
*Sierra verb*: `> USE test tube` → "You cannot. It is being crushed by $2.72 trillion of military hardware."

---

### clock (10s)

> "Your parasitic theft economy is growing five times faster than your building economy. In 15 years, it becomes more rational to steal than to produce. Your species has a word for this. Several, actually. Somalia. Venezuela. Argentina. This is the clock."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `PARASITIC ECONOMY: 15%/yr` | medium, red | pulse |
| `PRODUCTIVE ECONOMY: 3%/yr` | medium, green | fadeIn |
| `2040: COLLAPSE THRESHOLD` | large, red | pulse |
| `YEARS REMAINING: 14 yrs 247 days 8 hrs` | small | countUp |

*Visual*: Pixel art — stone castle wall (King's Quest aesthetic) with a massive clock face. Two hands racing: red "PARASITIC (15%/yr)" spinning fast, green "PRODUCTIVE (3%/yr)" crawling behind. Below, a pixel-art line chart shows the two trajectories crossing — red overtaking green — with a flashing "X" at "2040: COLLAPSE THRESHOLD." Digital countdown ticks: "YEARS REMAINING: 14 yrs 247 days 8 hrs..."

*Sierra verb*: `> USE time machine` → "You don't have one. That's rather the point."
*Sierra verb*: `> LOOK AT clock` → "Every civilisation that reached this threshold collapsed. Soviet Union. Yugoslavia. Argentina. Zimbabwe. You are next unless you change the trajectory."

---

### failed-state (10s)

> "When stealing pays better than building, everyone steals. Somalia. Venezuela. Lebanon. This is not a theory. It is a travel itinerary. And your planet is booking tickets."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `SOMALIA. VENEZUELA. LEBANON.` | medium, red | fadeIn |
| `WHEN DESTRUCTION > PRODUCTION: GLOBAL FAILED STATE` | large, red | fadeIn |

*Visual*: Pixel art — a Sierra city scene, but decaying in real-time. The scene starts as a functioning pixel town (shops, roads, people walking). As the narration progresses, pixel-art decay spreads: storefronts board up, pixel thieves appear on rooftops, roads crack, a hospital's red cross sign flickers and dies, pixel people flee offscreen or huddle in corners. The palette desaturates toward the Moronia greys. In the corner, a world map shows red spreading from a few countries to all continents. Text overlay: "WHEN DESTRUCTION > PRODUCTION: GLOBAL FAILED STATE."

*Sierra verb*: `> LOOK AT city` → "Somalia but everywhere. Venezuela but permanent. Lebanon but with no neighbouring country to flee to."
*Sierra verb*: `> HELP` → "There is no help command in a failed state. That is what makes it a failed state."

---

### ai-spiral (10s)

> "Your species built AI that writes code. Then criminals used it to write theft code. The theft funds more AI. The AI writes more theft code. A feedback loop your species would recognise if it ever read its own computer science papers. You automated robbery. Congratulations."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `AI HACKERS: 1... 2... 4... 1,024... 1,048,576...` | medium, red | countUp |
| `STEAL $$$ → BUY COMPUTE → TRAIN MORE HACKERS` | small, red | typewriter |
| `RECURSIVE EXPONENTIAL THEFT` | large, red | pulse |

```
┌──→ STEAL $$$  ──→ BUY COMPUTE ──→ TRAIN MORE HACKERS ──┐
│                                                          │
└──────────────────────────────────────────────────────────┘
RECURSIVE EXPONENTIAL THEFT
```

*Visual*: Pixel art — a dark server room (SQ-style villain lair). A single pixel-art robot hacker sits at a terminal. It splits into two. Those two split into four. The screen fills with multiplying hacker bots. A counter ticks: "AI HACKERS: 1... 2... 4... 1,024... 1,048,576... ∞." Below, a loop diagram animates: STEAL $$$ → BUY COMPUTE → TRAIN MORE HACKERS → (repeat). The loop spins faster and faster. The stolen amount counter ticks up. The productive economy bar from The Clock shrinks visibly in the HUD.

*Sierra verb*: `> LOOK AT hackers` → "Each one creates two more. The doubling model, but for destruction."
*Sierra verb*: `> UNPLUG server` → "You cannot unplug a distributed botnet. That is rather the point of distributed systems."

---

### moronia (10s)

> "Moronia was a planet that spent 604 times more on weapons than on curing disease. It no longer exists. Their allocation ratio correlates with yours at 94.7%."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `G A M E   O V E R` | giant, red | fadeIn |
| `Moronia allocated 604× more to weapons than curing disease.` | medium | fadeIn |
| `Correlation with Earth: 94.7%.` | medium, red | fadeIn |
| `RESTORE` | medium | fadeIn |
| `RESTART` | medium | fadeIn |
| `QUIT` | medium | fadeIn |

```
┌─────────────────────────────────────┐
│          G A M E   O V E R          │
│                                     │
│  Moronia allocated 604× more to     │
│  weapons than curing disease.       │
│                                     │
│  Correlation with Earth: 94.7%.     │
│                                     │
│  CONTINUE?  INSERT 604 COINS        │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌──────┐  │
│  │ RESTORE │ │ RESTART │ │ QUIT │  │
│  │ [LOCKED]│ │ [LOCKED]│ │  ◄◄  │  │
│  └─────────┘ └─────────┘ └──────┘  │
│                                     │
│  There is no restart for an         │
│  extinct civilisation.              │
└─────────────────────────────────────┘
```

*Visual*: Pixel art — barren, cracked planet surface. Red-black sky. Shattered buildings. Leafless pixel trees. Craters. Ash drifting. After narration, screen FREEZES. Sierra death jingle plays. Image desaturates to greyscale. Death dialog drops in with GAME OVER, three buttons: RESTORE / RESTART / QUIT. Score resets to 0. Death counter keeps ticking.

---


## THE TURN — RESTORE GAME

### The Turn

### wishonia (10s)

**[[Cursor moves to "RESTORE" and clicks. Death dialog dissolves. Save-game file browser slides in. Clicks "wishonia_year_0.sav". "Bwoing" restore sound.]]**

> "Wishonia redirected 1% of its murder budget to clinical trials 4,297 years ago. That is where I am from. It is considerably nicer."

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

*Visual*: INSTANTANEOUS hard cut. Palette explodes from EGA 16-color to VGA 256. Bright cyan sky, fluffy pixel clouds, green rolling hills, gleaming pixel cities with parks and hospitals (no military bases). Pixel birds fly. Rivers flow. Health/happiness meters maxed. Quest meters (HALE / Income) appear for the FIRST TIME, empty, pulsing gently. Score reappears. Inventory is empty. The quest begins.

---


## ACT II — THE QUEST

### Part 1: The Solution

### the-fix (10s)

> "Redirect 1% of the global murder budget to clinical trials. That is $27 billion a year. That is going from 99% bombs to 98% bombs. The explosion manufacturers keep 99% of their budget and do not even notice."

*Visual*: Pixel art — Wishonia's control room. Massive wall-mounted lever with display: "MILITARY: 99%" / "CURES: 1%". Animated pixel hand nudges it one notch. Display updates: "MILITARY: 98%" / "CURES: 2%." The slot is one pixel different. Comic "that's it?" pause. Pixel-art scroll "1% TREATY" drops into inventory slot 1 with "cha-ching." Quest meter for INCOME nudges slightly.

*Sierra verb*: `> USE lever` → "You nudge it 1%. The explosion manufacturers do not notice. Twenty-seven billion dollars just got redirected and nobody felt a thing."

**Score**: `100,000` · **Inventory**: +`1% TREATY` (slot 1)

---

### acceleration (10s)

> "Right now, at current spending, curing all known diseases takes 443 years. Redirect 1% of the murder budget, and clinical trial capacity increases 12.3 times. 443 years compresses to 36. Your great-great-great-great-great-great-great-great grandchildren just sent their thanks."

*Visual*: Pixel art — two hourglasses on a workshop bench. Left: enormous, "STATUS QUO", plaque "443 YEARS", tiny sand trickle. Right: compact, "1% TREATY", plaque "36 YEARS", sand pouring 12x faster. Pixel scientist between them, pointing at right one, shrugging. Multiplier badge: "x12.3 CAPACITY." HALE quest meter fills slightly.

*Sierra verb*: `> LOOK AT left hourglass` → "443 years. Your grandchildren's grandchildren's grandchildren would still be waiting."
*Sierra verb*: `> LOOK AT right hourglass` → "36 years. Most of you would live to see it. If you started today."

**Score**: `1,000,000`

---

### roi-comparison (8s)

> "Healthcare spending returns three times more economic activity per dollar than your murder budget. Your species has not noticed this because the murder budget has a better lobby."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `HEALTHCARE: $1 IN → $1.80 OUT` | large, green | fadeIn |
| `MILITARY: $1 IN → $0.60 OUT` | large, red | fadeIn |

```
┌─────────────────────────────────────────────┐
│  📊 RETURN ON INVESTMENT                     │
│                                             │
│  HEALTHCARE                                 │
│  $1 in → $1.80 out                         │
│  ████████████████████ 180%                  │
│  Side effect: people alive                  │
│                                             │
│  MILITARY                                   │
│  $1 in → $0.60 out                         │
│  ████████████░░░░░░░░  60%                  │
│  Side effect: people dead                   │
│                                             │
│  Your species chose the bottom one.         │
│  604 times.                                 │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — two side-by-side investment windows. Left: MILITARY with a shrinking bar graph and coins falling into a pit. Right: HEALTHCARE with a growing bar graph and coins multiplying. The contrast is immediate and absurd.

*Sierra verb*: `> LOOK AT returns` → "One makes money. One loses money. Your species chose the one that loses money. Six hundred and four times more of it."

**Score**: `1,300,000`

---

### virtuous-loop (10s)

> "Disease drags down 13% of global GDP. Fifteen trillion dollars a year. Every disease you cure unlocks a permanent slice of that. Freed workers produce more. More production funds more trials. More trials cure more diseases. Your species calls this a virtuous cycle. You have mostly been running the vicious version."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `13% OF GLOBAL GDP LOST TO DISEASE` | large, red | fadeIn |
| `$15,000,000,000,000 / YEAR` | medium, red | countUp |

```
┌─────────────────────────────────────────────┐
│  🔄 THE LOOP                                 │
│                                             │
│  ┌──→ CURE DISEASE                          │
│  │         │                                │
│  │         ▼                                │
│  │    UNLOCK 13% GDP ($15T/yr)              │
│  │         │                                │
│  │         ▼                                │
│  │    MORE WORKERS ALIVE → MORE TAX         │
│  │         │                                │
│  │         ▼                                │
│  │    BIGGER TRIAL BUDGET                   │
│  │         │                                │
│  └─────────┘  (repeat until no disease)     │
│                                             │
│  YOUR SPECIES VERSION:                      │
│  ┌──→ FUND MILITARY ──→ KILL PEOPLE ──┐     │
│  │         ──→ LESS GDP ──→ LESS TAX  │     │
│  │              ──→ PANIC ────────────┘     │
│  (repeat until no civilisation)             │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — The Marble Run (animated feedback loop). A pixel-art circular track with four stations. A glowing pixel marble rolls clockwise through: CURE DISEASES → UNLOCK GDP → MORE TAX REVENUE → BIGGER BUDGET → back to CURE DISEASES. Each cycle the marble gets bigger and moves faster. Below, a second loop in red shows the vicious version: FUND MILITARY → KILL PEOPLE → LESS GDP → PANIC → FUND MILITARY.

*Sierra verb*: `> LOOK AT loop` → "Every disease cured makes the economy bigger. A bigger economy funds more cures. More cures make it bigger still. It is almost as if spending money on keeping people alive is better for the economy than spending money on making them dead."

**Score**: `1,500,000`

---

### twenty-year-gap (10s)

> "At current trajectory, your economy grows at 2.5%. Redirect 1% of the explosions budget, and it compounds at 17.9%. Over twenty years, that is the difference between $12,500 per person and $339,000 per person. Same planet. Same people. Same twenty years."

```
┌─────────────────────────────────────────────┐
│  📈 20-YEAR FORECAST                         │
│                                             │
│  YEAR    STATUS QUO (2.5%)   TREATY (17.9%) │
│  ────    ────────────────    ────────────── │
│  2026    $12,500             $12,500        │
│  2030    $13,800             $24,200        │
│  2035    $15,600             $53,400        │
│  2040    $17,700             $149,000       │
│  2045    $20,100             $339,000       │
│                                             │
│  DIFFERENCE: $318,900 per person            │
│  CAUSE: moving a slider 1%                  │
│                                             │
│  Same planet. Same people.                  │
│  Different slider position.                 │
└─────────────────────────────────────────────┘
```

*Visual*: Live GDP Trajectory Chart. A year counter ticks from 2025 to 2045. Two lines draw in real-time: Grey (Status Quo, 2.5%): barely rising. Green (Treaty, 17.9%): steep climb. By year 20, the green line is so far above grey that the chart rescales — the grey line flattens to a hair at the bottom.

*Sierra verb*: `> COMPARE trajectories` → "Same planet. Same people. Same twenty years. The only difference is where you point the money. $12,500 versus $339,000."

**Score**: `1,800,000`

---

### compound-punchline (8s)

> "Compound interest does not care about your politics. It does not care about your party. The confidence interval is 11 to 26%. Even the worst case is four times better than doing nothing. Your species has been arguing about this for decades. The math resolved it in one equation."

```
┌─────────────────────────────────────────────┐
│  🧮 WHAT COMPOUND INTEREST THINKS            │
│     ABOUT YOUR POLITICS                     │
│                                             │
│  Best case (26%):   $1,160,000 / person     │
│  Expected (17.9%):  $339,000 / person       │
│  Worst case (11%):  $81,000 / person        │
│  Do nothing (2.5%): $20,100 / person        │
│                                             │
│  ┌───────────────────────────────────┐      │
│  │ WORST CASE IS 4× BETTER THAN     │      │
│  │ DOING NOTHING                     │      │
│  └───────────────────────────────────┘      │
│                                             │
│  Math consulted: yes                        │
│  Politicians consulted: not required        │
└─────────────────────────────────────────────┘
```

*Visual*: A single clean display showing four outcomes stacked vertically. The worst-case bar is dramatically larger than the do-nothing bar. A highlighted box pulses: WORST CASE IS 4x BETTER THAN DOING NOTHING.

*Sierra verb*: `> CONSULT politician` → "The politician has opinions. The math has answers. These are not the same thing."

**Score**: `2,000,000`

---

### the-bug (8s)

> "Everyone wants this. Everyone thinks nobody else wants it. So nobody does anything. Your species identified this bug, named it, taught it in universities, and then continued to be governed by it for sixty years."

```
┌─────────────────────────────────────────────┐
│  🐛 BUG: pluralistic_ignorance               │
│                                             │
│  PERSON 1: "I want this" (thinks: only me)  │
│  PERSON 2: "I want this" (thinks: only me)  │
│  PERSON 3: "I want this" (thinks: only me)  │
│  PERSON 4: "I want this" (thinks: only me)  │
│  ...                                        │
│  PERSON 8,000,000,000: "I want this"        │
│                (thinks: only me)             │
│                                             │
│  RESULT: Nobody does anything.              │
│                                             │
│  YEAR DISCOVERED:     1965                  │
│  YEARS SINCE:         61                    │
│  STATUS:              still governing you   │
│  PATCH AVAILABLE:     yes (see next slide)  │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — town square (King's Quest village). Thirty pixel villagers, each with a green checkmark thought bubble. But each is turned away, arms crossed, looking at the ground — can't see anyone else's bubble. One villager in center has yellow ! quest marker (the player). The thought bubbles are visible to the viewer but not to the villagers.

*Sierra verb*: `> TALK TO crowd` → "They all want the same thing. They just don't know they all want the same thing. Your job is to make the demand visible."

---

### the-mismatch (8s)

> "The public holds $454 trillion in wealth. The concentrated special interests who run your government hold $5 trillion. You outnumber them 90 to 1. You are not outgunned. You are just not coordinated."

```
┌─────────────────────────────────────────────┐
│  ⚔️ BATTLE REPORT                            │
│                                             │
│  YOU (the public)        THEM (lobbyists)   │
│  ─────────────────       ───────────────    │
│  8,000,000,000 people    ~50,000 people     │
│  $454 trillion           $5 trillion        │
│  Want: health + wealth   Want: your money   │
│                                             │
│  RATIO: 90 : 1                              │
│                                             │
│  CURRENT STATUS:                            │
│  They are winning.                          │
│                                             │
│  REASON:                                    │
│  They have a group chat.                    │
│  You do not.                                │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra battle screen. On the left: a massive army of pixel villagers stretching to the horizon, labeled 8 BILLION. On the right: a tiny cluster of pixel lobbyists in suits, labeled ~50,000. The ratio is absurd. The lobbyists are winning anyway.

*Sierra verb*: `> LOOK AT odds` → "You have ninety times their money and ninety times their numbers. They have a group chat. That is the entire difference."

---

### dysfunction-tax (10s)

> "Your civilisation wastes $101 trillion a year on problems everyone agrees should be fixed but nobody coordinates to fix. That is 88% of global GDP. This bug has been open for 113 years. No one has assigned it. On my planet, that developer would have been fired. On yours, they got re-elected."

```
┌──────────────────────────────────────────┐
│  🐛 BUG REPORT: pluralistic_ignorance.exe │
│  Status: ACTIVE                          │
│  Severity: CRITICAL                      │
│                                          │
│  Health innovation delays:  $34T         │
│  Migration restrictions:    $57T         │
│  Lead poisoning:             $6T         │
│  Underfunded science:        $4T         │
│  ─────────────────────────────           │
│  TOTAL ANNUAL COST:        $101T         │
│  (88% of global GDP)                     │
│                                          │
│  This bug has been open for 113 years.   │
│  No one has assigned it.                 │
│                                          │
│  COMMENTS (3):                           │
│  @earth (1913): "We should fix this"     │
│  @earth (1960): "Bump. Still broken."    │
│  @earth (2026): "Closing as wont-fix"    │
└──────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra bug report / system error screen. The screen flickers like a CRT crash. A bug report window displays: BUG REPORT: pluralistic_ignorance.exe, Status: ACTIVE, Severity: CRITICAL. Line items animate in one at a time with CountUp — Health innovation delays: $34T, Migration restrictions: $57T, Lead poisoning: $6T, Underfunded science: $4T. A running total at the bottom counts up in lockstep: $0... $34T... $91T... $97T... $101T. TOTAL ANNUAL COST: $101T. The final total pulses. "88% of global GDP" flashes red. "This bug has been open for 113 years. No one has assigned it." typewriters in last — the punchline.

*Sierra verb*: `> FIX bug` → "That is what the game is for."
*Sierra verb*: `> ASSIGN bug` → "You just did. You are player #4,847."

---

### scoreboard (10s)

**[[Quest notification: "QUEST OBJECTIVES REVEALED"]]**

> "The entire game comes down to two numbers. Healthy life expectancy: 63.3 years, target 69.8. Median income: $18,700, target $149,000. Your species has produced 4,000 pages of UN resolutions about these numbers. This game has two progress bars. We find the bars more effective."

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

*Visual*: Pixel art — large Sierra quest log/journal open on a wooden desk. OBJECTIVE 1: HEALTHY LIFE EXPECTANCY — Current: 63.3 years, Target: 69.8 years (+6.5), Progress bar at 0%. OBJECTIVE 2: GLOBAL MEDIAN INCOME — Current: $18,700/year, Target: $149,000/year (8x), Progress bar at 0%. DEADLINE: 2040 (14 years). REWARD: 8,000,000,000 lives aligned. Quest meters in HUD pulse and glow — the viewer now understands what they're tracking. Current values pull live from WHO (HALE) and World Bank (median income). The progress bars animate from empty to their current % of target. The deadline CountUps the remaining days in real-time.

*Sierra verb*: `> READ quest log` → "Two numbers. That is all. Your species has made this extraordinarily complicated. It is not."

**Score**: `5,000,000`

---

### Part 2: The Game

### allocate (10s)

**[[Quest notification: "LEVEL 1 — Allocate your civilisation's resources."]]**

> "You see two budget categories. Drag the slider toward the one you prefer. Explosions or curing disease. Ten comparisons. Two minutes."

```
┌──────────────────────────────────────────────────┐
│  ⚔️ BUDGET BATTLE — ROUND 1 of 10                │
│                                                  │
│  ┌──────────────────┐  VS  ┌──────────────────┐ │
│  │  💥 EXPLOSIONS    │      │  🧪 CLINICAL      │ │
│  │                  │      │     TRIALS        │ │
│  │  $2,720,000,000, │      │  $4,500,000,000   │ │
│  │  000 / year      │      │  / year           │ │
│  │                  │      │                   │ │
│  │  ROI: -$0.40     │      │  ROI: +$0.80      │ │
│  │  Side effect:    │      │  Side effect:     │ │
│  │  death           │      │  not death        │ │
│  └──────────────────┘      └──────────────────┘ │
│                                                  │
│  ◄━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━►         │
│  EXPLOSIONS          ^            CURES          │
│                    (drag)                        │
│                                                  │
│  Choose wisely.                                  │
│  (This is not hard.)                             │
└──────────────────────────────────────────────────┘
```

*Visual*: Pixel art — Sierra "duel" layout. RPG battle, but combatants are budget categories. Round 1: EXPLOSIONS VS CLINICAL TRIALS. Cursor grabs slider, drags firmly toward CLINICAL TRIALS. Green burst. "COMPARISON 1 of 10."

*Sierra verb*: `> DRAG slider` → "Interesting. You'd rather cure cancer than build a ninth aircraft carrier. Your politicians may want to take notes."

**Score**: `10,000,000` · **Inventory**: +`ALLOCATION` (slot 2)

---

### your-budget (8s)

> "Your choices build a complete national budget using the same mathematics your species invented in 1977 and mostly uses to rank football teams."

```
┌─────────────────────────────────────────────┐
│  📊 YOUR BUDGET (10 comparisons, 2 minutes)  │
│                                             │
│  Clinical Trials  ████████████████  31%     │
│  Education        ██████████████    22%     │
│  Infrastructure   ████████████      18%     │
│  Healthcare       ██████████        15%     │
│  Environment      ██████            10%     │
│  Military         ██                 4%     │
│                                             │
│  METHOD: Eigenvector decomposition          │
│  INVENTED: 1977                             │
│  USED FOR: ranking football teams           │
│  COULD ALSO BE USED FOR: civilisation       │
│  HAS BEEN: no                               │
│                                             │
│  You just did in 2 minutes what your        │
│  legislature fails to do in 2 years.        │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel-art horizontal bar chart grows. Each comparison adjusts a bar. Clinical Trials: 31% / Education: 22% / Infrastructure: 18% / Military: 4%. Ballot drops into inventory.

*Sierra verb*: `> LOOK AT allocation chart` → "Eigenvector decomposition. Stable preference weights from ten comparisons. Your species invented this in 1977. Used it for football. We use it for civilisation."

**Score**: `50,000,000`

---

### referendum (10s)

> "The 1% Treaty Referendum. Should all governments redirect 1% of the murder budget to clinical trials? That is going from 99% bombs to 98% bombs. One click. Thirty seconds. Your species has held elections about less."

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   📜 THE 1% TREATY REFERENDUM                     │
│                                                  │
│   Should all governments redirect 1% of          │
│   military spending to pragmatic clinical trials? │
│                                                  │
│   Current allocation: 💥 99% → 🧪 1%              │
│   Proposed:           💥 98% → 🧪 2%              │
│                                                  │
│   The explosion manufacturers keep 98%.          │
│   They will not notice.                          │
│                                                  │
│       ┌──────────┐         ┌──────────┐          │
│       │   YES    │         │    NO    │          │
│       └──────────┘         └──────────┘          │
│                                                  │
│   Time required: 30 seconds                      │
│   Difficulty: clicking a button                  │
└──────────────────────────────────────────────────┘
```

*Visual*: Screen dims to spotlight. Single oversized Sierra dialog box: THE 1% TREATY REFERENDUM. YES and NO buttons. Cursor hovers YES. 1.5 seconds silence. Clicks. Dialog explodes with pixel confetti. Fanfare. Score jumps.

*Sierra verb*: `> CLICK yes` → "Congratulations. You have just done more for civilisation than most parliaments manage in a decade."
*Sierra verb*: `> CLICK no` → "Interesting. You prefer the current ratio of 604 dollars on explosions per dollar on cures. The narrator judges you silently."

**Score**: `100,000,000` · **Inventory**: +`VOTE` (slot 3)

---

### youre-in (8s)

> "Congratulations. You have just done more for civilisation than most parliaments manage in a decade. Now tell two friends."

```
┌────────────────────────────────────────┐
│  🎉 VOTE RECORDED                      │
│                                        │
│  Player #4,847 of 4,000,000,000 needed │
│                                        │
│  YOUR QUEST:                           │
│  ┌──────────────────────────────────┐  │
│  │ Tell two friends.               │  │
│  │ They tell two friends.          │  │
│  │ 2 → 4 → 8 → 16 → ...          │  │
│  │ → 4,000,000,000                 │  │
│  │                                  │  │
│  │ (33 doublings. Your species     │  │
│  │  invented this. You call it     │  │
│  │  "going viral." We call it      │  │
│  │  "counting.")                   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌────────────────┐  ┌──────────────┐  │
│  │  📋 COPY LINK  │  │  📱 SHARE    │  │
│  └────────────────┘  └──────────────┘  │
└────────────────────────────────────────┘
```

*Visual*: Banner: VOTE RECORDED. The allocation slider from the title screen nudges one tick rightward — the global slider moved because you voted. New dialog slides in showing the viral loop: tell two, they tell two, 33 doublings to 4 billion.

*Sierra verb*: `> SHARE link` → "Two friends. That is all. They will each tell two more. Your species invented exponential growth. Now use it for something other than debt."

**Score**: `150,000,000`

---

### asymmetry (8s)

> "That vote took thirty seconds. Your time cost six cents. The upside: fifteen point seven million dollars. Per person. That is a ratio of 245 million to one. On my planet we just call it arithmetic."

*Visual*: Pixel art — Sierra merchant's shop. Wishonia behind counter in merchant robes. Left side: tiny copper pixel coin on velvet pad, "$0.06 — 30 seconds of your time." Right side: comically enormous gold pile extending off-screen, "$15,700,000 — lifetime income gain." Trade arrow between them. Flashing pixel text: "EXCHANGE RATE: 245,000,000 : 1." Wishonia's portrait: one eyebrow raised.

*Sierra verb*: `> TRADE 30 seconds FOR $15.7 million` → "The merchant stares at you. 'This is the most lopsided trade in the history of commerce. And I have been trading for 4,297 years.'"
*Sierra verb*: `> HAGGLE` → "There is nothing to haggle. The trade is already infinitely in your favour."

**Score**: `200,000,000`

---

### get-friends (10s)

**[[Quest notification: "LEVEL 3 — Get your friends to play. Tell two people."]]**

> "Tell two friends to play. They tell two friends. The target is 4 billion players. Sounds ambitious? 4 billion of you already drive to a polling station, wait in line, and vote for free — for a 1 in 30 million chance of changing anything. You are asking those same people to click buttons on a phone to get ten times richer. The hard part is not participation. The hard part was doing it for free. You solved that."

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

*Visual*: Pixel art — split into two halves. LEFT — The Concrete Action: Pixel-art phone screen showing a text message thread. Player's message: "Play this -> optimitron.com/r/player1". Friends "Sarah" and "Mike" reply with "I'm playing!" Notifications pop: "+1 VOTE POINT" "+1 VOTE POINT." Three platform icons below (text, WhatsApp, Twitter). A prize pool counter ticks up as each friend joins. RIGHT — The Comparison That Kills the Objection: A Sierra side-by-side comparison. REGULAR VOTING: Drive to polling station, Wait in line, 1 in 30M chance of being the tiebreaker, Winner ignores you, Cost: free, Reward: nothing, People who do this: 4B. PLAYING THIS GAME: Click buttons on website, 30 seconds, Each point worth $194K, Everyone gets 10x richer, Winner = you, Cost: free, Reward: $15.7M, People needed: 4B. The left card is greyed out and dull. The right card glows green. Chain-link drops into inventory slot 4.

*Sierra verb*: `> TEXT sarah` → "'Play this game.' Sarah opens the link. Plays. Gets her own link. Sends it to two more friends. The prize pool just grew. Your VOTE points just got more valuable."
*Sierra verb*: `> COMPARE voting` → "4 billion people already do something harder for nothing. You are asking them to do something easier for $15.7 million. This is not a marketing challenge. It is arithmetic."

**Score**: `500,000,000` · **Inventory**: +`REFERRAL LINK` (slot 4)

---

### Part 3: The Money

### prize-investment (10s)

> "Your retirement fund earns 8%. This earns 17%. The side effect of your retirement fund is nothing. The side effect of this is curing all disease. Your financial advisor will not tell you about this because your financial advisor works for the 8% companies."

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

*Visual*: Pixel art — Sierra merchant's investment counter. Two options side by side: YOUR RETIREMENT FUND (Old corporations, Rent-seeking/slow, Return: 8%/year, $100 -> $317 in 15 yrs, Side effect: nothing) vs PRIZE POOL (Innovative startups, High-growth/new, Return: 17%/year, $100 -> $1,110 in 15 yrs, Side effect: curing all disease). Right option glows green. Left looks grey and dull. The goal: build the biggest prize pool in history. So every player on Earth is incentivized to win.

*Sierra verb*: `> COMPARE returns` → "8% in a retirement fund versus 17% in the prize pool. Your financial advisor will not tell you about this because your financial advisor works for the 8% companies."
*Sierra verb*: `> DEPOSIT gold coin` → "Your money is now invested in companies building the future, instead of companies extracting rent from the past. Also, the side effect is saving civilisation."

**Score**: `650,000,000`

---

### prize-mechanism (12s)

> "Deposit $100. If Earth wins, VOTE holders split $774 trillion and your lifetime income goes up $15.7 million. You will not miss the $100. If Earth loses, you get $1,110 back. That is an 11x return on failure. Both paths pay. Your species has a word for this: a no-brainer. Which, given the circumstances, is fitting."

```
┌─ 🌍 TARGETS HIT ──→ [pixel utopia]
                     │   Pool unlocks.
  YOU ($100) → [CHEST] ──┤   VOTE holders split it.
                     │
                     └─ ❌ TARGETS MISSED ─→ [pile of 11× gold]
                         Your $100 → $1,110 back.
                         (11× over 15 years at 17%)
```

*Visual*: Pixel art — branching path (Sierra maze fork). Player's avatar at crossroads holding gold coin. Treasure chest at fork: "PRIZE POOL SMART CONTRACT." Two paths: Left path — TARGETS HIT -> pixel utopia. Pool unlocks. VOTE holders split it. Right path — TARGETS MISSED -> pile of 11x gold. Your $100 -> $1,110 back. (11x over 15 years at 17%). BOTH paths glow green. No red path. No skull. Gold coin drops into inventory slot 5.

*Sierra verb*: `> LOOK AT paths` → "Both are green. In one path, your friends who played get paid. In the other, you get eleven times your money back. Your species has a word for this: 'free option.'"
*Sierra verb*: `> LOOK AT chest` → "A dominant assurance contract. It multiplies your gold whether you win or lose. The only losing move is to not put anything in."

**Score**: `800,000,000` · **Inventory**: +`PRIZE DEPOSIT` (slot 5)

---

### vote-point-value (10s)

> "Every friend who plays earns you one VOTE point. If the world's retirement savings compound in the prize pool at 17% instead of 8%, the pool reaches $774 trillion. Split across 4 billion players, each point is worth $194,000. Two friends: $387,000. Ten friends: $1.9 million. Points cannot be bought. Only earned by getting real humans to care. Your species finally invented a currency backed by something useful."

```
┌────────────────────────────────────────────┐
│  ⚔️ CHARACTER — VOTE POINT LEDGER          │
│                                            │
│  CLASS:   Human (debuff: won't coordinate) │
│  ABILITY: Tell two friends (unused)        │
│  WEAPON:  Arithmetic                       │
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

*Visual*: Pixel art — Sierra character stats screen: VOTE POINT LEDGER. POINTS EARNED: 2 (from friends playing). VALUE PER POINT: $194,000. TOTAL IF HIT: $387,000. Friends Playing Table: 2 friends -> $387,000 / 5 friends -> $970,000 / 10 friends -> $1,940,000 / 50 friends -> $9,700,000. Warnings: Points are NON-TRADABLE. Cannot be purchased. Ever. Earned ONLY by getting friends to play. More players -> bigger pool -> bigger prize -> more incentive to make sure Earth wins. Two silver tokens drop into inventory slot 6. Flywheel line at bottom rendered as pixel-art cycle arrow.

*Sierra verb*: `> LOOK AT points` → "Non-transferable. Non-purchasable. Earned by getting friends to play. The game gets more valuable the more people are in it. That is not a bug. It is the design."
*Sierra verb*: `> SELL points` → "They cannot be sold. If they could be bought, the rich would own the game. The only way to earn them is to get another human being to care."

**Score**: `1,000,000,000` · **Inventory**: +`VOTE POINTS ×2` (slot 6)

---

### cannot-lose (10s)

> "If humanity wins, your $100 deposit goes to VOTE holders. You also became a multimillionaire in a civilisation that cured all disease. You do not mourn the $100. If humanity loses, you get $1,110 back. The only way to lose is not to play. Two of three outcomes are wins. The third one is your fault."

```
┌─────────────────────────────────────────┐
│  📊 THREE SCENARIOS ($100 + 2 friends)   │
│                                         │
│  ✅ HUMANITY WINS                        │
│     NET: +$16,087,000                    │
│     (you don't miss the $100)            │
│                                         │
│  ✅ HUMANITY MISSES                      │
│     NET: +$1,010 (11× return)            │
│     (still beats your retirement fund)   │
│                                         │
│  ❌ DID NOT PLAY                         │
│     NET: -$15,700,000                    │
│     (opportunity cost of doing nothing)  │
│                                         │
│  Two of three are wins.                 │
│  The third is your fault.               │
└─────────────────────────────────────────┘
```

*Visual*: Sierra summary/stats screen — three outcomes. WORKED EXAMPLE — $100 DEPOSIT + 2 FRIENDS PLAYING. Box 1 (glows brightest): HUMANITY WINS — Your deposit: goes to VOTE holders (not you). Your VOTE points: 2 x $194K = $387,000. Your lifetime income: +$15.7 MILLION. Everyone is 10x richer. You don't miss $100. NET: +$16,087,000. Box 2: HUMANITY MISSES (targets not hit) — VOTE points: expire ($0). Your deposit: $100 -> $1,110 (11x yield). Still outperforms your retirement fund (3.5x). NET: +$1,010. Box 3 (dim red): DID NOT PLAY — $0 returned. $0 earned. Still paying $12,600/yr dysfunction tax. Missed $15.7M in lifetime income. NET: -$15,700,000 (opportunity cost). Two out of three outcomes are wins. The third one is your fault.

*Sierra verb*: `> WORRY ABOUT deposit` → "Your deposit goes to VOTE holders if humanity wins. You also got $15.7 million richer. On my planet we call this a good trade."
*Sierra verb*: `> LOOK AT outcomes` → "Two green. One red. The red one is the one where you did nothing. That is the only scenario where you lose."

**Score**: `1,500,000,000`

---

### Part 4: Accountability

### track-record (10s)

> "You spent $8 trillion on the War on Terror. Terrorism increased seventeen-fold. You spent $90 billion a year on the War on Drugs. Overdose deaths increased sixteen-fold. When something fails on your planet, it gets a bigger budget. By this logic, the most successful fire department is one that starts fires."

```
┌─────────────────────────────────────────────┐
│  📋 PERFORMANCE REVIEW — YOUR GOVERNMENT     │
│                                             │
│  PROJECT             BUDGET    RESULT       │
│  ─────────────────   ───────   ──────       │
│  War on Terror       $8T       +1,700%      │
│  War on Drugs        $1.35T    +1,600%      │
│  War on Poverty      $25T      poverty won  │
│                                             │
│  PERFORMANCE RATING: ★☆☆☆☆                  │
│                                             │
│  ACTION TAKEN: Bigger budget                │
│                                             │
│  REVIEWER NOTES:                            │
│  "By this logic, the most successful fire   │
│   department is one that starts fires."     │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra performance review pinned to a corkboard. Three line items with budgets and results. Each result animates in red — the numbers go the wrong direction. A star rating flickers between 1 and 0 stars. ACTION TAKEN: Bigger budget.

*Sierra verb*: `> LOOK AT results` → "Every metric went the wrong direction. Every budget went up. Your species rewards failure with funding. On my planet, we call that a perverse incentive. On yours, you call it Tuesday."

**Score**: `3,000,000,000`

---

### arsonist-board (10s)

> "This leaderboard shows which of your leaders are arsonists. Your leaders are not evil. They are just optimising for the wrong metric. We changed the metric."

```
┌─────────────────────────────────────────────┐
│  🏆 ALIGNMENT HIGH SCORES                   │
│                                             │
│  OLD METRIC: ~~RE-ELECTION PROBABILITY~~    │
│  NEW METRIC: CITIZEN ALIGNMENT SCORE        │
│                                             │
│  RANK  NATION     LEADER    SCORE   RATIO   │
│  ────  ──────     ──────    ─────   ─────   │
│   1    ██████     ██████    94.2%   12:1    │
│   2    ██████     ██████    87.1%   18:1    │
│   3    ██████     ██████    73.4%   41:1    │
│  ...                                        │
│  191   ██████     ██████     2.1%   604:1   │
│  192   ██████     ██████     0.8%   890:1   │
│                                             │
│  SORT BY: [BEST] [WORST] [MOST IMPROVED]    │
│                                             │
│  The competition for last place is fierce.  │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — Sierra high-score table. Header "RE-ELECTION PROBABILITY" gets slashed with a red X. New header typewriters in: "CITIZEN ALIGNMENT SCORE." Rankings shuffle. Magnifying glass drops into inventory.

*Sierra verb*: `> LOOK AT leaderboard` → "Some of these scores are impressively low. It takes real commitment to be this misaligned."
*Sierra verb*: `> SORT BY worst` → "Sorting by worst score. The competition for last place is fierce."

**Score**: `4,000,000,000` · **Inventory**: +`ALIGNMENT SCORE` (slot 8)

---

### Part 5: The Armory

### fda-queue (8s)

> "Your FDA makes treatments wait 8.2 years after they have already been proven safe. Just sitting there. Being safe. While 102 million of you died in the queue. The drugs that DID pass? Vioxx killed 55,000. OxyContin killed 500,000. Your safety system's main product is dead patients."

```
┌─────────────────────────────────────────────┐
│  🏥 FDA WAITING ROOM                         │
│                                             │
│  TICKET #: 4,847                            │
│  ESTIMATED WAIT: 8.2 years                  │
│                                             │
│  STATUS OF YOUR DRUG:                       │
│  ☑ Discovered                               │
│  ☑ Tested                                   │
│  ☑ Proven safe                              │
│  ☑ Proven effective                         │
│  ☐ Approved (estimated: 2034)               │
│                                             │
│  PATIENTS WHO DIED WAITING: 102,000,000     │
│                                             │
│  DRUGS THAT SKIPPED THE QUEUE:              │
│  Vioxx — killed 55,000                      │
│  OxyContin — killed 500,000                 │
│                                             │
│  Executives jailed: 0                       │
│  System changed: no                         │
│                                             │
│  NOW SERVING: nobody, it's lunch break      │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra waiting room. Rows of pixel patients sitting in chairs, some slumping over. A ticket counter displays "NOW SERVING: nobody." A shelf behind the counter holds rows of approved drugs, gathering pixel dust. A clock on the wall shows 8.2 years passing in fast-forward.

*Sierra verb*: `> LOOK AT queue` → "8.2 years. The drugs are sitting on a shelf. They work. The FDA knows they work. The patients are dying in the waiting room. This is not caution. It is manslaughter by committee."

**Score**: `4,100,000,000`

---

### dfda-fix (8s)

> "The decentralised version runs pragmatic trials in real-world conditions. $929 per patient instead of $41,000. Forty-four times cheaper. 12.3 times more trial capacity. Same patients. No eight-year queue. The technology exists. It just did not have a lobbying firm."

```
┌─────────────────────────────────────────────┐
│  🧪 DECENTRALIZED FDA                        │
│                                             │
│  Same trials. No waiting room.              │
│                                             │
│             BEFORE         AFTER            │
│  ────────   ──────         ─────            │
│  Cost:      $41,000        $929             │
│  Wait:      8.2 years      now              │
│  Capacity:  1.9M/yr        23.4M/yr         │
│  Queue:     yes            what queue       │
│  Lobby:     required       not applicable   │
│  Code:      no             auditable        │
│                                             │
│  "It's the same thing but without the       │
│   part where everyone dies."                │
│               — Wishonia                    │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — the same waiting room, but transformed. The queue is gone. Patients walk in one door and out another. The ticket counter now displays real-time trial results. Everything is faster, cheaper, and nobody is dying in a chair.

*Sierra verb*: `> USE decentralized FDA` → "Same patients, real conditions, real data, no eight-year queue. The technology exists. The only thing missing was the funding. That is what the 1% Treaty provides."

**Score**: `4,200,000,000`

---

### iabs (8s)

> "Campaign cost: one billion. The treaty generates twenty-seven billion per year. Eighty percent goes to clinical trials. Ten percent back to bond holders. Ten percent to the alignment SuperPAC. The split is enforced on-chain. No human touches the money. On your planet, that is the only way to keep money from disappearing."

```
┌─────────────────────────────────────────────────────┐
│  ⚗️ INCENTIVE ALIGNMENT BONDS — CRAFTING RECIPE      │
│                                                     │
│  INPUT:                                             │
│  ┌──────────────────┐                               │
│  │ BONDS: $1 BILLION │ (Solidity smart contract)    │
│  └────────┬─────────┘                               │
│           ▼                                         │
│  ┌──────────────────┐                               │
│  │ TREATY PASSES    │                               │
│  │ → $27B/yr inflow │                               │
│  └────────┬─────────┘                               │
│           ▼                                         │
│  OUTPUT (annual, enforced on-chain):                │
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

*Visual*: Pixel art — Sierra merchant/crafting screen. An NPC "IAB TRADER" behind a counter. A flow diagram: INCENTIVE ALIGNMENT BONDS — CRAFTING RECIPE. INPUT: BONDS: $1 BILLION (Solidity smart contract). TREATY PASSES -> $27B/yr inflow. OUTPUT (annual, enforced on-chain): 80% TRIALS $21.6B / 10% BOND HOLDERS $2.7B / 10% ALIGNMENT SUPERPAC $2.7B. Campaign cost: $1B. Annual return: $27B. Forever. Solidity contract icon visible on the bond. Hypercert badge on the trials output. The output slots glow as they fill.

*Sierra verb*: `> BUY bonds` → "The campaign costs one billion. The treaty generates twenty-seven billion per year. Indefinitely. Your financial advisor would call this a good deal. If your financial advisor understood anything other than index funds."

**Score**: `4,500,000,000`

---

### superpac (8s)

> "This SuperPAC has no lobbyists, no dinners, no phone calls. Just a smart contract that reads your voting record and pays accordingly. Vote for cures? Money. Vote for bombs? Nothing. The lobbyist has been replaced by four lines of code. The code does not accept bribes. The code does not have a favourite restaurant. Your species will find this upsetting."

*Visual*: Pixel art — the Leaderboard from the earlier slide, but now gold coins rain from the top of the screen. They flow to the highest-ranked politicians — more coins for higher alignment scores. The lowest-ranked get nothing; their rows dim. Where a lobbyist NPC would normally stand, a pixel gear/brain icon labeled "SMART CONTRACT" has replaced them. In the corner, a crossed-out pixel lobbyist sits holding an empty dinner invitation, looking confused. A Solidity logo pulses on the smart contract. The PoliticalIncentiveAllocator contract name is visible.

*Sierra verb*: `> TALK TO lobbyist` → "The lobbyist has been replaced by a smart contract. It does not accept dinner invitations. Or bribes. Or phone calls. It reads voting records and allocates funds. Automatically."
*Sierra verb*: `> LOOK AT algorithm` → "One input: did you vote to help people or did you vote to kill them? One output: campaign funding or nothing. Your species made this complicated. It is not."

**Score**: `4,700,000,000`

---

### storacha (8s)

> "Every data point. Every budget. Every vote. Every death. Stored where no government can delete it, no lobbyist can edit it, and no administration can classify it. Your species has a long history of losing inconvenient evidence. This evidence has no address. It has a hash. Try deleting mathematics."

*Visual*: Pixel art — a Sierra vault/archive room. Pixel-art filing cabinets, but instead of drawers they have glowing IPFS content-addressed blocks. Each block has a CID hash visible. A pixel government official tries to reach for a block — a force field repels them. A "CONTENT-ADDRESSED" badge pulses. Storacha and IPFS/Filecoin logos visible. A pixel document labeled "FDA DELAY: 102M DEATHS" sits in a block — immutable, permanent, unfalsifiable.

*Sierra verb*: `> DELETE evidence` → "ACCESS DENIED. Content-addressed storage cannot be altered. That is the point. Your government's legal team has been notified and is reportedly quite upset."
*Sierra verb*: `> LOOK AT vault` → "Every outcome. Every budget. Every vote. Every death. Permanent. Public. Immutable. On my planet, this is called a filing cabinet. On yours, it is called radical transparency."

**Score**: `5,200,000,000`

---

### hypercerts (8s)

> "On your planet, proving you saved lives works on the honour system. 'We spent the money on healthcare.' Did it work? 'Trust us.' On Wishonia, every claim of impact gets a receipt. If a charity tells you they saved ten thousand lives, you ask for the Hypercert. If they do not have one, they did not save ten thousand lives. Your species calls this 'radical accountability.' We call it 'a receipt.'"

*Visual*: Pixel art — Sierra achievement/badge screen. A grid of Hypercert badges, each one a pixel-art certificate with: trial name, patients treated, outcome measured, CID hash linking to Storacha data. One badge animates being minted: "TRIAL #4,847: Malaria vaccine pragmatic trial. 12,000 patients. 94% efficacy. Verified on-chain." A pixel stamp of approval lands on it. The badge links visually to a Storacha block from the previous slide — the data backing the claim.

*Sierra verb*: `> VERIFY claim` → "Verifiable. Auditable. On-chain. The opposite of 'trust me, we spent it wisely.'"
*Sierra verb*: `> LOOK AT badge` → "This Hypercert says 12,000 people received a malaria vaccine. The clinical data is content-addressed on Storacha. The funding trail is on-chain in Solidity. Every link is auditable. Your current system's equivalent is a PDF that says 'trust us.'"

**Score**: `5,400,000,000`

---

### replace-irs (8s)

> "Your tax code is 74,000 pages. It employs 83,000 people to enforce it. A 0.5% transaction tax does the same job in four lines of Solidity. The four lines are auditable. The 74,000 pages are not."

```
┌─────────────────────────────────────────────┐
│  📜 TAX CODE COMPARISON                      │
│                                             │
│  CURRENT SYSTEM:                            │
│  ┌─────────────────────────────────────┐    │
│  │ page 1 of 74,000                    │    │
│  │ (a) In the case of any individual   │    │
│  │ who is not married (determined by   │    │
│  │ applying the rules of paragraph     │    │
│  │ (4) of subsection (b) of section    │    │
│  │ 7703), with respect to whom a       │    │
│  │ deduction under section 151 is      │    │
│  │ ...                                 │    │
│  │           [74,000 pages later]      │    │
│  └─────────────────────────────────────┘    │
│  Employees: 83,000                          │
│  Loopholes: yes                             │
│                                             │
│  REPLACEMENT:                               │
│  ┌─────────────────────────────────────┐    │
│  │ function tax(amount) {              │    │
│  │   return amount * 0.005;            │    │
│  │ }                                   │    │
│  └─────────────────────────────────────┘    │
│  Employees: 0                               │
│  Loopholes: view source                     │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra scroll unfurling endlessly on the left (the tax code, page after page). On the right, a tiny glowing terminal with four lines of code. The scroll keeps unfurling. The code does not change.

*Sierra verb*: `> LOOK AT IRS` → "74,000 pages of tax code. 83,000 employees. All replaceable by a flat 0.5% transaction tax in four lines of Solidity. The four lines are auditable. The 74,000 pages are not."

**Score**: `5,400,000,000`

---

### replace-welfare (8s)

> "Your species runs 83 welfare programs across 6 agencies. The overhead is extraordinary. Universal basic income, distributed automatically via World ID: one program. Zero agencies. No application form. No waiting list. No one deciding whether you deserve to eat."

```
┌─────────────────────────────────────────────┐
│  🏛 WELFARE REPLACEMENT                      │
│                                             │
│  CURRENT SYSTEM:                            │
│  Programs:          83                      │
│  Agencies:          6                       │
│  Application forms: hundreds                │
│  Wait time:         months                  │
│  Deciding if you                            │
│  deserve to eat:    committee               │
│                                             │
│  REPLACEMENT:                               │
│  Programs:          1                       │
│  Agencies:          0                       │
│  Application forms: 0                       │
│  Wait time:         0                       │
│  Deciding if you                            │
│  deserve to eat:    you're human, yes       │
│                                             │
│  METHOD: UBI via World ID (automatic)       │
│  BUREAUCRATS NEEDED: null                   │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra government office with long queues and stamping bureaucrats on the left. On the right, a single clean terminal that just says DEPOSITED. No queue. No forms. No office.

*Sierra verb*: `> APPLY for welfare` → "Form 1 of 47. Estimated processing time: 6-8 weeks. Or: use the smart contract. Processing time: now."

**Score**: `5,500,000,000`

---

### replace-fed (8s)

> "Your central bank destroyed 97% of the dollar since 1913. This smart contract maintains zero percent inflation by anchoring to productivity growth. It cannot print money to fund wars because it does not have a print function."

```
┌─────────────────────────────────────────────┐
│  🏦 CENTRAL BANK REPLACEMENT                 │
│                                             │
│  FEDERAL RESERVE (1913-present):            │
│  Dollar value destroyed:  97%               │
│  Wars funded:             all of them       │
│  Citizens consulted:      0                 │
│  Audit results:           "no"              │
│                                             │
│  SMART CONTRACT:                            │
│  Inflation target:        0%                │
│  Anchored to:             productivity      │
│  print(money):            FUNCTION REMOVED  │
│  fund(war):               FUNCTION REMOVED  │
│  Audit results:           view source       │
│                                             │
│  "It cannot print money to fund wars        │
│   because it does not have a print          │
│   function."                                │
│                                             │
│  Your engineers will appreciate this.       │
│  Your central bankers will not.             │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra bank vault. On the left, a pixel money printer running endlessly, dollars dissolving as they come out. On the right, a locked terminal with the print function visibly deleted from the code.

*Sierra verb*: `> PRINT money` → "ERROR: print() is not a function. This is by design. Your central bankers are reportedly quite upset."

**Score**: `5,600,000,000`

---

### policy-engine (8s)

> "The Optimal Policy Generator. It looks at what every country tried and what actually happened. Not which policies were popular. Which ones moved the numbers. It does not have a favourite party. It does not have donors. It has arithmetic."

**On-Screen Content** (top to bottom):

| Element | Size | Animation |
|---------|------|-----------|
| `OPTIMAL POLICY GENERATOR` | large, green | fadeIn |
| `RANKED BY CAUSAL IMPACT` | medium, green | fadeIn |

```
┌─────────────────────────────────────────────┐
│  🔬 OPTIMAL POLICY GENERATOR                 │
│                                             │
│  INPUT:  What every country tried           │
│  OUTPUT: What actually worked               │
│                                             │
│  DOES NOT CARE ABOUT:                       │
│  ☐ Party affiliation                        │
│  ☐ Ideology                                 │
│  ☐ Campaign donations                       │
│  ☐ Feelings                                 │
│                                             │
│  CARES ABOUT:                               │
│  ☑ Did the number go up or down             │
│                                             │
│  Your species has a word for this.          │
│  "Controversial."                           │
│  On my planet we call it "looking."         │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — Wishonia's workshop. A large machine with input slot and output tray. Clean, transparent. Not a black box — a looking machine.

*Sierra verb*: `> USE policy generator` → "It analyses what actually worked. No ideology. No party. Just outcomes. A novel concept for your species."

**Score**: `4,900,000,000`

---

### optimizer (10s)

> "Portugal decriminalised all drugs in 2001. Overdose deaths dropped 80%. America spent $47 billion a year on the War on Drugs. Overdose deaths rose 1,700%. The data existed. Nobody looked at it. The data did not have a lobbying firm."

```
┌─────────────────────────────────────────────┐
│  📊 SAMPLE OUTPUT — DRUG POLICY              │
│                                             │
│  🇵🇹 PORTUGAL                 🇺🇸 AMERICA     │
│  ────────────────            ──────────── │
│  Decriminalised drugs        Declared war   │
│  Cost: low                   Cost: $47B/yr  │
│  Overdose deaths: -80%       Overdose: +17x │
│  Prison population: -30%     Prison: +500%  │
│  Status: working             Status: working│
│                              (for prisons)  │
│                                             │
│  MACHINE RECOMMENDATION:                    │
│  Do the Portugal thing.                     │
│                                             │
│  YEARS THIS DATA HAS EXISTED: 25           │
│  COUNTRIES THAT LOOKED AT IT: 1             │
│  The data did not have a lobbying firm.     │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — the policy generator machine from the previous slide, now with output. A comparison display shows Portugal vs America side by side. The contrast is devastating.

*Sierra verb*: `> LOOK AT data` → "The data has existed for 25 years. One country looked at it. The rest declared war on the problem and made it worse. Your species has an unusual relationship with evidence."

**Score**: `5,000,000,000`

---

### budget-optimizer (10s)

> "The Optimal Budget Generator. Feed it spending data and outcomes for 34 categories. It finds the point of diminishing returns for each one. Singapore spends a quarter of what America spends on healthcare. Their people live six years longer. Less money. Better outcomes. On every single line item."

```
┌─────────────────────────────────────────────┐
│  💰 OPTIMAL BUDGET GENERATOR                 │
│                                             │
│  🇺🇸 USA (CURRENT)        🇺🇸 USA (OPTIMIZED) │
│  ────────────────        ──────────────── │
│  Healthcare: $4.5T       Healthcare: $1.1T │
│  Outcomes: ranked 37th   Outcomes: ranked 1st│
│                                             │
│  Defense: $886B          Defense: $200B     │
│  Wars since 1945: 13     Wars needed: 0     │
│                                             │
│  Education: $800B        Education: $600B   │
│  Test scores: declining  Test scores: +40%  │
│                                             │
│  TOTAL SPENT: more       TOTAL SPENT: less  │
│  OUTCOMES:    worse      OUTCOMES:    better │
│                                             │
│  DIFFICULTY: looking at the data            │
└─────────────────────────────────────────────┘
```

*Visual*: Pixel art — a Sierra budget control panel. Two columns: USA CURRENT (red, crumbling) and USA OPTIMIZED (green, gleaming). Each row animates: the current number shrinks while the outcome improves. The total spent goes DOWN. The outcomes go UP. A line at the bottom: DIFFICULTY: looking at the data.

*Sierra verb*: `> OPTIMIZE budget` → "Less money, better outcomes. On every single line item. Singapore figured this out. Your species can too."

**Score**: `5,100,000,000`

---

### i-pencil (10s)

> "Nobody knows how to make a pencil. The wood comes from one country, the graphite from another, the rubber from a third. Millions of people, no coordinator. The price system does it. Four billion people with $194,000 each will figure out how to build a decentralised FDA the same way. You do not need a plan. You need an incentive. The incentive is $774 trillion. Researcher discovers cheaper trials? Gets paid. Lobbyist passes legislation? Gets paid. Developer ships better code? Gets paid. The game does not pick the solution. The market does."

*Visual*: Pixel art — a Sierra "I, Pencil" sequence. A pixel pencil sits in the center of the screen. Zoom lines expand outward from it showing the supply chain: a pixel lumberjack, a pixel miner, a pixel factory worker, a pixel painter — each in a different pixel country. None of them know each other. Lines connect them all to the pencil. Then the pencil morphs into a pixel test tube (clinical trial), and the supply chain morphs too: a pixel developer writing Solidity, a pixel doctor running a trial, a pixel data scientist on Storacha, a pixel patient getting treated, a pixel auditor minting a Hypercert. Same structure. Same principle. Nobody coordinates them. The prize pool does. Below, a counter: "BRAINS INCENTIVIZED: 4,000,000,000. VOTE POINT VALUE: $194,000. PRIZE POOL: $774 TRILLION." The numbers pulse.

*Sierra verb*: `> LOOK AT pencil` → "Nobody knows how to make this. Millions of people each contribute one step. The market coordinates them. The prize pool does the same thing, except instead of pencils it produces cures."
*Sierra verb*: `> WORRY ABOUT complexity` → "Your species built the internet without a central plan. It built Wikipedia without paying anyone. It will build this because $194,000 per person is a better incentive than either of those had."

**Score**: `5,800,000,000`

---


## ACT III — THE ENDGAME

### personal-upside (12s)

> "If the treaty passes, your lifetime income goes up by $15.7 million. Per person. Not per country. Per. Person. You are currently losing $12,600 a year to a system bug nobody has assigned. This is not charity. This is the most lopsided trade your species has ever been offered. And the cost of not taking it is $15.7 million."

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

*Visual*: Pixel art — three Sierra save-game slots, each with tiny pixel scene and stats. Slot 1 (Status Quo) actively desaturates — the pixel city gets smoggier, buildings crumble slightly, pixel people hunch over, numbers CountUp to depressing values, [LOADED] tag blinks accusingly. Slot 2 (1% Treaty) actively brightens — parks bloom with green pixels, hospital lights turn on, pixel people stand taller, $15.7M CountUps from $0 in golden text, ◄◄◄ arrow pulses. Slot 3 (Wishonia Trajectory) gleams impossibly — the Wishonia paradise rendered in miniature, every pixel radiating, $54.3M in white-gold. The visual hierarchy makes Slot 1 feel like a mistake and Slot 2 feel like an obvious upgrade. Glowing deed drops into inventory slot 7.

*Sierra verb*: `> LOOK AT slot 1` → "Status quo. $1.34 million lifetime income. You are losing $12,600 a year to a system bug."
*Sierra verb*: `> LOOK AT slot 3` → "$54.3 million. My planet chose this 4,297 years ago. We have not regretted it."
*Sierra verb*: `> LOAD slot 2` → "You cannot load it from here. You have to earn it. That is rather the point of the game."

**Score**: `6,000,000,000` · **Inventory**: +`$15.7M CLAIM` (slot 7)

---

### lives-saved (12s)

> "150,000 deaths per day. The combined trial capacity increase and efficacy lag elimination accelerate treatment by 212 years. A third of those deaths are avoidable with earlier cures. Multiply it out: 10.7 billion lives. More than the total number of humans who have ever lived in a single century. Every share, every vote, every conversation moves the number. The math is patient. The diseases are not."

*Visual*: Pixel art — planet from the Cold Open returns, but transforming. Cemetery crosses being replaced one by one — each cross morphs into a tiny pixel person standing up, grey to green. The replacement accelerates as the narration builds — slow at first, then hundreds at once. Center of screen: a massive CountUp ticks from 0 to 10,700,000,000 over the full duration of the narration. The number starts small and the font size GROWS as the count increases — by 1 billion it's large, by 10 billion it fills the screen. The planet's palette shifts from EGA dark to VGA bright in sync with the counter. Quest meters approach full. The death ticker in the HUD visibly slows — the gap between ticks widening as the count climbs. By the end, the planet is the Wishonia paradise from the Restore slide.

*Sierra verb*: `> COUNT lives` → "More than the total number of humans who have ever lived. That is what is at stake. No pressure."

**Score**: `7,500,000,000`

---

### close (15s)

**[[Beat. Then:]]**

> "The most powerful AI on your planet is not in a data centre. It is in a building with a dome. It has been misaligned for two centuries. This game is its alignment software. And unlike the version made of silicon — this one you can fix with a vote."

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
│  Difficulty:   clicking a button        │
│  Real difficulty: getting 4 billion     │
│  people to click a button               │
│                                         │
│  ┌────────────────────┐                 │
│  │    PLAY NOW →      │                 │
│  └────────────────────┘                 │
│                                         │
│  optimitron.com       github.com/...    │
└─────────────────────────────────────────┘
```

*Visual*: Full planet view from space. Halfway transformed — bright continents where pixel people stand, dark where crosses remain. Death counter still ticking but slower. Stars twinkling. Wishonia's portrait shifts from sardonic to something approaching sincerity — the only time in the entire demo. Dramatic pause after 'misaligned.' Two seconds of just the image breathing. Then Sierra title screen returns — same gold font, same starfield. Score: 8,000,000,000 of 8,000,000,000. Quest meters: 100%. All 8 inventory slots full and glowing. Final dialog: CONGRATULATIONS! You have completed THE EARTH OPTIMIZATION GAME. Lives saved: all of them. PLAY NOW button pulses. Music resolves to a single held chord. Silence.

**Score**: `8,000,000,000`

---

### easter-egg (0s)

**[[2 seconds of black. UI chrome disappears. Total darkness. Then just the narrator box fades in:]]**

> "Oh, and if you're wondering — yes, this is the actual game. You're playing it right now. The demo was level one."

*Visual*: Narrator text box on pure black. Wishonia's portrait: faintest smirk — one pixel of mouth moved upward. Cursor blinks. Nothing else. Hold 3 seconds, then fade.

---

## Technical Notes

### Sierra Implementation
- **Color palette**: EGA 16-color for Act I, VGA 256 for Acts II–III (palette upgrade IS the tonal shift at Wishonia)
- **Font**: Sierra bitmap for narrator box. Arcade font for headers/score/quest meters.
- **Text speed**: ~30 chars/sec typewriter. Click to skip.
- **Portrait**: Wishonia 48×48 pixel art, slightly animated (blinking, eyebrow, one smirk in post-credits)
- **Quest meters**: HALE + Income progress bars. Hidden Act I. Appear at Wishonia. Fill through Act II. 100% at completion.

### Content Pipeline
- `lib/demo/demo-config.ts` is the single source of truth for all slide content
- `pnpm generate:readme` — regenerate this README from the config
- `pnpm generate:narration` — regenerate TTS audio for changed slides
- `pnpm record` — record full video (needs `pnpm dev` running)

### Key Rules
- Never introduce a value before the mechanism that creates it (Prize pool → VOTE point value)
- One concept per slide — if a slide explains two things, split it
- The Armory shows every piece of tech built for the hackathon — judges need to see these
- Personal upside ($15.7M) is the LAST thing before Act III — it's the gut punch
