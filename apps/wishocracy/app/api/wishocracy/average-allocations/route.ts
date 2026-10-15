import { NextResponse } from "next/server"
import { loadPublicAllocations } from "@/lib/wishocracy-results.server"
import { createLogger } from "@/lib/logger"

const log = createLogger("wishocracy-average-allocations")

export async function GET() {
  try {
    return NextResponse.json(await loadPublicAllocations())
  } catch (error) {
    log.error("Failed to calculate average allocations", { error })
    return NextResponse.json(
      { error: "Failed to fetch average allocations" },
      { status: 500 },
    )
  }
}
