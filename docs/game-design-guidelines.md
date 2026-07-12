# Game UI Design Guidelines

> **Scope:** applies only to `/demo`, the Sierra slide decks, and other
> explicitly game/demo screens. Public treaty/campaign surfaces use the
> black-and-white treaty/editorial style mandated in [../AGENTS.md](../AGENTS.md)
> and [../CLAUDE.md](../CLAUDE.md) — when the two conflict on a public page,
> treaty style wins.

> **The game IS the app.** Optimitron looks like a Sierra Online adventure game because the core
> metaphor is "Earth is a game and we're playing it wrong." Every page should feel like a screen
> in that game — bold typography, animated data, CRT effects, and intentional surface contrast.

**Reference implementation:** `packages/web/src/components/demo/` and
`packages/web/src/components/demo/slides/sierra/`.

**Live demo:** `http://localhost:3001/demo?playlist=protocol-labs`

---

## 1. Design Philosophy

- **Sierra Online adventure game meets data visualization.** The aesthetic comes from 1990s
  point-and-click adventure games — pixelated fonts, CRT scanlines, limited color palettes,
  typewriter text reveals.
- **Data is the hero.** Numbers, charts, and comparisons take center stage. Text is minimal — the
  narrator (Wishonia) handles exposition. On-screen text is for data, punchlines, and labels.
- **One punchline per page section.** Every section has one thing the viewer remembers.
  Everything else supports it.
- **Constraint-based authenticity.** The EGA palette (16 colors) creates horror/urgency. The VGA
  palette (expanded) creates hope. The palette choice is narrative, not decorative.
- **Phase-based reveals.** Information appears in timed stages, not all at once. This creates
  drama and directs attention.

### Where to Apply

| Page Type | Aesthetic Level | Notes |
|-----------|----------------|-------|
| Landing pages, hero sections | **Full game** | CRT effects, pixel fonts, animated counters, particle effects |
| Dashboards, scoreboards, leaderboards | **Full game** | Animated bar charts, progress rings, death ticker, game chrome |
| Budget/policy visualizers | **Full game** | Phase-based reveals, animated comparisons, data cards |
| Data entry forms, settings | **Tempered** | `font-terminal` for body text, `font-pixel` for headings only, no CRT effects |
| Long-form reading (papers, docs) | **Tempered** | Standard sans-serif body, high-contrast light surfaces, pixel font for section titles |
| Legal/compliance | **Minimal** | tandard readable fonts, game chrome in header/footer only |

---

## 2. Color System

### Two-Palette System

The game uses two switchable palettes controlled by CSS classes on the wrapper element.
Apply `.palette-ega` or `.palette-vga` to activate.

**Source:** `packages/web/src/lib/demo/palette.ts`, `packages/web/src/styles/sierra.css`

#### EGA Palette — "The Horror" (Act I)

Dark, ominous, 16-color. Used for problem framing — war spending, death counts, system failures.

| Name | Hex | CSS Variable | Use |
|------|-----|-------------|-----|
| Black | `#000000` | `--sierra-bg` | Background |
| Blue | `#0000aa` | `--sierra-blue` | Narrator bg gradient |
| Green | `#00aa00` | `--sierra-green` | Success (muted) |
| Cyan | `#00aaaa` | `--sierra-cyan` | Secondary |
| Red | `#aa0000` | `--sierra-red` | Danger (muted) |
| Magenta | `#aa00aa` | `--sierra-magenta` | Rarely used |
| Brown | `#aa5500` | `--sierra-brown` | Rarely used |
| Light Gray | `#aaaaaa` | `--sierra-fg` | Foreground text |
| Dark Gray | `#555555` | `--sierra-muted` | Borders, muted text |
| Bright Blue | `#5555ff` | `--sierra-primary` | Primary actions, links |
| Bright Green | `#55ff55` | `--sierra-bright-green` | Success |
| Bright Cyan | `#55ffff` | `--sierra-bright-cyan` | Highlights |
| Bright Red | `#ff5555` | `--sierra-danger` | Death, danger, military |
| Bright Magenta | `#ff55ff` | `--sierra-bright-magenta` | Rarely used |
| Yellow | `#ffff55` | `--sierra-accent` | Score, emphasis, gold |
| White | `#ffffff` | `--sierra-white` | Maximum emphasis only |

