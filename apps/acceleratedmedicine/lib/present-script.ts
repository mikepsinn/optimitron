import { readFileSync } from "node:fs";
import { join } from "node:path";

// One slide of a presentation script (content/<deck>/script.md): "## 3. Heading" (or "## B1." for
// a backup slide), then bold-labeled fields. The deck takes each slide's eyebrow, title, Say and
// If asked lines and source line from here; the rest of the on-screen text lives in the slide
// components.
export type ScriptSlide = {
  key: string;
  heading: string;
  onScreen: string[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  purpose?: string;
  visual?: string;
  say?: string;
  ifAsked?: string;
  // The line of the explainer video this slide's Say is spoken in.
  videoLine?: number;
  sourceLine?: string;
};

const FIELDS: Record<string, keyof ScriptSlide> = {
  "Purpose": "purpose", "Visual": "visual", "Say": "say", "If asked": "ifAsked", "Source line": "sourceLine",
};
// "**Say:** text" or "**Say (video line 7):** text"
const FIELD = /^\*\*(Purpose|Visual|Say|If asked|Source line)(?: \(video line (\d+)\))?:\*\*\s*(.*)$/;
const plain = (text: string) => text.replace(/\*\*|`/g, "").trim();

export function parseScript(markdown: string): ScriptSlide[] {
  const slides: ScriptSlide[] = [];
  for (const section of markdown.replace(/\r\n/g, "\n").split(/^## /m).slice(1)) {
    const [headingLine, ...lines] = section.split("\n");
    const match = /^(B?\d+)\. (.+)$/.exec(headingLine.trim());
    if (!match) continue; // the brief, open items and other notes
    const slide: ScriptSlide = { key: match[1], heading: match[2], onScreen: [] };
    let field: keyof ScriptSlide | "onScreen" | null = null;
    const text: Partial<Record<keyof ScriptSlide, string[]>> = {};
    for (const line of lines) {
      if (/^#\s|^---$/.test(line)) break; // a top-level heading or rule ends the last slide
      const start = FIELD.exec(line);
      if (start) {
        field = FIELDS[start[1]];
        text[field] = [start[3]];
        if (start[2]) slide.videoLine = Number(start[2]);
      } else if (line === "**On screen**") {
        field = "onScreen";
      } else if (field === "onScreen" && line.startsWith("- ")) {
        slide.onScreen.push(line.slice(2));
      } else if (field === "onScreen" && line.startsWith("  ") && slide.onScreen.length) {
        slide.onScreen[slide.onScreen.length - 1] += ` ${line.trim()}`;
      } else if (field && field !== "onScreen" && line.trim()) {
        text[field]!.push(line.trim());
      }
    }
    for (const [key, parts] of Object.entries(text)) {
      (slide as Record<string, unknown>)[key] = plain(parts!.join(" "));
    }
    for (const item of slide.onScreen) {
      const labeled = /^(Eyebrow|Title|Headline|Subtitle): (.+)$/.exec(item);
      if (!labeled) continue;
      if (labeled[1] === "Eyebrow") slide.eyebrow = plain(labeled[2]);
      else if (labeled[1] === "Subtitle") slide.subtitle = plain(labeled[2]);
      else slide.title = plain(labeled[2]);
    }
    slides.push(slide);
  }
  return slides;
}

// The explainer video's narration: each video line is the Say lines of the slides it covers, in
// slide order. A line can span two slides (video line 7 is slides 11 and 12).
export function videoNarration(slides: ScriptSlide[]): { line: number; text: string }[] {
  const lines = new Map<number, string[]>();
  for (const slide of slides) {
    if (slide.videoLine === undefined) continue;
    if (!slide.say) throw new Error(`Slide ${slide.key} is in video line ${slide.videoLine} but has no Say line`);
    lines.set(slide.videoLine, [...(lines.get(slide.videoLine) ?? []), slide.say]);
  }
  const numbers = [...lines.keys()].sort((a, b) => a - b);
  if (numbers.some((line, i) => line !== i + 1)) {
    throw new Error(`Video lines must run 1 to ${numbers.length} without gaps; found ${numbers.join(", ")}`);
  }
  return numbers.map(line => ({ line, text: lines.get(line)!.join(" ") }));
}

// next.config.mjs traces content/ into the deployment, so the file is there at request time.
export function loadScript(deck: string) {
  return parseScript(readFileSync(join(process.cwd(), "content", deck, "script.md"), "utf8"));
}
