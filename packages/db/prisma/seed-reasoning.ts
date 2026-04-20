/**
 * Seed: /reasoning autonomous persuasion optimizer
 *
 * Seeds:
 *  - 4 VariantSets (canonical + 3 persona-tuned)
 *  - Initial English arms per slot across ≥3 VariantFamilies
 *  - 4 relationship handoff templates
 *  - LocaleConfig rows (en enabled, 10 others disabled with banned-phrase seeds)
 *  - SystemState singleton
 *  - Default FraudPatterns + DistributionTargets
 *  - AssignmentRules mapping ?rel= to persona variants
 *
 * Idempotent: safe to re-run.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { loadDatabaseUrl } from "../src/db-cli.ts";
import type { ParameterName } from "@optimitron/data/parameters";

let prisma: PrismaClient;
const DEFAULT_ARM_CHANNEL = "default";
const p = <T extends ParameterName>(paramName: T) => `{${paramName}}`;

export async function seedReasoningData(prismaClient: PrismaClient) {
  prisma = prismaClient;
  await seedSystemState();
  await seedLocaleConfigs();
  await seedFraudPatterns();
  const canonicalSetId = await seedCanonicalVariantSet();
  const personaSetIds = await seedPersonaVariantSets(canonicalSetId);
  await seedPersonaArmVariants(personaSetIds);
  await seedAssignmentRules(personaSetIds);
  await seedDistributionTargets();
  await assertAssignmentRuleTargetsSeeded();

  console.log("✓ reasoning seed complete");
}

async function seedSystemState() {
  await prisma.reasoningSystemState.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      topologyGateOpen: false,
      promoterFrozen: false,
      allocatorForceCanonical: false,
    },
    update: {},
  });
}

async function seedLocaleConfigs() {
  const locales = [
    { localeKey: "en", displayName: "English", enabled: true, audienceEstimate: 1_500_000_000 },
    { localeKey: "zh-Hans", displayName: "Chinese (Simplified)", enabled: false, audienceEstimate: 1_100_000_000 },
    { localeKey: "zh-Hant", displayName: "Chinese (Traditional)", enabled: false, audienceEstimate: 60_000_000 },
    { localeKey: "es", displayName: "Spanish", enabled: false, audienceEstimate: 600_000_000 },
    { localeKey: "hi", displayName: "Hindi", enabled: false, audienceEstimate: 600_000_000 },
    { localeKey: "ar", displayName: "Arabic", enabled: false, audienceEstimate: 400_000_000 },
    { localeKey: "pt", displayName: "Portuguese", enabled: false, audienceEstimate: 270_000_000 },
    { localeKey: "bn", displayName: "Bengali", enabled: false, audienceEstimate: 230_000_000 },
    { localeKey: "ru", displayName: "Russian", enabled: false, audienceEstimate: 260_000_000 },
    { localeKey: "ja", displayName: "Japanese", enabled: false, audienceEstimate: 125_000_000 },
    { localeKey: "fr", displayName: "French", enabled: false, audienceEstimate: 300_000_000 },
  ];
  for (const l of locales) {
    await prisma.reasoningLocaleConfig.upsert({
      where: { localeKey: l.localeKey },
      create: {
        localeKey: l.localeKey,
        displayName: l.displayName,
        enabled: l.enabled,
        fallbackChain: l.localeKey === "en" ? [] : ["en"],
        bannedPhrases: l.localeKey === "es" ? ["\\bracionalmente\\b", "\\bobviamente\\b"] : [],
        audienceEstimate: l.audienceEstimate,
      },
      update: {},
    });
  }
}

async function seedFraudPatterns() {
  const patterns = [
    {
      patternKind: "regex",
      pattern: { pattern: "\\bfree money\\b" },
      action: "zero-credit",
      reason: "Bot-amplification bait",
      approved: true,
    },
  ];
  for (const p of patterns) {
    const existing = await prisma.reasoningFraudPattern.findFirst({
      where: { patternKind: p.patternKind, reason: p.reason },
    });
    if (!existing) {
      await prisma.reasoningFraudPattern.create({
        data: {
          patternKind: p.patternKind,
          pattern: p.pattern,
          action: p.action,
          reason: p.reason,
          approved: p.approved,
        },
      });
    }
  }
}

async function seedCanonicalVariantSet(): Promise<string> {
  const existing = await prisma.reasoningVariantSet.findUnique({
    where: { name: "canonical" },
  });
  const set = existing ?? (await prisma.reasoningVariantSet.create({
    data: {
      name: "canonical",
      description: "The default chain — cold landing + close-friend bucket + fallback.",
      status: "ACTIVE",
      isCanonical: true,
      allowedSlots: [
        "HANDOFF",
        "CHAIN_NODE",
        "OBJECTION_NODE",
        "INEVITABILITY",
        "REPLICATION_CTA",
        "DEEP_CHAIN_NODE",
      ],
    },
  }));

  await seedCanonicalArmsForSet(set.id);
  return set.id;
}

async function seedCanonicalArmsForSet(variantSetId: string) {
  // Claim arms.
  const claims: Array<{
    nodeId: string;
    headline: string;
    body: string;
    coldOpenerBody?: string;
    sourceKeys: ParameterName[];
    family: "DRY_DATA" | "EMOTIONAL_APPEAL" | "CURIOSITY_MYSTERY" | "SOCIAL_PROOF" | "SELF_INTEREST_ROI" | "MORAL_DUTY" | "ABSURDIST_COMEDY" | "DIRECT_IMPERATIVE";
  }> = [
    {
      nodeId: "love-and-preventable-harm",
      headline: "You love specific people",
      body:
        "You love specific people, and you don't want them to suffer or die from causes that could be prevented.",
      coldOpenerBody:
        "One question, then five more, then you decide. If any one of the five is wrong, tell me which. You love specific people, and you don't want them to suffer or die from causes that could be prevented.",
      sourceKeys: [],
      family: "MORAL_DUTY",
    },
    {
      nodeId: "bottleneck",
      headline: "The bottleneck is bureaucracy, not science",
      body:
        `${p("DISEASES_WITHOUT_EFFECTIVE_TREATMENT")} diseases have no effective treatment. Only ${p("NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR")} get their first treatment per year. The queue clears in ${p("STATUS_QUO_QUEUE_CLEARANCE_YEARS")} years. Regulators add a ${p("EFFICACY_LAG_YEARS")}-year efficacy-lag after safety is already proven. Trial capacity is ~${p("DFDA_TRIAL_CAPACITY_MULTIPLIER")}x undersized.`,
      sourceKeys: [
        "DISEASES_WITHOUT_EFFECTIVE_TREATMENT",
        "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR",
        "STATUS_QUO_QUEUE_CLEARANCE_YEARS",
        "EFFICACY_LAG_YEARS",
        "DFDA_TRIAL_CAPACITY_MULTIPLIER",
      ],
      family: "DRY_DATA",
    },
    {
      nodeId: "one-percent-fix",
      headline: `${p("TREATY_REDUCTION_PCT")} of military spending clears the queue`,
      body:
        `Redirecting ${p("TREATY_REDUCTION_PCT")} of global military spending (${p("TREATY_ANNUAL_FUNDING")}) to pragmatic clinical trials at ${p("DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT")} clears the queue in ${p("DFDA_QUEUE_CLEARANCE_YEARS")} years instead of ${p("STATUS_QUO_QUEUE_CLEARANCE_YEARS")}.`,
      sourceKeys: [
        "TREATY_REDUCTION_PCT",
        "TREATY_ANNUAL_FUNDING",
        "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT",
        "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS",
        "DFDA_QUEUE_CLEARANCE_YEARS",
        "STATUS_QUO_QUEUE_CLEARANCE_YEARS",
      ],
      family: "DRY_DATA",
    },
    {
      nodeId: "pressure-works",
      headline: "Pressure works",
      body:
        `Governments spend ~${p("MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO")}x more on weapons than on clinical trials. Without pressure they won't reallocate. When ~${p("GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT")} of a population publicly demands a specific reform, governments historically concede (Chenoweth, 300+ movements). This is a prior, not a law.`,
      sourceKeys: [
        "MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO",
        "GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT",
      ],
      family: "SOCIAL_PROOF",
    },
    {
      nodeId: "paid-recursion",
      headline: "Paid recursion, not cult recursion",
      body:
        `Your signature is worth ~${p("VOTER_LIVES_SAVED")} lives and ~${p("VOTER_SUFFERING_HOURS_PREVENTED")} hours of suffering prevented in expectation. Every person you forward to, up to the ${p("TREATY_CAMPAIGN_VOTING_BLOC_TARGET")} threshold, is worth the same. The forwarding is paid: referral bonuses pay VOTE points; bondholders earn ${p("VICTORY_BOND_ANNUAL_RETURN_PCT")}/yr. Money flows IN to forwarders, not UP a pyramid.`,
      sourceKeys: [
        "VOTER_LIVES_SAVED",
        "VOTER_SUFFERING_HOURS_PREVENTED",
        "TREATY_CAMPAIGN_VOTING_BLOC_TARGET",
        "VICTORY_BOND_ANNUAL_RETURN_PCT",
      ],
      family: "SELF_INTEREST_ROI",
    },
  ];

  for (const c of claims) {
    await upsertArm({
      variantSetId,
      slot: "CHAIN_NODE",
      slotKey: `chain_node.${c.nodeId}.body`,
      channel: DEFAULT_ARM_CHANNEL,
      localeKey: "en",
      armKey: "seed-canonical",
      family: c.family,
      content: {
        nodeId: c.nodeId,
        headline: c.headline,
        body: c.body,
        coldOpenerBody: c.coldOpenerBody,
        sources: c.sourceKeys.map((k) => ({ label: humanize(k), paramName: k })),
      },
      status: "ACTIVE",
      riskTier: "T1",
    });
  }

  // Objection arms.
  const objections: Array<{
    nodeId: string;
    steelman: string;
    rebuttal: string;
    adversarialSourceLabel: string;
    adversarialSourceUrl?: string;
  }> = [
    {
      nodeId: "obj:lag-warranted",
      steelman:
        `You might argue the ${p("EFFICACY_LAG_YEARS")}-year efficacy-lag saves lives — Vioxx, thalidomide. Better to delay than to release a bad drug.`,
      rebuttal:
        "The claim isn't 'no safety review.' It's that the lag's marginal year produces net harm for orphan diseases with no market alternative. At h2ewd.md:201's calculation, 3,070 people die waiting per 1 protected.",
      adversarialSourceLabel: "FDA conservatism defense (steelman)",
      adversarialSourceUrl: "https://www.astralcodexten.com/p/adumbrations-of-aducanumab",
    },
    {
      nodeId: "obj:math-suspect",
      steelman:
        "You might dispute the cost-per-patient, the trial-capacity multiplier, or the lives-saved numerator.",
      rebuttal:
        "Each input has a published CI. Click any number in the claim to see its formula + confidence interval. Which specific input do you dispute?",
      adversarialSourceLabel: "dFDA methodology review",
      adversarialSourceUrl: "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
    },
    {
      nodeId: "obj:pressure-fails",
      steelman:
        `Chenoweth's ${p("GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT")} finding was descriptive of domestic regime change, not transnational treaty reforms.`,
      rebuttal:
        "If you don't believe Chenoweth applies: Incentive Alignment Bonds raise $1B, and the resulting Super-PAC rewards politicians who voted yes (same machinery as the NRA's letter grades). You need both mechanisms to fail for pressure to fail; at 50% each, 25% chance both fail, 75% chance pressure works.",
      adversarialSourceLabel: "Chenoweth critique",
      adversarialSourceUrl: "https://www.foreignaffairs.com/articles/world/2022-10-04/rise-and-fall-nonviolent-resistance",
    },
    {
      nodeId: "obj:not-linear-or-cult",
      steelman:
        "Either this is MLM (structurally) or the linearity assumption is wrong (reactance, relationship cost).",
      rebuttal:
        `Four structural disanalogies to MLM: bounded goal (stops at ${p("TREATY_CAMPAIGN_VOTING_BLOC_TARGET")}), costless exit, money flows IN from campaign instruments (not UP a pyramid), no downline. Linearity: the claim is EV per expected signature produced, not per conversation. At 10% conversion the math is still net-positive.`,
      adversarialSourceLabel: "MLM-psychology steelman",
      adversarialSourceUrl: "https://en.wikipedia.org/wiki/Multi-level_marketing",
    },
  ];

  for (const o of objections) {
    await upsertArm({
      variantSetId,
      slot: "OBJECTION_NODE",
      slotKey: `objection.${o.nodeId}.body`,
      channel: DEFAULT_ARM_CHANNEL,
      localeKey: "en",
      armKey: "seed-canonical",
      family: "DRY_DATA",
      content: {
        nodeId: o.nodeId,
        steelman: o.steelman,
        rebuttal: o.rebuttal,
        sources: [
          {
            label: o.adversarialSourceLabel,
            url: o.adversarialSourceUrl,
            adversarial: true,
          },
        ],
        reAnswerCta: "OK, re-answer",
        stillDisagreeCta: "I still disagree",
      },
      status: "ACTIVE",
      riskTier: "T1",
    });
  }

  // Inevitability arm.
  await upsertArm({
    variantSetId,
    slot: "INEVITABILITY",
    slotKey: "inevitability-recap",
    channel: DEFAULT_ARM_CHANNEL,
    localeKey: "en",
    armKey: "seed-canonical",
    family: "DIRECT_IMPERATIVE",
    content: {
      body:
        "Count what you didn't object to. The conclusion is not a hope. It's a proof.\n\nYou can reject exactly one premise to escape it. Which one?",
      rejectSelectorLabel: "Which premise do you reject?",
      proceedCtaLabel: "None — proceed",
    },
    status: "ACTIVE",
    riskTier: "T1",
  });

  // Replication arm.
  await upsertArm({
    variantSetId,
    slot: "REPLICATION_CTA",
    slotKey: "replication.primary",
    channel: DEFAULT_ARM_CHANNEL,
    localeKey: "en",
    armKey: "seed-canonical",
    family: "DIRECT_IMPERATIVE",
    content: {
      primaryCta: "Send to one person right now",
      secondaryCta: "Pick one more in a different bucket",
      urgencyCopy: "while the math is fresh",
      expansionCopy: "Nice — now pick another.",
      buckets: ["family-partner", "close-friend", "professional", "weak-tie"],
    },
    status: "ACTIVE",
    riskTier: "T1",
  });

  // Handoff arms (4 buckets × sms for v1; email/slack/whatsapp added later).
  const handoffs: Array<{
    bucket: "family-partner" | "close-friend" | "professional" | "weak-tie";
    template: string;
    family: "MORAL_DUTY" | "CURIOSITY_MYSTERY" | "DRY_DATA" | "SELF_INTEREST_ROI";
  }> = [
    {
      bucket: "family-partner",
      template:
        "Please finish this before bed. I can't decide if I've gone insane or if this is the most important thing I've read: {url}",
      family: "MORAL_DUTY",
    },
    {
      bucket: "close-friend",
      template:
        "I think I figured out the highest-leverage thing any of us can do. Try to talk me out of it: {url}",
      family: "CURIOSITY_MYSTERY",
    },
    {
      bucket: "professional",
      template:
        "Curious about your take on the math here — specifically the $0.00177/QALY claim. ~90s: {url}",
      family: "DRY_DATA",
    },
    {
      bucket: "weak-tie",
      template:
        "Weird ask — is this obviously wrong to you? Under a minute: {url}",
      family: "SELF_INTEREST_ROI",
    },
  ];

  for (const h of handoffs) {
    await upsertArm({
      variantSetId,
      slot: "HANDOFF",
      slotKey: `handoff.${h.bucket}.sms`,
      channel: "sms",
      localeKey: "en",
      armKey: "seed-canonical",
      family: h.family,
      content: {
        bucket: h.bucket,
        channel: "sms",
        template: h.template,
        maxLen: 160,
      },
      status: "ACTIVE",
      riskTier: "T1",
    });
  }
}

async function seedPersonaVariantSets(canonicalSetId: string): Promise<{
  analytical: string;
  moral: string;
  practical: string;
}> {
  const setNames = [
    { name: "analytical", description: "Credible, ParameterValue-heavy; IAB in Node 4 body." },
    { name: "moral-emotional", description: "Stakes-heavy; dying-child paragraph invoked." },
    { name: "practical-self-interest", description: "ROI-framed; $/QALY headline; bond-return math foregrounded." },
  ];
  const ids: Record<string, string> = {};
  for (const s of setNames) {
    const existing = await prisma.reasoningVariantSet.findUnique({
      where: { name: s.name },
    });
    const set = existing ?? (await prisma.reasoningVariantSet.create({
      data: {
        name: s.name,
        description: s.description,
        status: "ACTIVE",
        isCanonical: false,
        parentSetId: canonicalSetId,
        allowedSlots: [
          "HANDOFF",
          "CHAIN_NODE",
          "OBJECTION_NODE",
          "INEVITABILITY",
          "REPLICATION_CTA",
          "DEEP_CHAIN_NODE",
        ],
      },
    }));
    ids[s.name] = set.id;
  }
  return {
    analytical: ids.analytical!,
    moral: ids["moral-emotional"]!,
    practical: ids["practical-self-interest"]!,
  };
}

async function seedAssignmentRules(personaSetIds: {
  analytical: string;
  moral: string;
  practical: string;
}) {
  const rules = [
    { relationshipBucket: "family-partner", variantSetId: personaSetIds.moral },
    { relationshipBucket: "professional", variantSetId: personaSetIds.analytical },
    { relationshipBucket: "weak-tie", variantSetId: personaSetIds.practical },
  ];
  for (const [i, r] of rules.entries()) {
    const existing = await prisma.reasoningAssignmentRule.findFirst({
      where: { relationshipBucket: r.relationshipBucket, variantSetId: r.variantSetId },
    });
    if (!existing) {
      await prisma.reasoningAssignmentRule.create({
        data: {
          priority: i * 10,
          relationshipBucket: r.relationshipBucket,
          variantSetId: r.variantSetId,
          active: true,
        },
      });
    }
  }
}

async function seedPersonaArmVariants(personaSetIds: {
  analytical: string;
  moral: string;
  practical: string;
}) {
  for (const setId of Object.values(personaSetIds)) {
    await seedCanonicalArmsForSet(setId);
  }

  await applyAnalyticalOverrides(personaSetIds.analytical);
  await applyMoralOverrides(personaSetIds.moral);
  await applyPracticalOverrides(personaSetIds.practical);
}

async function applyAnalyticalOverrides(variantSetId: string) {
  await upsertArm({
    variantSetId,
    slot: "CHAIN_NODE",
    slotKey: "chain_node.bottleneck.body",
    channel: DEFAULT_ARM_CHANNEL,
    localeKey: "en",
    armKey: "seed-canonical",
    family: "DRY_DATA",
    content: {
      nodeId: "bottleneck",
      headline: "The queue is quantifiable",
      body:
        `${p("DISEASES_WITHOUT_EFFECTIVE_TREATMENT")} diseases still lack an effective treatment. At ~${p("NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR")} first approvals per year the queue clears in ~${p("STATUS_QUO_QUEUE_CLEARANCE_YEARS")} years, while the efficacy lag alone adds ~${p("EFFICACY_LAG_YEARS")} years after safety is already demonstrated. Trial capacity is roughly ${p("DFDA_TRIAL_CAPACITY_MULTIPLIER")}x too small relative to need.`,
      sources: [
        { label: humanize("DISEASES_WITHOUT_EFFECTIVE_TREATMENT"), paramName: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT" },
        { label: humanize("NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR"), paramName: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR" },
        { label: humanize("STATUS_QUO_QUEUE_CLEARANCE_YEARS"), paramName: "STATUS_QUO_QUEUE_CLEARANCE_YEARS" },
        { label: humanize("EFFICACY_LAG_YEARS"), paramName: "EFFICACY_LAG_YEARS" },
        { label: humanize("DFDA_TRIAL_CAPACITY_MULTIPLIER"), paramName: "DFDA_TRIAL_CAPACITY_MULTIPLIER" },
      ],
    },
    status: "ACTIVE",
    riskTier: "T1",
  });

  await upsertArm({
    variantSetId,
    slot: "HANDOFF",
    slotKey: "handoff.professional.sms",
    channel: "sms",
    localeKey: "en",
    armKey: "seed-canonical",
    family: "DRY_DATA",
    content: {
      bucket: "professional",
      channel: "sms",
      template: "Can you sanity-check the queue-clearance math here? The core claim is that 1% of military spending clears the treatment backlog: {url}",
      maxLen: 160,
    },
    status: "ACTIVE",
    riskTier: "T1",
  });
}

async function applyMoralOverrides(variantSetId: string) {
  await upsertArm({
    variantSetId,
    slot: "CHAIN_NODE",
    slotKey: "chain_node.love-and-preventable-harm.body",
    channel: DEFAULT_ARM_CHANNEL,
    localeKey: "en",
    armKey: "seed-canonical",
    family: "EMOTIONAL_APPEAL",
    content: {
      nodeId: "love-and-preventable-harm",
      headline: "Someone you love could be in the line",
      body:
        "You already know what matters here: specific people with names, faces, and bodies. If a preventable delay leaves them suffering for years, the abstraction disappears instantly.",
      coldOpenerBody:
        "This is six questions and then you can walk away. Start here: if someone you loved were trapped in a preventable treatment queue, you would want that queue shortened.",
      sources: [],
    },
    status: "ACTIVE",
    riskTier: "T1",
  });

  await upsertArm({
    variantSetId,
    slot: "HANDOFF",
    slotKey: "handoff.family-partner.sms",
    channel: "sms",
    localeKey: "en",
    armKey: "seed-canonical",
    family: "MORAL_DUTY",
    content: {
      bucket: "family-partner",
      channel: "sms",
      template: "Please read this tonight. If it is right, ignoring it would cost real people their lives: {url}",
      maxLen: 160,
    },
    status: "ACTIVE",
    riskTier: "T1",
  });
}

async function applyPracticalOverrides(variantSetId: string) {
  await upsertArm({
    variantSetId,
    slot: "CHAIN_NODE",
    slotKey: "chain_node.paid-recursion.body",
    channel: DEFAULT_ARM_CHANNEL,
    localeKey: "en",
    armKey: "seed-canonical",
    family: "SELF_INTEREST_ROI",
    content: {
      nodeId: "paid-recursion",
      headline: "The expected return is absurdly high",
      body:
        `Per modeled baseline, one signature is worth ~${p("VOTER_LIVES_SAVED")} lives and ~${p("VOTER_SUFFERING_HOURS_PREVENTED")} hours of suffering prevented. The forward is not charity-only either: referral bonuses pay VOTE points and bondholders earn ${p("VICTORY_BOND_ANNUAL_RETURN_PCT")}/yr if the campaign succeeds.`,
      sources: [
        { label: humanize("VOTER_LIVES_SAVED"), paramName: "VOTER_LIVES_SAVED" },
        { label: humanize("VOTER_SUFFERING_HOURS_PREVENTED"), paramName: "VOTER_SUFFERING_HOURS_PREVENTED" },
        { label: humanize("TREATY_CAMPAIGN_VOTING_BLOC_TARGET"), paramName: "TREATY_CAMPAIGN_VOTING_BLOC_TARGET" },
        { label: humanize("VICTORY_BOND_ANNUAL_RETURN_PCT"), paramName: "VICTORY_BOND_ANNUAL_RETURN_PCT" },
      ],
    },
    status: "ACTIVE",
    riskTier: "T1",
  });

  await upsertArm({
    variantSetId,
    slot: "HANDOFF",
    slotKey: "handoff.weak-tie.sms",
    channel: "sms",
    localeKey: "en",
    armKey: "seed-canonical",
    family: "SELF_INTEREST_ROI",
    content: {
      bucket: "weak-tie",
      channel: "sms",
      template: "Odd request: if this expected-value math is even half-right, forwarding it is the best $0 action I know. Tell me what I’m missing: {url}",
      maxLen: 160,
    },
    status: "ACTIVE",
    riskTier: "T1",
  });
}

async function seedDistributionTargets() {
  const targets = [
    { localeKey: "en", surface: "hosted", enabled: true, ceilingEstimate: 1_500_000_000, liveStatus: "LIVE" },
    { localeKey: "zh-Hans", surface: "hosted", enabled: false, ceilingEstimate: 1_100_000_000, liveStatus: "NOT_STARTED" },
    { localeKey: "es", surface: "hosted", enabled: false, ceilingEstimate: 600_000_000, liveStatus: "NOT_STARTED" },
    { localeKey: "hi", surface: "hosted", enabled: false, ceilingEstimate: 600_000_000, liveStatus: "NOT_STARTED" },
    { localeKey: "ar", surface: "hosted", enabled: false, ceilingEstimate: 400_000_000, liveStatus: "NOT_STARTED" },
  ];
  for (const t of targets) {
    const existing = await prisma.reasoningDistributionTarget.findFirst({
      where: { localeKey: t.localeKey, surface: t.surface },
    });
    if (!existing) {
      await prisma.reasoningDistributionTarget.create({
        data: {
          localeKey: t.localeKey,
          surface: t.surface,
          enabled: t.enabled,
          ceilingEstimate: t.ceilingEstimate,
          liveStatus: t.liveStatus,
        },
      });
    }
  }
}

async function upsertArm(args: {
  variantSetId: string;
  slot: "HANDOFF" | "CHAIN_NODE" | "OBJECTION_NODE" | "INEVITABILITY" | "REPLICATION_CTA" | "DEEP_CHAIN_NODE" | "TOPOLOGY";
  slotKey: string;
  channel: string;
  localeKey: string;
  armKey: string;
  family: "DRY_DATA" | "EMOTIONAL_APPEAL" | "CURIOSITY_MYSTERY" | "SOCIAL_PROOF" | "SELF_INTEREST_ROI" | "MORAL_DUTY" | "ABSURDIST_COMEDY" | "DIRECT_IMPERATIVE";
  content: object;
  status: "DRAFT" | "ACTIVE";
  riskTier: "T1" | "T2" | "T3";
}) {
  const existing = await prisma.reasoningVariantArm.findUnique({
    where: {
      variantSetId_slotKey_channel_localeKey_armKey: {
        variantSetId: args.variantSetId,
        slotKey: args.slotKey,
        channel: args.channel,
        localeKey: args.localeKey,
        armKey: args.armKey,
      },
    },
  });
  if (existing) {
    await prisma.reasoningVariantArm.update({
      where: { id: existing.id },
      data: {
        content: args.content,
        status: args.status,
        family: args.family,
      },
    });
  } else {
    await prisma.reasoningVariantArm.create({
      data: {
        variantSetId: args.variantSetId,
        slot: args.slot,
        slotKey: args.slotKey,
        channel: args.channel,
        localeKey: args.localeKey,
        armKey: args.armKey,
        family: args.family,
        content: args.content,
        status: args.status,
        riskTier: args.riskTier,
      },
    });
  }
}

async function assertAssignmentRuleTargetsSeeded() {
  const rules = await prisma.reasoningAssignmentRule.findMany({
    where: { active: true },
    select: { variantSetId: true },
  });
  for (const rule of rules) {
    const armCount = await prisma.reasoningVariantArm.count({
      where: {
        variantSetId: rule.variantSetId,
        localeKey: "en",
        status: "ACTIVE",
      },
    });
    if (armCount < 15) {
      throw new Error(`Assignment rule target ${rule.variantSetId} is missing seeded ACTIVE arms`);
    }
  }
}

function humanize(paramName: ParameterName): string {
  return paramName
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const adapter = new PrismaPg({ connectionString: loadDatabaseUrl() });
  const standalonePrisma = new PrismaClient({ adapter });

  Promise.resolve()
    .then(() => seedReasoningData(standalonePrisma))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await standalonePrisma.$disconnect();
    });
}