#### VGA Palette — "The Quest" (Acts II-III)

Brighter, hopeful, expanded. Used for solutions — treaties, tools, outcomes, endgame.

| Category | Name | Hex | CSS Variable | Use |
|----------|------|-----|-------------|-----|
| **Backgrounds** | Deep | `#0a0a1a` | `--sierra-bg-deep` | Deepest background |
| | Primary | `#1a1a2e` | `--sierra-bg` | Default background |
| | Secondary | `#16213e` | `--sierra-bg-secondary` | Card backgrounds |
| | Accent | `#1f3a5f` | `--sierra-bg-accent` | Highlighted sections |
| **Blues** | Blue | `#4a90d9` | `--sierra-blue` | Primary |
| | Bright Blue | `#64b5f6` | `--sierra-primary` | Primary actions |
| **Cyans** | Cyan | `#4dd0e1` | `--sierra-secondary` | Secondary, quest meters |
| | Teal | `#26a69a` | `--sierra-teal` | Tertiary |
| **Greens** | Green | `#66bb6a` | `--sierra-green` | Success |
| | Bright Green | `#81c784` | `--sierra-bright-green` | Progress fills |
| | Lime | `#aed581` | `--sierra-lime` | Growth indicators |
| **Warm** | Gold | `#ffd54f` | `--sierra-accent` | Score, emphasis |
| | Orange | `#ffb74d` | `--sierra-orange` | Warnings |
| | Coral | `#ff8a65` | `--sierra-death` | Death ticker |
| **Text** | Primary | `#e8e8e8` | `--sierra-fg` | Main text |
| | Secondary | `#b0b0b0` | — | Supporting text |
| | Muted | `#808080` | `--sierra-muted` | Deemphasized |
| **Borders** | Light | `#3a3a5a` | `--sierra-border` | Default borders |
| | Dark | `#2a2a4a` | — | Subtle borders |
| **Status** | Success | `#4caf50` | `--sierra-success` | Positive outcomes |
| | Warning | `#ff9800` | `--sierra-warning` | Caution |
| | Error | `#f44336` | `--sierra-danger` | Negative outcomes |
| | Info | `#2196f3` | `--sierra-info` | Informational |

#### Semantic Color Mappings

Both palettes map to the same semantic variables. Switch palettes by swapping the class — all
components adapt automatically.

```css
--sierra-bg          /* Page/section background */
--sierra-fg          /* Primary text */
--sierra-primary     /* Primary actions, links */
--sierra-secondary   /* Secondary actions, quest meters */
--sierra-accent      /* Score, emphasis, gold highlights */
--sierra-danger      /* Death, danger, military spending */
--sierra-success     /* Positive outcomes, progress */
--sierra-muted       /* Deemphasized text, borders */
--sierra-border      /* Default border color */
--sierra-narrator-bg /* Narrator box gradient background */
--sierra-narrator-border /* Narrator box border */
--sierra-death       /* Death ticker color */
--sierra-score       /* Score display color */
```

#### Mapping to Existing Brutal Tokens

When using components that reference the neobrutalist color system:

| Brutal Token | Sierra Equivalent | When to Use |
|-------------|-------------------|-------------|
| `brutal-cyan` | `--sierra-secondary` (`#4dd0e1`) | Quest metrics, clinical trials, health data |
| `brutal-yellow` | `--sierra-accent` (`#ffd54f`) | Score, achievement, income data |
| `brutal-red` | `--sierra-danger` (`#f44336`) | Death counts, military spending, warnings |
| `brutal-pink` | — (no direct equivalent) | Verb selection highlight, interactive state |

---

## 3. Typography

### Font Families

**Source:** `packages/web/src/app/layout.tsx`

