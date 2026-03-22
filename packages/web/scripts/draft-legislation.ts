#!/usr/bin/env tsx
/**
 * Draft model legislation from efficient frontier budget analysis.
 *
 * Reads the generated us-budget-analysis.json, finds categories where
 * the US significantly overspends, and uses Gemini + Google Search
 * grounding to draft evidence-based legislation for each.
 *
 * Usage:
 *   pnpm --filter @optimitron/web run draft:legislation
 *   pnpm --filter @optimitron/web run draft:legislation -- --category Military
 *
 * Requires: GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY env var
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as loadDotenv } from 'dotenv';

// Load .env from monorepo root (two levels up from packages/web/)
const __filename2 = fileURLToPath(import.meta.url);
const monorepoRoot = resolve(dirname(__filename2), '../../..');
const envPath = resolve(monorepoRoot, '.env');
if (existsSync(envPath)) {
  loadDotenv({ path: envPath });
}

import {
  draftLegislation,
  insertCitations,
  generateSourceFootnotes,
  type EfficiencyEvidence,
  type PolicyExemplarInput,
} from '@optimitron/agent';

import { POLICY_EXEMPLARS } from '@optimitron/data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../src/data');
const outputDir = resolve(__dirname, '../src/data/legislation');

// ─── Map policy exemplars to budget categories ──────────────────────

const EXEMPLAR_CATEGORY_MAP: Record<string, string[]> = {
  // Military savings should fund healthcare + UBI — include the models for WHERE the money goes
  'Military': [
    'Singapore 3M Health System (Medisave / MediShield / Medifund)',
    'Costa Rica CCSS Universal Healthcare',
  ],
  'Medicare': ['Singapore 3M Health System (Medisave / MediShield / Medifund)'],
  'Medicaid': ['Singapore 3M Health System (Medisave / MediShield / Medifund)', 'Costa Rica CCSS Universal Healthcare'],
  'Health (non-Medicare/Medicaid)': ['Singapore 3M Health System (Medisave / MediShield / Medifund)', 'Japan Tokutei Kenshin Health Screening'],
  'Social Security': [],
  'Education': ['Finland Comprehensive Education Reform'],
  'Science / NASA': ['South Korea Broadband and Digital Infrastructure'],
};

function getExemplarsForCategory(category: string): PolicyExemplarInput[] {
  const names = EXEMPLAR_CATEGORY_MAP[category] ?? [];
  return POLICY_EXEMPLARS
    .filter(e => names.includes(e.name))
    .map(e => ({
      name: e.name,
      originCountry: e.originCountry,
      description: e.description,
      yearImplemented: e.yearImplemented,
      adaptationNotes: e.adaptationNotes,
    }));
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  // Parse args
  const categoryFilter = process.argv.find((_, i) => process.argv[i - 1] === '--category');
  const minOverspend = parseFloat(process.argv.find((_, i) => process.argv[i - 1] === '--min-overspend') ?? '1.5');

  // Load budget analysis
  const budgetData = JSON.parse(readFileSync(resolve(dataDir, 'us-budget-analysis.json'), 'utf-8'));

  // Find categories with efficiency data and significant overspend
  const candidates = budgetData.categories
    .filter((c: { efficiency: { overspendRatio: number } | null; name: string }) => {
      if (!c.efficiency) return false;
      if (categoryFilter && c.name !== categoryFilter) return false;
      return c.efficiency.overspendRatio >= minOverspend;
    })
    .sort((a: { efficiency: { overspendRatio: number } }, b: { efficiency: { overspendRatio: number } }) =>
      b.efficiency.overspendRatio - a.efficiency.overspendRatio
    );

  if (candidates.length === 0) {
    console.log('No categories found with overspend ratio ≥ ' + minOverspend);
    if (categoryFilter) console.log('  (filtered to: ' + categoryFilter + ')');
    process.exit(0);
  }

  console.log(`Found ${candidates.length} categories to draft legislation for:\n`);
  for (const c of candidates) {
    console.log(`  ${c.name}: ${c.efficiency.overspendRatio}x overspend (rank ${c.efficiency.rank}/${c.efficiency.totalCountries})`);
  }
  console.log('');

  mkdirSync(outputDir, { recursive: true });

  for (const c of candidates) {
    const e = c.efficiency;
    const evidence: EfficiencyEvidence = {
      ...e,
      category: c.name,
    };

    const exemplars = getExemplarsForCategory(c.name);

    console.log(`\nDrafting legislation for ${c.name}...`);
    console.log(`  Evidence: ${e.overspendRatio}x overspend, rank ${e.rank}/${e.totalCountries}`);
    console.log(`  Exemplars: ${exemplars.length > 0 ? exemplars.map((x: { originCountry: string }) => x.originCountry).join(', ') : 'none (Gemini will research)'}`);

    try {
      const draft = await draftLegislation(evidence, exemplars);

      // Build output with citations
      const citedText = insertCitations(draft);
      const footnotes = generateSourceFootnotes(draft);

      const output = [
        `# Model Legislation: ${c.name} Reform`,
        '',
        `> Generated by Optimitron OPG + Gemini (search-grounded)`,
        `> Based on OECD cross-country efficiency analysis (23 countries)`,
        `> Category: ${c.name} | Overspend: ${e.overspendRatio}x | Rank: ${e.rank}/${e.totalCountries}`,
        '',
        citedText,
        '',
        '---',
        '',
        footnotes,
        '',
        '---',
        '',
        '## Metadata',
        '',
        `- **Search queries**: ${draft.searchQueries.join('; ')}`,
        `- **Sources cited**: ${draft.sources.length}`,
        `- **Claims with citations**: ${draft.citations.length}`,
        `- **Category**: ${c.name}`,
        `- **Overspend ratio**: ${e.overspendRatio}x`,
        `- **Potential savings**: $${Math.round(e.potentialSavingsTotal / 1e9)}B/yr`,
      ].join('\n');

      const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const outPath = resolve(outputDir, `${slug}-reform.md`);
      writeFileSync(outPath, output);

      console.log(`  ✅ Drafted → ${slug}-reform.md (${draft.sources.length} sources, ${draft.citations.length} cited claims)`);
    } catch (err) {
      console.error(`  ❌ Failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\nDone! Legislation drafts in packages/web/src/data/legislation/');
}

main().catch(console.error);
