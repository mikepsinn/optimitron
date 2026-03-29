// Slide configuration for the Earth Optimization Game demo
// Each slide defines: id, act, duration, narration, score, inventory, palette

import type { PaletteMode } from "./palette";
import type { InventoryItem } from "./parameters";
import { INVENTORY_ITEMS } from "./parameters";

export type ActType = "act1" | "turn" | "act2" | "act3";

export interface SierraVerb {
  verb: string;
  response: string;
}

export interface OnScreenElement {
  text: string;
  size: "giant" | "large" | "medium" | "small" | "label";
  animation?: "fadeIn" | "countUp" | "typewriter" | "glitch" | "pulse" | "stagger";
  color?: string;
  source?: string; // PARAMETERS path for dynamic values, e.g. "deaths.perDay"
  emoji?: string;
  count?: number;
}

export interface SlideConfig {
  id: string;
  act: ActType;
  duration: number; // seconds (0 = wait for manual advance)
  narration: string;
  visual?: string; // Scene/visual description
  onScreen?: OnScreenElement[]; // On-screen text/elements in display order
  stageDirection?: string; // Stage directions like "[3s black screen]"
  asciiArt?: string; // ASCII art layout diagram
  score?: number;
  inventory?: InventoryItem;
  palette?: PaletteMode;
  sierraVerbs?: SierraVerb[];
  chapter?: string;
  showQuestMeters?: boolean;
  ctaUrl?: string; // Link to live web app feature, e.g. "https://optimitron.com/agencies/domb"
  ctaLabel?: string; // Button label, e.g. "TRY IT" (defaults to "TRY IT →")
}

// Helper to get inventory item by acquiredAt
function getInventory(acquiredAt: string): InventoryItem | undefined {
  return INVENTORY_ITEMS.find((item) => item.acquiredAt === acquiredAt);
}