| Font | CSS Variable | Utility Class | Use For |
|------|-------------|---------------|---------|
| **Press Start 2P** | `--font-pixel` | `font-pixel` | Titles, labels, scores, large emphasis, buttons |
| **VT323** | `--font-terminal` | `font-terminal` | Body text, narration, descriptions, form labels |
| **Geist** | `--font-sans` | (default) | Fallback, long-form reading, legal text |
| **Geist Mono** | `--font-mono` | `font-mono` | Code blocks, technical data |

### Pixel Size Scale

Pixel-perfect sizes for `font-pixel` to prevent subpixel rendering artifacts.

**Source:** `packages/web/src/styles/sierra.css`

| Class | Size | Mobile (< 768px) | Use |
|-------|------|-------------------|-----|
| `text-pixel-xs` | 8px | 8px | Tiny labels (avoid in most cases) |
| `text-pixel-sm` | 10px | 10px | Small labels, metadata |
| `text-pixel-base` | 12px | 12px | Default pixel text |
| `text-pixel-lg` | 14px | 14px | **Minimum readable size** |
| `text-pixel-xl` | 16px | 12px | Standard headings |
| `text-pixel-2xl` | 20px | 14px | Section titles |
| `text-pixel-3xl` | 24px | 16px (14px on 480px) | Major headings |
| `text-pixel-4xl` | 32px | 20px (18px on 480px) | Hero headings |
| `text-pixel-5xl` | 40px | 40px | Display text |
| `text-pixel-6xl` | 48px | 48px | Title screens |

**Rule:** Nothing below `text-pixel-lg` (14px) for any text a user needs to read.

### Typography Hierarchy

```
Page Title      font-pixel text-pixel-4xl md:text-pixel-6xl uppercase tracking-widest
Section Title   font-pixel text-pixel-2xl md:text-pixel-3xl uppercase tracking-wider
Card Title      font-pixel text-pixel-xl uppercase
Body Text       font-terminal text-lg md:text-2xl leading-relaxed
Large Number    font-pixel text-pixel-4xl md:text-pixel-6xl tabular-nums
Small Label     font-pixel text-pixel-sm uppercase tracking-[0.2em]
Narrator Text   font-terminal text-lg leading-relaxed (white)
Button Text     font-pixel text-pixel-sm uppercase
```

### Typography Rules

- **Headings:** Always `font-pixel uppercase`. Add `tracking-widest` or `tracking-wider` for
  emphasis. Decorative borders like `★ ═══════ ★` above/below major titles.
- **Body text:** Always `font-terminal`. Minimum `text-lg`. Color: `text-zinc-300` or
  `var(--sierra-fg)`.
- **Numbers/stats:** Always `font-pixel tabular-nums` for fixed-width alignment.
  Use `AnimatedCounter` for values that appear on screen.
- **Never use:** `font-normal`, `font-medium`, `font-light` — minimum weight is `font-bold`
  for terminal text.
- **Decorative spacing:** `tracking-[0.5em]` for dramatic letter-spacing on title screens.
  `tracking-[0.2em]` for labels and badges.

---

## 4. CRT & Retro Effects

**Source:** `packages/web/src/styles/sierra.css`

### Scanlines

Horizontal line overlay simulating a CRT monitor. Apply to any full-screen or section wrapper.

```css
.crt-scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 100;
}
```

**Usage:** Add `crt-scanlines` class to a `position: relative` container. Always
`pointer-events: none`.

### CRT Glow

Soft blue glow around the viewport edge. Adds monitor-like depth.

```css
.crt-glow {
  box-shadow:
    0 0 10px rgba(100, 200, 255, 0.3),
    inset 0 0 60px rgba(100, 200, 255, 0.05);
}
```

### CRT Flicker

Subtle opacity oscillation. Very subtle — don't overdo it.

```css
.crt-flicker {
  animation: crt-flicker 0.15s infinite;
}
/* 0.97 → 1.0 → 0.98 opacity cycle */
```

### Screen Curvature

Simulates the curved surface of a CRT monitor.

```css
.crt-curve {
  border-radius: 20px;
  box-shadow:
    inset 0 0 100px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 0, 0, 0.5);
}
```

### Pixel Grid Overlay

Subtle 4px grid pattern. Used in `SierraSlideWrapper` for extra retro texture.

