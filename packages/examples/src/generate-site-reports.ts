#!/usr/bin/env tsx
/**
 * Generate the static markdown analysis site.
 *
 * Reads all analysis data (budget, policies, legislation) and produces
 * cross-linked markdown files in reports/site/ that mirror the website routes.
 *
 * Run: pnpm --filter @optimitron/examples run generate:site
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DATA = resolve(__dirname, '../../web/src/data');
const LEGISLATION_DIR = resolve(WEB_DATA, 'legislation');
const SITE_DIR = resolve(__dirname, '../../../reports/site');

// ─── Load Data ──────────────────────────────────────────────────────

const budgetData = JSON.parse(readFileSync(resolve(WEB_DATA, 'us-budget-analysis.json'), 'utf-8'));
const policyData = JSON.parse(readFileSync(resolve(WEB_DATA, 'us-policy-analysis.json'), 'utf-8'));

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

const LEGISLATION_MAP: Record<string, string> = {
  'Military': 'military-reform',
  'Medicare': 'medicare-reform',
  'Medicaid': 'medicaid-reform',
  'Health (non-Medicare/Medicaid)': 'health-non-medicare-medicaid-reform',
  'Science / NASA': 'science-nasa-reform',
  'Social Security': 'social-security-reform',
};

const US_MEDIAN_INCOME = 59_540;

function write(path: string, content: string) {
  const full = resolve(SITE_DIR, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

// Deduplicate categories that share the same OECD spending field
// (Medicare, Medicaid, Health all map to healthSpendingPerCapitaPpp)
const OECD_FIELD_MAP: Record<string, string> = {
  'Medicare': 'health', 'Medicaid': 'health', 'Health (non-Medicare/Medicaid)': 'health',
  'Military': 'military', 'Social Security': 'social', 'Education': 'education', 'Science / NASA': 'rd',
};

function deduplicateByOECDField(categories: any[]): any[] {
  const seen = new Set<string>();
  return categories.filter((c: any) => {
    const field = OECD_FIELD_MAP[c.name];
    if (!field) return true;
    if (seen.has(field)) return false;
    seen.add(field);
    return true;
  });
}

// Map policy categories to related legislation
const POLICY_TO_LEGISLATION: Record<string, string> = {
  'health': 'medicare-reform',
  'health_research': 'health-non-medicare-medicaid-reform',
  'health_system': 'medicare-reform',
  'defense': 'military-reform',
  'income_security': 'social-security-reform',
  'environment': 'science-nasa-reform',
};

// ─── Index Page ─────────────────────────────────────────────────────

function generateIndex() {
  const withEfficiency = budgetData.categories.filter((c: any) => c.efficiency);
  const dedupForTotal = deduplicateByOECDField(withEfficiency);
  const totalWasted = dedupForTotal.reduce((sum: number, c: any) => sum + c.efficiency.potentialSavingsTotal, 0);

  const md = `---
title: Home
layout: layout.njk
---

# Optimitron Analysis: US Federal Budget

**${budgetData.categories.length} budget categories** analyzed against **23 OECD countries**.
The US ranks dead last in ${withEfficiency.filter((c: any) => c.efficiency.usRank === c.efficiency.totalCountries).length} of ${withEfficiency.length} categories with cross-country data.

**Total waste vs OECD efficient floor: ${fmt(totalWasted)}/yr**

## Navigate

- [**Budget Analysis**](./budget/) — ${budgetData.categories.length} categories with OECD efficiency rankings
- [**Policy Rankings**](./policies/) — ${policyData.policies.length} evidence-based policies ranked by impact
- [**Model Legislation**](./legislation/) — ${Object.keys(LEGISLATION_MAP).length} Gemini-drafted bills with citations
- [**Efficiency Rankings**](./efficiency/) — OECD cross-country comparisons
- [**Universal Dividend**](./dividend/) — Savings breakdown per household

## Top Findings

${budgetData.topRecommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

---

*Generated ${new Date(budgetData.generatedAt).toLocaleDateString()} by Optimitron OBG + OPG + OECD cross-country panel*
`;
  write('index.md', md);
}

// ─── Budget Index ───────────────────────────────────────────────────

function generateBudgetIndex() {
  const cats = budgetData.categories;

  const rows = cats.map((c: any) => {
    const eff = c.efficiency;
    const slug = slugify(c.name);
    const rank = eff ? `${eff.usRank}/${eff.totalCountries}` : '—';
    const over = eff ? `${eff.overspendRatio}x` : '—';
    const savings = eff ? fmt(eff.potentialSavingsTotal) : '—';
    const legSlug = LEGISLATION_MAP[c.name];
    const legLink = legSlug ? ` · [legislation](../legislation/${legSlug}/)` : '';
    return `| [${c.name}](./${slug}/) | ${fmt(c.currentSpending)} | $${c.currentSpendingRealPerCapita.toFixed(0)}/cap | ${rank} | ${over} | ${savings} | ${c.recommendation}${legLink} |`;
  }).join('\n');

  const md = `---
title: Budget Overview
layout: layout.njk
---

[← Home](../)

# US Federal Budget: ${cats.length} Categories

Total budget: **${fmt(budgetData.totalBudget)}**

| Category | Nominal | Real/Cap | OECD Rank | Overspend | Wasted/yr | Action |
|----------|---------|----------|-----------|-----------|-----------|--------|
${rows}

## Related

- [Policy Rankings](../policies/) — evidence-based policies for each category
- [Model Legislation](../legislation/) — drafted bills for overspending categories
- [Efficiency Rankings](../efficiency/) — full OECD comparison table
- [Universal Dividend](../dividend/) — your share of the savings
`;
  write('budget/index.md', md);
}

// ─── Budget Category Details ────────────────────────────────────────

function generateBudgetDetails() {
  for (const cat of budgetData.categories) {
    const slug = slugify(cat.name);
    const eff = cat.efficiency;
    const dr = cat.diminishingReturns;
    const legSlug = LEGISLATION_MAP[cat.name];

    let md = `---
title: "${cat.name}"
layout: layout.njk
---

[← Budget Overview](../)\n\n`;

    md += `# ${cat.name}\n\n`;

    // Summary stats
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Current spending | ${fmt(cat.currentSpending)} |\n`;
    md += `| Real per-capita (2017 USD) | $${cat.currentSpendingRealPerCapita.toFixed(0)} |\n`;
    if (eff) {
      md += `| OECD efficiency rank | **${eff.usRank}/${eff.totalCountries}** |\n`;
      md += `| Overspend ratio | **${eff.overspendRatio}x** |\n`;
      md += `| Floor spending | $${eff.floorSpending}/cap |\n`;
      md += `| Potential savings | **${fmt(eff.potentialSavingsTotal)}/yr** |\n`;
    }
    md += `| Recommendation | **${cat.recommendation.toUpperCase()}** |\n`;
    md += `| Evidence | ${cat.evidenceSource} |\n`;
    if (eff) {
      const perAdult = Math.round(eff.potentialSavingsTotal / 258_000_000);
      const perMonth = Math.round(perAdult / 12);
      md += `| **Your dividend** | **$${perAdult.toLocaleString()}/yr ($${perMonth.toLocaleString()}/mo)** per adult |\n`;
    }
    md += '\n';

    // Efficiency comparison
    if (eff) {
      md += `## OECD Efficiency Comparison\n\n`;
      md += `> **Note:** OECD spending data reflects total government spending (federal + state + local). `;
      md += `The US federal budget line item for "${cat.name}" is ${fmt(cat.currentSpending)}, `;
      md += `but the OECD comparison uses the full government system at $${eff.usData.spending}/cap.\n\n`;
      md += `| Country | Spending/cap | ${eff.outcomeName} | Rank |\n`;
      md += `|---------|-------------|${'-'.repeat(eff.outcomeName.length + 2)}|------|\n`;
      md += `| **US** | **$${eff.usData.spending}** | **${eff.usData.outcome}** | **${eff.usRank}** |\n`;
      for (const t of eff.topEfficient) {
        md += `| ${t.name} | $${t.spending} | ${t.outcome} | ${t.rank} |\n`;
      }
      md += `\nBest: **${eff.bestCountry.name}** — $${eff.bestCountry.spending}/cap → ${eff.outcomeName} ${eff.bestCountry.outcome}\n\n`;
    }

    // Diminishing returns
    if (dr) {
      md += `## Diminishing Returns Model\n\n`;
      md += `- Model: ${dr.modelType}\n`;
      md += `- R²: ${dr.r2}\n`;
      md += `- Observations: ${dr.n}\n`;
      if (dr.elasticity != null) md += `- Elasticity: ${dr.elasticity} (1% spending → ${dr.elasticity}% ${dr.outcomeName})\n`;
      md += `\n`;
    }

    // Historical spending
    if (cat.historicalRealPerCapita.length > 0) {
      const first = cat.historicalRealPerCapita[0];
      const last = cat.historicalRealPerCapita[cat.historicalRealPerCapita.length - 1];
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

    // Recommendation
    if (eff && eff.overspendRatio >= 1.5) {
      const perAdult = Math.round(eff.potentialSavingsTotal / 258_000_000);
      const perMonth = Math.round(perAdult / 12);
      const topNames = eff.topEfficient.map((t: any) => t.name).join(', ');
      md += `## Recommendation\n\n`;
      md += `**Adopt the approach of ${topNames}.** These countries achieve ${eff.outcomeName} `;
      md += `of ${eff.topEfficient[0]?.outcome ?? '?'} while spending $${eff.topEfficient[0]?.spending ?? '?'}/cap `;
      md += `vs the US at $${eff.usData.spending}/cap for ${eff.outcomeName} ${eff.usData.outcome}.\n\n`;
      md += `Reducing to the efficient floor of $${eff.floorSpending}/cap would save **${fmt(eff.potentialSavingsTotal)}/yr**, `;
      md += `equivalent to **$${perAdult.toLocaleString()}/yr ($${perMonth.toLocaleString()}/mo)** per adult as a Universal Dividend.\n\n`;
      if (legSlug) {
        md += `**[Read the model legislation for this reform →](../legislation/${legSlug}/)**\n\n`;
      }
    } else if (eff && eff.overspendRatio < 1.2) {
      md += `## Assessment\n\n`;
      md += `US spending on ${cat.name} is **near the efficient floor** (${eff.overspendRatio}x). No major reallocation recommended.\n\n`;
    }

    // Related links
    md += `## Related\n\n`;
    if (legSlug) {
      md += `- [**View Model Legislation →**](../legislation/${legSlug}/)\n`;
    }
    md += `- [Efficiency Rankings](../efficiency/)\n`;
    md += `- [Policy Rankings](../policies/)\n`;
    md += `- [Universal Dividend](../dividend/)\n`;
    md += `- [← Back to Budget Overview](../)\n`;

    write(`budget/${slug}/index.md`, md);
  }
}

// ─── Policy Index ───────────────────────────────────────────────────

function generatePolicyIndex() {
  const rows = policyData.policies.map((p: any) => {
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
- [Universal Dividend](../dividend/) — combined savings per household
`;
  write('policies/index.md', md);
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
      md += `| ${k} | ${((v as number) * 100).toFixed(0)}% |\n`;
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
    md += `- [Universal Dividend](../../dividend/)\n`;

    write(`policies/${slug}/index.md`, md);
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

  for (const [catName, legSlug] of entries) {
    const cat = budgetData.categories.find((c: any) => c.name === catName);
    const eff = cat?.efficiency;
    md += `| [${catName} Reform](./${legSlug}/) | ${catName} | ${eff ? eff.overspendRatio + 'x' : '—'} | ${eff ? fmt(eff.potentialSavingsTotal) + '/yr' : '—'} |\n`;
  }

  md += `\n## Related\n\n`;
  md += `- [Budget Analysis](../budget/) — the evidence behind each bill\n`;
  md += `- [Policy Rankings](../policies/) — scored policy alternatives\n`;
  md += `- [Efficiency Rankings](../efficiency/) — OECD country comparisons\n`;

  write('legislation/index.md', md);
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
    write(`legislation/${legSlug}/index.md`, md);
  }
}

// ─── Efficiency Index ───────────────────────────────────────────────

function generateEfficiencyIndex() {
  const withEff = budgetData.categories.filter((c: any) => c.efficiency);
  const dedupForTotal = deduplicateByOECDField(withEff);
  const totalWasted = dedupForTotal.reduce((sum: number, c: any) => sum + c.efficiency.potentialSavingsTotal, 0);
  const perAdult = Math.round(totalWasted / 258_000_000);

  let md = `---
title: Efficiency Rankings
layout: layout.njk
---

[← Home](../)

# OECD Spending Efficiency Rankings

The US compared to 23 OECD countries across ${withEff.length} spending categories.

**Total waste vs efficient floor: ${fmt(totalWasted)}/yr** (${fmt(perAdult)}/adult)

| Category | US $/cap | Rank | Floor | Overspend | Wasted/yr | Best Country |
|----------|----------|------|-------|-----------|-----------|--------------|
`;

  for (const c of withEff.sort((a: any, b: any) => b.efficiency.overspendRatio - a.efficiency.overspendRatio)) {
    const e = c.efficiency;
    const slug = slugify(c.name);
    md += `| [${c.name}](../budget/${slug}/) | $${e.usData.spending} | ${e.usRank}/${e.totalCountries} | $${e.floorSpending} | **${e.overspendRatio}x** | ${fmt(e.potentialSavingsTotal)} | ${e.bestCountry.name} ($${e.bestCountry.spending}) |\n`;
  }

  md += `\n## Related\n\n`;
  md += `- [Budget Analysis](../budget/) — detailed analysis per category\n`;
  md += `- [Model Legislation](../legislation/) — bills to address overspending\n`;
  md += `- [Universal Dividend](../dividend/) — your share of the savings\n`;

  write('efficiency/index.md', md);
}

// ─── Dividend Page ──────────────────────────────────────────────────

function generateDividendPage() {
  const withEff = budgetData.categories.filter((c: any) => c.efficiency && c.efficiency.overspendRatio >= 1.5);
  const deduplicated = deduplicateByOECDField(
    withEff.sort((a: any, b: any) => b.efficiency.overspendRatio - a.efficiency.overspendRatio)
  );
  const adults = 258_000_000;

  let totalSavings = 0;
  let md = `---
title: Universal Dividend
layout: layout.njk
---

[← Home](../)

# Universal Dividend Calculator

If the US matched the spending efficiency of the best OECD countries, the savings could fund a Universal Dividend for every adult citizen.

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
    const label = OECD_FIELD_MAP[c.name] === 'health' ? 'Healthcare (total system)' : c.name;
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

  write('dividend/index.md', md);
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

  write('evaluation/index.md', md);
}

// ─── Main ───────────────────────────────────────────────────────────

console.log('Generating analysis site...\n');

generateIndex();
console.log('  ✅ index.md');

generateBudgetIndex();
console.log('  ✅ budget/index.md');

generateBudgetDetails();
console.log(`  ✅ budget/ — ${budgetData.categories.length} category detail pages`);

generatePolicyIndex();
console.log('  ✅ policies/index.md');

generatePolicyDetails();
console.log(`  ✅ policies/ — ${policyData.policies.length} policy detail pages`);

generateLegislationIndex();
console.log('  ✅ legislation/index.md');

generateLegislationDetails();
const legCount = Object.values(LEGISLATION_MAP).filter(slug =>
  existsSync(resolve(LEGISLATION_DIR, `${slug}.md`))
).length;
console.log(`  ✅ legislation/ — ${legCount} bill detail pages`);

generateEfficiencyIndex();
console.log('  ✅ efficiency/index.md');

generateDividendPage();
console.log('  ✅ dividend/index.md');

generateEvaluationPage();
console.log('  ✅ evaluation/index.md');

console.log('\nDone! Site in reports/site/');
console.log('Run: cd reports/site && npx @11ty/eleventy --serve');
