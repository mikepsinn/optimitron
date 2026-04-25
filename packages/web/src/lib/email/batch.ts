import { serverEnv } from "@/lib/env";

const DEFAULT_REFERRAL_EMAIL_BATCH_SIZE = 50;

export function getReferralEmailBatchSize(): number {
  const rawValue = Number(serverEnv.REFERRAL_EMAIL_BATCH_SIZE);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : DEFAULT_REFERRAL_EMAIL_BATCH_SIZE;
}