```tsx
/* Applied as a pseudo-element or overlay div */
background: repeating-linear-gradient(
  0deg, transparent, transparent 3px,
  rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px
);
opacity: 0.03;
pointer-events: none;
```

### Pixel Borders

Three border styles that simulate the beveled edges of 90s GUI windows.

```css
/* Standard — raised look */
.pixel-border {
  border: 2px solid var(--sierra-border);
  box-shadow:
    inset -2px -2px 0 var(--sierra-muted),
    inset 2px 2px 0 var(--sierra-fg);
}

/* Inset — sunken/pressed look */
.pixel-border-inset {
  border: 2px solid var(--sierra-border);
  box-shadow:
    inset 2px 2px 0 var(--sierra-muted),
    inset -2px -2px 0 rgba(255, 255, 255, 0.2);
}

/* Double — decorative frame */
.pixel-border-double {
  border: 4px double var(--sierra-border);
  padding: 4px;
}
```

---

## 5. Animation Library

### CSS Keyframe Animations

**Source:** `packages/web/src/styles/sierra.css`

| Animation | Class | Duration | Use |
|-----------|-------|----------|-----|
| **fade-in** | `animate-fade-in` | 0.5s ease-out | Generic content reveal |
| **slide-up** | `animate-slide-up` | 0.4s ease-out | Content entering from below |
| **sierra-pulse** | `animate-sierra-pulse` | 1s infinite | Pulsing emphasis (opacity 0.5→1) |
| **sierra-blink** | `animate-sierra-blink` | 1s step-end infinite | Cursor, status indicators |
| **score-tick** | `animate-score-tick` | 0.2s | Score/number update feedback (scale 1→1.2→1) |
| **item-pickup** | `animate-item-pickup` | 0.5s bouncy | New inventory item (spin + scale + fade-in) |
| **glitch** | `animate-glitch` | 0.3s | System corruption effect (translate + hue-rotate) |
| **death-desaturate** | `animate-death` | 1s | Game over (color → grayscale) |
| **screen-shake** | `animate-shake` | 0.5s | Impact/error (multi-directional jitter) |
| **restore-flash** | `animate-restore` | 0.3s | Save restore (brightness spike + white flash) |
| **float-up** | `animate-float-up` | 2s | Particles, dismissed notifications (rise + shrink + fade) |
| **cursor-blink** | (inline) | 0.7s step-end | Terminal cursor |
| **crt-flicker** | `crt-flicker` | 0.15s infinite | CRT monitor simulation |

### Title Glow Effect

Used on major title text. Pulsing text-shadow in amber/gold.

```css
@keyframes title-glow {
  0%, 100% {
    text-shadow: 0 0 10px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2);
  }
  50% {
    text-shadow: 0 0 20px rgba(245,158,11,0.8), 0 0 60px rgba(245,158,11,0.4);
  }
}
/* Duration: 3s ease-in-out infinite */
```

### Animation Components

**Source:** `packages/web/src/components/demo/animations/sierra/`

#### GlitchText

RGB channel separation effect. Dual-layer text with red and cyan offsets + random clip-path masking.

```tsx
<GlitchText
  text="GAME OVER"
  intensity="high"    // low (200ms, 2px) | medium (100ms, 4px) | high (50ms, 8px)
  active={true}
  className="text-pixel-4xl"
/>
```

#### AnimatedCounter

Smooth counting animation from start to end value. Uses `requestAnimationFrame`.

```tsx
<AnimatedCounter
  end={170000000000000}
  duration={2000}        // ms
  delay={500}            // ms before starting
  format="currency"      // number | currency | compact | percent
  decimals={0}
  easing="easeOut"       // linear | easeOut | easeIn | easeInOut
/>
```

Formats: `currency` → `$170T`, `compact` → `170T`, `percent` → `42%`

#### AnimatedBarChart

Horizontal or vertical animated bars with staggered entry.

```tsx
<AnimatedBarChart
  data={[
    { label: "Military", value: 886, color: "#f44336" },
    { label: "Health", value: 47, color: "#4dd0e1" },
  ]}
  orientation="horizontal"  // or "vertical"
  duration={1000}
  staggerDelay={200}        // ms between each bar
  formatValue={(v) => `$${v}B`}
/>
```

