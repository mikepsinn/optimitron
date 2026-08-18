/**
 * Generate images for the Wishonia world page.
 *
 * Usage: npx tsx scripts/generate-wishonia-images.ts
 *
 * Loads GOOGLE_GENERATIVE_AI_API_KEY from root .env automatically.
 * Outputs to public/images/wishonia/
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load env from monorepo root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });
import {
  generateRetroScientificIllustration,
  writeGeneratedImageAssets,
} from "../../../packages/agent/src/image-generation.js";

const OUTPUT_DIR = path.resolve(__dirname, "../public/images/wishonia");

const UTOPIAN_STYLE = [
  "1970s utopian science fiction surrealism.",
  "Style of Syd Mead, Roger Dean, and Moebius.",
  "Sweeping organic landscapes, impossible architecture, vivid saturated colors.",
  "Optimistic, dreamy, humanity-figured-it-out energy.",
  "Soft airbrushed quality with precise linework.",
  "No text, no labels, no UI elements.",
];

interface ImageSpec {
  name: string;
  prompt: string;
  aspectRatio: "16:9" | "1:1" | "3:2";
}

const images: ImageSpec[] = [
  {
    name: "hero-planet",
    aspectRatio: "16:9",
    prompt: [
      "A utopian planet seen from low orbit in 1970s sci-fi art style.",
      "Sweeping curved megastructures visible on the surface, connected by luminous transport ribbons.",
      "Lush vegetation covering impossible floating islands. Crystal-clear oceans reflecting twin suns.",
      "The atmosphere has a warm golden glow. Everything suggests a civilisation that solved its problems millennia ago.",
      "Roger Dean album cover meets Syd Mead industrial design. Vivid teals, golds, and magentas.",
    ].join(" "),
  },
  {
    name: "super-longevity",
    aspectRatio: "1:1",
    prompt: [
      "A surreal 70s sci-fi scene: a person of ambiguous age floating in a garden of enormous bioluminescent flowers.",
      "DNA helices spiral upward like glowing trees. Organic medical pods bloom from the ground like seed pods.",
      "The person radiates vitality — age is a choice, not a sentence.",
      "Warm amber and cool cyan color palette. Airbrushed with dreamlike soft focus on edges.",
      "The feeling is: death was a bug, and it was fixed.",
    ].join(" "),
  },
  {
    name: "super-wellbeing",
    aspectRatio: "1:1",
    prompt: [
      "A surreal 70s utopian landscape: people relaxing in a vast open space with impossible geometry.",
      "Architecture curves like shells and waves. Living walls of plants. Waterfalls flowing sideways.",
      "Everyone is engaged, creative, calm. No urgency, no anxiety, no clocks.",
      "Rich warm oranges, purples, and greens. Moebius-style precise linework with soft color fills.",
      "The feeling is: suffering was engineered out centuries ago. This is just how things are.",
    ].join(" "),
  },
  {
    name: "super-intelligence",
    aspectRatio: "1:1",
    prompt: [
      "A vast cathedral of knowledge — crystalline structures reaching into a prismatic sky.",
      "Streams of data flow like rivers of light between towering organic computing spires.",
      "A solitary figure stands at the center, interfacing with the cosmos through gesture.",
      "The scale is immense — galaxies visible through transparent walls — but intimate, not threatening.",
      "70s sci-fi surrealism. Psychedelic precision. The feeling is: omniscience, gently held.",
    ].join(" "),
  },
  {
    name: "governance",
    aspectRatio: "3:2",
    prompt: [
      "A transparent governance structure — no walls, no ceiling, open to a vivid alien sky.",
      "At its center, a mesmerising holographic sphere shows flowing preference data as coloured streams merging and separating.",
      "Citizens drift through casually, some touching the sphere for a moment, then continuing. No queues. No guards.",
      "Floating platforms at different levels connected by light bridges.",
      "70s Syd Mead futurism. The feeling is: governance takes four minutes. Then you go live your life.",
    ].join(" "),
  },
  {
    name: "timeline-treaty",
    aspectRatio: "3:2",
    prompt: [
      "A surreal split scene: on the left, a stormy grey world with tanks and smokestacks dissolving into particles.",
      "On the right, the particles reassemble into a gleaming medical research campus with soaring organic towers.",
      "At the centre, a simple table where diverse humans sign a single page.",
      "The sky transitions from apocalyptic red-grey to luminous gold-blue.",
      "70s album cover surrealism. Airbrushed. The feeling is: the moment everything changed.",
    ].join(" "),
  },
];

async function main() {
  console.log(`Generating ${images.length} images for /wishonia page...`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  for (const img of images) {
    console.log(`Generating: ${img.name} (${img.aspectRatio})...`);
    try {
      const result = await generateRetroScientificIllustration({
        prompt: img.prompt,
        aspectRatio: img.aspectRatio,
        imageSize: "2K",
        extraStyleDirectives: UTOPIAN_STYLE,
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

  console.log("\nDone. Update the Wishonia page to reference these images.");
}

void main();
