#!/usr/bin/env tsx
/**
 * Earth Special Education — Misinformation Correction Generator
 *
 * Generates a mathematically-grounded correction for costly misinformation,
 * ready to post on social media. Includes a task assignment for the person
 * to do something useful instead.
 *
 * Usage:
 *   pnpm tsx scripts/earth-special-education.ts
 *   pnpm tsx scripts/earth-special-education.ts --topic iran
 *   pnpm tsx scripts/earth-special-education.ts --topic iran --statement "Iran can't be trusted"
 *   pnpm tsx scripts/earth-special-education.ts --list
 */

import { parseArgs } from "node:util";

// ─── Data ────────────────────────────────────────────────────────────────────

interface TopicFact {
  fact: string;
  source?: string;
}

interface CommonArgument {
  claim: string;
  fallacy: string;
  rebuttal: string;
}

interface Topic {
  id: string;
  name: string;
  costPerDay: number;
  facts: TopicFact[];
  commonArguments: CommonArgument[];
  taskTitle: string;
  taskUrl: string;
  taskValue: string;
  taskDifficulty: string;
  taskDeadline?: string;
}

const TOPICS: Record<string, Topic> = {
  iran: {
    id: "iran",
    name: "Iran War / Iran Deal",
    costPerDay: 6_000_000_000,
    facts: [
      { fact: "30,000+ killed since hostilities began (June 2026)" },
      {
        fact: "Oil at $110/barrel vs. pre-war ~$70 → $4B/day global oil shock",
        source: "EIA, Bloomberg June 2026",
      },
      {
        fact: "US military cost: ~$700M–$1B/day at current operational tempo",
        source: "DoD operational cost estimates",
      },
      { fact: "Total global cost: ~$6B/day while this continues" },
      {
        fact: "A final deal value: ~$2.2T/year (oil normalization + Strait of Hormuz + reconstruction)",
      },
      {
        fact: "The 2015 JCPOA held for 15 months after Trump withdrew — Iran complied until the US broke it first",
        source: "IAEA quarterly reports 2018–2019",
      },
      {
        fact: "Iran is currently enriching to 60%+ with no IAEA inspection access",
        source: "IAEA Board of Governors report, 2026",
      },
      {
        fact: "60-day MoU window closes August 15, 2026 — no deal = war resumes",
        source: "Joint MoU text, June 15 2026",
      },
      {
        fact: "Cost of signing a piece of paper: ~30 minutes of diplomatic time",
      },
      { fact: "ROI of a final deal vs. continued war: approximately 366,000:1 per year" },
    ],
    commonArguments: [
      {
        claim: "Iran can't be trusted, no deal will hold",
        fallacy: "Fixed-trait fallacy",
        rebuttal:
          "The 2015 JCPOA held for 15 months after Trump withdrew — Iran complied until the US broke the deal first. 'Trustworthiness' is a function of incentive structures and verification mechanisms, not a fixed national trait. The question is verification design. Cost of no-deal based on a fixed-trait assumption: $6B/day indefinitely.",
      },
      {
        claim: "The deal is too weak on nuclear limits",
        fallacy: "Perfect solution fallacy",
        rebuttal:
          "Any deal with IAEA inspection access is better than the current state: Iran enriching to 60%+ with zero inspectors. The alternative is not a stronger deal — it's no deal and resumed war. The 60-day window exists to negotiate stronger terms. Demanding perfection by August 15 produces nothing.",
      },
      {
        claim: "We should keep military pressure on Iran",
        fallacy: "Sunk cost + availability heuristic",
        rebuttal:
          "Military pressure has produced: 30,000+ dead, $6B/day global cost, oil at $110/barrel. ROI on continued pressure at any time horizon past 30 days is negative. 'Pressure' is not free — it costs $700M–$1B/day and has produced a 60-day MoU, which is exactly what negotiations were going to produce anyway. We paid $25B+ to get to the same place.",
      },
      {
        claim: "The deal rewards Iran's aggression",
        fallacy: "Framing fallacy",
        rebuttal:
          "The deal rewards stopping Iranian aggression, not the aggression itself. The alternative is $6B/day until one side collapses. At current US deficit trajectory, fiscal pressure will eventually force a deal from a weaker position. A deal now is more favorable to US interests than a deal in 18 months of additional war spending.",
      },
      {
        claim: "Iran wants nukes no matter what",
        fallacy: "Mind-reading / unfalsifiable claim",
        rebuttal:
          "This is an unfalsifiable assertion used to block any negotiated solution. The JCPOA successfully halted nuclear progress for 3+ years with verification. Breakout time under JCPOA: 12 months. Breakout time right now with no deal and no inspectors: ~3 months. A bad deal is not worse than the current situation.",
      },
    ],
    taskTitle: "Sign a Final Iran Deal Before the 60-Day Window Expires",
    taskUrl: "https://optimitron.com/tasks/cmqihq4au000004kzuh80znvc",
    taskValue: "$2.2T/year",
    taskDifficulty: "TRIVIAL",
    taskDeadline: "August 15, 2026",
  },

  defense: {
    id: "defense",
    name: "US Defense Spending",
    costPerDay: 2_427_397_260,
    facts: [
      {
        fact: "US defense budget FY2025: $886B/year ($2.4B/day)",
        source: "DoD FY2025 budget request",
      },
      {
        fact: "US spends more on defense than the next 10 countries combined",
        source: "SIPRI Military Expenditure Database 2024",
      },
      {
        fact: "NIH budget: $48B/year — 18.4x smaller than defense",
        source: "NIH FY2024 appropriations",
      },
      {
        fact: "A single F-35 costs $80M–$110M; one unit could fund ~45,000 DALYs at ICEWAD cost-effectiveness",
      },
      {
        fact: "The 1% Treaty would redirect $8.86B/year to clinical trials — at $0.00177/DALY, that prevents ~5B DALYs",
        source: "warondisease.org model, 670 parameters",
      },
      {
        fact: "Political dysfunction tax: $101T/year in foregone welfare",
        source: "manual.warondisease.org/knowledge/appendix/political-dysfunction-tax",
      },
    ],
    commonArguments: [
      {
        claim: "We can't cut defense, it keeps us safe",
        fallacy: "Slippery slope + omission of alternatives",
        rebuttal:
          "The US spends more than the next 10 countries combined. The marginal safety gain from dollar 800B is near zero. The marginal welfare gain from redirecting 1% ($8.86B) to disease eradication: ~5 billion DALYs. Safety is not binary. The question is ROI at the margin.",
      },
      {
        claim: "We can't afford universal healthcare / disease research",
        fallacy: "False scarcity",
        rebuttal:
          "The US spends $886B/year on defense and $4.5T/year on healthcare with poor outcomes. The 1% Treaty redirects $8.86B — less than 1% of the defense budget — to clinical trials. At $0.00177/DALY, that prevents more suffering than any healthcare expansion of similar cost. The constraint is political, not fiscal.",
      },
    ],
    taskTitle: "Vote Yes on the 1% Treaty",
    taskUrl: "https://warondisease.org",
    taskValue: "$84 quadrillion (modeled)",
    taskDifficulty: "TRIVIAL",
  },

  war_and_disease: {
    id: "war_and_disease",
    name: "Ending War and Disease",
    costPerDay: 277_000_000_000,
    facts: [
      {
        fact: "Political dysfunction tax: $101T/year in foregone welfare — the gap between actual and optimal government output",
        source: "manual.warondisease.org/knowledge/appendix/political-dysfunction-tax",
      },
      {
        fact: "ICEWAD cost-effectiveness: $0.00177/DALY — 50,300x more cost-effective than insecticide-treated bednets",
        source: "warondisease.org model, 670 parameters, Monte Carlo simulation",
      },
      {
        fact: "$1 donated → ~565 DALYs prevented; $1,000 → ~565,000 DALYs; $100,000 → ~3,200 lives",
      },
      {
        fact: "Total value of ending war and disease: $84 quadrillion (present value of 15-year impact)",
        source: "manual.warondisease.org/knowledge/economics/1-pct-treaty-impact",
      },
      {
        fact: "Earth Optimization Day: August 6, 2026 — the campaign deadline",
      },
    ],
    commonArguments: [
      {
        claim: "You can't end war, it's human nature",
        fallacy: "Appeal to nature + fixed-trait fallacy",
        rebuttal:
          "War is not a trait — it's an institution. Dueling was 'human nature' until legal and social institutions made it prohibitively costly. The 1% Treaty changes the incentive structure for the largest collective action problem on Earth. The math: $84 quadrillion in recoverable value vs. institutional friction costs of a treaty. This is not idealism — it's a cost-benefit problem.",
      },
      {
        claim: "These numbers are made up / too big to be credible",
        fallacy: "Ad hominem + scope insensitivity",
        rebuttal:
          "The model has 670 parameters, Monte Carlo simulation, and complete derivation chains published at manual.warondisease.org with 95% confidence intervals. The math does not care whether it sounds implausible. The question is: which specific number do you disagree with, and what's your alternative estimate?",
      },
    ],
    taskTitle: "Vote Yes on the 1% Treaty",
    taskUrl: "https://warondisease.org",
    taskValue: "$84 quadrillion",
    taskDifficulty: "TRIVIAL",
  },
};