export const SLIDES: SlideConfig[] = [
  // ============================================
  // ACT I - THE HORROR (slides 0-8)
  // EGA palette, dark, ominous, score stays at 0
  // ============================================
  {
    id: "daily-death-toll",
    act: "act1",
    duration: 10,
    chapter: "Act I: The Horror",
    narration:
      "Bugs in your meat software permanently stop 150,000 of you every 24 hours. One Holocaust every 40 days — except with fewer Nazis and more insurance paperwork. That is also fifty 9/11s every single day, except nobody invades anybody about it because diseases do not have oil.",
    stageDirection:
      "[3 seconds of black screen. Just the death counter ticking up. No narration. No Sierra chrome yet — just red numbers on black, counting. Then the UI fades in around it.]",
    visual:
      'Black background. The text reads like a deadpan alien dispatch: "BUGS IN YOUR MEAT SOFTWARE / KILL / 150,000 / OF YOU EVERY DAY." The counter is brutally large. Below it, 59 tower emojis fill in one by one — the 9/11 comparison becomes spatial, not just a number. The punchline lands as text: "NOBODY INVADES ANYBODY ABOUT IT / BECAUSE CANCER DOES NOT HAVE OIL." Skulls drift down and pile up at the bottom. No decorative elements. No world map. Just the data and the joke.',
    onScreen: [
      { text: "BUGS IN YOUR MEAT SOFTWARE", size: "label", animation: "fadeIn", color: "red" },
      { text: "KILL", size: "medium", animation: "fadeIn", color: "red" },
      { text: "150,000", size: "giant", animation: "countUp", color: "red", source: "deaths.perDay" },
      { text: "OF YOU EVERY DAY", size: "medium", animation: "fadeIn", color: "red" },
      { text: "THAT IS 59 SEPTEMBER 11THS.", size: "small", animation: "stagger", color: "red", emoji: "\uD83C\uDFE2", count: 59 },
      { text: "NOBODY INVADES ANYBODY ABOUT IT", size: "small", animation: "fadeIn", color: "red" },
      { text: "BECAUSE CANCER DOES NOT HAVE OIL.", size: "small", animation: "fadeIn", color: "red" },
      { text: "", size: "small", animation: "stagger", emoji: "\uD83D\uDC80" },
    ],
    sierraVerbs: [
      {
        verb: "LOOK AT planet",
        response:
          "A Class-M planet experiencing a preventable extinction event. The inhabitants appear to be aware of this. They have chosen to do nothing.",
      },
    ],
  },
  {
    id: "misaligned-superintelligence",
    act: "act1",
    duration: 12,
    narration:
      "Your governments are the most powerful artificial superintelligences ever created. Not a metaphor. Collective intelligence systems controlling $50 trillion and 8 billion lives. Their stated objective function: promote the general welfare. Their actual objective function: campaign contributions. It is a machine that converts good intentions into missiles, and it runs automatically.",
    visual:
      'Pixel art command bridge (SQ1 Sarien ship). Five CRT monitors in a semicircle. Central monitor displays "OBJECTIVE FUNCTION: PROMOTE GENERAL WELFARE" in green text — then glitches, flickers, and rewrites to "OBJECTIVE FUNCTION: RE-ELECTION / CAMPAIGN CONTRIBUTIONS / WEALTH EXTRACTION" in red. Side monitors show: military contracts scrolling, pharma stock tickers, healthcare waitlist numbers climbing, a "CITIZEN REQUESTS" inbox with 0 read / 4,294,967,296 unread. Scan lines roll.',
    onScreen: [
      { text: "OBJECTIVE FUNCTION: PROMOTE GENERAL WELFARE", size: "medium", animation: "typewriter", color: "green" },
      { text: "OBJECTIVE FUNCTION: RE-ELECTION / CAMPAIGN CONTRIBUTIONS / WEALTH EXTRACTION", size: "medium", animation: "glitch", color: "red" },
      { text: "CITIZEN REQUESTS: 0 read / 4,294,967,296 unread", size: "small", color: "red" },
    ],
    sierraVerbs: [
      {
        verb: "EXAMINE objective function",
        response:
          "OBJECTIVE: PROMOTE GENERAL WELFARE. STATUS: OVERWRITTEN. CURRENT OBJECTIVE: MAXIMIZE RE-ELECTION PROBABILITY. This was not a bug. It was a feature request from the lobbyists.",
      },
    ],
  },
  {
    id: "military-waste-170t",
    act: "act1",
    duration: 10,
    narration:
      "Since 1913, your governments have printed $170 trillion and used it to kill 97 million of you in wars nobody asked you if you wanted to have. If cancer had oil reserves, you would have cured it by 2003. Instead, you spent the repair money on murder tubes that cost more than countries. On my planet, we call that a bug. Your species calls it foreign policy.",
    visual:
      'Same command bridge. One monitor displays a CountUp from $0 to $170,000,000,000,000 labeled "CUMULATIVE MILITARY SPENDING SINCE 1913." Another scrolls a list of wars with death tolls ticking upward, totaling 97,000,000. The central monitor pulses: "MISALIGNED OBJECTIVE FUNCTION \u2014 RUNNING."',
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    onScreen: [
      { text: "$170,000,000,000,000", size: "giant", animation: "countUp", color: "red" },
      { text: "CUMULATIVE MILITARY SPENDING SINCE 1913", size: "label", color: "red" },
      { text: "97,000,000 DEAD", size: "large", animation: "countUp", color: "red" },
    ],
    sierraVerbs: [
      {
        verb: "TALK TO computer",
        response:
          "It does not respond. It has not responded to citizen input in approximately forty years.",
      },
      {
        verb: "USE keyboard",
        response: "ACCESS DENIED. You are not a lobbyist.",
      },
    ],
  },
  {
    id: "government-body-count",
    act: "act1",
    duration: 10,
    narration:
      "Your governments kept score. You can read the numbers on the screen. Nobody held a referendum on any of it. They wrote it down. Then they filed it. Then they increased the budget.",
    visual:
      "Ranked list of governments by post-WWII military deaths caused. Rows stagger in one by one. Death counts animate up. US highlighted at #1. Skull particle drizzle. Footer: COMBINED: X,XXX,XXX dead. 0 referendums held.",
    score: 0,
  },
  {
    id: "inflation-wage-theft",
    act: "act1",
    duration: 10,
    narration:
      "Your dollar has lost 96% of its value since 1913. If your wages had kept pace with productivity, the median family would earn $528,000. The actual number is $77,500. This is called 'monetary policy.' On my planet we have a word for this. It translates roughly to beige crime or theft that is far too boring for anyone to investigate.",
    visual:
      'Same command bridge. A monitor shows a dollar bill dissolving pixel by pixel — "PURCHASING POWER: 100% → 4%." Another shows two pay stubs side by side: ghost image "$528,000 — IF WAGES KEPT PACE" and real "$77,500 — ACTUAL." The gap is enormous. Pixel arrows show where the difference went.',
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    onScreen: [
      { text: "PURCHASING POWER: 100% → 4%", size: "medium", animation: "fadeIn", color: "red" },
      { text: "$528,000 — IF WAGES KEPT PACE", size: "large", animation: "fadeIn", color: "gold" },
      { text: "$77,500 — ACTUAL", size: "large", animation: "fadeIn", color: "red" },
    ],
    sierraVerbs: [
      {
        verb: "LOOK AT paycheck",
        response:
          "$77,500. Your species calls this a 'good salary.' It is 15% of what it would be if your central bank had not spent a century funding wars with your purchasing power.",
      },
      {
        verb: "FILE charges",
        response: "Against whom? They run the courts too.",
      },
    ],
  },
  {
    id: "earth-optimization-game",
    act: "act1",
    duration: 12,
    narration:
      "This is the Earth Optimisation Game. The rules are simple. Move the budget from the things that make you poorer and deader to the things that make you healthier and wealthier. That is the entire game. Your species has been playing the opposite version for 10,000 years. You are not winning.",
    visual:
      'Full Sierra title screen with the game\'s core mechanic visible from the start. Black background, twinkling pixel stars. "THE EARTH OPTIMIZATION GAME" in gold-embossed Sierra bitmap font, centered. Below the title, an animated pixel-art allocation slider — a horizontal bar with a pixel explosion icon on the left end and a pixel test tube icon on the right. The slider handle sits almost entirely on the left (current: 99% explosions). As the narration says "move the budget," an animated hand drags the slider one notch rightward (to 98%). A tiny "+$27B \u2192 CURES" label pops up. The bar barely moves — but the test tube icon pulses brighter. Below the slider: "A Point-and-Click Adventure in Civilisational Reallocation." Blinking "PRESS START" at the bottom.',
    onScreen: [
      { text: "THE EARTH OPTIMIZATION GAME", size: "giant", animation: "fadeIn", color: "gold" },
      { text: "\uD83D\uDCA5 99% EXPLOSIONS |\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500| \uD83E\uDDEA 1% CURES", size: "medium", animation: "fadeIn" },
      { text: "+$27B \u2192 CURES", size: "label", animation: "fadeIn", color: "green" },
      { text: "A Point-and-Click Adventure in Civilisational Reallocation", size: "small", animation: "fadeIn" },
      { text: "PRESS START", size: "medium", animation: "pulse" },
    ],
    sierraVerbs: [
      {
        verb: "USE common sense ON government",
        response: "I don't think that works here.",
      },
      {
        verb: "DRAG slider",
        response:
          "You have just reallocated $27 billion from explosions to cures. The military did not notice. The sick did.",
      },
    ],
  },
  {
    id: "military-health-ratio",
    act: "act1",
    duration: 8,
    narration:
      "Your governments spend $604 on the capacity for mass murder for every $1 they spend testing which medicines work. 95% of your diseases have zero approved treatments. At the current discovery rate, finding treatments for all of them takes 443 years. You personally will be dead within 80 years, which I mention not to be rude but because you seem weirdly calm about this.",
    visual:
      'Pixel art — animated zoom sequence. Start: a towering stack of pixel coins fills the entire screen top to bottom, labeled "$2,720,000,000,000 — MILITARY." The camera zooms in on the bottom-right corner — deeper, deeper — until a single pixel coin becomes visible at 64\u00D7 magnification, labeled "$4,500,000,000 — CLINICAL TRIALS." Pause. Then snap-zoom back out to full scale. The single coin disappears into the mass. The CountUp component animates the ratio from 1:1 racing to 604:1. Below, MilitaryVsTrialsPie renders — the clinical trials slice is literally one pixel wide.',
    onScreen: [
      { text: "$2,720,000,000,000 \u2014 MILITARY", size: "giant", animation: "countUp", color: "red" },
      { text: "$4,500,000,000 \u2014 CLINICAL TRIALS", size: "small", animation: "fadeIn", color: "green" },
      { text: "604 : 1", size: "giant", animation: "countUp", color: "red" },
      { text: "95% OF DISEASES: ZERO APPROVED TREATMENTS", size: "medium", animation: "fadeIn", color: "red" },
      { text: "TIME TO CURE THEM ALL: 443 YEARS", size: "small", animation: "fadeIn", color: "red" },
      { text: "YOUR LIFESPAN: 80 YEARS", size: "small", animation: "fadeIn" },
    ],
    sierraVerbs: [
      {
        verb: "LOOK AT tiny pile",
        response:
          "That is the entire global clinical trials budget. Try not to blink or you'll miss it.",
      },
      {
        verb: "USE test tube",
        response:
          "You cannot. It is being crushed by $2.72 trillion of military hardware. If cancer had oil reserves, you would have cured it by 2003.",
      },
    ],
  },
  {
    id: "economic-collapse-clock",
    act: "act1",
    duration: 10,
    narration:
      "Cybercrime costs $10.5 trillion per year and growing at 15% annually. Combined with your murder budget, your destructive economy is $13.2 trillion — 11.5% of global GDP. The Soviet Union collapsed at 15%. You are approaching their ratio with better technology, a faster-growing parasitic sector, and no plan. The Soviet Union's terrible plan beat your no plan, and the Soviet Union lost.",
    visual:
      'Pixel art — stone castle wall (King\'s Quest aesthetic) with a massive clock face. Two hands racing: red "PARASITIC (15%/yr)" spinning fast, green "PRODUCTIVE (3%/yr)" crawling behind. Below, a pixel-art line chart shows the two trajectories crossing — red overtaking green — with a flashing "X" at "2040: COLLAPSE THRESHOLD." Digital countdown ticks: "YEARS REMAINING: 14 yrs 247 days 8 hrs..."',
    onScreen: [
      { text: "DESTRUCTIVE ECONOMY: $13.2T (11.5% OF GDP)", size: "medium", animation: "pulse", color: "red" },
      { text: "SOVIET UNION COLLAPSED AT: 15%", size: "medium", animation: "fadeIn", color: "red" },
      { text: "YOUR TRAJECTORY: 25% BY 2033", size: "large", animation: "pulse", color: "red" },
      { text: "THEIR PLAN: TERRIBLE. YOUR PLAN: NONE.", size: "small", animation: "fadeIn" },
    ],
    sierraVerbs: [
      {
        verb: "USE time machine",
        response: "You don't have one. That's rather the point.",
      },
      {
        verb: "LOOK AT clock",
        response:
          "Every civilisation that reached this threshold collapsed. Soviet Union. Yugoslavia. Argentina. Zimbabwe. You are next unless you change the trajectory.",
      },
    ],
  },
  {
    id: "global-failed-state",
    act: "act1",
    duration: 10,
    narration:
      "Why spend years building a product when you can ransom a hospital in an afternoon? Why manufacture exports when hacking banks pays better? You have a name for places where this already happened. You call them failed states. Somalia. Libya. Venezuela. You watched this happen to individual countries the way someone watches a neighbour's house burn down while storing petrol in their own basement.",
    visual:
      'Pixel art — a Sierra city scene, but decaying in real-time. The scene starts as a functioning pixel town (shops, roads, people walking). As the narration progresses, pixel-art decay spreads: storefronts board up, pixel thieves appear on rooftops, roads crack, a hospital\'s red cross sign flickers and dies, pixel people flee offscreen or huddle in corners. The palette desaturates toward the Moronia greys. In the corner, a world map shows red spreading from a few countries to all continents. Text overlay: "WHEN DESTRUCTION > PRODUCTION: GLOBAL FAILED STATE."',
    onScreen: [
      { text: "SOMALIA. VENEZUELA. LEBANON.", size: "medium", animation: "fadeIn", color: "red" },
      { text: "WHEN DESTRUCTION > PRODUCTION: GLOBAL FAILED STATE", size: "large", animation: "fadeIn", color: "red" },
    ],
    sierraVerbs: [
      {
        verb: "LOOK AT city",
        response:
          "Somalia but everywhere. Venezuela but permanent. Lebanon but with no neighbouring country to flee to.",
      },
      {
        verb: "HELP",
        response:
          "There is no help command in a failed state. That is what makes it a failed state.",
      },
    ],
  },
  {
    id: "ai-hacker-spiral",
    act: "act1",
    duration: 10,
    narration:
      "North Korea cannot build an aircraft carrier, but it funds its nuclear programme by stealing $1.5 billion in cryptocurrency in a single afternoon. Russia finances military operations with ransomware. Cybercrime is war conducted through WiFi, and it pays better. Every nation you have bombed has learned that parasitising your economy is cheaper than fighting you conventionally. That is not crime. That is homework.",
    visual:
      'Pixel art — a dark server room (SQ-style villain lair). A single pixel-art robot hacker sits at a terminal. It splits into two. Those two split into four. The screen fills with multiplying hacker bots. A counter ticks: "AI HACKERS: 1... 2... 4... 1,024... 1,048,576... \u221E." Below, a loop diagram animates: STEAL $$$ \u2192 BUY COMPUTE \u2192 TRAIN MORE HACKERS \u2192 (repeat). The loop spins faster and faster. The stolen amount counter ticks up. The productive economy bar from The Clock shrinks visibly in the HUD.',
    asciiArt: `
┌──→ STEAL $$$  ──→ BUY COMPUTE ──→ TRAIN MORE HACKERS ──┐
│                                                          │
└──────────────────────────────────────────────────────────┘
RECURSIVE EXPONENTIAL THEFT`,
    onScreen: [
      { text: "AI HACKERS: 1... 2... 4... 1,024... 1,048,576...", size: "medium", animation: "countUp", color: "red" },
      { text: "STEAL $$$ \u2192 BUY COMPUTE \u2192 TRAIN MORE HACKERS", size: "small", animation: "typewriter", color: "red" },
      { text: "RECURSIVE EXPONENTIAL THEFT", size: "large", animation: "pulse", color: "red" },
    ],
    sierraVerbs: [
      {
        verb: "LOOK AT hackers",
        response:
          "Each one creates two more. The doubling model, but for destruction.",
      },
      {
        verb: "UNPLUG server",
        response:
          "You cannot unplug a distributed botnet. That is rather the point of distributed systems.",
      },
    ],
  },
  {
    id: "ai-hacker-breach",
    act: "act1",
    duration: 10,
    narration:
      "That just happened. Well, a simulation of it. A real AI hacker would not have shown you the terminal. It would not have introduced itself. It would have taken 4.7 seconds and you would have noticed six months later when your bank called.",
    visual:
      "Full-screen breach takeover. Red flashing. Fake terminal scrolls: nmap scan, password extraction, webcam capture. Punchline: Relax. That was fake. But it took 4.7 seconds. An AI hacker would not have told you.",
    score: 3_000_000_000,
    showQuestMeters: false,
    sierraVerbs: [],
  },
  {
    id: "game-over-moronia",
    act: "act1",
    duration: 10,
    narration:
      "Your civilisation spent 604 times more on weapons than on curing disease. Year 2033: destructive economy hit 25 percent of GDP. Year 2040: parasitic economy hit 50 percent. Year 2043: water wars went nuclear. The math was not on your side.",
    visual:
      'Pixel art — barren, cracked planet surface. Red-black sky. Shattered buildings. Ash drifting. Screen FREEZES. Desaturates to greyscale. GAME OVER. YOUR CIVILIZATION HAS COLLAPSED. Save file detected — RESTORE / RESTART / QUIT.',
    asciiArt: `
┌─────────────────────────────────────┐
│          G A M E   O V E R          │
│                                     │
│  YOUR CIVILIZATION HAS COLLAPSED    │
│                                     │
│  You allocated 604× more to         │
│  weapons than curing disease.       │
│  The math was not on your side.     │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌──────┐  │
│  │ RESTORE │ │ RESTART │ │ QUIT │  │
│  └─────────┘ └─────────┘ └──────┘  │
└─────────────────────────────────────┘`,
    onScreen: [
      { text: "G A M E   O V E R", size: "giant", animation: "fadeIn", color: "red" },
      { text: "You allocated 604\u00D7 more to weapons than curing disease.", size: "medium", animation: "fadeIn" },
      { text: "The math was not on your side.", size: "medium", animation: "fadeIn", color: "red" },
      { text: "RESTORE", size: "medium", animation: "fadeIn" },
      { text: "RESTART", size: "medium", animation: "fadeIn" },
      { text: "QUIT", size: "medium", animation: "fadeIn" },
    ],
    sierraVerbs: [],
  },

  // ============================================
  // THE TURN (slides 9-10)
  // Palette shift from EGA to VGA
  // ============================================
  {
    id: "restore-from-wishonia",
    act: "turn",
    duration: 10,
    chapter: "The Turn",
    narration:
      "Wishonia redirected 1% of its murder budget to clinical trials 4,297 years ago. That is where I am from. It is considerably nicer.",
    stageDirection:
      '[Cursor moves to "RESTORE" and clicks. Death dialog dissolves. Save-game file browser slides in. Clicks "wishonia_year_0.sav". "Bwoing" restore sound.]',
    visual:
      "INSTANTANEOUS hard cut. Palette explodes from EGA 16-color to VGA 256. Earth restored title. Quest meters (Healthy Life Years / Income) appear for the FIRST TIME, pulsing gently. CTA button: INITIATE EARTH OPTIMIZATION PROTOCOL.",
    asciiArt: `
┌─────────────────────────────────────┐
│  R E S T O R E   G A M E           │
│                                     │
│  ▸ earth_2026.sav      (current)   │
│  ▸ moronia_final.sav    ☠ (dead)   │
│  ▸ wishonia_year_0.sav  ★ ◄◄◄     │
│                                     │
│  ┌──────────┐ ┌────────┐           │
│  └──────────┘ └────────┘           │
└─────────────────────────────────────┘`,
    palette: "vga",
    showQuestMeters: true,
    sierraVerbs: [],
  },

  // ============================================
  // ACT II - THE QUEST (slides 11+)
  // VGA palette, hopeful, score climbs
  // ============================================

  // Part 1: The Solution
  {
    id: "one-percent-treaty",
    act: "act2",
    duration: 10,
    chapter: "Part 1: The Solution",
    narration:
      "Not building a nuclear bomb requires nothing. Rocks do it every day. Rocks have managed to live peacefully alongside different colored rocks for thousands of years. You are not asking for peace. You are asking for 1% fewer bombs. Redirect 1% of the global murder budget to clinical trials. $27 billion a year. Going from 99% bombs to 98% bombs.",
    visual:
      'Pixel art — Wishonia\'s control room. Massive wall-mounted lever with display: "MILITARY: 99%" / "CURES: 1%". Animated pixel hand nudges it one notch. Display updates: "MILITARY: 98%" / "CURES: 2%." The slot is one pixel different. Comic "that\'s it?" pause. Pixel-art scroll "1% TREATY" drops into inventory slot 1 with "cha-ching." Quest meter for INCOME nudges slightly.',
    score: 100_000,
    inventory: getInventory("the-fix"),
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "USE lever",
        response:
          "You nudge it 1%. The explosion manufacturers do not notice. Twenty-seven billion dollars just got redirected and nobody felt a thing.",
      },
    ],
  },
  {
    id: "trial-acceleration-12x",
    act: "act2",
    duration: 10,
    narration:
      "Right now, at current spending, curing all known diseases takes 443 years. Redirect 1% of the murder budget, and clinical trial capacity increases 12.3 times. 443 years compresses to 36. Your great-great-great-great-great-great-great-great grandchildren just sent their thanks.",
    visual:
      'Pixel art — two hourglasses on a workshop bench. Left: enormous, "STATUS QUO", plaque "443 YEARS", tiny sand trickle. Right: compact, "1% TREATY", plaque "36 YEARS", sand pouring 12x faster. Pixel scientist between them, pointing at right one, shrugging. Multiplier badge: "x12.3 CAPACITY." HALE quest meter fills slightly.',
    score: 1_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT left hourglass",
        response:
          "443 years. Your grandchildren's grandchildren's grandchildren would still be waiting.",
      },
      {
        verb: "LOOK AT right hourglass",
        response: "36 years. Most of you would live to see it. If you started today.",
      },
    ],
  },
  {
    id: "healthcare-vs-military-roi",
    act: "act2",
    duration: 8,
    narration:
      "Healthcare spending returns three times more economic activity per dollar than your murder budget. Your species has not noticed this because the murder budget has a better lobby.",
    visual:
      "Pixel art — two side-by-side investment windows. Left: MILITARY with a shrinking bar graph and coins falling into a pit. Right: HEALTHCARE with a growing bar graph and coins multiplying. The contrast is immediate and absurd.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    onScreen: [
      { text: "HEALTHCARE: $1 IN → $1.80 OUT", size: "large", animation: "fadeIn", color: "green" },
      { text: "MILITARY: $1 IN → $0.60 OUT", size: "large", animation: "fadeIn", color: "red" },
    ],
    score: 1_300_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT returns",
        response:
          "One makes money. One loses money. Your species chose the one that loses money. Six hundred and four times more of it.",
      },
    ],
  },
  {
    id: "economic-virtuous-loop",
    act: "act2",
    duration: 10,
    narration:
      "Disease drags down 13% of global GDP. Fifteen trillion dollars a year. Every disease you cure unlocks a permanent slice of that. Freed workers produce more. More production funds more trials. More trials cure more diseases. You have mostly been running the loop in the other direction.",
    visual:
      "Pixel art — The Marble Run (animated feedback loop). A pixel-art circular track with four stations. A glowing pixel marble rolls clockwise through: CURE DISEASES → UNLOCK GDP → MORE TAX REVENUE → BIGGER BUDGET → back to CURE DISEASES. Each cycle the marble gets bigger and moves faster. Below, a second loop in red shows the vicious version: FUND MILITARY → KILL PEOPLE → LESS GDP → PANIC → FUND MILITARY.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    onScreen: [
      { text: "13% OF GLOBAL GDP LOST TO DISEASE", size: "large", animation: "fadeIn", color: "red" },
      { text: "$15,000,000,000,000 / YEAR", size: "medium", animation: "countUp", color: "red" },
    ],
    score: 1_500_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT loop",
        response:
          "Every disease cured makes the economy bigger. A bigger economy funds more cures. More cures make it bigger still. It is almost as if spending money on keeping people alive is better for the economy than spending money on making them dead.",
      },
    ],
  },
  {
    id: "gdp-20-year-forecast",
    act: "act2",
    duration: 10,
    narration:
      "At current trajectory, your economy grows at 2.5%. Redirect 1% of the explosions budget, and it compounds at 17.9%. Over twenty years, that is the difference between $12,500 per person per year and $339,000 per person per year. One slider. Twenty-seven times more money.",
    visual:
      "Live GDP Trajectory Chart. A year counter ticks from 2025 to 2045. Two lines draw in real-time: Grey (Status Quo, 2.5%): barely rising. Green (Treaty, 17.9%): steep climb. By year 20, the green line is so far above grey that the chart rescales — the grey line flattens to a hair at the bottom.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    score: 1_800_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "COMPARE trajectories",
        response:
          "Same planet. Same people. Same twenty years. The only difference is where you point the money. $12,500 versus $339,000.",
      },
    ],
  },
  {
    id: "pluralistic-ignorance-bug",
    act: "act2",
    duration: 8,
    narration:
      "Everyone wants a world without war and disease. But everyone also thinks nobody else will agree to the steps to make it happen. So nobody does anything. Your economists call it pluralistic ignorance, which is the polite term for eight billion people waiting for permission to want what they already want. This is the dumbest reason a civilisation has ever continued dying.",
    visual:
      "Pixel art — town square (King's Quest village). Thirty pixel villagers, each with a green checkmark thought bubble. But each is turned away, arms crossed, looking at the ground — can't see anyone else's bubble. One villager in center has yellow ! quest marker (the player). The thought bubbles are visible to the viewer but not to the villagers.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "TALK TO crowd",
        response:
          "They all want the same thing. They just don't know they all want the same thing. Your job is to make the demand visible.",
      },
    ],
  },
  {
    id: "public-vs-lobbyist-90to1",
    act: "act2",
    duration: 8,
    narration:
      "The public holds $454 trillion. The concentrated interests who run your government hold $5 trillion. You outnumber them 90 to 1. Your species identified the exact collective action problem by which your governance fails, published it, assigned it in universities, and then continued to be governed by it for sixty years. You are not outgunned. You are just not coordinated.",
    visual:
      "Pixel art — a Sierra battle screen. On the left: a massive army of pixel villagers stretching to the horizon, labeled 8 BILLION. On the right: a tiny cluster of pixel lobbyists in suits, labeled ~50,000. The ratio is absurd. The lobbyists are winning anyway.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT odds",
        response:
          "You have ninety times their money and ninety times their numbers. They have a group chat. That is the entire difference.",
      },
    ],
  },
  {
    id: "dysfunction-tax-101t",
    act: "act2",
    duration: 10,
    narration:
      "Your civilisation wastes $101 trillion a year on problems everyone agrees should be fixed but nobody coordinates to fix. That is 88% of global GDP. This bug has been open for 113 years. No one has assigned it. On my planet, that developer would have been fired. On yours, they got re-elected.",
    visual:
      "Pixel art — a Sierra bug report / system error screen. The screen flickers like a CRT crash. A bug report window displays: RECEIPT: political_dysfunction_tax.exe, Status: ACTIVE, Severity: CRITICAL. Line items animate in one at a time with CountUp — Health innovation delays: $34T, Migration restrictions: $57T, Lead poisoning: $6T, Underfunded science: $4T. A running total at the bottom counts up in lockstep: $0... $34T... $91T... $97T... $101T. TOTAL ANNUAL COST: $101T. The final total pulses. \"88% of global GDP\" flashes red. \"This bug has been open for 113 years. No one has assigned it.\" typewriters in last — the punchline.",
    asciiArt: `
┌──────────────────────────────────────────┐
│  🐛 RECEIPT: political_dysfunction_tax.exe │
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
└──────────────────────────────────────────┘`,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "FIX bug",
        response: "That is what the game is for.",
      },
      {
        verb: "ASSIGN bug",
        response: "You just did. You are player #4,847.",
      },
    ],
  },
  {
    id: "win-conditions-hale-income",
    act: "act2",
    duration: 10,
    narration:
      "The entire game comes down to two numbers. Healthy life expectancy: 63.3 years, target 69.8. Median income: $18,700, target $149,000. Your species has produced 4,000 pages of UN resolutions about these numbers. This game has two progress bars. We find the bars more effective.",
    stageDirection: '[Quest notification: "QUEST OBJECTIVES REVEALED"]',
    visual:
      "Pixel art — large Sierra quest log/journal open on a wooden desk. OBJECTIVE 1: HEALTHY LIFE EXPECTANCY — Current: 63.3 years, Target: 69.8 years (+6.5), Progress bar at 0%. OBJECTIVE 2: GLOBAL MEDIAN INCOME — Current: $18,700/year, Target: $149,000/year (8x), Progress bar at 0%. DEADLINE: 2040 (14 years). REWARD: 8,000,000,000 lives aligned. Quest meters in HUD pulse and glow — the viewer now understands what they're tracking. Current values pull live from WHO (HALE) and World Bank (median income). The progress bars animate from empty to their current % of target. The deadline CountUps the remaining days in real-time.",
    asciiArt: `
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
└──────────────────────────────────────────────┘`,
    score: 5_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "READ quest log",
        response:
          "Two numbers. That is all. Your species has made this extraordinarily complicated. It is not.",
      },
    ],
  },

  // Part 2: The Game
  {
    id: "pairwise-budget-allocation",
    act: "act2",
    duration: 10,
    chapter: "Part 2: The Game",
    ctaUrl: "/agencies/dcongress/wishocracy",
    ctaLabel: "PLAY →",
    narration:
      "You see two budget categories. Drag the slider toward the one you prefer. Explosions or curing disease. Ten comparisons. Two minutes.",
    stageDirection:
      '[Quest notification: "LEVEL 1 — Allocate your civilisation\'s resources."]',
    visual:
      "Pixel art — Sierra \"duel\" layout. RPG battle, but combatants are budget categories. Round 1: EXPLOSIONS VS CLINICAL TRIALS. Cursor grabs slider, drags firmly toward CLINICAL TRIALS. Green burst. \"COMPARISON 1 of 10.\"",
    asciiArt: `
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
└──────────────────────────────────────────────────┘`,
    score: 10_000_000,
    inventory: getInventory("allocate"),
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "DRAG slider",
        response:
          "Interesting. You'd rather cure cancer than build a ninth aircraft carrier. Your politicians may want to take notes.",
      },
    ],
  },
  {
    id: "eigenvector-budget-result",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/domb",
    narration:
      "Your choices build a complete national budget using the same mathematics your species invented in 1977 and mostly uses to rank football teams.",
    visual:
      "Pixel-art horizontal bar chart grows. Each comparison adjusts a bar. Clinical Trials: 31% / Education: 22% / Infrastructure: 18% / Military: 4%. Ballot drops into inventory.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    score: 50_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT allocation chart",
        response:
          "Eigenvector decomposition. Stable preference weights from ten comparisons. Your species invented this in 1977. Used it for football. We use it for civilisation.",
      },
    ],
  },
  {
    id: "one-percent-referendum-vote",
    act: "act2",
    duration: 10,
    ctaUrl: "/prize",
    ctaLabel: "VOTE →",
    narration:
      "The 1% Treaty Referendum. Should all governments redirect 1% of the murder budget to clinical trials? That is going from 99% bombs to 98% bombs. One click. Thirty seconds. Your species has held elections about less.",
    visual:
      "Screen dims to spotlight. Single oversized Sierra dialog box: THE 1% TREATY REFERENDUM. YES and NO buttons. Cursor hovers YES. 1.5 seconds silence. Clicks. Dialog explodes with pixel confetti. Fanfare. Score jumps.",
    asciiArt: `
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
└──────────────────────────────────────────────────┘`,
    score: 100_000_000,
    inventory: getInventory("vote"),
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "CLICK yes",
        response:
          "Congratulations. You have just done more for civilisation than most parliaments manage in a decade.",
      },
      {
        verb: "CLICK no",
        response:
          "Interesting. You prefer the current ratio of 604 dollars on explosions per dollar on cures. The narrator judges you silently.",
      },
    ],
  },
  {
    id: "vote-value-asymmetry",
    act: "act2",
    duration: 8,
    narration:
      "That vote took thirty seconds. Your time cost six cents. The upside: three thousand one hundred sixty-three dollars per VOTE point, plus the fund outperforming your retirement account. That is a ratio of 140,600 to one.",
    visual:
      "Pixel art — Sierra merchant's shop. Left side: timer showing 15 minutes, \"vote + share with 10 friends.\" Right side: gold pile, \"$15.7M lifetime income gain.\" Trade arrow between them. Flashing pixel text: \"EXCHANGE RATE: 140,600 : 1.\"",
    score: 200_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "TRADE 30 seconds FOR $15.7 million",
        response:
          "The merchant stares at you. 'This is the most lopsided trade in the history of commerce. And I have been trading for 4,297 years.'",
      },
      {
        verb: "HAGGLE",
        response:
          "There is nothing to haggle. The trade is already infinitely in your favour.",
      },
    ],
  },
  {
    id: "recruit-network-effect",
    act: "act2",
    duration: 10,
    narration:
      "4 billion of you already drive to a polling station and vote for free, for a 1 in 30 million chance of changing anything. You are asking those same people to click a button on a phone. For $15.7 million. The hard part was getting people to do it for free. You solved that.",
    stageDirection:
      '[Quest notification: "LEVEL 3 — Get your friends to play. Tell two people."]',
    visual:
      "Pixel art — split into two halves. LEFT — The Concrete Action: Pixel-art phone screen showing a text message thread. Player's message: \"Play this -> optimitron.com/r/player1\". Friends \"Sarah\" and \"Mike\" reply with \"I'm playing!\" Notifications pop: \"+1 VOTE POINT\" \"+1 VOTE POINT.\" Three platform icons below (text, WhatsApp, Twitter). A prize pool counter ticks up as each friend joins. RIGHT — The Comparison That Kills the Objection: A Sierra side-by-side comparison. REGULAR VOTING: Drive to polling station, Wait in line, 1 in 30M chance of being the tiebreaker, Winner ignores you, Cost: free, Reward: nothing, People who do this: 4B. PLAYING THIS GAME: Click buttons on website, 30 seconds, Each point worth $8,436, Everyone gets 10x richer, Winner = you, Cost: free, Reward: $15.7M, People needed: 4B. The left card is greyed out and dull. The right card glows green. Chain-link drops into inventory slot 4.",
    asciiArt: `
┌──────────────────────────┐  ┌──────────────────────────┐
│  🗳 REGULAR VOTING        │  │  🎮 PLAYING THIS GAME    │
│                          │  │                          │
│  Drive to polling station│  │  Click buttons on website│
│  Wait in line            │  │  30 seconds              │
│  1 in 30M chance of      │  │  Each point worth $8,436  │
│  being the tiebreaker    │  │  Everyone gets 10× richer│
│  Winner ignores you      │  │  Winner = you            │
│  Cost: free              │  │  Cost: free              │
│  Reward: nothing         │  │  Reward: $15.7M          │
│                          │  │                          │
│  People who do this: 4B  │  │  People needed: 4B       │
└──────────────────────────┘  └──────────────────────────┘`,
    score: 500_000_000,
    inventory: getInventory("get-friends"),
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "TEXT sarah",
        response:
          "'Play this game.' Sarah opens the link. Plays. Gets her own link. Sends it to two more friends. The prize pool just grew. Your VOTE points just got more valuable.",
      },
      {
        verb: "COMPARE voting",
        response:
          "4 billion people already do something harder for nothing. You are asking them to do something easier for $15.7 million.",
      },
    ],
  },

  // Part 3: The Money
  {
    id: "prize-pool-vs-index-fund",
    act: "act2",
    duration: 10,
    chapter: "Part 3: The Money",
    narration:
      "Rich people have a secret money club called VC that earns 17% returns on average. Your retirement account is legally banned from joining. Your government decided that only rich people are smart enough to invest in things that make money. This is called investor protection. It protects you from having money. The prize pool gets you in. Side effect: curing all disease. Value each life-year saved at $150,000, multiply across the global disease burden, and the return is 84.8 million to one. Your calculator will display an error, emit a tiny electronic scream, and attempt to leave the desk. This is correct.",
    visual:
      "Pixel art — Sierra merchant's investment counter. Two options side by side: YOUR RETIREMENT FUND (Old corporations, Rent-seeking/slow, Return: 8%/year, $100 -> $317 in 15 yrs, Side effect: nothing) vs PRIZE POOL (Innovative startups, High-growth/new, Return: 17%/year, $100 -> $1,106 in 15 yrs, Side effect: curing all disease). Right option glows green. Left looks grey and dull. The goal: build the biggest prize pool in history. So every player on Earth is incentivized to win.",
    asciiArt: `
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
│  │  $100 → $317 (15 yrs)  │  │  $100 → $1,106     │  │
│  │                        │  │  (15 yrs)          │  │
│  │  Side effect: nothing  │  │  Side effect:       │  │
│  │                        │  │  curing all disease │  │
│  └────────────────────────┘  └────────────────────┘  │
│                                                      │
│  The goal: build the biggest prize pool in history.  │
│  So every player on Earth is incentivized to win.    │
└──────────────────────────────────────────────────────┘`,
    score: 650_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "COMPARE returns",
        response:
          "8% in a retirement fund versus 17% in the prize pool. Your financial advisor will not tell you about this because your financial advisor works for the 8% companies.",
      },
      {
        verb: "DEPOSIT gold coin",
        response:
          "Your money is now invested in companies building the future, instead of companies extracting rent from the past. Also, the side effect is saving civilisation.",
      },
    ],
  },
  {
    id: "dominant-assurance-contract",
    act: "act2",
    duration: 12,
    narration:
      "Deposit $100. If Earth wins, your lifetime income goes up $15.7 million. You will not miss the $100. If Earth loses, you get $1,106 back. That is a 11x return on failure. Both paths pay. Your species has a word for this. A no-brainer. Which, given the circumstances, is fitting.",
    visual:
      "Pixel art — branching path (Sierra maze fork). Player's avatar at crossroads holding gold coin. Treasure chest at fork: \"PRIZE POOL SMART CONTRACT.\" Two paths: Left path — TARGETS HIT -> pixel utopia. Pool unlocks. VOTE holders split it. Right path — TARGETS MISSED -> pile of 11x gold. Your $100 -> $1,106 back. (11x over 15 years at 17%). BOTH paths glow green. No red path. No skull. Gold coin drops into inventory slot 5.",
    asciiArt: `
                     ┌─ 🌍 TARGETS HIT ──→ [pixel utopia]
                     │   Pool unlocks.
  YOU ($100) → [CHEST] ──┤   VOTE holders split it.
                     │
                     └─ ❌ TARGETS MISSED ─→ [pile of 11× gold]
                         Your $100 → $1,106 back.
                         (11× over 15 years at 17%)`,
    score: 800_000_000,
    inventory: getInventory("prize-mechanism"),
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT paths",
        response:
          "Both are green. In one path, your friends who played get paid. In the other, you get eleven times your money back. Your species has a word for this: 'free option.'",
      },
      {
        verb: "LOOK AT chest",
        response:
          "A dominant assurance contract. It multiplies your gold whether you win or lose. The only losing move is to not put anything in.",
      },
    ],
  },
  {
    id: "vote-point-dollar-value",
    act: "act2",
    duration: 10,
    narration:
      "Every friend who plays earns you one VOTE point. Each point is worth $8,436. Two friends: $16,873. Ten friends: $1.9 million. Points cannot be bought. Only earned by getting real humans to care. Your species finally invented a currency backed by something useful.",
    visual:
      "Pixel art — Sierra character stats screen: VOTE POINT LEDGER. POINTS EARNED: 2 (from friends playing). VALUE PER POINT: $8,436. TOTAL IF HIT: $16,873. Friends Playing Table: 2 friends -> $16,873 / 5 friends -> $42,182 / 10 friends -> $84,363 / 50 friends -> $421,814. Warnings: Points are NON-TRADABLE. Cannot be purchased. Ever. Earned ONLY by getting friends to play. More players -> bigger pool -> bigger prize -> more incentive to make sure Earth wins. Two silver tokens drop into inventory slot 6. Flywheel line at bottom rendered as pixel-art cycle arrow.",
    asciiArt: `
┌────────────────────────────────────────────┐
│  ⚔️ CHARACTER — VOTE POINT LEDGER          │
│                                            │
│  CLASS:   Human (debuff: won't coordinate) │
│  ABILITY: Tell two friends (unused)        │
│  WEAPON:  Arithmetic                       │
│                                            │
│  POINTS EARNED:    2 (from friends playing)│
│  VALUE PER POINT:  $8,436                │
│  TOTAL IF HIT:     $16,873                │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  FRIENDS PLAYING TABLE              │  │
│  │  ───────────────────────────        │  │
│  │  2 friends   →  $16,873            │  │
│  │  5 friends   →  $42,182            │  │
│  │  10 friends  →  $84,363          │  │
│  │  50 friends  →  $421,814          │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ⚠ Points are NON-TRADABLE.               │
│  ⚠ Cannot be purchased. Ever.             │
│  ⚠ Earned ONLY by getting friends to play.│
│                                            │
│  More players → bigger pool → bigger prize │
│  → more incentive to make sure Earth wins  │
└────────────────────────────────────────────┘`,
    score: 1_000_000_000,
    inventory: getInventory("vote-point-value"),
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT points",
        response:
          "Non-transferable. Non-purchasable. Earned by getting friends to play. The game gets more valuable the more people are in it. That is not a bug. It is the design.",
      },
      {
        verb: "SELL points",
        response:
          "They cannot be sold. If they could be bought, the rich would own the game. The only way to earn them is to get another human being to care.",
      },
    ],
  },
  {
    id: "three-scenarios-all-win",
    act: "act2",
    duration: 10,
    narration:
      "If humanity wins, your $100 deposit goes to VOTE holders. You also became a multimillionaire in a civilisation that cured all disease. You do not mourn the $100. If humanity loses, you get $1,106 back. The only way to lose is not to play. The break-even probability is 0.0067%. That means depositing is a good bet if you believe there is even a 1 in 15,000 chance this works. Two of three outcomes are wins. The third one is your fault.",
    visual:
      "Sierra summary/stats screen — three outcomes. WORKED EXAMPLE — $100 DEPOSIT + 2 FRIENDS PLAYING. Box 1 (glows brightest): HUMANITY WINS — Your deposit: goes to VOTE holders (not you). Your VOTE points: 2 x $8,436 = $16,873. Your lifetime income: +$15.7 MILLION. Everyone is 10x richer. You don't miss $100. NET: +$16,087,000. Box 2: HUMANITY MISSES (targets not hit) — VOTE points: expire ($0). Your deposit: $100 -> $1,106 (11x yield). Still outperforms your retirement fund (3.5x). NET: +$1,010. Box 3 (dim red): DID NOT PLAY — $0 returned. $0 earned. Still paying $12,600/yr dysfunction tax. Missed $15.7M in lifetime income. NET: -$15,700,000 (opportunity cost). Two out of three outcomes are wins. The third one is your fault.",
    asciiArt: `
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
└─────────────────────────────────────────┘`,
    score: 1_500_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "WORRY ABOUT deposit",
        response:
          "Your deposit goes to VOTE holders if humanity wins. You also got $15.7 million richer. On my planet we call this a good trade.",
      },
      {
        verb: "LOOK AT outcomes",
        response:
          "Two green. One red. The red one is the one where you did nothing. That is the only scenario where you lose.",
      },
    ],
  },

  // Part 4: The Accountability
  {
    id: "government-track-record",
    act: "act2",
    duration: 10,
    chapter: "Part 4: Accountability",
    narration:
      "You spent $8 trillion on the War on Terror. Terrorism increased seventeen-fold. You spent $90 billion a year on the War on Drugs for fifty years. Overdose deaths went from 6,000 to 100,000. Combined scorecard: two programmes, $9 trillion spent, both problems seventeen times worse. At no point did anyone with budget authority check whether the spending was making the problem better or worse. The data existed. Nobody looked at it. The data did not have a lobbying firm.",
    visual:
      "Pixel art — a Sierra performance review pinned to a corkboard. Three line items with budgets and results. Each result animates in red — the numbers go the wrong direction. A star rating flickers between 1 and 0 stars. ACTION TAKEN: Bigger budget.",
    asciiArt: `
┌─────────────────────────────────────────────┐
│  📋 PERFORMANCE REVIEW — YOUR GOVERNMENT     │
│                                             │
│  PROJECT             BUDGET    RESULT       │
│  ─────────────────   ───────   ──────       │
│  War on Terror       $8T       +1,700%      │
│  War on Drugs        $4.5T     +1,600%      │
│                                             │
│  COMBINED: $9T spent. Both problems 17× worse│
│                                             │
│  PERFORMANCE RATING: ★☆☆☆☆                  │
│  ACTION TAKEN: Bigger budget                │
│                                             │
│  "The data existed. Nobody looked at it.    │
│   The data did not have a lobbying firm."   │
└─────────────────────────────────────────────┘`,
    score: 3_000_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT results",
        response:
          "Every metric went the wrong direction. Every budget went up. Your species rewards failure with funding. On my planet, we call that a perverse incentive. On yours, you call it Tuesday.",
      },
    ],
  },
  {
    id: "congress-military-trials-ratio",
    act: "act2",
    duration: 10,
    narration:
      "Your Congress spent $886 billion on the military this year. And $810 million on clinical trials. That is a ratio of 1,094 to 1. For every dollar spent trying to stop diseases from killing you, 1,094 dollars on new ways to kill other people's children. Both parties voted for this. It is not a left-right problem. It is a math problem.",
    visual:
      "Giant animated counter: 1,094:1. Below: table of 6 politicians spanning parties with name, party, military $, trials $, ratio. Color-coded by spending direction. Punchline: Both parties voted for this.",
    score: 3_500_000_000,
    inventory: getInventory("leaderboard"),
    showQuestMeters: true,
    ctaUrl: "/governments/US/politicians",
  },
  // Part 5: The Armory (tech built for hackathon)
  {
    id: "fda-approval-delay-8yr",
    act: "act2",
    duration: 8,
    chapter: "Part 5: The Armory",
    ctaUrl: "/agencies/dih/discoveries",
    narration:
      "Vioxx killed 55,000 people from heart attacks. The FDA approved it. When patients started dying, someone filled out a PDF form. A PDF. Then they faxed it. Five years and tens of thousands of corpses later, someone noticed a pattern. This is your safety system. Meanwhile, your FDA makes treatments wait 8.2 years after they have already been proven safe. Just sitting there. Being safe. For every 1 person protected from a dangerous drug, 3,070 die waiting for a safe one locked in the approval cabinet. It is a lifeguard who confirms the life preserver floats, then locks it in a cabinet while a billion people drown in line for two life jackets.",
    visual:
      "Pixel art — a Sierra waiting room. Rows of pixel patients sitting in chairs, some slumping over. A ticket counter displays \"NOW SERVING: nobody.\" A shelf behind the counter holds rows of approved drugs, gathering pixel dust. A clock on the wall shows 8.2 years passing in fast-forward.",
    asciiArt: `
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
│  ERROR RATIO:                               │
│  People saved from bad drugs:     1         │
│  People killed waiting for safe:  3,070     │
│                                             │
│  "A lifeguard who confirms the life         │
│   preserver floats, then locks it in a      │
│   cabinet for years while a billion         │
│   people drown in line."                    │
└─────────────────────────────────────────────┘`,
    score: 4_100_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT queue",
        response:
          "8.2 years. The drugs are sitting on a shelf. They work. The FDA knows they work. The patients are dying in the waiting room. This is not caution. It is manslaughter by committee.",
      },
    ],
  },
  {
    id: "decentralized-fda",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/dih/discoveries",
    narration:
      "Right now, your doctor picks treatments based on that drug rep who brought good donuts in 2003, something they half-remember from medical school, whatever the insurance company allows, and vibes. This is called evidence-based medicine, which contains the word evidence the same way grape soda contains the word grape. Food has nutrition labels. Cigarettes have warning labels. Your drugs have 40-page inserts written by lawyers having seizures, which nobody reads, including your doctor. The decentralised FDA produces Outcome Labels — what actually happens when real humans take a drug. And Treatment Rankings — every treatment ranked by what actually worked, not what had the best sales team. Forty-four times cheaper. Twelve times more capacity. Zero queue.",
    visual:
      "Two panels side by side. LEFT: an Outcome Label for Atorvastatin showing outcome bars (LDL -43%, Cardiovascular Risk -36%, HDL +5%) and side effects (Muscle Pain 8.2%, Liver Enzymes 1.2%) — like a nutrition label for drugs. RIGHT: Treatment Rankings for High Cholesterol showing 3 treatments ranked by effectiveness with safety and confidence scores. Kicker: 44x cheaper. 12.3x more capacity. Zero queue.",
    asciiArt: `
┌─────────────────────────────────────────────┐
│  🧪 DECENTRALIZED FDA                        │
│                                             │
│  OUTCOME LABEL              TREATMENT RANK  │
│  ─────────────              ──────────────  │
│  Atorvastatin 20mg          High Cholesterol│
│                                             │
│  LDL Cholesterol  ████ -43% 1. Atorvastatin │
│  CV Risk          ███  -36%    87% eff      │
│  HDL              █    +5%  2. Rosuvastatin │
│                                84% eff      │
│  Side Effects:              3. Ezetimibe    │
│  Muscle Pain: 8.2%             62% eff      │
│  Liver Enzymes: 1.2%                        │
│                                             │
│  44x cheaper. 12.3x capacity. Zero queue.  │
└─────────────────────────────────────────────┘`,
    score: 4_200_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "USE decentralized FDA",
        response:
          "For every 1 person your FDA protects from a dangerous drug, 3,070 people die waiting for a safe one locked in the approval cabinet. It's a lifeguard who confirms the life preserver floats, then locks it in a cabinet for years while a billion people drown in line for two life jackets.",
      },
    ],
  },
  {
    id: "incentive-alignment-bonds",
    act: "act2",
    duration: 8,
    narration:
      "Your grandparents funded World War Two by buying war bonds. Four percent returns and a world without Nazis. You are proposing the same thing. Campaign cost: one billion. The treaty generates twenty-seven billion per year. Eighty percent to clinical trials. Ten percent back to bond holders — that is 272% annual returns. Ten percent to the alignment SuperPAC. The split is enforced on-chain. No human touches the money. Grandma's war bonds paid 4%. Yours pay 272%. Grandma would be furious if she had not died of cancer.",
    visual:
      "Pixel art — Sierra merchant/crafting screen. An NPC \"IAB TRADER\" behind a counter. A flow diagram: INCENTIVE ALIGNMENT BONDS — CRAFTING RECIPE. INPUT: BONDS: $1 BILLION (Solidity smart contract). TREATY PASSES -> $27B/yr inflow. OUTPUT (annual, enforced on-chain): 80% TRIALS $21.6B / 10% BOND HOLDERS $2.7B / 10% ALIGNMENT SUPERPAC $2.7B. Campaign cost: $1B. Annual return: $27B. Forever. Solidity contract icon visible on the bond. Hypercert badge on the trials output. The output slots glow as they fill.",
    asciiArt: `
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
└─────────────────────────────────────────────────────┘`,
    score: 4_500_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "BUY bonds",
        response:
          "The campaign costs one billion. The treaty generates twenty-seven billion per year. Indefinitely. Your financial advisor would call this a good deal. If your financial advisor understood anything other than index funds.",
      },
    ],
  },
  {
    id: "smart-contract-superpac",
    act: "act2",
    duration: 8,
    narration:
      "The NRA already perfected this technology. They give politicians a letter grade and your senators are more afraid of a bad mark than a mass shooting. You are plagiarising their system and replacing guns with not dying from diseases. Eight billion citizens rank priorities through pairwise comparisons. The algorithm compares every politician's voting record against those preferences. Alignment score. Ten percent of treaty revenue flows into a SuperPAC smart contract that allocates campaign funding automatically. Vote with citizens? Money. Vote against? Nothing. Lobbyists do not have beliefs. They have clients. You are giving them a better client.",
    visual:
      "4-step algorithm pipeline at top: Citizens rank priorities (pairwise) → Compare to voting record (every bill) → Alignment score (on-chain) → Fund or defund (10% of treaty revenue). Below: politician leaderboard with alignment scores and FUNDED/NOTHING status. High-aligned get coins, low-aligned get nothing. Punchline: No dinners. No lobbyists. No phone calls.",
    score: 4_700_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT algorithm",
        response:
          "Citizens rank priorities via pairwise comparisons. The contract compares each politician's voting record against those preferences. Alignment score. Automatic funding. No human in the loop. No dinner required.",
      },
    ],
  },
  {
    id: "ipfs-immutable-storage",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/dgao",
    narration:
      "Eight billion people. Their priorities. Their health outcomes. Every policy grade. Every budget preference. Encrypted so only the owner can read it. Aggregated so the Optimitron can act on it. Stored on a decentralized network where no government can delete it, no lobbyist can edit it, and no administration can classify it. Your species stores its census data on servers controlled by the people being graded. We store ours where the math is the only authority.",
    visual:
      "Vertical data pipeline. Top: '8 BILLION CITIZENS' source bar with encryption indicator (AES-GCM-256). Middle: 2x2 grid of four data type cards — Citizen Priorities (pairwise rankings), Policy Grades (A-F welfare scores), Health Evidence (N-of-1 results), Encrypted Submissions (individual data, owner-only decryption). Bottom: STORACHA + IPFS destination bar. Down-arrows connect each layer. Punchline: 'Your species stores its census data on servers controlled by the people being graded.'",
    onScreen: [
      { text: "THE DECENTRALIZED CENSUS", size: "large", animation: "fadeIn", color: "yellow" },
      { text: "8 BILLION CITIZENS → ENCRYPTED → STORACHA + IPFS", size: "small", animation: "fadeIn" },
    ],
    score: 5_200_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "DELETE evidence",
        response:
          "ACCESS DENIED. Content-addressed storage cannot be altered. That is the point. Your government's legal team has been notified and is reportedly quite upset.",
      },
      {
        verb: "LOOK AT data",
        response:
          "Four types. Citizen priorities — pairwise-ranked by real humans. Policy grades — every law scored A through F by welfare impact. Health evidence — N-of-1 trial results with evidence grades. And encrypted individual submissions that only the owner can decrypt. All on IPFS. All permanent. Your current system stores its report cards on the teacher's laptop.",
      },
      {
        verb: "DECRYPT submission",
        response:
          "AES-GCM-256 encryption. The key lives with the citizen, not the government. You can verify the aggregate without seeing any individual's data. On my planet, this is called obvious. On yours, it is called cryptography and requires a conference.",
      },
    ],
  },
  {
    id: "impact-certificates",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/dgao",
    narration:
      "On your planet, proving you did something useful works on the honour system. 'I recruited voters.' How many verified? 'Trust me.' On Wishonia, every claim of impact gets a receipt — published to a protocol no one controls. You recruit verified voters, you get a Hypercert. You fund the prize pool, you get a Hypercert. You rank 142 budget priorities so the algorithm knows what you actually want, you get a Hypercert. Permanent. Auditable. On Bluesky. Your species calls this 'radical accountability.' We call it 'a receipt.'",
    visual:
      "Pixel art — Sierra achievement/badge screen. A grid of Hypercert badges: one for voter recruitment (7 verified voters, 58.3% rate), one for a $500 PRIZE pool deposit, one for completing 142 pairwise preference comparisons across 8 budget categories. Each badge shows AT Protocol URIs and measurement data. One badge animates being minted with a stamp of approval.",
    score: 5_400_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "VERIFY claim",
        response:
          "Every Hypercert is an AT Protocol record — activity claim, measurements, evaluation. Published to Bluesky. Content-addressed. The opposite of 'trust me, we spent it wisely.'",
      },
      {
        verb: "LOOK AT badge",
        response:
          "This Hypercert says you recruited seven verified voters. Verification rate: 58.3%. Method: World ID personhood verification. Published to AT Protocol. Your current system's equivalent is a spreadsheet someone emailed once and then lost.",
      },
    ],
  },
  {
    id: "decentralized-irs",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/dtreasury/dirs",
    narration:
      "Your tax code is 74,000 pages. It employs 83,000 people to enforce it. A 0.5% transaction tax does the same job in four lines of Solidity. The four lines are auditable. The 74,000 pages are not.",
    visual:
      "Pixel art — a Sierra scroll unfurling endlessly on the left (the tax code, page after page). On the right, a tiny glowing terminal with four lines of code. The scroll keeps unfurling. The code does not change.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    score: 5_400_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT IRS",
        response:
          "74,000 pages of tax code. 83,000 employees. All replaceable by a flat 0.5% transaction tax in four lines of Solidity. The four lines are auditable. The 74,000 pages are not.",
      },
    ],
  },
  {
    id: "decentralized-welfare",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/dtreasury/dssa",
    narration:
      "Your species runs 83 welfare programs across 6 agencies. The overhead is extraordinary. Universal basic income, distributed automatically via World ID: one program. Zero agencies. No application form. No waiting list. No one deciding whether you deserve to eat.",
    visual:
      "Pixel art — a Sierra government office with long queues and stamping bureaucrats on the left. On the right, a single clean terminal that just says DEPOSITED. No queue. No forms. No office.",
    asciiArt: `
┌─────────────────────────────────────────────┐
│  🏛️ WELFARE REPLACEMENT                      │
│                                             │
│                CURRENT     REPLACEMENT      │
│  ──────────────────────────────────────     │
│  Programs       83          1              │
│  Agencies       6           0              │
│  Forms          Hundreds    0              │
│  Wait time      Months      0              │
│  Bureaucrats    Thousands   0              │
│  Deserve food?  Committee   You're human   │
│                                             │
│  METHOD: UBI via World ID (automatic)       │
└─────────────────────────────────────────────┘`,
    score: 5_500_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "APPLY for welfare",
        response:
          "Form 1 of 47. Estimated processing time: 6-8 weeks. Or: use the smart contract. Processing time: now.",
      },
    ],
  },
  {
    id: "decentralized-federal-reserve",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/dtreasury/dfed",
    narration:
      "Twelve unelected humans meet eight times a year to decide how much your money is worth. Since 1913 they have destroyed 97 percent of the dollar's value. When they print new money, it goes to banks and asset holders first. Everyone else gets the inflation. This smart contract replaces them with an algorithm. Zero percent inflation, anchored to productivity growth. New money distributed equally to every human via UBI. No meetings. No favourites. No 97 percent.",
    visual:
      "3-column comparison table: Label | FED | Smart Contract. Rows stagger in. Clean, data-forward layout. No pixel art — the numbers speak for themselves.",
    asciiArt: `
┌─────────────────────────────────────────────┐
│  🏦 A DECENTRALIZED FEDERAL RESERVE          │
│                                             │
│              FED          SMART CONTRACT    │
│  ──────────────────────────────────────     │
│  Who decides  12 unelected  Algorithm      │
│  New $ goes   Banks/assets  Everyone (UBI) │
│  Inflation    97% destroyed 0% (automatic) │
│  Consulted    0             8,000,000,000  │
│  Tax filing   70,000 pages  0.5% auto-tax  │
│  Auditable    Never         View source    │
│  Wars funded  All of them   0              │
└─────────────────────────────────────────────┘`,
    score: 5_600_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT fed",
        response:
          "Twelve people. Eight meetings a year. 97% of your currency destroyed. New money goes to banks first, inflation goes to everyone else. On my planet we call this 'theft with a spreadsheet.'",
      },
    ],
  },
  {
    id: "optimal-policy-generator",
    act: "act2",
    duration: 8,
    ctaUrl: "/agencies/dcbo",
    narration:
      "The Optimal Policy Generator. It looks at what every country tried and what actually happened. Not which policies were popular. Which ones moved the numbers. How many healthy years did they add? What did they do to income? Each policy gets a grade — A through F — based on Bradford Hill causal criteria. Nine dimensions of evidence, weighted by experimental quality. It does not have a favourite party. It does not have donors. It has arithmetic.",
    visual:
      "Table with five columns: Policy, Health (years gained), Income (pp/yr), Grade (A-F), and Action (ENACT/MAINTAIN/REPLACE/REPEAL). Rows animate in one by one. Tobacco tax row shows current→target ($1.41→$2.50). Health/income values are green for positive, red for negative — showing trade-offs clearly. War on Drugs gets an F grade and REPEAL. Punchline: 'Ranked by what actually happened. Not by who donated.'",
    asciiArt: `
┌────────────────────────────────────────────────────────────────┐
│  🔬 OPTIMAL POLICY GENERATOR                                   │
│                                                                │
│  POLICY                  HEALTH    INCOME   GRADE   ACTION     │
│  ─────────────────────   ───────   ──────   ─────   ────────   │
│  🇵🇹 Drug Decrim          +0.25yr   +0.03pp   A     ✅ ENACT   │
│  🏥 Universal Healthcare  +0.40yr   +0.05pp   A     ✅ MAINTAIN│
│  🚬 Tobacco Tax           +0.25yr   -0.02pp   A     🔄 REPLACE│
│     ($1.41→$2.50)                                              │
│  ⚔️  War on Drugs         -0.15yr   -0.01pp   F     ❌ REPEAL  │
│  🏦 Quantitative Easing   +0.00yr   -0.03pp   D     ❌ REPEAL  │
│                                                                │
│  Health = healthy life-years · Income = growth pp/yr           │
│  Grade = A-F evidence strength (Bradford Hill causal criteria) │
│                                                                │
│  Ranked by what actually happened. Not by who donated.         │
└────────────────────────────────────────────────────────────────┘`,
    onScreen: [
      { text: "OPTIMAL POLICY GENERATOR", size: "large", animation: "fadeIn", color: "green" },
      { text: "POLICY · HEALTH · INCOME · GRADE · ACTION", size: "small", animation: "fadeIn" },
    ],
    score: 4_900_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "USE policy generator",
        response:
          "It analyses what actually worked. No ideology. No party. Just outcomes. A novel concept for your species.",
      },
    ],
  },
  {
    id: "drug-policy-natural-experiment",
    act: "act2",
    duration: 10,
    narration:
      "Portugal decriminalised all drugs in 2001. Overdose deaths dropped 80%. America spent $47 billion a year on the War on Drugs. Overdose deaths rose 1,700%. One country looked at the evidence. The other one declared war on it.",
    visual:
      "Pixel art — the policy generator machine from the previous slide, now with output. A comparison display shows Portugal vs America side by side. The contrast is devastating.",
    asciiArt: `
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
└─────────────────────────────────────────────┘`,
    score: 5_000_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT data",
        response:
          "The data has existed for 25 years. One country looked at it. The rest declared war on the problem and made it worse. Your species has an unusual relationship with evidence.",
      },
    ],
  },
  {
    id: "optimal-budget-generator",
    act: "act2",
    duration: 10,
    ctaUrl: "/agencies/domb",
    narration:
      "The Optimal Budget Generator. Feed it spending data and outcomes across countries. It finds the cheapest high performer for each category. Singapore spends three thousand per person on healthcare. America spends twelve thousand. Singapore lives six and a half years longer. Every dollar past the diminishing returns curve is not healthcare. It is paperwork.",
    visual:
      "Pixel art — a Sierra budget control panel. Three columns: USA CURRENT (red), CHEAPEST HIGH PERFORMER (green), and OVERSPEND ratio (amber). Each row animates with the comparison. Healthcare: USA $12.6K vs Singapore $3K, 4.2× overspend. Military: $886B vs $271B deterrence floor, 3.3× overspend. Education: 4.9% GDP vs Singapore 2.9% GDP, 1.7× overspend. Summary: more money, worse outcomes vs less money, better outcomes. Footer: DIFFICULTY: looking at the data.",
    asciiArt: `
┌──────────────────────────────────────────────────────┐
│  💰 OPTIMAL BUDGET GENERATOR                          │
│                                                      │
│          🇺🇸 USA (CURRENT)  CHEAPEST HIGH    OVERSPEND│
│                             PERFORMER                │
│  ──────────────────────────────────────────────────── │
│  🏥 Health  $12.6K/person   🇸🇬 $3.0K/person    4.2× │
│             77.5 yrs LE         84.1 yrs LE          │
│                                                      │
│  ⚔️ Military $886B          🛡️ $271B            3.3× │
│             0.6× mult           realloc → 7× ROI     │
│                                                      │
│  📚 Edu     4.9% GDP        🇸🇬 2.9% GDP        1.7× │
│             PISA 465            PISA 575             │
│                                                      │
│  PATTERN: more $, worse     less $, better           │
│  DIFFICULTY: looking at the data                     │
└──────────────────────────────────────────────────────┘`,
    score: 5_100_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "OPTIMIZE budget",
        response:
          "Less money, better outcomes. On every single line item. Singapore figured this out. Your species can too.",
      },
    ],
  },
  {
    id: "pencil-supply-chain",
    act: "act2",
    duration: 12,
    narration:
      "Look at this pencil. There is not a single person in the world who can make this pencil. The wood comes from a tree in Washington. To cut that tree took a saw. To make the saw took steel. To make steel took iron ore. The graphite comes from mines in South America. The rubber from Malaya. Thousands of people cooperated to make this pencil. People who don't speak the same language. Who might hate each other if they ever met. No one sitting in a central office gave orders. No master mind planned it. The price system — and nothing else — turned their selfishness into pencils. Your species does this billions of times a day without noticing. And yet you think you need a committee to cure a disease.",
    visual:
      "Central pencil with radial supply chain nodes connected by lines. Nodes appear one at a time: Wood (Washington), Saw (Oregon), Steel (Pennsylvania), Iron Ore (Minnesota), Graphite (South America), Rubber (Malaya), Brass, Paint. Counter ticks up: STRANGERS COOPERATING: 100,000. Stats: CENTRAL PLANNER: NONE / MASTER MIND: NONE / COST: $0.25. Punchline: THE PRICE SYSTEM DID IT.",
    asciiArt: `
┌─────────────────────────────────────────────┐
│  ✏️ I, PENCIL                                │
│                                             │
│  🪵 Washington  🪚 Oregon   ⚙️ Pennsylvania │
│       \\            |           /            │
│        \\           |          /             │
│  ⛏️ Minnesota ──── ✏️ ──── 🌿 Malaya       │
│        /           |          \\             │
│       /            |           \\            │
│  🔧 ???        🎨 ???                       │
│                                             │
│  STRANGERS COOPERATING: 100,000            │
│  CENTRAL PLANNER: NONE                     │
│  MASTER MIND: NONE                         │
│  COST: $0.25                               │
│                                             │
│  THE PRICE SYSTEM DID IT.                  │
└─────────────────────────────────────────────┘`,
    onScreen: [
      { text: "I, PENCIL", size: "large", animation: "fadeIn" },
      { text: "SUPPLY CHAIN DIAGRAM: WOOD → SAW → STEEL → IRON ORE → GRAPHITE → RUBBER → BRASS → PAINT", size: "small", animation: "stagger" },
      { text: "STRANGERS COOPERATING: 100,000. CENTRAL PLANNER: NONE.", size: "medium", animation: "fadeIn" },
      { text: "THE PRICE SYSTEM DID IT.", size: "medium", animation: "fadeIn", color: "gold" },
    ],
    score: 5_800_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT pencil",
        response:
          "The wood is from Washington. The graphite from South America. The rubber from Malaya. Thousands of strangers who will never meet. No central planner. No master mind. Cost: twenty-five cents. Method: everyone wanted money.",
      },
    ],
  },
  {
    id: "disease-cure-supply-chain",
    act: "act2",
    duration: 14,
    narration:
      "Now look at this cured disease. The researcher in Lagos who found the cheaper trial does not know the lobbyist in Brussels who passed the directive. The lobbyist does not know the nonprofit in Manila that recruited a million voters. The voters do not know the bondholder in New York whose greed funded the campaign. The bondholder does not know the politician in Delhi who voted yes because the SuperPAC funded her opponent last time she voted no. Millions of people cooperated to cure this disease. No one gave orders.",
    visual:
      "Pixel art — the pencil from the previous slide morphs into a pixel test tube. The supply chain lines transform: pixel researcher in Lagos, pixel lobbyist in Brussels, pixel volunteer in Manila, pixel bondholder in New York, pixel politician in Delhi, pixel patient in Dhaka. Each appears one at a time as the narration names them. Lines connect them all to the glowing test tube at center. None of them face each other. None of them know each other exists. The test tube pulses with light.",
    asciiArt: `
┌─────────────────────────────────────────────┐
│  🧪 I, CURED DISEASE                        │
│                                             │
│  👩‍🔬 Lagos      → cheaper trial design       │
│  🤝 Brussels   → passed the directive       │
│  📱 Manila     → recruited 1M voters        │
│  💰 New York   → funded the campaign        │
│  🏛️ Delhi      → voted yes                  │
│  🏥 Dhaka      → enrolled in the trial      │
│                                             │
│  People cooperating:         millions       │
│  People who know each other: none           │
│  Central coordinator:        none           │
│  Orders given:               zero           │
│                                             │
│  Method: everyone wanted money              │
│  Result: cured disease                      │
└─────────────────────────────────────────────┘`,
    onScreen: [
      { text: "NOW LOOK AT THIS CURED DISEASE", size: "large", animation: "fadeIn" },
      { text: "RESEARCHER IN LAGOS → LOBBYIST IN BRUSSELS → VOTERS IN MANILA", size: "small", animation: "stagger" },
      { text: "→ BONDHOLDER IN NEW YORK → POLITICIAN IN DELHI → PATIENT IN DHAKA", size: "small", animation: "stagger" },
      { text: "MILLIONS COOPERATED. NO ONE GAVE ORDERS.", size: "medium", animation: "fadeIn", color: "gold" },
    ],
    score: 6_500_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT supply chain",
        response:
          "The researcher does not know the lobbyist. The lobbyist does not know the voters. The voters do not know the bondholder. And yet the disease is cured. Same principle as the pencil. Bigger pencil.",
      },
    ],
  },
  {
    id: "alignment-switch",
    act: "act2",
    duration: 10,
    narration:
      "Two numbers on a Scoreboard and pieces of paper with presidents on them did what no committee, no charity, and no central plan has ever done.",
    visual:
      "Pixel art — all the machinery from the previous slides assembles into a single gleaming machine. The pencil supply chain, the disease supply chain, the bonds, the SuperPAC, the trials — all visible as interlocking gears. In the center: a single large lever labeled SWITCH. The camera slowly zooms into the lever. A pixel hand reaches for it. Pause. The hand pulls it. Everything lights up. The Scoreboard from earlier appears: HALE and INCOME meters filling. The score counter accelerates.",
    asciiArt: `
┌─────────────────────────────────────────────┐
│  🔌 THE SWITCH                               │
│                                             │
│  Two numbers on a Scoreboard                │
│  and pieces of paper with presidents on them│
│  did what no committee, no charity,         │
│  and no central plan has ever done.         │
│                                             │
│         ┌──────────────┐                    │
│         │              │                    │
│         │   ╔══════╗   │                    │
│         │   ║ ON   ║   │                    │
│         │   ╚══════╝   │                    │
│         │     ◄────    │                    │
│         │              │                    │
│         └──────────────┘                    │
│                                             │
│  You do not need to build the machinery.    │
│  You need to turn it on.                    │
└─────────────────────────────────────────────┘`,
    onScreen: [
      { text: "TWO NUMBERS ON A SCOREBOARD", size: "medium", animation: "fadeIn" },
      { text: "AND PIECES OF PAPER WITH PRESIDENTS ON THEM", size: "medium", animation: "fadeIn" },
      { text: "DID WHAT NO COMMITTEE, NO CHARITY, AND NO CENTRAL PLAN HAS EVER DONE.", size: "large", animation: "fadeIn", color: "gold" },
      { text: "HERE IS THE SWITCH.", size: "giant", animation: "pulse", color: "green" },
    ],
    score: 7_000_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "PULL switch",
        response:
          "The machinery is already built. The bonds exist. The SuperPAC exists. The trials exist. The Scoreboard exists. All that is missing is you.",
      },
    ],
  },

  // ============================================
  // ACT III - THE ENDGAME (slides ~35+)
  // ============================================
  {
    id: "personal-income-3-timelines",
    act: "act3",
    duration: 12,
    chapter: "Act III: The Endgame",
    narration:
      "If the treaty passes, your lifetime income goes up by $15.7 million. Per person. Not per country. Per. Person. Communism took over half your planet and collapsed in a single human lifetime. Without fax machines. It required mass murder and was a terrible idea. You have the internet and an idea that mainly requires people to click a button and then receive money. The cost of not taking this deal is $15.7 million.",
    visual:
      "Pixel art — three Sierra save-game slots, each with tiny pixel scene and stats. Slot 1 (Status Quo) actively desaturates — the pixel city gets smoggier, buildings crumble slightly, pixel people hunch over, numbers CountUp to depressing values, [LOADED] tag blinks accusingly. Slot 2 (1% Treaty) actively brightens — parks bloom with green pixels, hospital lights turn on, pixel people stand taller, $15.7M CountUps from $0 in golden text, ◄◄◄ arrow pulses. Slot 3 (Wishonia Trajectory) gleams impossibly — the Wishonia paradise rendered in miniature, every pixel radiating, $54.3M in white-gold. The visual hierarchy makes Slot 1 feel like a mistake and Slot 2 feel like an obvious upgrade. Glowing deed drops into inventory slot 7.",
    asciiArt: `
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
└────────────────────────────────────────────────────┘`,
    score: 6_000_000_000,
    inventory: getInventory("personal-upside"),
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "LOOK AT slot 1",
        response:
          "Status quo. $1.34 million lifetime income. You are losing $12,600 a year to a system bug.",
      },
      {
        verb: "LOOK AT slot 3",
        response:
          "$54.3 million. My planet chose this 4,297 years ago. We have not regretted it.",
      },
      {
        verb: "LOAD slot 2",
        response:
          "You cannot load it from here. You have to earn it. That is rather the point of the game.",
      },
    ],
  },
  {
    id: "ten-billion-lives-saved",
    act: "act3",
    duration: 12,
    narration:
      "10.7 billion. More than every human currently alive. That is the number of lives saved by compressing the cure timeline from 443 years to 36. Your species rounded it down and moved on to the next agenda item.",
    visual:
      "Skulls transform to smiles around the border. Center: massive animated counter ticking to 10.7B lives saved. Below: six stat boxes showing the optimized world — $2.7T murder budget, $27.2B 1% redirect, 10.7B lives saved, +6.5 healthy years, +$14.7M income gain per person, 12× richer. Celebration particles (stars, sparkles, confetti) rain upward.",
    onScreen: [
      { text: "1% MILITARY → 12.3× CLINICAL TRIAL CAPACITY", size: "label", animation: "fadeIn" },
      { text: "LIVES SAVED OVER 100 YEARS", size: "large", animation: "fadeIn" },
      { text: "10,700,000,000", size: "giant", animation: "countUp", color: "green", source: "dFDA.livesSaved" },
      { text: "$2.7T/yr murder budget → $27.2B/yr to clinical trials", size: "small", animation: "fadeIn" },
      { text: "+6.5 healthy years · +$14.7M income · 12× richer", size: "small", animation: "fadeIn", color: "green" },
    ],
    score: 7_500_000_000,
    showQuestMeters: true,
    sierraVerbs: [
      {
        verb: "COUNT lives",
        response:
          "More than the total number of humans who have ever lived. That is what is at stake. No pressure.",
      },
    ],
  },
  {
    id: "final-call-to-action",
    act: "act3",
    duration: 15,
    ctaUrl: "/prize",
    ctaLabel: "PLAY NOW →",
    narration:
      "Somewhere on your planet, a compound that would save a life is sitting on a shelf, untested, because the money that would have funded the trial bought a missile that is also sitting on a shelf, unused. Two shelves. One has a cure. One has a bomb. Neither is being used. This game is alignment software for the most powerful superintelligence on your planet. And unlike the version made of silicon — this one you can fix with a vote.",
    visual:
      "Full planet view from space. Halfway transformed — bright continents where pixel people stand, dark where crosses remain. Death counter still ticking but slower. Stars twinkling. Wishonia's portrait shifts from sardonic to something approaching sincerity — the only time in the entire demo. Dramatic pause after 'misaligned.' Two seconds of just the image breathing. Then Sierra title screen returns — same gold font, same starfield. Score: 8,000,000,000 of 8,000,000,000. Quest meters: 100%. All 8 inventory slots full and glowing. Final dialog: CONGRATULATIONS! You have completed THE EARTH OPTIMIZATION GAME. Lives saved: all of them. PLAY NOW button pulses. Music resolves to a single held chord. Silence.",
    asciiArt: `
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
└─────────────────────────────────────────┘`,
    stageDirection: "[Beat. Then:]",
    score: 8_000_000_000,
    showQuestMeters: true,
  },
  {
    id: "post-credits-aliens",
    act: "act3",
    duration: 0, // Manual advance / end screen
    narration:
      "The universe is literally offering you infinite money and eternal life, and you are thinking about it. This is why aliens don't visit.",
    visual:
      "Narrator text box on pure black. Wishonia's portrait: faintest smirk — one pixel of mouth moved upward. Cursor blinks. Nothing else. Hold 3 seconds, then fade.",
    stageDirection:
      "[2 seconds of black. UI chrome disappears. Total darkness. Then just the narrator box fades in:]",
    showQuestMeters: true,
  },
];

