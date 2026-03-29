/**
 * Export the narration script for a playlist as formatted text.
 *
 * Usage: npx tsx scripts/export-script.ts --playlist=protocol-labs
 *
 * Outputs to stdout (pipe to file if needed):
 *   npx tsx scripts/export-script.ts --playlist=protocol-labs > script-protocol-labs.txt
 */

import { SLIDES, resolvePlaylist, PLAYLISTS } from "../lib/demo/demo-config";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const playlistArg = process.argv.find((a) => a.startsWith("--playlist="));
const playlistId = playlistArg?.split("=")[1] || "full";
const activeSlides = resolvePlaylist(playlistId);
const playlist = PLAYLISTS.find((p) => p.id === playlistId);

const NARRATION_DIR = join(process.cwd(), "public", "audio", "narration");
const MANIFEST_PATH = join(NARRATION_DIR, "manifest.json");

function getAudioDuration(mp3Path: string): number | null {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
      { stdio: "pipe" }
    );
    const duration = parseFloat(result.toString().trim());
    return isNaN(duration) ? null : duration;
  } catch {
    return null;
  }
}

let manifest: Record<string, { file: string }> = {};
if (existsSync(MANIFEST_PATH)) {
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  } catch {}
}

// Header
console.log("=".repeat(70));
console.log(`  ${playlist?.name || playlistId} — Narration Script`);
console.log(`  ${activeSlides.length} slides | target: ${playlist?.targetDuration || "?"}s`);
console.log("=".repeat(70));
console.log("");

let totalDuration = 0;
let totalWords = 0;
let currentAct = "";

for (let i = 0; i < activeSlides.length; i++) {
  const slide = activeSlides[i];

  // Act header
  const actLabel =
    slide.act === "act1" ? "ACT I — THE HORROR" :
    slide.act === "turn" ? "THE TURN" :
    slide.act === "act2" ? "ACT II — THE QUEST" :
    "ACT III — THE ENDGAME";
  if (actLabel !== currentAct) {
    currentAct = actLabel;
    console.log("");
    console.log("─".repeat(70));
    console.log(`  ${actLabel}`);
    console.log("─".repeat(70));
    console.log("");
  }

  // Audio duration
  let audioDur: string = `${slide.duration}s (config)`;
  const entry = manifest[slide.id];
  if (entry) {
    const mp3Path = join(NARRATION_DIR, entry.file);
    if (existsSync(mp3Path)) {
      const dur = getAudioDuration(mp3Path);
      if (dur !== null) {
        audioDur = `${dur.toFixed(1)}s`;
        totalDuration += dur;
      }
    }
  }

  const words = slide.narration.split(/\s+/).length;
  totalWords += words;

  // Slide header
  const num = String(i + 1).padStart(2, "0");
  console.log(`[${num}] ${slide.id}  (${audioDur} | ${words} words)`);
  if (slide.chapter) console.log(`     Chapter: ${slide.chapter}`);
  console.log("");

  // Narration text, wrapped at 70 chars
  const wrapped = slide.narration.replace(/(.{1,66})([\s]|$)/g, "     $1\n").trimEnd();
  console.log(wrapped);
  console.log("");
}

// Footer
console.log("=".repeat(70));
console.log(`  TOTALS: ${activeSlides.length} slides | ${totalWords} words | ~${Math.floor(totalDuration / 60)}m ${Math.round(totalDuration % 60)}s audio`);
console.log("=".repeat(70));
