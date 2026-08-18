/**
 * One-time CLI script: fetches the manual's published search index,
 * serializes it into a structured text corpus, uploads it to Gemini,
 * and prints the uploaded file ID.
 *
 * Runtime RAG now reads directly from the search index in /api/voice/rag.
 * This script is only for local experiments with Gemini file uploads.
 *
 * Usage:
 *   npx tsx scripts/ingest-manual.ts
 *
 * After running, set GEMINI_FILE_SEARCH_STORE_ID in your .env file
 * only if you want to keep experimenting with Gemini file-based grounding.
 */

import "./load-env";
import { GoogleGenAI } from "@google/genai";
import {
  formatManualEntryForUpload,
  getManualSearchIndex,
} from "../src/lib/manual-search.server";

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("Fetching manual search index...\n");

  const entries = await getManualSearchIndex({ forceRefresh: true });
  if (entries.length === 0) {
    console.error("No search-index entries fetched. Check the manual endpoint.");
    process.exit(1);
  }

  const combinedText = entries.map(formatManualEntryForUpload).join("\n\n---\n\n");

  console.log(`Fetched ${entries.length} indexed chapters, ${combinedText.length} chars total.`);
  console.log("Uploading serialized corpus to Gemini...\n");

  const ai = new GoogleGenAI({ apiKey });
  const file = await ai.files.upload({
    file: new Blob([combinedText], { type: "text/plain" }),
    config: {
      displayName: "optimitron-manual-search-index",
      mimeType: "text/plain",
    },
  });

  console.log("File uploaded:", file.name);
  console.log("\nOptional .env setting for Gemini file experiments:");
  console.log(`  GEMINI_FILE_SEARCH_STORE_ID=${file.name}`);
  console.log("\nRuntime voice RAG no longer depends on this upload.");
}

void main();