#### ProgressRing

SVG circular progress indicator with smooth fill animation.

```tsx
<ProgressRing
  progress={0.73}      // 0-1
  radius={60}
  strokeWidth={8}
  color="#4dd0e1"
  duration={1500}      // ms, cubic ease-out
/>
```

#### ParticleEmitter

Continuous or burst particle effects. Uses 60fps canvas-free animation loop (DOM elements).

```tsx
<ParticleEmitter
  emoji="✨"           // or any string/emoji
  rate={2}             // particles per second
  lifetime={4000}      // ms per particle
  direction="up"       // up | down | left | right | radial | fall
  speed={50}           // pixels per second
/>
```

---

## 6. UI Chrome (Game HUD)

**Source:** `packages/web/src/components/demo/SierraChrome.tsx`

The "chrome" is the persistent game UI that surrounds page content. Not every page needs all
elements, but the layout structure should be consistent.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ❤️ HALE: 63.3 → 69.8 yrs [████████░░░░]  💀 12,847 DEATHS │  ← HUD (top bar)
│ 💰 Income: $18K → $42K   [██████░░░░░░]     THIS SESSION  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    MAIN CONTENT                             │  ← Page content
│                  (slides / pages)                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 🛸 "Your species spent $170 trillion on    │ 🔍👁✋🚶💬  │  ← Narrator + Verbs
│    murder and nobody asked you."  ▌        │ [📦][⚡][🏥] │     + Inventory
└─────────────────────────────────────────────────────────────┘
```

### Quest Metrics (Top-Left)

Two progress meters showing HALE (health-adjusted life expectancy) and median income.
Current → target format with colored progress bars.

- HALE: bordered `brutal-cyan`, ❤️ emoji
- Income: bordered `brutal-yellow`, 💰 emoji
- Meters animate with `motion.div` (Framer Motion), 0.5-0.8s ease-out

### Death Ticker (Top-Right)

Real-time counter of preventable deaths. Updates every animation frame.

- Font: `font-pixel`, color: `brutal-red` / `--sierra-death`
- Text-shadow: `2px 2px 0 #000`
- Counter format: `.toLocaleString()` (adds commas)
- Label: "TERMINATED THIS SESSION"
- 💀 emoji prefix

### Narrator Box (Bottom-Left)

Typewriter text with Wishonia's portrait.

- Background: `var(--sierra-narrator-bg)` (gradient)
- Border: `3px solid var(--sierra-narrator-border)`
- Portrait: 64x64px, `image-rendering: pixelated`
- Text: `font-terminal text-lg`, white, typewriter effect at 30 chars/sec
- Blinking cursor `▌` while text is incomplete
- Character animation: `wishonia-bob` (subtle rotate + translateY)

### Verb Bar (Bottom-Center)

5 action buttons for game interaction.

| Verb | Emoji | Action |
|------|-------|--------|
| LOOK | 👁 | Inspect/examine |
| USE | ✋ | Interact/apply |
| WALK | 🚶 | Navigate |
| TALK | 💬 | Dialog/narration |
| INVENTORY | 📦 | View collected items |

- Font: `font-pixel text-pixel-xs` (8px)
- Active state: `bg-[--sierra-accent] text-black`
- Hover: `bg-[--sierra-primary] text-[--sierra-bg]`

### Inventory (Bottom-Right)

8-slot grid for collected items.

- Layout: `grid grid-cols-8 gap-1` (4 cols on mobile)
- Slot: `aspect-square bg-black/50 border-2 border-[--sierra-border]`
- Empty: `opacity-30`
- Filled: emoji icon, hover shows tooltip
- New item: `animate-item-pickup` + coin SFX + `ring-2 ring-brutal-cyan` for 2s

---

## 7. Component Patterns

### Pixel Button

The standard interactive button. Push-down on click with inset shadow shift.

