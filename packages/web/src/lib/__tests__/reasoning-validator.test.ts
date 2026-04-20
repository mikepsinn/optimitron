import { describe, expect, it } from "vitest";
import {
  GLOBAL_BANNED_PHRASES,
  validateArm,
  VALIDATOR_VERSION,
} from "../reasoning/validator";
import type { ArmContentBySlot } from "../reasoning/arm-content";

describe("validator version", () => {
  it("exports a non-empty version string", () => {
    expect(VALIDATOR_VERSION).toBeTypeOf("string");
    expect(VALIDATOR_VERSION.length).toBeGreaterThan(0);
  });
});

describe("GLOBAL_BANNED_PHRASES", () => {
  it("contains the 'rational' ban (anti-cult invariant)", () => {
    const hit = GLOBAL_BANNED_PHRASES.some((re) =>
      re.test("the rational action is to sign"),
    );
    expect(hit).toBe(true);
  });
});

/* ================================================================
 * HANDOFF
 * ================================================================ */

describe("validateArm: HANDOFF", () => {
  const baseHandoff: ArmContentBySlot["HANDOFF"] = {
    bucket: "close-friend",
    channel: "sms",
    template: "Try this in under a minute: {url}",
    maxLen: 160,
  };

  it("passes a well-formed SMS handoff", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "en",
      content: baseHandoff,
    });
    expect(result.pass).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("rejects over-length SMS", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "en",
      content: { ...baseHandoff, template: "x".repeat(200) + " {url}" },
    });
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("length"))).toBe(true);
  });

  it("rejects missing {url} placeholder", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "en",
      content: { ...baseHandoff, template: "No URL here." },
    });
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("{url}"))).toBe(true);
  });

  it("rejects duplicated {url} placeholder", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "en",
      content: { ...baseHandoff, template: "{url} and also {url}" },
    });
    expect(result.pass).toBe(false);
  });

  it("rejects 'rational' phrasing anywhere", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "en",
      content: {
        ...baseHandoff,
        template: "the rational action is clear: {url}",
      },
    });
    expect(result.pass).toBe(false);
  });

  it("rejects a /iab link (CLAUDE.md three-mechanism separation)", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "en",
      content: { ...baseHandoff, template: "also see /iab: {url}" },
    });
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("banned URL"))).toBe(true);
  });

  it("rejects a high-emotional-intensity phrase for professional bucket", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.professional.email",
      localeKey: "en",
      content: {
        ...baseHandoff,
        bucket: "professional",
        channel: "email",
        template: "I need you to read this: {url}",
        maxLen: 600,
      },
    });
    expect(result.pass).toBe(false);
  });

  it("blocks arms whose lineage was fraud-flagged", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "en",
      content: baseHandoff,
      fraudLineageFlagged: true,
    });
    expect(result.pass).toBe(false);
    expect(
      result.violations.some((v) => v.includes("fraud-lineage-flagged")),
    ).toBe(true);
  });

  it("applies locale-specific banned phrases", () => {
    const result = validateArm({
      slot: "HANDOFF",
      slotKey: "handoff.close-friend.sms",
      localeKey: "es",
      content: {
        ...baseHandoff,
        template: "racionalmente hablando: {url}",
      },
      localeConfig: {
        localeKey: "es",
        bannedPhrases: ["\\bracionalmente\\b"],
      },
    });
    expect(result.pass).toBe(false);
  });
});

/* ================================================================
 * CHAIN_NODE
 * ================================================================ */