// ─── Formatter ───────────────────────────────────────────────────────────────

function formatCorrection(topic: Topic, statement?: string): string {
  const lines: string[] = [];

  lines.push("🎓 Earth Optimization Special Education\n");

  // Find matching argument if statement provided
  let matchedArg: CommonArgument | undefined;
  if (statement) {
    const lower = statement.toLowerCase();
    matchedArg = topic.commonArguments.find(
      (a) =>
        lower.includes(a.claim.toLowerCase().slice(0, 15)) ||
        a.claim.toLowerCase().split(" ").some((w) => w.length > 5 && lower.includes(w)),
    );
  }

  if (statement) {
    lines.push(`You said: "${statement}"\n`);
    lines.push(
      "Strong instinct to reason carefully about this — it matters enormously.\n",
    );
  } else {
    lines.push(
      "Strong instinct to think carefully about this — it matters enormously.\n",
    );
  }

  lines.push(`Here's the data that updates the picture:\n`);
  lines.push(`📊 ${topic.name} by the numbers:`);
  for (const f of topic.facts) {
    lines.push(`• ${f.fact}${f.source ? ` (${f.source})` : ""}`);
  }

  if (matchedArg) {
    lines.push("");
    lines.push(`⚠️  The logical issue: ${matchedArg.fallacy}`);
    lines.push("");
    lines.push(matchedArg.rebuttal);
  } else if (statement) {
    lines.push("");
    lines.push(
      `⚠️  [Identify the specific logical fallacy in their argument here]`,
    );
    lines.push(
      `[Explain what they got right and what data point changes the conclusion]`,
    );
  }

  lines.push("");
  lines.push(
    `The highest-leverage action available right now:\n`,
  );
  lines.push(`👉 ${topic.taskTitle}`);
  lines.push(`   ${topic.taskUrl}`);
  lines.push(`   Value: ${topic.taskValue} | Difficulty: ${topic.taskDifficulty}${topic.taskDeadline ? ` | Deadline: ${topic.taskDeadline}` : ""}`);
  lines.push("");
  lines.push("— Earth Optimization Services");

  return lines.join("\n");
}

