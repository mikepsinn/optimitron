---
name: verify-slide
description: Screenshot a game slide and check it for visual problems (overlapping text, cropped content, layout issues, readability).
user_invocable: true
---

# Verify Slide

After editing a slide component, use this skill to screenshot it and check for visual problems.

## Arguments

The argument should be one of:
- A slide ID (e.g., `military-waste-170t`, `compound-growth-scenarios`)
- A file path to the slide component (e.g., `packages/game/components/demo/slides/act1/slide-military-waste-170t.tsx`)
- `last` — re-verify the last slide you edited
- No argument — auto-detect from the most recently edited slide file

## Prerequisites

The game dev server must be running on `http://localhost:4000`.

### Starting the dev server (if not running)

Check if the server is running first:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000 2>/dev/null
```

If it returns anything other than 200, start it:
```bash
cd packages/game && pnpm dev
```
This runs `next dev --port 4000`. Wait for the "Ready" message before proceeding.

## Steps

### 1. Determine the slide ID

If given a file path, extract the slide ID from the filename:
- `slide-military-waste-170t.tsx` → `military-waste-170t`
- Pattern: strip `slide-` prefix and `.tsx` extension

If no argument given, check recent file edits for `packages/game/components/demo/slides/**/*.tsx`.

### 2. Find the slide index

The slide index is its position in the `SLIDES` array from `packages/game/lib/demo/demo-config.ts`. Look up the slide by its `id` field and note the array index (0-based).

### 3. Navigate to the slide and screenshot

Use the Playwright MCP tools:

1. **Navigate**: `browser_navigate` to `http://localhost:4000`
2. **Set slide**: `browser_evaluate` with JavaScript:
   ```js
   const store = window.__demoStore;
   if (store) store.setState({ currentSlide: INDEX, typewriterComplete: true, narrationEnded: true });
   ```
   Replace `INDEX` with the 0-based slide index.
3. **Wait**: `browser_wait_for` — wait 3 seconds for animations to settle
4. **Screenshot**: `browser_take_screenshot` at 1920x1080

### 4. Analyze the screenshot

Read the screenshot image and check for:

- **Overlapping text** — text running into other text or off the edge
- **Cropped content** — elements cut off at the edges of the viewport
- **Contrast issues** — text too dark to read on dark backgrounds
- **Layout problems** — uneven spacing, misaligned columns, broken grids
- **Font size** — anything below ~14px (too small for presentation slides at 1080p)
- **Empty space** — large unused areas that could be used to make content bigger
- **Data accuracy** — numbers should match the parameters they're sourced from

### 5. Report findings

List any issues found with specific descriptions. If no issues, confirm the slide looks good.

If issues are found, fix them immediately and re-verify.

## Slide ID Reference

The full list of slide IDs is in `packages/game/lib/demo/demo-config.ts` (the `SLIDES` array). Each slide has an `id` field. The component files follow the naming pattern `slide-{id}.tsx` in subdirectories under `packages/game/components/demo/slides/`.

Common directories:
- `act1/` — Act I slides (the horror)
- `turn/` — The turn (restore from Wishonia)
- `act2/` — Act II slides (the quest)
- `act3/` — Act III slides (the endgame)
