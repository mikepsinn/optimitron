import { fetchers } from "@optomitron/data";
import {
  classifyLegislativeBill,
  confidenceToSignalWeight,
  deriveCategorySupportSignal,
  inferLegislativeBudgetDirection,
} from "@/lib/alignment-legislative-classification";
import { BUDGET_CATEGORIES, type BudgetCategoryId } from "@/lib/wishocracy-data";

const ALIGNMENT_CATEGORY_IDS = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];
const RECENT_BILLS_PER_CONGRESS = 30;
const MAX_ROLL_CALLS_PER_BILL = 3;
const MIN_ROLL_CALLS_PER_PROFILE = 6;
const MIN_CATEGORY_COVERAGE = 4;
const SIGNAL_PRIOR = 0.2;

export interface StoredAlignmentVoteRow {
  allocationPct: number;
  billId: string | null;
  itemCategory: string;
  updatedAt: Date;
  voteDate: Date | null;
}

export interface DerivedAlignmentAllocationRecord {
  allocations: Record<BudgetCategoryId, number>;
  categoriesCovered: number;
  latestVoteDate: Date | null;
  rollCallCount: number;
}

export interface DerivedAlignmentVoteRow {
  externalId: string;
  allocationPct: number;
  billId: string;
  itemCategory: BudgetCategoryId;
  voteDate: Date | null;
}

type FetchedBill = Awaited<ReturnType<typeof fetchers.fetchBills>>[number];
type FetchedBillVote = Awaited<ReturnType<typeof fetchers.fetchBillVotes>>[number];

function currentCongressNumber(now: Date = new Date()): number {
  return Math.floor((now.getUTCFullYear() - 1789) / 2) + 1;
}

function getCongressWindow(): number[] {
  const current = currentCongressNumber();
  return [current, current - 1].filter((value) => value > 0);
}

function toTimestamp(value: Date | null | undefined): number {
  return value?.getTime() ?? 0;
}

function isLegacyBenchmarkVote(vote: StoredAlignmentVoteRow): boolean {
  return vote.billId?.startsWith("alignment-benchmark:") ?? false;
}

function normalizeSignal(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

function normalizeAllocationRecord(
  weights: Record<BudgetCategoryId, number>,
): Record<BudgetCategoryId, number> {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return ALIGNMENT_CATEGORY_IDS.reduce((record, categoryId) => {
      record[categoryId] = 0;
      return record;
    }, {} as Record<BudgetCategoryId, number>);
  }

  return ALIGNMENT_CATEGORY_IDS.reduce((record, categoryId) => {
    record[categoryId] = Number(((weights[categoryId] / total) * 100).toFixed(1));
    return record;
  }, {} as Record<BudgetCategoryId, number>);
}

function buildLegacyAllocationRecord(
  votes: StoredAlignmentVoteRow[],
): DerivedAlignmentAllocationRecord | null {
  const latestByCategory = new Map<BudgetCategoryId, { allocationPct: number; timestamp: number }>();
  let latestVoteDate: Date | null = null;

  for (const vote of votes) {
    if (!ALIGNMENT_CATEGORY_IDS.includes(vote.itemCategory as BudgetCategoryId)) continue;
    const categoryId = vote.itemCategory as BudgetCategoryId;
    const timestamp = toTimestamp(vote.voteDate) || toTimestamp(vote.updatedAt);
    const existing = latestByCategory.get(categoryId);
    if (!existing || timestamp >= existing.timestamp) {
      latestByCategory.set(categoryId, { allocationPct: vote.allocationPct, timestamp });
    }
    if (timestamp > toTimestamp(latestVoteDate)) {
      latestVoteDate = vote.voteDate ?? vote.updatedAt;
    }
  }

  if (latestByCategory.size !== ALIGNMENT_CATEGORY_IDS.length) {
    return null;
  }

  return {
    allocations: ALIGNMENT_CATEGORY_IDS.reduce((record, categoryId) => {
      record[categoryId] = Number(
        (latestByCategory.get(categoryId)?.allocationPct ?? 0).toFixed(1),
      );
      return record;
    }, {} as Record<BudgetCategoryId, number>),
    categoriesCovered: latestByCategory.size,
    latestVoteDate,
    rollCallCount: latestByCategory.size,
  };
}