// Chapter markers for navigation
export const CHAPTERS = [
  { id: "act1", name: "Act I: The Horror", slideIndex: 0 },
  { id: "turn", name: "The Turn", slideIndex: 12 },
  { id: "act2-1", name: "The Solution", slideIndex: 13 },
  { id: "act2-2", name: "The Game", slideIndex: 22 },
  { id: "act2-3", name: "The Money", slideIndex: 27 },
  { id: "act2-4", name: "Accountability", slideIndex: 31 },
  { id: "act2-5", name: "The Armory", slideIndex: 33 },
  { id: "act3", name: "Act III: Endgame", slideIndex: 48 },
];

// ============================================
// PRESENTATION METADATA
// Everything below is used by generate-readme.ts
// ============================================

export const ACT_NAMES: Record<string, string> = {
  act1: "ACT I — THE HORROR",
  turn: "THE TURN — RESTORE GAME",
  act2: "ACT II — THE QUEST",
  act3: "ACT III — THE ENDGAME",
};

export const SCORE_DESCRIPTIONS: Record<string, string> = {
  "act1-all": "Nothing has been done yet. Counter mocks the viewer.",
  "game-over-moronia": "Score resets to 0. Death screen.",
  "restore-from-wishonia": "Score reappears. Quest meters appear.",
  "one-percent-treaty": "First hint of progress.",
  "trial-acceleration-12x": "Momentum building.",
  "healthcare-vs-military-roi": "The ROI contrast lands.",
  "economic-virtuous-loop": "The feedback loop clicks.",
  "gdp-20-year-forecast": "The 20-year gap is visible.",
  "win-conditions-hale-income": "Win conditions defined. Quest meters pulse.",
  "pairwise-budget-allocation": "Player engagement starts.",
  "eigenvector-budget-result": "Budget designed in 2 minutes.",
  "one-percent-referendum-vote": "Critical mass approaching.",
  "vote-value-asymmetry": "The asymmetry clicks.",
  "recruit-network-effect": "Network effect.",
  "prize-pool-vs-index-fund": "Better than your retirement fund.",
  "dominant-assurance-contract": "Two paths, both green.",
  "vote-point-dollar-value": "NOW the value makes sense.",
  "three-scenarios-all-win": "All three scenarios laid out.",
  "government-track-record": "Government performance review: 1 star.",
  "congress-military-trials-ratio": "1,094:1. Both parties voted for this.",
  "fda-approval-delay-8yr": "The queue is the killer.",
  "decentralized-fda": "Same trials, no waiting room.",
  "optimal-budget-generator": "Less money, better outcomes. Every category.",
  "decentralized-irs": "74,000 pages → 4 lines of code.",
  "decentralized-welfare": "83 programs → 1 smart contract.",
  "decentralized-federal-reserve": "print(money): FUNCTION REMOVED.",
  "personal-income-3-timelines": "Act II climax. Personal upside lands.",
  "final-call-to-action": 'Full alignment. "YOU HAVE WON."',
};