```css
.pixel-button {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  padding: 8px 16px;
  background: var(--sierra-muted);
  color: var(--sierra-fg);
  border: 2px solid var(--sierra-border);
  box-shadow:
    inset -2px -2px 0 #333,
    inset 2px 2px 0 #888,
    4px 4px 0 #000;
  text-transform: uppercase;
}

.pixel-button:active {
  transform: translate(2px, 2px);
  box-shadow:
    inset -2px -2px 0 #333,
    inset 2px 2px 0 #888,
    2px 2px 0 #000;    /* shadow shrinks */
}
```

### Sierra Dialog

Modal/dialog box with gradient background and outer shadow.

```css
.sierra-dialog {
  background: var(--sierra-narrator-bg);
  border: 3px solid var(--sierra-narrator-border);
  box-shadow:
    0 0 0 1px #000,
    6px 6px 0 rgba(0, 0, 0, 0.5);
  padding: 12px;
}

.sierra-dialog-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: var(--sierra-accent);
  text-align: center;
  letter-spacing: 2px;
}
```

### Data Card

Standard card for displaying a single stat or comparison.

```tsx
<div className="border-2 border-[color] rounded p-4 md:p-6 bg-[color]/10 text-center
                flex flex-col items-center gap-2">
  <span className="text-3xl md:text-4xl">🏥</span>  {/* emoji icon */}
  <span className="font-pixel text-pixel-xl" style={{ color }}>$47B</span>
  <span className="font-terminal text-sm text-zinc-400">Healthcare R&D</span>
</div>
```

Color-tinted backgrounds use low opacity: `bg-[color]/5` to `bg-[color]/20`.
Borders match the tint color: `border-[color]/50`.

### Progress Bar

Pixel-art styled progress bar with gradient fill.

```css
.pixel-progress {
  height: 16px;
  background: var(--sierra-black);
  border: 2px solid var(--sierra-border);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.pixel-progress-fill {
  height: 100%;
  background: linear-gradient(180deg,
    var(--sierra-bright-green) 0%,
    var(--sierra-green) 50%,
    var(--sierra-bright-green) 100%);
  transition: width 0.5s ease-out;
  background-size: 8px 8px;  /* pixelated stripe effect */
}
```

Danger variant: swap green for red gradient.

### Boot Screen

Terminal-style loading sequence for page transitions or initial load.

**Pattern:**
1. Show lines of text one at a time with delays (200-400ms between lines)
2. Progress bar using block characters: `█` (filled) + `░` (empty)
3. Blinking cursor (0.53s interval)
4. "Press any key to begin..." prompt with `animate-pulse`

```tsx
const progressBar = (pct: number) => {
  const filled = Math.floor(pct / 4);
  const empty = 25 - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${pct}%`;
};
```

### Phase-Based Reveal

The most common animation pattern across all slides. Content appears in timed stages.

```tsx
const [phase, setPhase] = useState(0);

useEffect(() => {
  const timers = [
    setTimeout(() => setPhase(1), 400),
    setTimeout(() => setPhase(2), 1200),
    setTimeout(() => setPhase(3), 2000),
    setTimeout(() => setPhase(4), 3000),
  ];
  return () => timers.forEach(clearTimeout);
}, []);

return (
  <div>
    {phase >= 0 && <Title />}
    {phase >= 1 && <Subtitle className="animate-fade-in" />}
    {phase >= 2 && <DataViz className="animate-slide-up" />}
    {phase >= 3 && <Punchline className="animate-fade-in" />}
  </div>
);
```

**Timing guide:**
- Title: immediate (0ms)
- Subtitle: 400ms
- Main content: 800-1200ms
- Supporting data: 1500-2500ms
- Punchline/CTA: 2500-4000ms

---

## 8. Layout Patterns

### Slide/Section Layout

Standard wrapper for full-screen or section content.

```tsx
<div className="relative min-h-screen flex flex-col items-center justify-center
                overflow-hidden transition-colors duration-500"
     style={{ background: actGradient }}>
  {/* Pixel grid overlay */}
  <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
       style={{ background: 'repeating-linear-gradient(...)' }} />

  {/* Content */}
  <div className="relative z-10 w-full max-w-[1400px] px-4 md:px-8
                  flex flex-col items-center gap-6 md:gap-8 text-center">
    {children}
  </div>
