/**
 * One-time CLI script: scrapes manual.warondisease.org,
 * uploads to Gemini FileSearchStore, and outputs the store ID.
 *
 * Usage:
 *   npx tsx scripts/ingest-manual.ts
 *
 * After running, set GEMINI_FILE_SEARCH_STORE_ID in your .env file.
 */

import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });
import { GoogleGenAI } from '@google/genai';

const MANUAL_PAGES = [
  'https://manual.warondisease.org/',
  'https://manual.warondisease.org/overview',
  'https://manual.warondisease.org/dfda',
  'https://manual.warondisease.org/optimocracy',
  'https://manual.warondisease.org/wishocracy',
  'https://manual.warondisease.org/rappa',
  'https://manual.warondisease.org/optimal-policy-generator',
  'https://manual.warondisease.org/optimal-budget-generator',
  'https://manual.warondisease.org/incentive-alignment-bonds',
  'https://manual.warondisease.org/prize',
  'https://manual.warondisease.org/treasury',
];

async function fetchPageText(url: string): Promise<string> {
  // eslint-disable-next-line no-console
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.warn(`  Failed to fetch ${url}: ${res.status}`);
    return '';
  }

  const html = await res.text();

  // Simple HTML-to-text extraction (strip tags, decode entities)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return `--- Source: ${url} ---\n\n${text}\n\n`;
}

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error('Error: GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('Fetching manual pages...\n');

  const pages = await Promise.all(MANUAL_PAGES.map(fetchPageText));
  const combinedText = pages.filter(Boolean).join('\n');

  if (!combinedText) {
    // eslint-disable-next-line no-console
    console.error('No content fetched. Check the URLs above.');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`\nFetched ${pages.filter(Boolean).length} pages, ${combinedText.length} chars total.`);
  // eslint-disable-next-line no-console
  console.log('Uploading to Gemini...\n');

  const ai = new GoogleGenAI({ apiKey });

  // Upload the combined text as a file
  const file = await ai.files.upload({
    file: new Blob([combinedText], { type: 'text/plain' }),
    config: {
      displayName: 'optomitron-manual',
      mimeType: 'text/plain',
    },
  });

  // eslint-disable-next-line no-console
  console.log('File uploaded:', file.name);
  // eslint-disable-next-line no-console
  console.log('\nTo use RAG grounding, set this in your .env:');
  // eslint-disable-next-line no-console
  console.log(`  GEMINI_FILE_SEARCH_STORE_ID=${file.name}`);
  // eslint-disable-next-line no-console
  console.log('\nNote: For production use, create a proper FileSearchStore corpus');
  // eslint-disable-next-line no-console
  console.log('with the Gemini API and upload chunked documents to it.');
}

void main();
