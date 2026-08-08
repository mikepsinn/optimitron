import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import { ensurePersonForUser } from "@/lib/person.server"

const log = createLogger("complete-signup-api")

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()
    const { name, newsletterSubscribed } = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        person: {
          select: {
            displayName: true,
          },
        },
      },
    })

    if (typeof name === "string" && name.trim() && !user?.person?.displayName) {
      await ensurePersonForUser(userId, { displayName: name.trim() })
      const person = await prisma.user.findUnique({
        where: { id: userId },
        select: { personId: true },
      })
      if (person?.personId) {
        await prisma.person.update({
          where: { id: person.personId },
          data: { displayName: name.trim() },
        })
      }
    }

    if (typeof newsletterSubscribed === "boolean") {
      await prisma.user.update({
        where: { id: userId },
        data: { newsletterSubscribed },
      })
    }

    return NextResponse.json({ message: "Signup completed" }, { status: 200 })
  } catch (error) {
    log.error("Complete signup error", { error })
    return NextResponse.json({ error: "Failed to complete signup" }, { status: 500 })
  }
}
