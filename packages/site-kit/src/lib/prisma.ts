import { PrismaClient } from "@optimitron/db"
import { PrismaPg } from "@prisma/adapter-pg"
import { env } from "./env"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  let connectionString = env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is required")
  }

  try {
    const url = new URL(connectionString)
    if (url.searchParams.get("sslmode") === "require") {
      url.searchParams.set("sslmode", "verify-full")
      connectionString = url.toString()
    }
  } catch {
    // leave connectionString as-is for non-URL forms
  }

  const adapter = new PrismaPg({ connectionString })
  const client = new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

  globalForPrisma.prisma = client
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = client[prop as keyof PrismaClient]
    if (typeof value === "function") {
      return (value as Function).bind(client)
    }
    return value
  },
})

export default prisma
