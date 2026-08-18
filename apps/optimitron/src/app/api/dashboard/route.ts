import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getDashboardData } from "@/lib/dashboard.server";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const data = await getDashboardData(userId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