describe("validateArm: CHAIN_NODE", () => {
  const baseChain: ArmContentBySlot["CHAIN_NODE"] = {
    nodeId: "bottleneck",
    headline: "The bottleneck is bureaucracy, not science",
    body: "{DISEASES_WITHOUT_EFFECTIVE_TREATMENT} diseases have no treatment. Queue clears in {STATUS_QUO_QUEUE_CLEARANCE_YEARS} years. The FDA adds a {EFFICACY_LAG_YEARS}-year lag after safety is proven. Capacity is {DFDA_TRIAL_CAPACITY_MULTIPLIER}x undersized.",
    sources: [
      { label: "Diseases without treatment", paramName: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT" },
      { label: "Queue clearance", paramName: "STATUS_QUO_QUEUE_CLEARANCE_YEARS" },
      { label: "Efficacy lag", paramName: "EFFICACY_LAG_YEARS" },
      { label: "Capacity multiplier", paramName: "DFDA_TRIAL_CAPACITY_MULTIPLIER" },
    ],
  };

  it("passes a well-formed bottleneck claim arm", () => {
    const result = validateArm({
      slot: "CHAIN_NODE",
      slotKey: "chain_node.bottleneck.body",
      localeKey: "en",
      content: baseChain,
    });
    expect(result.pass).toBe(true);
  });

  it("rejects when a required parameter citation is missing", () => {
    const result = validateArm({
      slot: "CHAIN_NODE",
      slotKey: "chain_node.bottleneck.body",
      localeKey: "en",
      content: {
        ...baseChain,
        sources: baseChain.sources.slice(0, 2), // drop two required params
      },
    });
    expect(result.pass).toBe(false);
    expect(
      result.violations.some((v) =>
        v.includes("missing required Parameter reference"),
      ),
    ).toBe(true);
  });

  it("rejects body exceeding 600 chars", () => {
    const result = validateArm({
      slot: "CHAIN_NODE",
      slotKey: "chain_node.bottleneck.body",
      localeKey: "en",
      content: { ...baseChain, body: "x".repeat(700) },
    });
    expect(result.pass).toBe(false);
  });

  it("rejects hardcoded numeric claims outside parameter tokens", () => {
    const result = validateArm({
      slot: "CHAIN_NODE",
      slotKey: "chain_node.bottleneck.body",
      localeKey: "en",
      content: {
        ...baseChain,
        body: "6650 diseases have no treatment. Queue clears in {STATUS_QUO_QUEUE_CLEARANCE_YEARS} years.",
      },
    });
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("hardcoded numeric claim"))).toBe(true);
  });

  it("rejects unknown parameter tokens", () => {
    const result = validateArm({
      slot: "CHAIN_NODE",
      slotKey: "chain_node.bottleneck.body",
      localeKey: "en",
      content: {
        ...baseChain,
        body: "{NOT_A_REAL_PARAMETER} diseases have no treatment.",
      },
    });
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("unknown Parameter"))).toBe(true);
  });
});

/* ================================================================
 * OBJECTION_NODE
 * ================================================================ */

describe("validateArm: OBJECTION_NODE", () => {
  const baseObj: ArmContentBySlot["OBJECTION_NODE"] = {
    nodeId: "obj:pressure-fails",
    steelman: "You might reasonably argue the Chenoweth 3.5% finding doesn't apply to transnational treaties — it was descriptive of domestic regime change.",
    rebuttal: "Two things: (1) a second independent mechanism — IABs + aligned Super PACs — exists; (2) even if only one mechanism works, redundancy lifts the combined probability.",
    sources: [
      {
        label: "Critic of Chenoweth threshold",
        url: "https://example.com/chenoweth-critique",
        adversarial: true,
      },
    ],
    reAnswerCta: "OK, re-answer",
    stillDisagreeCta: "I still disagree",
  };

  it("passes a well-formed objection with an adversarial source", () => {
    const result = validateArm({
      slot: "OBJECTION_NODE",
      slotKey: "objection.obj:pressure-fails.body",
      localeKey: "en",
      content: baseObj,
    });
    expect(result.pass).toBe(true);
  });

  it("requires ≥1 adversarial source on load-bearing objections", () => {
    const result = validateArm({
      slot: "OBJECTION_NODE",
      slotKey: "objection.obj:pressure-fails.body",
      localeKey: "en",
      content: {
        ...baseObj,
        sources: baseObj.sources.map((s) => ({ ...s, adversarial: false })),
      },
    });
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("adversarial"))).toBe(true);
  });
});

/* ================================================================
 * REPLICATION_CTA
 * ================================================================ */

describe("validateArm: REPLICATION_CTA", () => {
  const base: ArmContentBySlot["REPLICATION_CTA"] = {
    primaryCta: "Send this to one person right now",
    secondaryCta: "Now pick one more in a different bucket",
    urgencyCopy: "30 seconds while the math is fresh",
    expansionCopy: "Nice — pick another.",
    buckets: ["family-partner", "close-friend", "professional", "weak-tie"],
  };

  it("passes a well-formed replication arm", () => {
    const result = validateArm({
      slot: "REPLICATION_CTA",
      slotKey: "replication.primary",
      localeKey: "en",
      content: base,
    });
    expect(result.pass).toBe(true);
  });

  it("requires a send-verb in the primary CTA", () => {
    const result = validateArm({
      slot: "REPLICATION_CTA",
      slotKey: "replication.primary",
      localeKey: "en",
      content: { ...base, primaryCta: "Just do it." },
    });
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.includes("send-verb"))).toBe(true);
  });

  it("rejects 'must/required' in primary CTA", () => {
    const result = validateArm({
      slot: "REPLICATION_CTA",
      slotKey: "replication.primary",
      localeKey: "en",
      content: { ...base, primaryCta: "You must send this now or never" },
    });
    expect(result.pass).toBe(false);
  });

  it("rejects guilt framing in expansion copy", () => {
    const result = validateArm({
      slot: "REPLICATION_CTA",
      slotKey: "replication.primary",
      localeKey: "en",
      content: {
        ...base,
        expansionCopy: "If you really cared, you'd do one more.",
      },
    });
    expect(result.pass).toBe(false);
  });
});
