/**
 * Generate README.md from demo-config.ts (single source of truth).
 *
 * This script contains ZERO content — all content comes from the config.
 * It only handles formatting/layout.
 *
 * Usage: npx tsx scripts/generate-readme.ts
 * Output: README.md (overwrites existing)
 */

import { writeFileSync } from "fs";
import { join } from "path";
import {
  SLIDES,
  ACT_NAMES,
  SCORE_DESCRIPTIONS,
  SIERRA_FRAMING,
  PACING,
  TECHNICAL_NOTES,
  type SlideConfig,
} from "../lib/demo/demo-config";
import { SCORE_PROGRESSION, INVENTORY_ITEMS } from "../lib/demo/parameters";

const OUTPUT = join(process.cwd(), "README.md");

function formatScore(n: number): string {
  return n.toLocaleString("en-US");
}

function generateHeader(): string {
  return `# PL Genesis Hackathon — Demo Video Script

**Target length**: 3–4 minutes
**Tone**: Wishonia narrating (deadpan, data-first, dry, alien observer)
**Aesthetic**: Sierra Online adventure game (Space Quest IV–VI era) — pixel art scenes, narrator text boxes, point-and-click verbs, death screens, score counter
**Slides**: ~${SLIDES.length} (one concept per slide — count may change as we iterate)

---

## The Sierra Framing

${SIERRA_FRAMING.overview}

### Persistent UI Chrome (every slide)

\`\`\`
${SIERRA_FRAMING.chromeAsciiArt.trim()}
\`\`\`

**Persistent HUD elements:**

${SIERRA_FRAMING.hudElements.map((e) => `- **${e.split(":")[0]}**:${e.slice(e.indexOf(":") + 1)}`).join("\n")}

---

## Pacing & Trailer Structure

**Act I — The Horror (slides 1–9, ~80s)**
${PACING.act1}

**GAME OVER / RESTORE (slides 9–10)**
${PACING.gameOver}

**Act II — The Quest**
${PACING.act2}

**Act III — The Endgame (~1.5 min)**
${PACING.act3}

**Sound design:**
${PACING.sound.map((s) => `- ${s}`).join("\n")}

---
`;
}

function generateScoreTable(): string {
  let md = `## Score Progression

| Slide | Score | Why |
|-------|-------|-----|
`;
  for (const [key, score] of Object.entries(SCORE_PROGRESSION)) {
    md += `| ${key} | ${formatScore(score)} | ${SCORE_DESCRIPTIONS[key] || ""} |\n`;
  }
  return md + "\n---\n";
}

function generateInventoryTable(): string {
  let md = `## Inventory Items

| Slot | Acquired At | Icon | Item | Tooltip |
|------|-------------|------|------|---------|
`;
  for (const item of INVENTORY_ITEMS) {
    md += `| ${item.slot} | ${item.acquiredAt} | ${item.emoji} ${item.icon} | \`${item.name}\` | "${item.tooltip}" |\n`;
  }
  return md + "\n---\n";
}

function generateSlide(slide: SlideConfig, index: number): string {
  let md = "";

  // Chapter heading if this slide starts a new chapter
  if (slide.chapter) {
    const prevAct = index > 0 ? SLIDES[index - 1].act : null;
    if (slide.act !== prevAct) {
      md += `\n## ${ACT_NAMES[slide.act] || slide.act}\n\n`;
    }
    if (!slide.chapter.startsWith("Act ")) {
      md += `### ${slide.chapter}\n\n`;
    }
  } else {
    const prevAct = index > 0 ? SLIDES[index - 1].act : null;
    if (slide.act !== prevAct) {
      md += `\n## ${ACT_NAMES[slide.act] || slide.act}\n\n`;
    }
  }

  // Slide heading
  md += `### ${slide.id} (${slide.duration}s)\n\n`;

  // Stage direction
  if (slide.stageDirection) {
    md += `**[${slide.stageDirection}]**\n\n`;
  }

  // Narration
  md += `> "${slide.narration}"\n\n`;

  // On-screen content table
  if (slide.onScreen && slide.onScreen.length > 0) {
    md += `**On-Screen Content** (top to bottom):\n\n`;
    md += `| Element | Size | Animation |\n`;
    md += `|---------|------|-----------|\n`;
    for (const el of slide.onScreen) {
      const text = el.emoji
        ? `${el.count || ""} ${el.emoji} ${el.text}`.trim()
        : `\`${el.text}\``;
      md += `| ${text} | ${el.size}${el.color ? `, ${el.color}` : ""} | ${el.animation || ""} |\n`;
    }
    md += "\n";
  }

  // ASCII art diagram
  if (slide.asciiArt) {
    md += "```\n" + slide.asciiArt.trim() + "\n```\n\n";
  }

  // Visual description
  if (slide.visual) {
    md += `*Visual*: ${slide.visual}\n\n`;
  }

  // Sierra verbs
  if (slide.sierraVerbs && slide.sierraVerbs.length > 0) {
    for (const verb of slide.sierraVerbs) {
      md += `*Sierra verb*: \`> ${verb.verb}\` → "${verb.response}"\n`;
    }
    md += "\n";
  }

  // Score and inventory
  const parts: string[] = [];
  if (slide.score) parts.push(`**Score**: \`${formatScore(slide.score)}\``);
  if (slide.inventory)
    parts.push(
      `**Inventory**: +\`${slide.inventory.name}\` (slot ${slide.inventory.slot})`
    );
  if (parts.length > 0) {
    md += parts.join(" · ") + "\n\n";
  }

  md += "---\n\n";
  return md;
}

function generateFooter(): string {
  return `## Technical Notes

### Sierra Implementation
${TECHNICAL_NOTES.implementation.map((n) => `- **${n.split(":")[0]}**:${n.slice(n.indexOf(":") + 1)}`).join("\n")}

### Content Pipeline
- \`lib/demo/demo-config.ts\` is the single source of truth for all slide content
- \`pnpm generate:readme\` — regenerate this README from the config
- \`pnpm generate:narration\` — regenerate TTS audio for changed slides
- \`pnpm record\` — record full video (needs \`pnpm dev\` running)

### Key Rules
${TECHNICAL_NOTES.keyRules.map((r) => `- ${r}`).join("\n")}
`;
}

function main() {
  let md = generateHeader();
  md += generateScoreTable();
  md += generateInventoryTable();

  for (let i = 0; i < SLIDES.length; i++) {
    md += generateSlide(SLIDES[i], i);
  }

  md += generateFooter();

  writeFileSync(OUTPUT, md);
  console.log(
    `📄 Generated README.md (${SLIDES.length} slides, ${md.length} chars)`
  );
}

main();
