/**
 * Managed data: /reasoning autonomous persuasion optimizer
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

import { PrismaClient } from "../generated/prisma/client.js";
import type { ParameterName } from "@optimitron/data/parameters";

let prisma: PrismaClient;
const DEFAULT_ARM_CHANNEL = "default";
const p = <T extends ParameterName>(paramName: T) => `{${paramName}}`;

export async function syncManagedReasoningData(prismaClient: PrismaClient) {
  prisma = prismaClient;
  await seedSystemState();
  await seedLocaleConfigs();
  await seedFraudPatterns();
  const canonicalSetId = await seedCanonicalVariantSet();
  const personaSetIds = await seedPersonaVariantSets(canonicalSetId);
  await seedPersonaArmVariants(personaSetIds);
  await seedSecretOfTheUniverseVariantSet(canonicalSetId);
  await seedAssignmentRules(personaSetIds);
  await seedDistributionTargets();
  await assertAssignmentRuleTargetsSeeded();

  console.log("✓ reasoning managed data synced");
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
        `Your signature is worth ~${p("VOTER_LIVES_SAVED")} lives and ~${p("VOTER_SUFFERING_HOURS_PREVENTED")} hours of suffering prevented in expectation. Every person you forward to, up to the ${p("GLOBAL_REGISTERED_VOTERS")} threshold, is worth the same. The forwarding is paid: referral bonuses pay VOTE points; bondholders earn ${p("VICTORY_BOND_ANNUAL_RETURN_PCT")}/yr. Money flows IN to forwarders, not UP a pyramid.`,
      sourceKeys: [
        "VOTER_LIVES_SAVED",
        "VOTER_SUFFERING_HOURS_PREVENTED",
        "GLOBAL_REGISTERED_VOTERS",
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
        `Four structural disanalogies to MLM: bounded goal (stops at ${p("GLOBAL_REGISTERED_VOTERS")}), costless exit, money flows IN from campaign instruments (not UP a pyramid), no downline. Linearity: the claim is EV per expected signature produced, not per conversation. At 10% conversion the math is still net-positive.`,
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
    analytical: ids["analytical"]!,
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
        { label: humanize("GLOBAL_REGISTERED_VOTERS"), paramName: "GLOBAL_REGISTERED_VOTERS" },
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

/* ================================================================
 * "Secret of the Universe" variant set
 *
 * Content derived from docs/call-script-secret-of-the-universe.md —
 * the 22-question call script with the "Either I am crazy or..."
 * opener. Maps the 22 questions into the 5 canonical claim slots;
 * mid-call objection handlers go into the 4 objection slots.
 * ================================================================ */

