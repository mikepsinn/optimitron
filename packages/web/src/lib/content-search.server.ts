import { Prisma } from "@optimitron/db";
import {
  resolveCollectionAccessBatch,
  resolveDocumentAccessBatch,
} from "@/lib/content-access.server";
import { prisma } from "@/lib/prisma";

const MAX_SEARCH_RESULTS = 100;
const MAX_SEARCH_CANDIDATES = 1_000;
interface DocumentCandidate {
  id: string;
  rank: number;
  snippet: string;
  title: string;
}

interface RecordCandidate {
  collectionName: string;
  collectionId: string;
  id: string;
  rank: number;
  snippet: string;
  title: string;
}

export async function searchContent(input: {
  limit?: number | null;
  query: string;
  userId?: string | null;
}) {
  const query = input.query.trim();
  if (query.length < 2 || query.length > 500) {
    throw new Error("query must be 2-500 characters");
  }
  const limit = Math.min(
    Math.max(Math.trunc(input.limit ?? 30), 1),
    MAX_SEARCH_RESULTS,
  );
  const viewerUserId = input.userId?.trim() || null;
  const [documentCandidates, recordCandidates] = await Promise.all([
    prisma.$queryRaw<DocumentCandidate[]>(Prisma.sql`
      SELECT
        candidate."id",
        candidate."title",
        candidate."rank",
        candidate."snippet"
      FROM (
        SELECT DISTINCT ON (document."id")
          document."id",
          document."title",
          document."updatedAt",
          revision."version",
          ts_rank(
            to_tsvector(
              'english',
              revision."title" || ' ' || revision."body"
            ),
            websearch_to_tsquery('english', ${query})
          )::double precision AS "rank",
          regexp_replace(
            ts_headline(
              'english',
              revision."title" || ' ' || revision."body",
              websearch_to_tsquery('english', ${query}),
              'MaxWords=24, MinWords=8'
            ),
            '</?b>',
            '',
            'g'
          ) AS "snippet"
        FROM "DocumentRevision" revision
        JOIN "Document" document
          ON document."id" = revision."documentId"
         AND document."deletedAt" IS NULL
        WHERE revision."deletedAt" IS NULL
          AND to_tsvector(
            'english',
            revision."title" || ' ' || revision."body"
          ) @@ websearch_to_tsquery('english', ${query})
        ORDER BY
          document."id",
          "rank" DESC,
          revision."version" DESC
      ) candidate
      ORDER BY
        candidate."rank" DESC,
        candidate."updatedAt" DESC,
        candidate."id"
      LIMIT ${MAX_SEARCH_CANDIDATES}
    `),
    prisma.$queryRaw<RecordCandidate[]>(Prisma.sql`
      SELECT
        record."id",
        record."collectionId",
        collection."name" AS "collectionName",
        COALESCE(title_field."title", collection."name") AS "title",
        ts_rank(
          to_tsvector('english', record."searchText"),
          websearch_to_tsquery('english', ${query})
        )::double precision AS "rank",
        regexp_replace(
          ts_headline(
            'english',
            record."searchText",
            websearch_to_tsquery('english', ${query}),
            'MaxWords=24, MinWords=8'
          ),
          '</?b>',
          '',
          'g'
        ) AS "snippet"
      FROM "CollectionRecord" record
      JOIN "Collection" collection
        ON collection."id" = record."collectionId"
       AND collection."deletedAt" IS NULL
      LEFT JOIN LATERAL (
        SELECT NULLIF(BTRIM(record."valuesJson" ->> field."key"), '') AS "title"
        FROM "CollectionField" field
        WHERE field."collectionId" = record."collectionId"
          AND field."deletedAt" IS NULL
          AND field."type" IN ('TEXT', 'RICH_TEXT', 'EMAIL', 'URL', 'SELECT')
          AND NULLIF(BTRIM(record."valuesJson" ->> field."key"), '') IS NOT NULL
        ORDER BY field."position" ASC, field."id" ASC
        LIMIT 1
      ) title_field ON TRUE
      WHERE record."deletedAt" IS NULL
        AND to_tsvector('english', record."searchText")
          @@ websearch_to_tsquery('english', ${query})
      ORDER BY "rank" DESC, record."updatedAt" DESC
      LIMIT ${MAX_SEARCH_CANDIDATES}
    `),
  ]);

  const [documentAccess, collectionAccess] = await Promise.all([
    resolveDocumentAccessBatch(
      documentCandidates.map((candidate) => candidate.id),
      viewerUserId,
    ),
    resolveCollectionAccessBatch(
      recordCandidates.map((candidate) => candidate.collectionId),
      viewerUserId,
    ),
  ]);

  const results = [
    ...documentCandidates.flatMap((candidate) => {
      const permission = documentAccess.get(candidate.id) ?? null;
      return permission
        ? [
            {
              id: candidate.id,
              kind: "document" as const,
              permission,
              rank: candidate.rank,
              snippet: candidate.snippet,
              title: candidate.title,
              url: `/documents/${candidate.id}`,
            },
          ]
        : [];
    }),
    ...recordCandidates.flatMap((candidate) => {
      const permission = collectionAccess.get(candidate.collectionId) ?? null;
      return permission
        ? [
            {
              collectionName: candidate.collectionName,
              collectionId: candidate.collectionId,
              id: candidate.id,
              kind: "collectionRecord" as const,
              permission,
              rank: candidate.rank,
              snippet: candidate.snippet,
              title: candidate.title,
              url: `/collections/${candidate.collectionId}?record=${candidate.id}`,
            },
          ]
        : [];
    }),
  ]
    .sort(
      (left, right) =>
        right.rank - left.rank || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
  return {
    results,
    truncated:
      documentCandidates.length === MAX_SEARCH_CANDIDATES ||
      recordCandidates.length === MAX_SEARCH_CANDIDATES,
  };
}
