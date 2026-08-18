/**
 * Export a demo playlist as a reviewable markdown file.
 *
 * Usage:
 *   pnpm tsx scripts/export-playlist-script.ts [playlistId]
 *
 * Default: protocol-labs
 *
 * Outputs: docs/demo-scripts/{playlistId}.md
 *   - Full narration text for each slide
 *   - Word count + estimated duration per slide
 *   - Running total duration
 *   - Screenshot placeholder paths (take screenshots separately via Playwright)
 */

import { PLAYLISTS } from "../src/lib/demo-script";
import * as fs from "fs";
import * as path from "path";

const playlistId = process.argv[2] ?? "protocol-labs";

const playlist = PLAYLISTS.find((p) => p.id === playlistId);
if (!playlist) {
  console.error(`Playlist "${playlistId}" not found. Available:`);
  PLAYLISTS.forEach((p) => console.error(`  - ${p.id}: ${p.name}`));
  process.exit(1);
}

const WPM = 150; // average speaking pace

let totalWords = 0;
let totalSeconds = 0;

const lines: string[] = [];

lines.push(`# ${playlist.name}`);
lines.push(`**Playlist ID:** \`${playlist.id}\``);
lines.push(`**Description:** ${playlist.description}`);
lines.push(`**Slides:** ${playlist.segments.length}`);
lines.push("");
lines.push("---");
lines.push("");

playlist.segments.forEach((seg, i) => {
  const id = seg.id;
  const words = seg.narration.split(/\s+/).length;
  const seconds = Math.round((words / WPM) * 60);
  totalWords += words;
  totalSeconds += seconds;

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  lines.push(`## ${i + 1}. ${id} — "${seg.title}"`);
  lines.push("");
  lines.push(`**Slide:** \`${seg.slideId}\`  `);
  lines.push(`**Words:** ${words} | **Duration:** ~${seconds}s | **Running total:** ${mins}:${String(secs).padStart(2, "0")}`);
  lines.push("");
  lines.push(`**Narration:**`);
  lines.push(`> ${seg.narration}`);
  lines.push("");
  lines.push(`![${id}](screenshots/${id}.png)`);
  lines.push("");
  lines.push("---");
  lines.push("");
});

// Summary
const totalMins = Math.floor(totalSeconds / 60);
const totalSecs = totalSeconds % 60;

lines.push("## Summary");
lines.push("");
lines.push(`| Metric | Value |`);
lines.push(`|--------|-------|`);
lines.push(`| Total slides | ${playlist.segments.length} |`);
lines.push(`| Total words | ${totalWords} |`);
lines.push(`| Estimated duration | ${totalMins}:${String(totalSecs).padStart(2, "0")} |`);
lines.push(`| Average words/slide | ${Math.round(totalWords / playlist.segments.length)} |`);
lines.push("");

const outDir = path.resolve(__dirname, "../../..", "docs", "demo-scripts");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${playlistId}.md`);
fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

console.log(`✅ Exported ${playlist.segments.length} slides to ${outPath}`);
console.log(`   ${totalWords} words, ~${totalMins}:${String(totalSecs).padStart(2, "0")} estimated duration`);