</div>
```

### Act-Based Background Gradients

Each narrative act has a distinct gradient. Use these for major page sections.

| Act | Gradient | Mood |
|-----|----------|------|
| **Act I — The Horror** | `from-zinc-900 via-zinc-950 to-black` | Ominous, cold |
| **The Turn** | `from-indigo-950 via-purple-950 to-black` | Mysterious, transitional |
| **Act II — The Quest** | `from-slate-900 via-slate-950 to-black` | Determined, focused |
| **Act III — The Endgame** | `from-emerald-950 via-teal-950 to-black` | Hopeful, growth |

### Grid Layouts

For tool grids, inventory displays, comparison cards:

```tsx
{/* 4 columns on desktop, 2 on mobile */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {items.map(item => <DataCard key={item.id} {...item} />)}
</div>

{/* 3 columns for comparison (before / data / after) */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <ComparisonCard side="before" />
  <DataCard />
  <ComparisonCard side="after" />
</div>
```

### Responsive Breakpoints

Mobile-first design. Key breakpoints:

| Breakpoint | Changes |
|-----------|---------|
| Base (< 768px) | Single column, smaller fonts, 4-col inventory, stacked narrator |
| `md:` (768px+) | Multi-column grids, full font sizes, 8-col inventory, side-by-side narrator |
| `lg:` (1024px+) | Wider max-width containers, more spacing |

**Pattern:** `text-base md:text-xl`, `px-2 md:px-6`, `gap-2 md:gap-4`

---

## 9. Audio & Sound Design

**Source:** `packages/web/src/lib/wish-sound.ts`, `packages/web/src/lib/demo-tts.ts`

All sounds generated via Web Audio API — no audio files needed for SFX.

### Sound Effects

| SFX | Waveform | Frequency | Duration | Use |
|-----|----------|-----------|----------|-----|
| `typewriter` | Square | 800 Hz | 0.02s | Each character in typewriter text |
| `click` | Square | 1000 Hz | 0.01s | Button clicks |
| `hover` | Sine | 400 Hz | 0.02s | Button/element hover |
| `pickup` | Square sequence | C5→E5→G5 | 0.3s | New inventory item |
| `scoreUp` | Square sweep | 400→800 Hz | 0.15s | Score increment |
| `slideChange` | Triangle | 300 Hz | 0.1s | Page/slide transition |
| `death` | Sawtooth sequence | G4→F4→E4→C4 | 0.8s | Game over / negative event |
| `restore` | Sine sweep + tone | 200→800 Hz + 800 Hz | 0.4s | Save restore / positive reset |
| `victory` | Square sequence | C5→E5→G5→C6 | 0.6s | Achievement / win condition |
| `error` | Sawtooth | 200 Hz | 0.3s | Error / invalid action |
| `ticker` | Sine | 600 Hz | 0.05s | Death counter tick (low volume) |
| `questFill` | Sine sweep | 200→800 Hz | 0.2s | Quest meter fill animation |

### Background Music

Three chord modes using sine wave drones at low volume (0.1x master):

| Mode | Mood | Frequencies | Use |
|------|------|-------------|-----|
| `horror` | C minor-ish | Dark, dissonant | Act I — problem framing |
| `hope` | C major | Bright, resolving | Act II — solutions |
| `victory` | F major | Triumphant, warm | Act III — endgame |

---

## 10. Slide/Content Design Principles

**Source:** `packages/web/src/lib/demo-script.ts`

### The Rules

1. **Minimum text.** If the narrator is saying it, the screen doesn't need to. On-screen text
   is for data, punchlines, and labels — not paragraphs.

2. **Minimum font size.** Nothing below `text-pixel-lg` (14px). If it's too small to read in a
   1080p video, it shouldn't be there.

3. **Visuals over text.** Favor emoji compositions, animated data viz, and pixel art over walls
   of text. Show, don't tell.

4. **Natural reading order.** Top to bottom, left to right. The eye should flow without hunting.

5. **One punchline per section.** Every section has one thing the viewer remembers. Everything
   else supports it.

6. **Data is the punchline.** Lead with the number. The devastating follow-up writes itself
   when you pair "$170 trillion" with "and nobody asked you."

7. **Phase-based reveals.** Don't show everything at once. Build tension with timed reveals.
   Title → supporting data → the devastating comparison → the CTA.

### Visual Hierarchy for a Data Page

```
1. 🎯 THE BIG NUMBER          font-pixel text-pixel-6xl (animated counter)
2. 📝 What it means            font-terminal text-2xl text-zinc-300
3. 📊 The comparison           AnimatedBarChart or before/after cards
4. 💡 The punchline            font-pixel text-pixel-xl text-[--sierra-accent]
5. 🎮 The action               pixel-button or CTA
```

---

## 11. Migration Checklist: Making a Page Game-Like

Step-by-step for converting any existing page to the game aesthetic:

### Quick Conversion (30 minutes)

- [ ] Add `palette-vga` class to the page/section wrapper
- [ ] Set background: `bg-gradient-to-b from-slate-900 via-slate-950 to-black`
- [ ] Switch heading fonts to `font-pixel uppercase tracking-wider`
- [ ] Switch body fonts to `font-terminal text-lg`
- [ ] Replace white text with `text-[--sierra-fg]` or `text-zinc-200`
- [ ] Replace standard cards with data-card pattern (colored borders, tinted bg)
- [ ] Add `crt-scanlines` overlay to the main wrapper

### Full Conversion (2-4 hours)

- [ ] All items from Quick Conversion
- [ ] Add phase-based reveals for data sections
- [ ] Replace static numbers with `AnimatedCounter` components
- [ ] Replace static charts with `AnimatedBarChart` / `ProgressRing`
- [ ] Add `GlitchText` for error states or dramatic reveals
- [ ] Add `ParticleEmitter` for celebration/achievement moments
- [ ] Replace standard buttons with `pixel-button` styling
- [ ] Add score/progress tracking to the page HUD
- [ ] Add audio SFX for key interactions (optional)
- [ ] Test at mobile breakpoints

### Don't Forget

- [ ] All text must be readable at 14px minimum
- [ ] `prefers-reduced-motion` must disable animations
- [ ] Semantic HTML (headings, buttons, landmarks) preserved under game styling
- [ ] `tabular-nums` on any column of numbers for alignment

---

## Source Files Reference

| File | Contents |
|------|----------|
| `packages/web/src/styles/sierra.css` | Complete CSS effects library — palettes, fonts, CRT effects, pixel borders, animations, and UI chrome styles |
| `packages/web/src/lib/demo/palette.ts` | EGA/VGA color palettes with semantic mappings |
| `packages/web/src/lib/wish-sound.ts` | Web Audio API sound effect presets and fanfares |
| `packages/web/src/lib/demo-script.ts` | Wishonia narration, segment copy, and playlist structure |
| `packages/web/src/app/layout.tsx` | Font loading setup (Press Start 2P, VT323, DM Sans, Space Mono) |
| `packages/web/src/components/demo/slides/GameTitleSlide.tsx` | Title-screen and intro-slide reference implementation |
| `packages/web/src/components/demo/SierraChrome.tsx` | Full game HUD layout, inventory, narrator, and quest chrome |
| `packages/web/src/components/demo/animations/sierra/glitch-text.tsx` | GlitchText component |
| `packages/web/src/components/demo/animations/sierra/animated-counter.tsx` | AnimatedCounter component |
| `packages/web/src/components/demo/animations/sierra/animated-bar-chart.tsx` | AnimatedBarChart component |
| `packages/web/src/components/demo/animations/sierra/progress-ring.tsx` | ProgressRing component |
| `packages/web/src/components/demo/animations/sierra/particle-emitter.tsx` | ParticleEmitter component |
| `packages/web/src/components/demo/slides/sierra/SierraSlideWrapper.tsx` | Slide wrapper with act-based gradients + pixel grid overlay |
| `packages/web/src/components/demo/SierraChrome.tsx` | Full game HUD layout |
| `packages/web/src/components/demo/SierraGameContext.tsx` | Game state management (acts, score, inventory, quests) |
