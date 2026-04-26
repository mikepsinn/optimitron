import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let cachedClient: Stripe | null = null;

/**
 * Stripe client used for donations to IAM 501(c)(3).
 * Lazy-initialized so the absence of STRIPE_SECRET_KEY in dev/test does not crash module import.
 * Throws when called without a configured key.
 */
export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient;
  if (!serverEnv.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }
  cachedClient = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover",
    typescript: true,
  });
  return cachedClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY);
}

export const PRESET_DONATION_AMOUNTS = [25, 50, 100, 250, 500, 1000] as const;
export type PresetDonationAmount = (typeof PRESET_DONATION_AMOUNTS)[number];
export type DonationFrequency = "one-time" | "monthly";
