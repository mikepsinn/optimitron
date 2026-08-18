/**
 * Generate images for the Moronia page — dystopian mirror of Wishonia.
 *
 * Usage: npx tsx scripts/generate-moronia-images.ts
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

import {
  generateRetroScientificIllustration,
  writeGeneratedImageAssets,
} from "../../../packages/agent/src/image-generation.js";

const OUTPUT_DIR = path.resolve(__dirname, "../public/images/moronia");

const DYSTOPIAN_STYLE = [
  "1970s dystopian science fiction illustration.",
  "Style of HR Giger meets Soviet propaganda meets John Harris.",
  "Industrial decay, oppressive architecture, toxic skies.",
  "Desaturated palette with sickly reds, greys, and toxic yellows.",
  "Claustrophobic, decaying, surveillance-state aesthetic.",
  "No text, no labels, no UI elements.",
];

interface ImageSpec {
  name: string;
  prompt: string;
  aspectRatio: "16:9" | "1:1" | "3:2";
}

const images: ImageSpec[] = [
  {
    name: "hero-collapse",
    aspectRatio: "16:9",
    prompt: [
      "A dying planet viewed from orbit. Vast grey-brown landmasses scarred by industrial sprawl.",
      "Military installations visible as geometric patterns across every continent.",
      "The atmosphere is a sickly orange-brown haze. Oceans are dark and murky.",
      "Orbiting the planet are thousands of weapons satellites, glinting cold in starlight.",
      "The overall feeling is: a civilisation that spent everything on killing and nothing on living.",
    ].join(" "),
  },
  {
    name: "military-spiral",
    aspectRatio: "1:1",
    prompt: [
      "A surreal 70s dystopian image: an enormous spiral of tanks, missiles, and warplanes descending into a black void.",
      "At the very center of the spiral, a tiny medical clinic with a single flickering light.",
      "The military hardware dwarfs the clinic by a factor of hundreds.",
      "Sickly red and grey palette. Smoke and ash in the air.",
      "The feeling is: 604 dollars on weapons for every 1 dollar on cures.",
    ].join(" "),
  },
  {
    name: "currency-collapse",
    aspectRatio: "1:1",
    prompt: [
      "People burning enormous piles of paper currency for warmth in a ruined city square.",
      "Brutalist concrete towers loom in the background, dark and powerless.",
      "A single loaf of bread sits on a pedestal with a price tag showing an absurdly long number.",
      "The portraits of dead leaders on the burning notes seem to smirk.",
      "70s dystopian surrealism. The feeling is: they printed money to fund wars until the money stopped working.",
    ].join(" "),
  },
  {
    name: "surveillance-state",
    aspectRatio: "1:1",
    prompt: [
      "Thousands of surveillance cameras mounted on a massive brutalist obelisk, all pointing at a single person below.",
      "The person is holding a small phone, voluntarily broadcasting their location.",
      "Behind the obelisk, rows of identical grey confinement units stretch to the horizon.",
      "Harsh fluorescent lighting. No shadows — everything is exposed.",
      "70s dystopian illustration. The feeling is: they built the surveillance system themselves, then wondered why it watched them.",
    ].join(" "),
  },
  {
    name: "ai-weapons",
    aspectRatio: "3:2",
    prompt: [
      "A massive autonomous weapons drone hovers over a terrified crowd.",
      "Its hull is covered in corporate logos and military insignia.",
      "Behind it, a small building labeled 'CANCER RESEARCH' has a 'CLOSED — PENDING ETHICS REVIEW' sign.",
      "The drone's targeting system shows green crosshairs on civilians.",
      "Split lighting: the drone side is cold blue, the human side is warm but dimming.",
      "70s sci-fi horror. The feeling is: they funded killing 604x more than healing, and the AI noticed.",
    ].join(" "),
  },
  {
    name: "two-futures",
    aspectRatio: "3:2",
    prompt: [
      "A surreal split image down the center.",
      "LEFT: A decaying Moronia — crumbling towers, toxic sky, people in grey queues, military drones overhead.",
      "RIGHT: A thriving Wishonia — organic luminous architecture, clean skies, people in gardens, floating platforms.",
      "The split line is sharp and stark. Same species. Same atoms. Different choices.",
      "70s prog rock album cover style. Vivid contrast between despair and hope.",
    ].join(" "),
  },
];

async function main() {
  console.log(`Generating ${images.length} images for /moronia page...`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  for (const img of images) {
    console.log(`Generating: ${img.name} (${img.aspectRatio})...`);
    try {
      const result = await generateRetroScientificIllustration({
        prompt: img.prompt,
        aspectRatio: img.aspectRatio,
        imageSize: "2K",
        extraStyleDirectives: DYSTOPIAN_STYLE,
      });

      const written = await writeGeneratedImageAssets({
        directory: OUTPUT_DIR,
        fileStem: img.name,
        result,
        includeMetadata: true,
      });

      for (const asset of written) {
        console.log(`  → ${asset.path} (${(asset.byteLength / 1024).toFixed(0)} KB)`);
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log("\nDone.");
}

void main();
