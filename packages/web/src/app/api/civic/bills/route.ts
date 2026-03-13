import { NextRequest, NextResponse } from "next/server";
import { fetchers } from "@optomitron/data";
import {
  classifyLegislativeBill,
  inferLegislativeBudgetDirection,
  type LegislativeBillInput,
} from "@/lib/alignment-legislative-classification";
import type { BudgetCategoryId } from "@/lib/wishocracy-data";

export interface ClassifiedBill {
  billId: string;
  title: string;
  type: string;
  number: number;
  congress: number;
  policyArea: string | null;
  subjects: string[];
  latestAction: { date: string; text: string } | null;
  categories: Array<{
    categoryId: BudgetCategoryId;
    confidence: string;
    score: number;
  }>;
  direction: "increase" | "decrease";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 20);
  const category = searchParams.get("category") as BudgetCategoryId | null;
  const query = searchParams.get("q")?.toLowerCase() ?? null;

  try {
    // Fetch recent HR and S bills
    const [hrBills, sBills] = await Promise.all([
      fetchers.fetchBillsByType(undefined, "hr", 50),
      fetchers.fetchBillsByType(undefined, "s", 50),
    ]);

    const allBills = [...hrBills, ...sBills];

    // Enrich with detail (subjects/policy area) for those missing it
    const enriched = await Promise.all(
      allBills.map(async (bill) => {
        if (bill.subjects.length === 0 && !bill.policyArea) {
          const detail = await fetchers.fetchBillDetail(bill.type, bill.number, bill.congress);
          return detail ?? bill;
        }
        return bill;
      }),
    );

    // Classify and filter
    const classified: ClassifiedBill[] = [];

    for (const bill of enriched) {
      const input: LegislativeBillInput = {
        billId: bill.billId,
        title: bill.title,
        subjects: bill.subjects,
        policyArea: bill.policyArea,
        latestActionText: bill.latestAction?.text,
      };

      const matches = classifyLegislativeBill(input);
      if (matches.length === 0) continue;

      const direction = inferLegislativeBudgetDirection(input);

      // Filter by category if specified
      if (category && !matches.some((m) => m.categoryId === category)) continue;

      // Filter by keyword if specified
      if (query) {
        const searchable = [
          bill.title,
          ...bill.subjects,
          bill.policyArea ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(query)) continue;
      }

      classified.push({
        billId: bill.billId,
        title: bill.title,
        type: bill.type,
        number: bill.number,
        congress: bill.congress,
        policyArea: bill.policyArea,
        subjects: bill.subjects,
        latestAction: bill.latestAction,
        categories: matches.map((m) => ({
          categoryId: m.categoryId,
          confidence: m.confidence,
          score: m.score,
        })),
        direction,
      });

      if (classified.length >= limit) break;
    }

    return NextResponse.json({ bills: classified });
  } catch (err) {
    console.error("civic/bills error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 },
    );
  }
}