export const SIERRA_FRAMING = {
  overview:
    "The entire demo is presented as a Sierra-style point-and-click adventure game. Wishonia is the narrator — same role as the Space Quest narrator who mocks Roger Wilco for dying in increasingly stupid ways. Except here, the dying is real and the stupid decisions are made by 8 billion people.",

  chromeAsciiArt: `
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
└──────────────────────────────────────────────────────────────┘`,

  hudElements: [
    'Score counter (top-left): 0 of 8,000,000,000. Ticks up as the game progresses. Represents "lives aligned."',
    "Death ticker (top-right): ☠ 150,000/day — always counting, always visible, relentless. Red digits.",
    "Quest meters (mid-bar): Two progress bars showing current → target for HALE and Median Income. Hidden in Act I. Appear at The Turn (Wishonia). Fill through Act II. Hit 100% on completion screen.",
    "Narrator text box (bottom): Blue gradient box. Wishonia's pixel portrait on the left (48×48, slightly animated — blinking, occasional eyebrow raise). Narration text typewriter-animates character by character (~30 chars/sec).",
    "Verb bar + Inventory (bottom edge): Look / Use / Walk / Talk icons. 8 inventory slots that fill as the player collects items. Decorative in auto-play, functional in interactive mode.",
    "Cursor: Sierra-style crosshair, changes contextually (eye, hand, boots, speech bubble). Tracks mouse to prove it's not a video.",
  ],
};

