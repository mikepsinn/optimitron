#!/usr/bin/env tsx
/**
 * Generate the static markdown analysis site.
 *
 * Reads all analysis data (budget, policies, legislation) and produces
 * cross-linked markdown files in reports/site/ that mirror the website routes.
 *
 * Run: pnpm --filter @optimitron/examples run generate:site
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { EfficiencyAnalysis } from '@optimitron/obg';
import { BudgetAnalysisOutputSchema, PolicyAnalysisOutputSchema, type BudgetCategoryOutput } from './generate-web-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DATA = resolve(__dirname, '../../web/src/data');
const LEGISLATION_DIR = resolve(WEB_DATA, 'legislation');
const SITE_DIR = resolve(__dirname, '../../../reports/site');

// Jurisdiction config — parameterized so we can generate for any country
const JURISDICTION = {
  code: 'us',
  name: 'United States',
  population: 339_000_000,
  adults: 258_000_000,
  currency: 'USD',
  medianIncome: 59_540,
};

// Clean old generated content (keep config files like package.json, .eleventy.js, _includes, _data)
const KEEP_FILES = new Set(['package.json', 'package-lock.json', 'eleventy.config.js', '.gitignore', 'node_modules', '_includes', '_data', '_site', '.eleventy.js']);
function cleanSiteDir() {
  if (!existsSync(SITE_DIR)) return;
  for (const entry of readdirSync(SITE_DIR)) {
    if (KEEP_FILES.has(entry)) continue;
    const full = join(SITE_DIR, entry);
    rmSync(full, { recursive: true, force: true });
  }
}

// ─── Load Data ──────────────────────────────────────────────────────

const budgetData = BudgetAnalysisOutputSchema.parse(JSON.parse(readFileSync(resolve(WEB_DATA, 'us-budget-analysis.json'), 'utf-8')));
const policyData = PolicyAnalysisOutputSchema.parse(JSON.parse(readFileSync(resolve(WEB_DATA, 'us-policy-analysis.json'), 'utf-8')));

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

// Only discretionary categories with current legislation drafts (keyed by BudgetCategory.id)
const LEGISLATION_MAP: Record<string, string> = {
  military: 'military-reform',
  health_discretionary: 'health-non-medicare-medicaid-reform',
  education: 'education-reform',
  science_nasa: 'science-nasa-reform',
};

const US_MEDIAN_INCOME = JURISDICTION.medianIncome;

function write(path: string, content: string) {
  const full = resolve(SITE_DIR, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

// Deduplicate categories that share the same OECD spending field (keyed by BudgetCategory.id)
// (medicare, medicaid, health_discretionary all map to healthSpendingPerCapitaPpp)
const OECD_FIELD_MAP: Record<string, string> = {
  medicare: 'health', medicaid: 'health', health_discretionary: 'health',
  military: 'military', social_security: 'social', education: 'education', science_nasa: 'rd',
};

type BudgetCategoryWithEfficiency = BudgetCategoryOutput & { efficiency: EfficiencyAnalysis };

function hasEfficiency(c: BudgetCategoryOutput): c is BudgetCategoryWithEfficiency {
  return c.efficiency !== null;
}

function deduplicateByOECDField(categories: BudgetCategoryWithEfficiency[]): BudgetCategoryWithEfficiency[] {
  const seen = new Set<string>();
  return categories.filter((c) => {
    const field = OECD_FIELD_MAP[c.id];
    if (!field) return true;
    if (seen.has(field)) return false;
    seen.add(field);
    return true;
  });
}

// Map policy categories to related legislation (only valid links)
const POLICY_TO_LEGISLATION: Record<string, string> = {
  'health': 'health-non-medicare-medicaid-reform',
  'health_research': 'health-non-medicare-medicaid-reform',
  'health_non_medicare_medicaid_': 'health-non-medicare-medicaid-reform',
  'defense': 'military-reform',
  'military': 'military-reform',
  'science_nasa': 'science-nasa-reform',
};

// ─── Index Page ─────────────────────────────────────────────────────

function generateIndex() {
  const withEfficiency = budgetData.categories.filter(hasEfficiency);
  const dedupForTotal = deduplicateByOECDField(withEfficiency);
  const totalWasted = dedupForTotal.reduce((sum, c) => sum + c.efficiency.potentialSavingsTotal, 0);

  const perAdult = Math.round(totalWasted / JURISDICTION.adults);
  const perMonth = Math.round(perAdult / 12);

  // Build quick dividend breakdown for the hero
  const dividendRows = dedupForTotal
    .sort((a, b) => b.efficiency.potentialSavingsTotal - a.efficiency.potentialSavingsTotal)
    .map((c) => {
      const e = c.efficiency;
      const pa = Math.round(e.potentialSavingsTotal / JURISDICTION.adults);
      const pm = Math.round(pa / 12);
      const label = OECD_FIELD_MAP[c.id] === 'health' ? 'Healthcare' : c.name;
      return `| ${label} | ${e.bestCountry.name} | ${e.overspendRatio}x | **$${pm.toLocaleString()}/mo** |`;
    }).join('\n');

  const md = `---
title: Home
layout: layout.njk
---

# Your Optimization Dividend: $${perMonth.toLocaleString()}/month

The ${JURISDICTION.name} overspends by **${fmt(totalWasted)}/yr** across ${dedupForTotal.length} budget categories compared to the cheapest high-performing countries. If it matched their efficiency, every adult would receive **$${perMonth.toLocaleString()}/month ($${perAdult.toLocaleString()}/yr)**.

| Category | Model Country | Overspend | Your Dividend |
|----------|--------------|-----------|---------------|
${dividendRows}
| **TOTAL** | | | **$${perMonth.toLocaleString()}/mo** |

Don't like a reform? [Redirect your dividend](./dividend/) to any program you choose.

---

## The Evidence

${budgetData.categories.length} budget categories analyzed against ${withEfficiency[0]?.efficiency.totalCountries ?? 28} countries including Singapore, Japan, South Korea, and Switzerland.

${budgetData.topRecommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

## Navigate

- [**Budget Analysis**](./budget/) — ${budgetData.categories.length} categories with OECD efficiency rankings
- [**Policy Rankings**](./policies/) — ${policyData.policies.length} evidence-based policies ranked by impact
- [**Model Legislation**](./legislation/) — ${Object.keys(LEGISLATION_MAP).length} Gemini-drafted bills with citations
- [**Efficiency Rankings**](./efficiency/) — OECD cross-country comparisons
- [**Optimization Dividend**](./dividend/) — Full savings breakdown per household

---

*Generated ${new Date(budgetData.generatedAt).toLocaleDateString()} by Optimitron OBG + OPG + OECD cross-country panel*
`;
  write(`${JURISDICTION.code}/index.md`, md);
}

// ─── Budget Index ───────────────────────────────────────────────────

function generateBudgetIndex() {
  const cats = budgetData.categories;

  const rows = cats.map((c) => {
    const eff = c.efficiency;
    const slug = slugify(c.name);
    const rank = eff ? `${eff.rank}/${eff.totalCountries}` : '—';
    const over = eff ? `${eff.overspendRatio}x` : '—';
    const savings = eff ? fmt(eff.potentialSavingsTotal) : '—';
    const legSlug = LEGISLATION_MAP[c.id];
    const legLink = legSlug ? ` · [legislation](../legislation/${legSlug}/)` : '';
    return `| [${c.name}](./${slug}/) | ${fmt(c.currentSpending)} | $${c.currentSpendingRealPerCapita.toFixed(0)}/cap | ${rank} | ${over} | ${savings} | ${c.recommendation}${legLink} |`;
  }).join('\n');

  const md = `---
title: Budget Overview
layout: layout.njk
---

[← Home](../)

# ${JURISDICTION.name} Federal Budget: ${cats.length} Categories

Total budget: **${fmt(budgetData.totalSpendingNominal)}**

| Category | Nominal | Real/Cap | OECD Rank | Overspend | Wasted/yr | Action |
|----------|---------|----------|-----------|-----------|-----------|--------|
${rows}

## Related

- [Policy Rankings](../policies/) — evidence-based policies for each category
- [Model Legislation](../legislation/) — drafted bills for overspending categories
- [Efficiency Rankings](../efficiency/) — full OECD comparison table
- [Optimization Dividend](../dividend/) — your share of the savings
`;
  write(`${JURISDICTION.code}/budget/index.md`, md);
}

// ─── Budget Category Details ────────────────────────────────────────

function generateBudgetDetails() {
  for (const cat of budgetData.categories) {
    const slug = slugify(cat.name);
    const eff = cat.efficiency;
    const dr = cat.diminishingReturns;
    const legSlug = LEGISLATION_MAP[cat.id];

    let md = `---
title: "${cat.name}"
layout: layout.njk
---

[← Budget Overview](../)\n\n`;

    md += `# ${cat.name}\n\n`;

    // Summary stats
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Federal budget line item | ${fmt(cat.currentSpending)} |\n`;
    md += `| Real per-capita (2017 USD, federal) | $${cat.currentSpendingRealPerCapita.toFixed(0)} |\n`;
    if (eff) {
      md += `| OECD total gov spending (all levels) | $${eff.spendingPerCapita}/cap |\n`;
      md += `| OECD efficiency rank | **${eff.rank}/${eff.totalCountries}** |\n`;
      md += `| Overspend ratio | **${eff.overspendRatio}x** |\n`;
      md += `| Floor spending | $${eff.floorSpendingPerCapita}/cap |\n`;
      md += `| Potential savings | **${fmt(eff.potentialSavingsTotal)}/yr** |\n`;
    }
    md += `| Recommendation | **${cat.recommendation.toUpperCase()}** |\n`;
    md += `| Evidence | ${cat.evidenceSource} |\n`;
    if (eff) {
      const perAdult = Math.round(eff.potentialSavingsTotal / JURISDICTION.adults);
      const perMonth = Math.round(perAdult / 12);
      md += `| **Your dividend** | **$${perAdult.toLocaleString()}/yr ($${perMonth.toLocaleString()}/mo)** per adult |\n`;
    }
    md += '\n';

    // Efficiency comparison
    if (eff) {
      md += `## OECD Efficiency Comparison\n\n`;
      if (cat.id === 'military') {
        md += `> **Note:** Military spending is entirely federal. OECD per-capita figures derived from %GDP × GDP/capita.\n`;
        md += `> Life expectancy is used as a general welfare proxy — military spending shows R²≈0.01 correlation with LE. `;
        md += `The savings benefit comes from redirecting funds to healthcare/dividend, not from military cuts directly improving health.\n\n`;
      } else {
        md += `> **Note:** OECD spending data reflects total government spending (federal + state + local). `;
        md += `The US federal budget line item for "${cat.name}" is ${fmt(cat.currentSpending)}, `;
        md += `but the OECD comparison uses the full government system at $${eff.spendingPerCapita}/cap.\n\n`;
      }
      md += `| Country | Spending/cap | ${eff.outcomeName} | Rank |\n`;
      md += `|---------|-------------|${'-'.repeat(eff.outcomeName.length + 2)}|------|\n`;
      md += `| **${JURISDICTION.name}** | **$${eff.spendingPerCapita}** | **${eff.outcome}** | **${eff.rank}** |\n`;
      for (const t of eff.topEfficient) {
        md += `| ${t.name} | $${t.spendingPerCapita} | ${t.outcome} | ${t.rank} |\n`;
      }
      md += `\nBest: **${eff.bestCountry.name}** — $${eff.bestCountry.spendingPerCapita}/cap → ${eff.outcomeName} ${eff.bestCountry.outcome}\n\n`;
    }

    // Diminishing returns
    if (dr) {
      md += `## Diminishing Returns Model\n\n`;
      md += `- Model: ${dr.modelType}\n`;
      md += `- R²: ${dr.r2}\n`;
      md += `- Observations: ${dr.n}\n`;
      if (dr.elasticity !== null) md += `- Elasticity: ${dr.elasticity} (1% spending → ${dr.elasticity}% ${dr.outcomeName})\n`;
      md += `\n`;
    }

    // Historical spending
    if (cat.historicalRealPerCapita.length > 0) {
      const first = cat.historicalRealPerCapita[0]!;
      const last = cat.historicalRealPerCapita[cat.historicalRealPerCapita.length - 1]!;
      const nomGrowth = ((last.nominalBillions / first.nominalBillions - 1) * 100).toFixed(0);
      const realGrowth = ((last.realPerCapita / first.realPerCapita - 1) * 100).toFixed(0);

      md += `## Historical Spending (${first.year}–${last.year})\n\n`;
      md += `- Nominal growth: **+${nomGrowth}%**\n`;
      md += `- Real per-capita growth: **${Number(realGrowth) >= 0 ? '+' : ''}${realGrowth}%** (inflation + population adjusted)\n`;
      md += `- Inflation ate: **${Number(nomGrowth) - Number(realGrowth)}pp** of apparent growth\n\n`;

      md += `| Year | Nominal ($B) | Real/Cap ($) |\n|------|-------------|-------------|\n`;
      for (const h of cat.historicalRealPerCapita) {
        md += `| ${h.year} | $${h.nominalBillions}B | $${h.realPerCapita.toFixed(0)} |\n`;
      }
      md += '\n';
    }

    // Outcome metrics
    if (cat.outcomeMetrics.length > 0) {
      md += `## Outcome Metrics\n\n`;
      md += `| Metric | Value | Trend |\n|--------|-------|-------|\n`;
      for (const m of cat.outcomeMetrics) {
        md += `| ${m.name} | ${m.value} | ${m.trend} |\n`;
      }
      md += '\n';
    }

    // Recommendation with Wishonia voice
    if (eff && eff.overspendRatio >= 1.5) {
      const perAdult = Math.round(eff.potentialSavingsTotal / JURISDICTION.adults);
      const perMonth = Math.round(perAdult / 12);
      const topNames = eff.topEfficient.map((t) => t.name).join(', ');
      const best = eff.topEfficient[0];

      // Wishonia one-liner
      const wishoniaLines: Record<string, string> = {
        'Military': `Spending ${eff.overspendRatio}x more than ${best?.name ?? 'the best'} for worse outcomes. On my planet, we call this a refund.`,
        'Health (non-Medicare/Medicaid)': `${best?.name ?? 'South Korea'} spends a third of what you do and their citizens live ${Math.round((best?.outcome ?? 83) - eff.outcome)} years longer. It's almost like pricing and outcomes are related.`,
        'Education': `${best?.name ?? 'Japan'} spends half as much and their students score ${Math.round((best?.outcome ?? 536) - eff.outcome)} points higher on maths. Wild.`,
        'Science / NASA': `${best?.name ?? 'Netherlands'} spends half as much on R&D and their median citizen earns more. Perhaps the issue isn't how much you spend.`,
      };
      const wishonia = wishoniaLines[cat.name] ?? `${eff.overspendRatio}x overspend. I've seen more efficient use of resources on planets that haven't discovered fire yet.`;

      md += `## Recommendation\n\n`;
      md += `> *${wishonia}*\n\n`;
      md += `**Adopt the approach of ${topNames}.** These countries achieve ${eff.outcomeName} `;
      md += `of ${best?.outcome ?? '?'} while spending $${best?.spendingPerCapita ?? '?'}/cap `;
      md += `vs the ${JURISDICTION.name} at $${eff.spendingPerCapita}/cap for ${eff.outcomeName} ${eff.outcome}.\n\n`;
      md += `Reducing to the efficient floor of $${eff.floorSpendingPerCapita}/cap would save **${fmt(eff.potentialSavingsTotal)}/yr**, `;
      md += `equivalent to **$${perAdult.toLocaleString()}/yr ($${perMonth.toLocaleString()}/mo)** per adult as an Optimization Dividend.\n\n`;
      if (legSlug) {
        md += `**[Read the model legislation for this reform →](../legislation/${legSlug}/)**\n\n`;
      }

      // Evaluation schedule
      md += `## Evaluation & Sunset\n\n`;
      md += `- **Metrics:** Real after-tax median income + median healthy life years (HALE)\n`;
      md += `- **Review:** Biennial (every 2 years) by GAO\n`;
      md += `- **Sunset:** Auto-expires if BOTH metrics fail minimum thresholds by Year 4\n`;
      md += `- **Benchmarks:** ${topNames}\n`;
      md += `- **Data mandate:** BLS (income) + CDC (HALE) must publish annually\n\n`;
    } else if (eff && eff.overspendRatio < 1.2) {
      md += `## Assessment\n\n`;
      md += `> *Near the efficient floor. One of the few things your species isn't catastrophically overpaying for. Well done.*\n\n`;
      md += `${JURISDICTION.name} spending on ${cat.name} is **near the efficient floor** (${eff.overspendRatio}x). No major reallocation recommended.\n\n`;
    }

    // Related links
    md += `## Related\n\n`;
    if (legSlug) {
      md += `- [**View Model Legislation →**](../legislation/${legSlug}/)\n`;
    }
    md += `- [Efficiency Rankings](../efficiency/)\n`;
    md += `- [Policy Rankings](../policies/)\n`;
    md += `- [Optimization Dividend](../dividend/)\n`;
    md += `- [← Back to Budget Overview](../)\n`;

    write(`${JURISDICTION.code}/budget/${slug}/index.md`, md);
  }
}

// ─── Policy Index ───────────────────────────────────────────────────

function generatePolicyIndex() {
  const rows = policyData.policies.map((p) => {
    const slug = slugify(p.name);
    const income = Math.round(p.incomeEffect * US_MEDIAN_INCOME);
    const hale = Math.round(p.healthEffect * 12 * 10);
    const leg = POLICY_TO_LEGISLATION[p.category];
    const legLink = leg ? ` [bill](./legislation/${leg}/)` : '';
    return `| [${p.name}](./${slug}/) | +$${income.toLocaleString()}/yr | +${hale}mo | ${p.evidenceGrade} | ${p.recommendationType} |${legLink}`;
  }).join('\n');

  const md = `---
title: Policy Rankings
layout: layout.njk
---

[← Home](../)

# Policy Rankings: ${policyData.policies.length} Evidence-Based Policies

Ranked by welfare impact (income + healthy life years). Dollar amounts are per-household impact on median income.

| Policy | Income/yr | HALE | Grade | Action |
|--------|-----------|------|-------|--------|
${rows}

## Related

- [Budget Analysis](../budget/) — spending efficiency by category
- [Model Legislation](../legislation/) — drafted bills
- [Optimization Dividend](../dividend/) — combined savings per household
`;
  write(`${JURISDICTION.code}/policies/index.md`, md);
}

// ─── Policy Details ─────────────────────────────────────────────────

function generatePolicyDetails() {
  for (const p of policyData.policies) {
    const slug = slugify(p.name);
    const income = Math.round(p.incomeEffect * US_MEDIAN_INCOME);
    const hale = Math.round(p.healthEffect * 12 * 10);

    let md = `---
title: "${p.name}"
layout: layout.njk
---

[← Policy Rankings](../)\n\n`;

    md += `# ${p.name}\n\n`;
    md += `> ${p.description}\n\n`;

    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Income impact | **+$${income.toLocaleString()}/yr** (${(p.incomeEffect * 100).toFixed(0)}% of median) |\n`;
    md += `| Health impact | **+${hale} months** HALE |\n`;
    md += `| Evidence grade | **${p.evidenceGrade}** |\n`;
    md += `| Causal confidence | ${(p.causalConfidenceScore * 100).toFixed(0)}% |\n`;
    md += `| Action | ${p.recommendationType} |\n`;
    md += `| Category | ${p.category} |\n\n`;

    if (p.currentStatus) md += `**Current status:** ${p.currentStatus}\n\n`;
    if (p.recommendedTarget) md += `**Target:** ${p.recommendedTarget}\n\n`;

    md += `## Evidence\n\n${p.rationale}\n\n`;

    // Bradford Hill
    md += `## Bradford Hill Scores\n\n`;
    md += `| Criterion | Score |\n|-----------|-------|\n`;
    for (const [k, v] of Object.entries(p.bradfordHillScores)) {
      md += `| ${k} | ${(v * 100).toFixed(0)}% |\n`;
    }
    md += '\n';

    if (p.blockingFactors.length > 0) {
      md += `## Blocking Factors\n\n`;
      for (const f of p.blockingFactors) {
        md += `- ${f.replace(/_/g, ' ')}\n`;
      }
      md += '\n';
    }

    // Link to related legislation
    const relatedLeg = POLICY_TO_LEGISLATION[p.category];

    md += `## Related\n\n`;
    if (relatedLeg) {
      md += `- [**View Model Legislation →**](../../legislation/${relatedLeg}/)\n`;
    }
    md += `- [Policy Rankings](../)\n`;
    md += `- [Budget Analysis](../../budget/)\n`;
    md += `- [Optimization Dividend](../../dividend/)\n`;

    write(`${JURISDICTION.code}/policies/${slug}/index.md`, md);
  }
}

// ─── Legislation Index ──────────────────────────────────────────────

function generateLegislationIndex() {
  const entries = Object.entries(LEGISLATION_MAP);

  let md = `---
title: Model Legislation
layout: layout.njk
---

[← Home](../)

# Model Legislation: ${entries.length} Drafted Bills

Each bill is generated by Gemini with Google Search grounding. Every factual claim is cited with source URLs.

| Bill | Category | Overspend | Potential Savings |
|------|----------|-----------|-------------------|
`;

  for (const [catId, legSlug] of entries) {
    const cat = budgetData.categories.find((c) => c.id === catId);
    const eff = cat?.efficiency;
    const catName = cat?.name ?? catId;
    md += `| [${catName} Reform](./${legSlug}/) | ${catName} | ${eff ? eff.overspendRatio + 'x' : '—'} | ${eff ? fmt(eff.potentialSavingsTotal) + '/yr' : '—'} |\n`;
  }

  md += `\n## Related\n\n`;
  md += `- [Budget Analysis](../budget/) — the evidence behind each bill\n`;
  md += `- [Policy Rankings](../policies/) — scored policy alternatives\n`;
  md += `- [Efficiency Rankings](../efficiency/) — OECD country comparisons\n`;

  write(`${JURISDICTION.code}/legislation/index.md`, md);
}

// ─── Legislation Details (copy existing markdown) ───────────────────

function generateLegislationDetails() {
  for (const [catName, legSlug] of Object.entries(LEGISLATION_MAP)) {
    const file = resolve(LEGISLATION_DIR, `${legSlug}.md`);
    if (!existsSync(file)) continue;

    const content = readFileSync(file, 'utf-8');
    const budgetSlug = slugify(catName);

    const md = `---
title: "${catName} Reform"
layout: layout.njk
---

[← Legislation Index](../) · [Budget: ${catName}](../../budget/${budgetSlug}/)

${content}

## Related

- [**Budget Analysis: ${catName}**](../../budget/${budgetSlug}/) — OECD efficiency data behind this bill
- [Policy Rankings](../../policies/) — alternative policies for this category
- [Efficiency Rankings](../../efficiency/) — full cross-country comparison
- [← Legislation Index](../)
`;
    write(`${JURISDICTION.code}/legislation/${legSlug}/index.md`, md);
  }
}

// ─── Efficiency Index ───────────────────────────────────────────────

function generateEfficiencyIndex() {
  const withEff = budgetData.categories.filter(hasEfficiency);
  const dedupForTotal = deduplicateByOECDField(withEff);
  const totalWasted = dedupForTotal.reduce((sum, c) => sum + c.efficiency.potentialSavingsTotal, 0);
  const perAdult = Math.round(totalWasted / 258_000_000);

  let md = `---
title: Efficiency Rankings
layout: layout.njk
---

[← Home](../)

# OECD Spending Efficiency Rankings

The ${JURISDICTION.name} compared to 23 OECD countries across ${withEff.length} spending categories.

**Total waste vs efficient floor: ${fmt(totalWasted)}/yr** (${fmt(perAdult)}/adult)

| Category | ${JURISDICTION.name} $/cap | Rank | Floor | Overspend | Wasted/yr | Best Country |
|----------|----------|------|-------|-----------|-----------|--------------|
`;

  for (const c of withEff.sort((a, b) => b.efficiency.overspendRatio - a.efficiency.overspendRatio)) {
    const slug = slugify(c.name);
    md += `| [${c.name}](../budget/${slug}/) | $${c.efficiency.spendingPerCapita} | ${c.efficiency.rank}/${c.efficiency.totalCountries} | $${c.efficiency.floorSpendingPerCapita} | **${c.efficiency.overspendRatio}x** | ${fmt(c.efficiency.potentialSavingsTotal)} | ${c.efficiency.bestCountry.name} ($${c.efficiency.bestCountry.spendingPerCapita}) |\n`;
  }

  md += `\n## Related\n\n`;
  md += `- [Budget Analysis](../budget/) — detailed analysis per category\n`;
  md += `- [Model Legislation](../legislation/) — bills to address overspending\n`;
  md += `- [Optimization Dividend](../dividend/) — your share of the savings\n`;

  write(`${JURISDICTION.code}/efficiency/index.md`, md);
}

// ─── Dividend Page ──────────────────────────────────────────────────

function generateDividendPage() {
  const withEff = budgetData.categories.filter(hasEfficiency).filter(c => c.efficiency.overspendRatio >= 1.5);
  const deduplicated = deduplicateByOECDField(
    withEff.sort((a, b) => b.efficiency.overspendRatio - a.efficiency.overspendRatio)
  );
  const adults = JURISDICTION.adults;

  let totalSavings = 0;
  let md = `---
title: Optimization Dividend
layout: layout.njk
---

[← Home](../)

# Optimization Dividend Calculator

If the ${JURISDICTION.name} matched the spending efficiency of the best OECD countries, the savings could fund an Optimization Dividend for every adult citizen.

> **Note:** Healthcare savings are counted once (Medicare, Medicaid, and other health programs share the same OECD health spending comparison).

## Savings by Category

| Category | Overspend | Savings/yr | Per Adult/yr | Per Adult/mo |
|----------|-----------|-----------|-------------|-------------|
`;

  for (const c of deduplicated) {
    const e = c.efficiency;
    const perAdult = Math.round(e.potentialSavingsTotal / adults);
    const perMonth = Math.round(perAdult / 12);
    totalSavings += e.potentialSavingsTotal;
    const slug = slugify(c.name);
    const label = OECD_FIELD_MAP[c.id] === 'health' ? 'Healthcare (total system)' : c.name;
    md += `| [${label}](../budget/${slug}/) | ${e.overspendRatio}x | ${fmt(e.potentialSavingsTotal)} | $${perAdult.toLocaleString()} | $${perMonth.toLocaleString()} |\n`;
  }

  const totalPerAdult = Math.round(totalSavings / adults);
  const totalPerMonth = Math.round(totalPerAdult / 12);

  md += `| **TOTAL** | | **${fmt(totalSavings)}** | **$${totalPerAdult.toLocaleString()}** | **$${totalPerMonth.toLocaleString()}** |\n`;

  md += `\n## Household Projections\n\n`;
  md += `| Adults | Monthly | Annual |\n|--------|---------|--------|\n`;
  for (const n of [1, 2, 3, 4]) {
    md += `| ${n} | **$${(totalPerMonth * n).toLocaleString()}/mo** | $${(totalPerAdult * n).toLocaleString()}/yr |\n`;
  }

  md += `\n## Citizen Choice Provision\n\n`;
  md += `Don't like a reform? Redirect your dividend back to any program you choose. `;
  md += `Every citizen can allocate any portion of their payment to any federal budget category. `;
  md += `If enough people redirect their savings to defense, it effectively continues at the current level — through voluntary funding, not compulsion.\n\n`;

  md += `## Related\n\n`;
  md += `- [Budget Analysis](../budget/) — where the savings come from\n`;
  md += `- [Model Legislation](../legislation/) — the bills that would make this happen\n`;
  md += `- [Efficiency Rankings](../efficiency/) — OECD comparisons\n`;

  write(`${JURISDICTION.code}/dividend/index.md`, md);
}

// ─── Evaluation Page ────────────────────────────────────────────────

function generateEvaluationPage() {
  const md = `---
title: Evaluation Framework
layout: layout.njk
---

[← Home](../)

# Evaluation Framework

Every policy recommendation includes automatic evaluation and sunset provisions.

## The Two Metrics

All Optimitron analysis optimizes for exactly two metrics:

1. **Real after-tax median household income** (annual, USD) — source: Census/BLS
2. **Median healthy life expectancy at birth (HALE)** (years) — source: WHO/CDC

These are the ONLY evaluation criteria. Using the **median** (not mean) prevents GDP-style distortion where billionaire gains mask everyone else getting worse.

## Review Process

| Element | Specification |
|---------|---------------|
| **Review cadence** | Biennial (every 2 years) |
| **Review body** | Government Accountability Office (GAO) |
| **Baseline** | Measured within 90 days of enactment |
| **Targets** | Expected improvement + minimum acceptable threshold (50% of expected) |
| **Sunset condition** | Hard sunset — legislation auto-expires if BOTH metrics fail minimum thresholds by Year 4 |
| **Data mandate** | Agencies must publish income (BLS) and HALE (CDC) data annually, publicly accessible |
| **Benchmarks** | 3-5 OECD countries named as ongoing comparisons |

## Outcomes

| Result | Action |
|--------|--------|
| Both targets met | Continue |
| Above minimums but below targets | Modify (adjust provisions) |
| Below minimums on either metric | Expire (hard sunset) unless renewed by supermajority |
| Insufficient data | Extend review period |

## Related

- [Budget Analysis](../budget/) — what's being evaluated
- [Policy Rankings](../policies/) — the policies under review
- [Model Legislation](../legislation/) — bills include these evaluation sections
`;

  write(`${JURISDICTION.code}/evaluation/index.md`, md);
}

// ─── Main ───────────────────────────────────────────────────────────

console.warn('Cleaning old reports...');
cleanSiteDir();

console.warn('Generating analysis site...\n');

generateIndex();
console.warn('  ✅ index.md');

generateBudgetIndex();
console.warn('  ✅ budget/index.md');

generateBudgetDetails();
console.warn(`  ✅ budget/ — ${budgetData.categories.length} category detail pages`);

generatePolicyIndex();
console.warn('  ✅ policies/index.md');

generatePolicyDetails();
console.warn(`  ✅ policies/ — ${policyData.policies.length} policy detail pages`);

generateLegislationIndex();
console.warn('  ✅ legislation/index.md');

generateLegislationDetails();
const legCount = Object.values(LEGISLATION_MAP).filter(slug =>
  existsSync(resolve(LEGISLATION_DIR, `${slug}.md`))
).length;
console.warn(`  ✅ legislation/ — ${legCount} bill detail pages`);

generateEfficiencyIndex();
console.warn('  ✅ efficiency/index.md');

generateDividendPage();
console.warn('  ✅ dividend/index.md');

generateEvaluationPage();
console.warn('  ✅ evaluation/index.md');

// ─── JSON Manifest for Web App ──────────────────────────────────────
// A single JSON file listing all pages with their metadata, so the
// Next.js web app can import and render them without parsing markdown.

// ─── Root Index ─────────────────────────────────────────────────────

function generateRootIndex() {
  const withEff = budgetData.categories.filter(hasEfficiency);
  const deduped = deduplicateByOECDField(withEff);
  const totalWasted = deduped.reduce((sum, c) => sum + c.efficiency.potentialSavingsTotal, 0);
  const perAdult = Math.round(totalWasted / JURISDICTION.adults);

  const md = `---
title: Home
layout: layout.njk
---

# Optimitron: Evidence-Based Earth Optimization

## Jurisdictions

### [${JURISDICTION.name}](./${JURISDICTION.code}/)

${budgetData.categories.length} budget categories analyzed against 23 OECD countries.
Total overspend vs efficient floor: **${fmt(totalWasted)}/yr** (${fmt(perAdult)}/adult).

### [Wishonia: The Optimal Composite](./wishonia/)

What ${JURISDICTION.name} would look like if it adopted each category's most efficient country's approach.
`;
  write('index.md', md);
}

// ─── Wishonia (Optimal Composite Jurisdiction) ──────────────────────

function generateWishonia() {
  const withEff = budgetData.categories.filter(hasEfficiency);
  const deduped = deduplicateByOECDField(
    withEff.sort((a, b) => b.efficiency.overspendRatio - a.efficiency.overspendRatio)
  );
  const adults = JURISDICTION.adults;

  let totalCurrentSpending = 0;
  let totalOptimalSpending = 0;

  // Build the composite
  const rows = deduped.map((c) => {
    const label = OECD_FIELD_MAP[c.id] === 'health' ? 'Healthcare (total system)' : c.name;
    const e = c.efficiency;
    const currentTotal = e.spendingPerCapita * JURISDICTION.population;
    const optimalTotal = e.floorSpendingPerCapita * JURISDICTION.population;
    totalCurrentSpending += currentTotal;
    totalOptimalSpending += optimalTotal;
    const savings = currentTotal - optimalTotal;
    const perAdult = Math.round(savings / adults);
    const perMonth = Math.round(perAdult / 12);
    const legSlug = LEGISLATION_MAP[c.id];
    const legLink = legSlug ? ` · [bill](../${JURISDICTION.code}/legislation/${legSlug}/)` : '';

    return {
      label,
      modelCountry: e.bestCountry.name,
      currentPerCap: e.spendingPerCapita,
      optimalPerCap: e.floorSpendingPerCapita,
      savings,
      perAdult,
      perMonth,
      outcomeName: e.outcomeName,
      modelOutcome: e.bestCountry.outcome,
      targetOutcome: e.outcome,
      overspend: e.overspendRatio,
      detailLink: `../${JURISDICTION.code}/budget/${slugify(c.name)}/`,
      legLink,
    };
  });

  const totalSavings = totalCurrentSpending - totalOptimalSpending;
  const totalPerAdult = Math.round(totalSavings / adults);
  const totalPerMonth = Math.round(totalPerAdult / 12);

  // Index page
  let indexMd = `---
title: "Wishonia: The Optimal Composite"
layout: layout.njk
---

[← Home](../)

# Wishonia: What ${JURISDICTION.name} Looks Like With Its Own Best Ideas

> On my planet, we looked at what worked and did that. It took about four minutes. You lot have been arguing about it for 248 years.

Wishonia is a composite jurisdiction that adopts **each spending category's most efficient country's approach**. It's not hypothetical — every policy below is already working somewhere on Earth.

## The Composite

| Category | Model Country | US $/cap | Wishonia $/cap | Overspend | Savings/yr | Your Dividend |
|----------|--------------|----------|----------------|-----------|-----------|---------------|
`;

  for (const r of rows) {
    indexMd += `| [${r.label}](${r.detailLink}) | ${r.modelCountry} | $${r.currentPerCap.toLocaleString()} | $${r.optimalPerCap.toLocaleString()} | ${r.overspend}x | ${fmt(r.savings)} | $${r.perAdult.toLocaleString()}/yr ($${r.perMonth}/mo)${r.legLink} |\n`;
  }

  indexMd += `| **TOTAL** | | | | | **${fmt(totalSavings)}** | **$${totalPerAdult.toLocaleString()}/yr ($${totalPerMonth.toLocaleString()}/mo)** |\n`;

  indexMd += `
## What Changes

`;

  for (const r of rows) {
    indexMd += `### ${r.label}: Adopt ${r.modelCountry}'s Approach\n\n`;
    indexMd += `${r.modelCountry} achieves ${r.outcomeName} of **${r.modelOutcome}** at **$${r.optimalPerCap.toLocaleString()}/cap**. `;
    indexMd += `The ${JURISDICTION.name} gets ${r.outcomeName} ${r.targetOutcome} at $${r.currentPerCap.toLocaleString()}/cap (${r.overspend}x more for worse results).\n\n`;
    indexMd += `Savings: **${fmt(r.savings)}/yr** → **$${r.perAdult.toLocaleString()}/yr per adult** as Optimization Dividend.\n\n`;
    indexMd += `[View detailed analysis →](${r.detailLink})${r.legLink ? ` · [View model legislation →](${r.legLink.replace(' · ', '').replace('[bill]', '').replace('(', '').replace(')', '')})` : ''}\n\n`;
  }

  indexMd += `## Household Dividend Projections

| Adults | Monthly | Annual |
|--------|---------|--------|
`;
  for (const n of [1, 2, 3, 4]) {
    indexMd += `| ${n} | **$${(totalPerMonth * n).toLocaleString()}/mo** | $${(totalPerAdult * n).toLocaleString()}/yr |\n`;
  }

  indexMd += `
## Citizen Choice

Don't like a reform? Redirect your dividend back to any program you choose. Your money, your call.

## Related

- [${JURISDICTION.name} Analysis](../${JURISDICTION.code}/) — full budget analysis
- [Efficiency Rankings](../${JURISDICTION.code}/efficiency/) — OECD comparison table
- [Model Legislation](../${JURISDICTION.code}/legislation/) — drafted bills for each reform
`;

  write('wishonia/index.md', indexMd);
}

generateRootIndex();
console.warn('  ✅ index.md (root)');

generateWishonia();
console.warn('  ✅ wishonia/index.md');

console.warn('\nDone! Site in reports/site/');
console.warn('Run: cd reports/site && npx @11ty/eleventy --serve');
