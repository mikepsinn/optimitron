import type { Prisma, PrismaClient } from "@optimitron/db";
import { prisma as defaultPrisma } from "@/lib/prisma";

type StalenessDb = PrismaClient | Prisma.TransactionClient;

interface RevisionNode {
  currentRevisionId: string | null;
  inputRevisionIds: string[];
  parameterDeleted: boolean;
}

export async function getTransitiveStaleParameterRevisionIds(
  revisionIds: readonly string[],
  db: StalenessDb = defaultPrisma,
) {
  const requestedIds = [...new Set(revisionIds.filter(Boolean))];
  const nodes = new Map<string, RevisionNode | null>();
  let pending = requestedIds;

  for (let depth = 0; pending.length > 0; depth += 1) {
    if (depth >= 64) {
      throw new Error("Parameter dependency graph exceeds 64 levels.");
    }
    const rows = await db.parameterRevision.findMany({
      where: { id: { in: pending } },
      select: {
        id: true,
        inputs: {
          where: { deletedAt: null },
          select: { inputRevisionId: true },
        },
        parameter: {
          select: { currentRevisionId: true, deletedAt: true },
        },
      },
    });
    const rowById = new Map(rows.map((row) => [row.id, row]));
    const nextIds = new Set<string>();
    for (const id of pending) {
      const row = rowById.get(id);
      if (!row) {
        nodes.set(id, null);
        continue;
      }
      const inputRevisionIds = row.inputs.map((input) => input.inputRevisionId);
      nodes.set(id, {
        currentRevisionId: row.parameter.currentRevisionId,
        inputRevisionIds,
        parameterDeleted: row.parameter.deletedAt != null,
      });
      for (const inputRevisionId of inputRevisionIds) {
        if (!nodes.has(inputRevisionId)) nextIds.add(inputRevisionId);
      }
    }
    pending = [...nextIds];
  }

  const memo = new Map<string, boolean>();
  const visiting = new Set<string>();
  const isStale = (id: string): boolean => {
    const cached = memo.get(id);
    if (cached != null) return cached;
    const node = nodes.get(id);
    if (!node || visiting.has(id)) return true;
    visiting.add(id);
    const stale =
      node.parameterDeleted ||
      (node.currentRevisionId != null && node.currentRevisionId !== id) ||
      node.inputRevisionIds.some(isStale);
    visiting.delete(id);
    memo.set(id, stale);
    return stale;
  };

  return new Set(requestedIds.filter(isStale));
}