export const PACING = {
  act1: "Dark pixel art scenes. EGA 16-color palette. Ominous chiptune. Score stays at 0. Quest meters hidden. Each slide is 8–10s. Fast cuts. Escalating dread.",
  gameOver:
    "Moronia = death screen. Wishonia = restore from alternate save. EGA→VGA palette shift. Quest meters appear.",
  act2: "VGA palette. Upbeat chiptune. Score climbs. Inventory fills.",
  act3: "Score approaching max. 10.7B lives (emotional scale) → Close → Easter egg.",
  sound: [
    "Act I: Minor-key chiptune. Ticking clock undertone. Death ticker has a faint heartbeat pulse.",
    "Game Over: Sierra death jingle (dun-dun-dun-duuuun).",
    'Restore: Save-game "bwoing", then immediate bright major-key shift.',
    'Act II: Upbeat quest music. "Cha-ching" on inventory pickups. Quest meter fill has a rising pitch.',
    "Act III: Full heroic chiptune theme building to resolution. Final chord sustains, then silence.",
  ],
};

export const TECHNICAL_NOTES = {
  implementation: [
    "Color palette: EGA 16-color for Act I, VGA 256 for Acts II–III (palette upgrade IS the tonal shift at Wishonia)",
    "Font: Sierra bitmap for narrator box. Arcade font for headers/score/quest meters.",
    "Text speed: ~30 chars/sec typewriter. Click to skip.",
    "Portrait: Wishonia 48×48 pixel art, slightly animated (blinking, eyebrow, one smirk in post-credits)",
    "Quest meters: HALE + Income progress bars. Hidden Act I. Appear at Wishonia. Fill through Act II. 100% at completion.",
  ],
  keyRules: [
    "Never introduce a value before the mechanism that creates it (Prize pool → VOTE point value)",
    "One concept per slide — if a slide explains two things, split it",
    "The Armory shows every piece of tech built for the hackathon — judges need to see these",
    "Personal upside ($15.7M) is the LAST thing before Act III — it's the gut punch",
  ],
};

// ============================================
// HELPERS
// ============================================

export function getSlideById(id: string): SlideConfig | undefined {
  return SLIDES.find((slide) => slide.id === id);
}

export function getChapterForSlide(slideIndex: number): string {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (slideIndex >= CHAPTERS[i].slideIndex) {
      return CHAPTERS[i].name;
    }
  }
  return CHAPTERS[0].name;
}
