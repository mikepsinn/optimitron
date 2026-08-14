import type { Prisma, PrismaClient } from "@optimitron/db";

/**
 * Full Prisma client injected by the host app (packages/web or apps/dfda).
 * This package never constructs a client itself, so it stays free of
 * connection-string and driver-adapter concerns.
 */
export type TrackingPrismaClient = PrismaClient;

/** Either the full client or a transaction client, for helpers that run inside $transaction. */
export type TrackingDbClient = Prisma.TransactionClient | TrackingPrismaClient;

/** MCP tool-response envelope shared with the host servers. */
export interface TrackingToolResponse {
  content: Array<{ text: string; type: "text" }>;
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}
