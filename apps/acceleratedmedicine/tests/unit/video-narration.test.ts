import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadScript, videoNarration } from "../../lib/present-script";

// The words the explainer video actually says: the narration step writes each recorded line's
// word timings to the video's audio_meta.json, which is committed (the recordings are not).
const videoDir = join(process.cwd(), "..", "..", "videos", "care-integrated-clinical-trials");
const recording = JSON.parse(readFileSync(join(videoDir, "audio_meta.json"), "utf8")) as {
  voices: { frame: number; words: { text: string }[] }[];
};
const words = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

describe("explainer video narration", () => {
  it("is the deck's Say lines, as recorded", () => {
    const lines = videoNarration(loadScript("patient-journey"));
    expect(lines.map(l => l.line)).toEqual(recording.voices.map(v => v.frame));
    for (const line of lines) {
      const recorded = recording.voices.find(v => v.frame === line.line)!.words.map(w => w.text).join(" ");
      expect(words(recorded), `Video line ${line.line} no longer matches its recording. Re-record it ` +
        "(videos/care-integrated-clinical-trials/README.md) or undo the change.").toBe(words(line.text));
    }
  });
});
