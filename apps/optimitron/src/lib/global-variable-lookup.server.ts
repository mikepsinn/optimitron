import type { Prisma } from "@optimitron/db";

type GlobalVariableLookupClient = Pick<Prisma.TransactionClient, "globalVariable">;

export async function findCanonicalConditionGlobalVariable(
  tx: GlobalVariableLookupClient,
  conditionName: string,
) {
  const normalizedName = conditionName.trim();
  if (!normalizedName) return null;

  return tx.globalVariable.findFirst({
    where: {
      deletedAt: null,
      variableCategory: { name: "Condition" },
      OR: [
        { name: { equals: normalizedName, mode: "insensitive" } },
        { synonyms: { contains: normalizedName, mode: "insensitive" } },
        {
          externalCodes: {
            some: {
              code: { equals: normalizedName, mode: "insensitive" },
              codeSystem: "ICD-10",
              deletedAt: null,
            },
          },
        },
      ],
    },
    select: {
      externalCodes: {
        where: {
          codeSystem: "ICD-10",
          deletedAt: null,
        },
        orderBy: [{ code: "asc" }],
        select: {
          code: true,
          codeSystem: true,
        },
        take: 1,
      },
      id: true,
    },
  });
}
