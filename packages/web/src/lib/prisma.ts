import { PrismaClient } from "@optimitron/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { serverEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  // Pin sslmode=verify-full on SSL connections to suppress the pg v8 deprecation
  // warning and keep the same security behavior when pg v9 ships.
  let connectionString = serverEnv.DATABASE_URL;
  const url = new URL(connectionString);
  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.set("sslmode", "verify-full");
    connectionString = url.toString();
  }
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({
    adapter,
    log: serverEnv.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (serverEnv.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Lazy proxy: the PrismaClient is only created when a property is first accessed,
// avoiding SASL errors during SSG build when DATABASE_URL may not be available.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return (value as Function).bind(client);
    }
    return value;
  },
});

export default prisma;
