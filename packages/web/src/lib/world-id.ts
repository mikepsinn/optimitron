import type { IDKitResult } from "@worldcoin/idkit";

export interface WorldIdRpContextPayload {
  created_at: number;
  expires_at: number;
  nonce: string;
  rp_id: string;
  signature: string;
}

export interface WorldIdRequestPayload {
  action: string;
  allow_legacy_proofs: boolean;
  app_id: `app_${string}`;
  environment: "production" | "staging";
  rp_context: WorldIdRpContextPayload;
  signal: string;
}

export type WorldIdVerificationPayload = IDKitResult;
