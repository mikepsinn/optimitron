// Copies the deck script's video lines (the "Say (video line N)" lines in
// content/patient-journey/script.md) into the explainer video's SCRIPT.md, which the narration step
// records, and STORYBOARD.md, which times the scenes and captions. Run it before re-recording:
//   pnpm --filter @apps/acceleratedmedicine video:narration
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadScript, videoNarration } from "../lib/present-script";

const videoDir = join(process.cwd(), "..", "..", "videos", "care-integrated-clinical-trials");
const lines = videoNarration(loadScript("patient-journey"));

// Replaces the narration in each section that `heading` starts, by line number, and fails if a
// line has no section or a section has no narration.
function rewrite(file: string, heading: RegExp, narration: RegExp, render: (text: string) => string) {
  const path = join(videoDir, file);
  const sections = readFileSync(path, "utf8").replace(/\r\n/g, "\n").split(/(?=^## )/m);
  const updated = new Set<number>();
  const result = sections.map(section => {
    const match = heading.exec(section);
    if (!match) return section;
    const line = lines.find(l => l.line === Number(match[1]));
    if (!line) throw new Error(`${file}: "${section.split("\n")[0]}" has no video line in the deck script`);
    if (!narration.test(section)) throw new Error(`${file}: "${section.split("\n")[0]}" has no narration to replace`);
    updated.add(line.line);
    return section.replace(narration, () => render(line.text));
  });
  const missing = lines.filter(l => !updated.has(l.line)).map(l => l.line);
  if (missing.length) throw new Error(`${file} has no section for video lines ${missing.join(", ")}`);
  writeFileSync(path, result.join(""));
}

rewrite("SCRIPT.md", /^## Line (\d+) /, /^ {4}\S.*$/m, text => `    ${text}`);
rewrite("STORYBOARD.md", /^## Frame (\d+) /, /^- voiceover: ".*"$/m, text => {
  if (text.includes('"')) throw new Error(`STORYBOARD.md voiceover lines are quoted, so they cannot contain '"': ${text}`);
  return `- voiceover: "${text}"`;
});
console.log(`Wrote ${lines.length} video lines to SCRIPT.md and STORYBOARD.md. Re-record any line that changed.`);
