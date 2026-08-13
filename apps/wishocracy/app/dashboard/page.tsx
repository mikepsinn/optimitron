import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import {
  getUserDisplayName,
  getUserDisplayHandle,
} from "@/lib/user-display"
import { WishocracyDashboardClient } from "./dashboard-client"

export default async function WishocracyDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  const dbAllocations = await prisma.wishocraticAllocation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      itemAId: true,
      itemBId: true,
      allocationA: true,
      allocationB: true,
      createdAt: true,
    },
  })

  const seen = new Map<string, (typeof dbAllocations)[number]>()
  for (const alloc of dbAllocations) {
    const [catA, catB] = [alloc.itemAId, alloc.itemBId].sort()
    const key = `${catA}_${catB}`
    if (!seen.has(key) || alloc.createdAt > seen.get(key)!.createdAt) {
      seen.set(key, alloc)
    }
  }

  const comparisons = Array.from(seen.values()).map((alloc) => {
    const [itemA, itemB] = [alloc.itemAId, alloc.itemBId].sort()
    const needsSwap = itemA !== alloc.itemAId
    return {
      categoryA: itemA,
      categoryB: itemB,
      allocationA: needsSwap ? alloc.allocationB : alloc.allocationA,
      allocationB: needsSwap ? alloc.allocationA : alloc.allocationB,
    }
  })

  const inclusions = await prisma.wishocraticItemInclusion.findMany({
    where: { userId: user.id },
    select: { itemId: true, included: true },
  })

  const selectedCategories = inclusions.filter((i) => i.included).map((i) => i.itemId)

  return (
    <WishocracyDashboardClient
      user={{
        email: user.email ?? "",
        name: getUserDisplayName(user),
        handle: getUserDisplayHandle(user),
      }}
      initialComparisons={comparisons}
      selectedCategoryIds={selectedCategories}
    />
  )
}