export function buildAllocationRecordFromStoredVotes(
  votes: StoredAlignmentVoteRow[],
): DerivedAlignmentAllocationRecord | null {
  if (votes.length === 0) return null;
  if (votes.every(isLegacyBenchmarkVote)) {
    return buildLegacyAllocationRecord(votes);
  }

  const byCategory = new Map<BudgetCategoryId, { count: number; sum: number }>();
  const uniqueRollCalls = new Set<string>();
  let latestVoteDate: Date | null = null;

  for (const vote of votes) {
    if (!ALIGNMENT_CATEGORY_IDS.includes(vote.itemCategory as BudgetCategoryId)) continue;
    const categoryId = vote.itemCategory as BudgetCategoryId;
    const stats = byCategory.get(categoryId) ?? { count: 0, sum: 0 };
    stats.count += 1;
    stats.sum += normalizeSignal(vote.allocationPct);
    byCategory.set(categoryId, stats);
    if (vote.billId) {
      uniqueRollCalls.add(vote.billId);
    }
    if (toTimestamp(vote.voteDate) > toTimestamp(latestVoteDate)) {
      latestVoteDate = vote.voteDate;
    }
  }

  if (
    uniqueRollCalls.size < MIN_ROLL_CALLS_PER_PROFILE ||
    byCategory.size < MIN_CATEGORY_COVERAGE
  ) {
    return null;
  }

  const weights = ALIGNMENT_CATEGORY_IDS.reduce((record, categoryId) => {
    const stats = byCategory.get(categoryId);
    if (!stats) {
      record[categoryId] = SIGNAL_PRIOR;
      return record;
    }

    const averageSignal = normalizeSignal(stats.sum / stats.count);
    record[categoryId] = ((averageSignal + 1) / 2) * stats.count + SIGNAL_PRIOR;
    return record;
  }, {} as Record<BudgetCategoryId, number>);

  return {
    allocations: normalizeAllocationRecord(weights),
    categoriesCovered: byCategory.size,
    latestVoteDate,
    rollCallCount: uniqueRollCalls.size,
  };
}

function dedupeRollCalls(votes: FetchedBillVote[]): FetchedBillVote[] {
  const unique = new Map<string, FetchedBillVote>();
  for (const vote of votes) {
    if (
      vote.rollNumber == null ||
      vote.sessionNumber == null ||
      !vote.chamber
    ) {
      continue;
    }
    const key = `${vote.chamber.toLowerCase()}:${vote.sessionNumber}:${vote.rollNumber}`;
    if (!unique.has(key)) {
      unique.set(key, vote);
    }
  }
  return [...unique.values()];
}

function sortBillsByLatestAction(bills: FetchedBill[]): FetchedBill[] {
  return [...bills].sort((left, right) => {
    const leftTime = left.latestAction?.date ? new Date(left.latestAction.date).getTime() : 0;
    const rightTime = right.latestAction?.date ? new Date(right.latestAction.date).getTime() : 0;
    return rightTime - leftTime;
  });
}

export async function deriveRecentLegislativeVoteRows(
  externalIds: string[],
): Promise<DerivedAlignmentVoteRow[]> {
  const targetIds = new Set(externalIds);
  if (targetIds.size === 0) {
    return [];
  }

  const congressBills = await Promise.all(
    getCongressWindow().map((congress) =>
      fetchers.fetchBills(congress, undefined, RECENT_BILLS_PER_CONGRESS),
    ),
  );
  const bills = sortBillsByLatestAction(congressBills.flat());
  const rows: DerivedAlignmentVoteRow[] = [];

  for (const bill of bills) {
    const [subjectInfo, billVotes] = await Promise.all([
      fetchers.fetchBillSubjects(bill.type, bill.number, bill.congress),
      fetchers.fetchBillVotes(bill.type, bill.number, bill.congress),
    ]);
    const classifiedBill = {
      billId: bill.billId,
      title: bill.title,
      subjects: subjectInfo.subjects,
      policyArea: subjectInfo.policyArea,
      latestActionText: bill.latestAction?.text,
    };
    const matches = classifyLegislativeBill(classifiedBill);
    if (matches.length === 0) {
      continue;
    }

    const direction = inferLegislativeBudgetDirection(classifiedBill);
    const rollCalls = dedupeRollCalls(billVotes).slice(0, MAX_ROLL_CALLS_PER_BILL);

    for (const rawVote of rollCalls) {
      const vote = await fetchers.fetchRollCallVote(
        rawVote.congress ?? bill.congress,
        rawVote.chamber ?? "house",
        rawVote.sessionNumber ?? 1,
        rawVote.rollNumber ?? 0,
      );
      if (!vote) {
        continue;
      }

      const voteDate = vote.date ? new Date(vote.date) : null;
      const rollCallId = `${bill.billId}:${vote.chamber}:${vote.session}:${vote.rollCallNumber}`;

      for (const memberVote of vote.memberVotes) {
        if (!targetIds.has(memberVote.bioguideId)) {
          continue;
        }
        const supportSignal = deriveCategorySupportSignal(memberVote.position, direction);
        if (supportSignal === 0) {
          continue;
        }

        for (const match of matches) {
          rows.push({
            externalId: memberVote.bioguideId,
            allocationPct: Number(
              (
                supportSignal *
                match.weight *
                confidenceToSignalWeight(match.confidence)
              ).toFixed(3),
            ),
            billId: rollCallId,
            itemCategory: match.categoryId,
            voteDate,
          });
        }
      }
    }
  }

  return rows;
}
