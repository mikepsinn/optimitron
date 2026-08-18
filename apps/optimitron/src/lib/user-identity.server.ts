import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

// Agent / spy-thriller flavored
const AGENT_ADJECTIVES = [
  "covert", "shadow", "stealth", "rogue", "elite", "sleeper", "field",
  "double", "phantom", "silent", "ghost", "hidden", "cipher", "classified",
  "tactical", "clandestine", "undercover", "vigilant", "sentinel", "recon",
  "midnight", "onyx", "obsidian", "crimson", "iron", "titanium", "cobalt",
  "arctic", "solar", "lunar", "orbital", "zero-day", "black-hat", "white-hat",
] as const;

// Optimization / governance / science flavored
const OPTIMIZATION_ADJECTIVES = [
  "optimal", "aligned", "calibrated", "rational", "efficient", "causal",
  "median", "pareto", "evidence", "bayesian", "convergent", "adaptive",
  "emergent", "recursive", "stochastic", "heuristic", "empirical",
  "systematic", "rigorous", "decisive", "pragmatic", "analytical",
  "strategic", "holistic", "iterative", "coherent", "verified", "robust",
  "dynamic", "predictive", "proactive", "validated", "autonomous",
] as const;

// General cool / powerful
const GENERAL_ADJECTIVES = [
  "quantum", "stellar", "cosmic", "radical", "brilliant", "hyper", "ultra",
  "prime", "apex", "zenith", "turbo", "mega", "neo", "omni", "supreme",
  "infinite", "atomic", "photon", "plasma", "voltage", "vector", "nexus",
  "fusion", "nova", "delta", "omega", "sigma", "gamma", "theta",
  "swift", "bold", "fierce", "mighty", "relentless", "resolute", "fearless",
  "tenacious", "valiant", "steadfast", "intrepid", "dauntless",
] as const;

const ADJECTIVES: readonly string[] = [
  ...AGENT_ADJECTIVES,
  ...OPTIMIZATION_ADJECTIVES,
  ...GENERAL_ADJECTIVES,
];

// Roles / titles — what you are in this game
const NOUNS = [
  "optimizer", "operative", "analyst", "architect", "scout", "agent",
  "diplomat", "strategist", "navigator", "sentinel", "catalyst", "advocate",
  "envoy", "ranger", "engineer", "auditor", "warden", "pioneer", "operator",
  "enforcer", "guardian", "marshal", "director", "controller", "commander",
  "defector", "reformer", "liberator", "crusader", "maverick", "vanguard",
  "pathfinder", "trailblazer", "freelancer", "whistleblower", "disruptor",
  "instigator", "overseer", "emissary", "delegate", "chancellor", "consul",
  "arbiter", "oracle", "decoder", "compiler", "debugger",
  "deployer", "indexer", "allocator", "resolver", "dispatcher", "calibrator",
  "synthesizer", "integrator", "validator", "accelerator", "amplifier",
  "activator", "initiator", "conductor",
] as const;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Generate a random public link handle like "covert-optimizer" or "pareto-sentinel" */
export function generateRandomPlayerName(): string {
  return `${pickRandom(ADJECTIVES)}-${pickRandom(NOUNS)}`;
}

/**
 * Create a unique handle by generating random link handles. Collision-checks
 * against the canonical `Person.handle`. Tries up to 5 random combos, then
 * appends a 2-digit number on collision.
 */
export async function createUniqueHandle(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateRandomPlayerName();
    const existing = await prisma.person.findUnique({ where: { handle: candidate } });
    if (!existing) return candidate;
  }

  // Fallback: pick a name and append a random number
  const base = generateRandomPlayerName();
  let candidate = `${base}-${Math.floor(Math.random() * 90 + 10)}`;
  while (await prisma.person.findUnique({ where: { handle: candidate } })) {
    candidate = `${base}-${Math.floor(Math.random() * 900 + 100)}`;
  }
  return candidate;
}

export async function createUniqueReferralCode() {
  let referralCode = nanoid(8).toUpperCase();

  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = nanoid(8).toUpperCase();
  }

  return referralCode;
}
