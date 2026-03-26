# Earth Optimization Demo

## Voice: Wishonia

Wishonia is an alien who has been observing Earth for 4,297 years and is
genuinely bewildered that humans keep choosing the food poisoning. Philomena
Cunk energy — childlike, deadpan, data-first. The humor comes from stating
something horrifying as if it's a puzzling data point, then delivering the
punchline as a confused observation.

### Voice Rules

- **Never angry, never preachy.** Let the data be the outrage. Wishonia is
  *puzzled*, not *upset*.
- **Direct address.** "Of you" not "of people." "Your species" not "humanity."
  She's talking TO them about THEM.
- **Alien vocabulary.** "Meat software" not "diseases." "Murder budget" not
  "military spending." "Paper with presidents on it" not "money."
- **The punchline is the contrast.** Horrifying number + bewildered alien
  observation. The joke writes itself when you pair "$170 trillion" with
  "and nobody asked you."
- **One concept per slide.** If a slide explains two things, split it.

### Gold Standard

Before writing ANY narration or on-screen content, read the voice at:
https://manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html

Match that tone. Key examples:

> "On Wishonia, we call this 'looking at a menu and ordering the food poisoning.'"

> "By this logic, the most successful fire department is one that starts fires."

> "The data existed. Nobody looked at it. The data did not have a lobbying firm."

> "The math is patient. The diseases are not."

#### More Gold Standard Lines (from the source material)

**From earth-optimization-prize.html:**

> "Your species calls this 'integrity,' which I understand is rare enough to
> require explanation."

> "On Wishonia, 'do nothing' is what we call the thing that killed you."

> "It is like arguing about whether the patient is improving without taking the
> patient's pulse."

> "Your retirement account is not trying very hard."

> "This is not incompetence. It is architecture."

> "This is the dumbest reason a civilization has ever continued dying."

> "Your species has been arguing about governance for 10,000 years without
> checking whether anything got better."

> "Your species identified the exact mechanism by which your governance fails,
> published it, assigned it in universities, and then continued to be governed
> by it for sixty years."

**From warondisease.org:**

> "You named your planet.. dirt."

> "This is like naming a hospital 'Rectangle' or calling a school 'Square'."

> "It's like discovering fire and then immediately using it to set yourself on
> fire."

> "It's like weaning a baby off eating paint chips."

> "That: sane. 'Give 1% fewer papers to people who build murder machines':
> insane."

> "I looked up the last person on your planet who went around suggesting
> universal love and peace. You nailed him to a piece of wood."

> "Rocks do it every day. In fact, rocks have managed to live peacefully
> alongside different colored rocks for thousands of years."

> "This is called 'investment,' which is gambling but wearing a suit."

> "This is called 'marketing' which is lying but with graphics."

> "It's like money laundering but backwards and legal."

> "It's like changing the wallpaper in a burning building."

> "You invented naps and then refused to apply them to geopolitics."

> "Your calculator will display an error, emit a tiny electronic scream, and
> attempt to leave the desk."

> "It's like a lifeguard who confirms the life preserver floats, then locks it
> in a cabinet for years"

> "Your 'red team' and 'blue team' argue about everything except the loop,
> because they're both inside it."

> "Each ant follows the ant ahead. No ant checks whether the trail goes
> anywhere."

### Anti-Patterns (Don't Do This)

- **Policy-brief voice**: Too dry, no personality.
- **Earnest advocacy**: "Together, we can make a difference!" → Wishonia would
  never.
- **Explaining the joke**: "That is not a fantasy. That is compound interest
  applied to not killing people." → The chart IS the punchline.
- **Filler**: "Here is how that turns into wealth." → Just start with the data.

## Slide Design Principles

- **Minimum text**: If the narrator is saying it, the screen doesn't need to.
  On-screen text is for data, punchlines, and labels — not paragraphs.
- **Minimum font size**: Nothing below `text-sm` (14px). If it's too small
  to read in a 1080p video, it shouldn't be there.
- **Visuals over text**: Favor hilarious Sierra-style pixel art, emoji
  compositions, and animated data viz over walls of text. Show, don't tell.
- **Natural reading order**: Top to bottom, left to right. The eye should
  flow without hunting.
- **One punchline per slide**: Every slide has one thing the viewer remembers.
  Everything else supports it.

## Content Pipeline

- `lib/demo/demo-config.ts` is the single source of truth for all content
- `pnpm generate:readme` — regenerate README from the config
- `pnpm generate:narration` — regenerate TTS audio for changed slides
- `pnpm record` — record full video (needs `pnpm dev` running)