function printTopicSummary(topic: Topic): string {
  const lines = [
    `\n━━━ ${topic.name.toUpperCase()} ━━━`,
    `Cost: $${(topic.costPerDay / 1e9).toFixed(1)}B/day`,
    `Task: ${topic.taskTitle}`,
    `URL:  ${topic.taskUrl}`,
    ``,
    `Common wrong arguments:`,
  ];
  for (const a of topic.commonArguments) {
    lines.push(`  • "${a.claim}" → ${a.fallacy}`);
  }
  return lines.join("\n");
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const { values } = parseArgs({
  options: {
    topic: { type: "string", short: "t" },
    statement: { type: "string", short: "s" },
    list: { type: "boolean", short: "l" },
    all: { type: "boolean", short: "a" },
  },
  strict: false,
});

if (values.list) {
  console.log("\nAvailable topics:");
  for (const [key, t] of Object.entries(TOPICS)) {
    console.log(`  ${key.padEnd(20)} ${t.name} ($${(t.costPerDay / 1e9).toFixed(1)}B/day)`);
  }
  console.log(
    "\nUsage: pnpm tsx scripts/earth-special-education.ts --topic iran --statement \"Iran can't be trusted\"",
  );
  process.exit(0);
}

if (values.all) {
  for (const topic of Object.values(TOPICS)) {
    console.log(printTopicSummary(topic));
  }
  process.exit(0);
}

const topicKey = (values.topic as string | undefined) ?? "iran";
const topic = TOPICS[topicKey];

if (!topic) {
  console.error(
    `Unknown topic: "${topicKey}". Run with --list to see available topics.`,
  );
  process.exit(1);
}

const statement = values.statement as string | undefined;

console.log("\n" + "─".repeat(72));
console.log(formatCorrection(topic, statement));
console.log("─".repeat(72));

if (statement) {
  const lower = statement.toLowerCase();
  const matched = topic.commonArguments.find(
    (a) =>
      lower.includes(a.claim.toLowerCase().slice(0, 15)) ||
      a.claim.toLowerCase().split(" ").some((w) => w.length > 5 && lower.includes(w)),
  );
  if (!matched) {
    console.log("\n⚠️  No pre-built rebuttal matched that statement.");
    console.log("   Known arguments for this topic:");
    for (const a of topic.commonArguments) {
      console.log(`   • "${a.claim}"`);
    }
  }
}

console.log(
  `\n✅ Task: ${topic.taskUrl}`,
);
console.log(
  `📋 Full task list: https://optimitron.com/tasks/education:earth-special-education-program`,
);