async function seedSecretOfTheUniverseVariantSet(
  canonicalSetId: string,
): Promise<string> {
  const existing = await prisma.reasoningVariantSet.findUnique({
    where: { name: "secret-of-the-universe" },
  });
  const set =
    existing ??
    (await prisma.reasoningVariantSet.create({
      data: {
        name: "secret-of-the-universe",
        description:
          "The 22-question call script. 'Either I am crazy or...' opener, " +
          "reductio-by-yes-answers chain, mid-call objection handlers, " +
          "two-per-person doubling math, hang-up-and-call-next imperative.",
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

  await seedSecretArms(set.id);
  return set.id;
}

async function seedSecretArms(variantSetId: string) {
  const SECRET_ARM_KEY = "seed-secret";

  // Lean 5-beat chain. Mechanism detail (FDA, NIH, trial-capacity) is
  // pushed into the `obj:lag-warranted` objection — fires only when the
  // listener actually disputes the acceleration claim. Default path leads
  // with stakes → lever → pressure → recursion (with honest 40-call math).
  const claims: Array<{
    nodeId: string;
    headline: string;
    body: string;
    coldOpenerBody?: string;
    sourceKeys: ParameterName[];
    family:
      | "DRY_DATA"
      | "EMOTIONAL_APPEAL"
      | "CURIOSITY_MYSTERY"
      | "SOCIAL_PROOF"
      | "SELF_INTEREST_ROI"
      | "MORAL_DUTY"
      | "ABSURDIST_COMEDY"
      | "DIRECT_IMPERATIVE";
  }> = [
    {
      nodeId: "love-and-preventable-harm",
      headline: "You don't want them to die of something fixable",
      body:
        "Someone you love will eventually die of a disease. Most of those diseases are solvable. That's the only premise the rest of this depends on.",
      coldOpenerBody:
        "Five questions. If any one is wrong, tell me which. First: someone you love will eventually die of a disease — and most of those diseases are solvable.",
      sourceKeys: [],
      family: "MORAL_DUTY",
    },
    {
      nodeId: "bottleneck",
      headline: "Disease is an engineering problem",
      body:
        `Smallpox, polio, hepatitis C — cured once enough trials ran. The diseases still killing your people aren't unsolvable. They're in a queue. We run too few trials, too slowly, and every minute of delay costs ${p("GLOBAL_DISEASE_DEATHS_PER_MINUTE")} more humans. The details of WHY we run too few are messy (regulatory, institutional, funding) — click the objection handler if you want them.`,
      sourceKeys: [
        "DISEASES_WITHOUT_EFFECTIVE_TREATMENT",
        "STATUS_QUO_QUEUE_CLEARANCE_YEARS",
        "EFFICACY_LAG_YEARS",
        "DFDA_TRIAL_CAPACITY_MULTIPLIER",
        "GLOBAL_DISEASE_DEATHS_PER_MINUTE",
      ],
      family: "DRY_DATA",
    },
    {
      nodeId: "one-percent-fix",
      headline: "One lever, many decades sooner",
      body:
        `Redirect ${p("TREATY_REDUCTION_PCT")} of global military spending — ${p("TREATY_ANNUAL_FUNDING")}/year — into clinical trials. Every country cuts simultaneously, so nobody is less safe. The queue of unsolved diseases clears in decades instead of centuries. That's it. The full math is one click away if you want it.`,
      sourceKeys: [
        "TREATY_REDUCTION_PCT",
        "TREATY_ANNUAL_FUNDING",
        "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT",
        "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS",
        "DFDA_QUEUE_CLEARANCE_YEARS",
      ],
      family: "DRY_DATA",
    },
    {
      nodeId: "pressure-works",
      headline: `${p("GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT")} has never failed`,
      body:
        `Every civilizational reform that hit ${p("GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT")} active public support succeeded. Civil rights. Women's vote. No exceptions in the last century. Governments can't hold out against 3.5% of voters — they can't even enforce parking rules at that scale. Governments already spend ${p("MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO")}x more on weapons than on trials; this asks them to buy 1% fewer.`,
      sourceKeys: [
        "GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT",
        "MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO",
      ],
      family: "SOCIAL_PROOF",
    },
    {
      nodeId: "paid-recursion",
      headline: "Call 40. Two will continue. That's enough.",
      body:
        `The system math is: if each person gets 2 others to keep the chain going, 32 doublings reaches ${p("GLOBAL_REGISTERED_VOTERS")} — enough that no government ignores. The honest behavioral math: ~5–10% of anyone you ask actually does what they said yes to. You can't predict which ones. So call ~40 (everyone you love, one per day for 6 weeks). Most will say yes and do nothing. 2–4 will actually call their own 40. Those 2–4 are enough, because they do the same thing. Your signature is worth ~${p("VOTER_LIVES_SAVED")} lives and ~${p("VOTER_SUFFERING_HOURS_PREVENTED")} hours of suffering prevented. You aren't responsible for everyone on your list — you are responsible for calling them. Volume is the only protection against "most say yes and forget."`,
      sourceKeys: [
        "VOTER_LIVES_SAVED",
        "VOTER_SUFFERING_HOURS_PREVENTED",
        "GLOBAL_REGISTERED_VOTERS",
      ],
      family: "DIRECT_IMPERATIVE",
    },
  ];

  for (const c of claims) {
    await upsertArm({
      variantSetId,
      slot: "CHAIN_NODE",
      slotKey: `chain_node.${c.nodeId}.body`,
      channel: DEFAULT_ARM_CHANNEL,
      localeKey: "en",
      armKey: SECRET_ARM_KEY,
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

  // Objection arms — steelman + rebuttal composed from the mid-call
  // objection handlers in the document.
  const objections: Array<{
    nodeId: string;
    steelman: string;
    rebuttal: string;
    adversarialSourceLabel: string;
    adversarialSourceUrl: string;
  }> = [
    {
      nodeId: "obj:lag-warranted",
      steelman:
        `Safety regulators save lives — Vioxx, thalidomide. The ${p("EFFICACY_LAG_YEARS")}-year efficacy-lag is there for a reason. Better to delay than release a bad drug. And why not just reform the existing FDA/NIH instead of circumventing them?`,
      rebuttal:
        `Here's the full mechanism, since you asked: ${p("DISEASES_WITHOUT_EFFECTIVE_TREATMENT")} diseases have no effective treatment, and at ${p("NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR")} first approvals/year the queue takes ${p("STATUS_QUO_QUEUE_CLEARANCE_YEARS")} years to clear. The FDA's ${p("EFFICACY_LAG_YEARS")}-year wait after safety is proven costs ~${p("TYPE_II_ERROR_COST_RATIO")} lives-lost per 1 life-saved-from-bad-drug. NIH spends only ~${p("NIH_CLINICAL_TRIALS_SPENDING_PCT")} of its budget on actual trials. The treaty's ${p("TREATY_ANNUAL_FUNDING")}/year new funding + pragmatic trial design grows capacity by ${p("DFDA_TRIAL_CAPACITY_MULTIPLIER")}x; queue clears in ${p("DFDA_QUEUE_CLEARANCE_YEARS")} years. Reform has been tried for 50 years: more funding → more administrators; new regulations → longer timelines. The current system works perfectly for the people who built it. They surrender it when outbid, not when asked nicely. RECOVERY during COVID showed ~${p("RECOVERY_TRIAL_COST_REDUCTION_FACTOR")} cost reduction on real patients during panic-mode operation — so the multiplier is actually conservative.`,
      adversarialSourceLabel: "FDA conservatism steelman",
      adversarialSourceUrl:
        "https://www.astralcodexten.com/p/adumbrations-of-aducanumab",
    },
    {
      nodeId: "obj:math-suspect",
      steelman:
        `You might dispute the ${p("DFDA_TRIAL_CAPACITY_MULTIPLIER")}x multiplier, or think "this sounds too good to be true," or worry the warondisease.org site itself is a scam.`,
      rebuttal:
        `Each input is auditable at manual.warondisease.org. RECOVERY already demonstrated ~${p("RECOVERY_TRIAL_COST_REDUCTION_FACTOR")} cost reduction during COVID — disorganized, panicked, still delivered. The ${p("DFDA_TRIAL_CAPACITY_MULTIPLIER")}x figure is funding ÷ current slots; it's conservative. Scam check: nobody takes your money. You type your name and vote. The only thing collected is a count of humans who want fewer preventable deaths.`,
      adversarialSourceLabel: "dFDA methodology review",
      adversarialSourceUrl:
        "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
    },
    {
      nodeId: "obj:pressure-fails",
      steelman:
        "Defense contractors will crush this. Big Pharma will block it. Politicians will never vote for it. And this 'bribery' structure sounds corrupt.",
      rebuttal:
        `Defense contractors keep ${p("DEFENSE_SECTOR_RETENTION_PCT")} of their budget and earn ${p("VICTORY_BOND_ANNUAL_RETURN_PCT")}/yr on top via Victory Bonds. Pharma gets paid per patient — revenue instead of gambling on drug-roulette. Politicians follow incentives: a Super PAC rewards yes-votes at ~8x what defense lobbyists currently spend/year. "Bribery" is lobbying — same K Street firms. The difference is what the money buys. This one caps the lobbying portion at 20% with a public ledger.`,
      adversarialSourceLabel: "Chenoweth critique (transnational limits)",
      adversarialSourceUrl:
        "https://www.foreignaffairs.com/articles/world/2022-10-04/rise-and-fall-nonviolent-resistance",
    },
    {
      nodeId: "obj:not-linear-or-cult",
      steelman:
        "This sounds like a pyramid scheme / chain letter. Or my friends will think I'm weird. Or nothing like this ever works — big systems don't change.",
      rebuttal:
        `Pyramid schemes never admit the pitcher might be crazy. The opener is literally "either I am crazy or…" — the admission is the whole point. Nobody makes money off your vote; the math rewards every voter equally. The only thing at the top of this "pyramid" is not dying of preventable diseases. Weird is a one-time social cost; silence costs ${p("GLOBAL_DISEASE_DEATHS_DAILY")} humans/day. Systems-don't-change: Communism spread across half the planet and collapsed in one human lifetime without fax machines. This plan has the internet and asks people to click a button and call their friends. The obstacle isn't the system.`,
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
      armKey: SECRET_ARM_KEY,
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
        reAnswerCta: "OK — re-answer",
        stillDisagreeCta: "I still disagree",
      },
      status: "ACTIVE",
      riskTier: "T1",
    });
  }

  // Inevitability recap — you agreed to each step. Conclusion is forced.
  await upsertArm({
    variantSetId,
    slot: "INEVITABILITY",
    slotKey: "inevitability-recap",
    channel: DEFAULT_ARM_CHANNEL,
    localeKey: "en",
    armKey: SECRET_ARM_KEY,
    family: "DIRECT_IMPERATIVE",
    content: {
      body:
        "You said yes to each step. People you love die of solvable diseases. The 1% trade works. 3.5% has never failed. The system needs 2 continuers per person — you can't predict which 2, so you call everyone.\n\nWhich step would you actually take back?",
      rejectSelectorLabel: "Which premise would you take back?",
      proceedCtaLabel: "None — vote and send 2 right now",
    },
    status: "ACTIVE",
    riskTier: "T1",
  });

  // Two-phase replication CTA.
  //   Phase 1 (primary, visible immediately): send to 2 people before closing
  //   the tab. Low-friction MVP that produces initial momentum.
  //   Phase 2 (expansion, revealed after first send): daily alarm, ~40 calls,
  //   6 weeks. The actual commitment — this is what produces real chain
  //   growth given 5-10% conversion.
  await upsertArm({
    variantSetId,
    slot: "REPLICATION_CTA",
    slotKey: "replication.primary",
    channel: DEFAULT_ARM_CHANNEL,
    localeKey: "en",
    armKey: SECRET_ARM_KEY,
    family: "DIRECT_IMPERATIVE",
    content: {
      primaryCta:
        "Vote, then send the 'Either I'm crazy or...' message to 2 people before you close this tab",
      secondaryCta:
        "Now set a daily alarm. One call a day. Finish everyone you love (~40 people) in 6 weeks.",
      urgencyCopy: "Every minute of delay costs ~104 humans",
      expansionCopy:
        "~5–10% of calls produce a real continuer. You can't tell which. Daily alarm beats willpower — let the alarm carry the discipline, you just answer it.",
      buckets: [
        "family-partner",
        "close-friend",
        "professional",
        "weak-tie",
      ],
    },
    status: "ACTIVE",
    riskTier: "T1",
  });

  // Handoff arms — the "Either I am crazy or..." opener. Kept under 160
  // chars for SMS; tone calibrated per bucket but all carry the honest
  // uncertainty that gets past the filter.
  const handoffs: Array<{
    bucket:
      | "family-partner"
      | "close-friend"
      | "professional"
      | "weak-tie";
    template: string;
    family:
      | "MORAL_DUTY"
      | "CURIOSITY_MYSTERY"
      | "DRY_DATA"
      | "SELF_INTEREST_ROI";
  }> = [
    {
      bucket: "family-partner",
      template:
        "Either I'm crazy or I found the most important secret in the history of the universe. Please call me and tell me which: {url}",
      family: "MORAL_DUTY",
    },
    {
      bucket: "close-friend",
      template:
        "Either I'm crazy or this is the most important secret in the universe. Call me and tell me which: {url}",
      family: "CURIOSITY_MYSTERY",
    },
    {
      bucket: "professional",
      template:
        "Either I'm losing it or I found one trade that cures most diseases. 5-min sanity check: {url}",
      family: "DRY_DATA",
    },
    {
      bucket: "weak-tie",
      template:
        "Weird one: either I'm crazy or this is the most important thing I've read. Tell me which: {url}",
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
      armKey: SECRET_ARM_KEY,
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
