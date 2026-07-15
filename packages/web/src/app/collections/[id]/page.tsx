import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ContentAccessLevel } from "@optimitron/db/enums";
import { CollectionRecordsClient } from "@/components/collections/collection-records-client";
import { ContentSharePanel } from "@/components/content/content-share-panel";
import { authOptions } from "@/lib/auth";
import {
  getCollectionForViewer,
  getCollectionRecordForViewer,
  queryCollectionRecords,
  toCollectionDto,
} from "@/lib/collections.server";
import { listContentAccessGrants } from "@/lib/content-access.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const result = await getCollectionForViewer(id, session?.user.id ?? null);
  return {
    title: result?.collection.name ?? "Collection not found",
    robots: { index: false },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ record?: string; view?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const result = await getCollectionForViewer(id, userId);
  if (!result) notFound();
  const dto = toCollectionDto(result);
  const selectedView =
    dto.views.find((view) => view.id === query.view) ??
    dto.views.find((view) => view.isDefault) ??
    null;
  const focusedRecordId = query.record?.trim() || null;
  const [records, grants, focusedRecord] = await Promise.all([
    queryCollectionRecords({
      collectionId: id,
      filters: focusedRecordId ? [] : selectedView?.filter,
      limit: 100,
      sorts: focusedRecordId ? [] : selectedView?.sort,
      userId,
    }),
    result.viewerCanShare && userId
      ? listContentAccessGrants({
          actorUserId: userId,
          resource: { id, type: "collection" },
        })
      : Promise.resolve([]),
    focusedRecordId
      ? getCollectionRecordForViewer(focusedRecordId, userId)
      : Promise.resolve(null),
  ]);
  const visibleFocusedRecord =
    focusedRecord?.collectionId === id ? focusedRecord : null;
  const initialRecords = visibleFocusedRecord
    ? [
        visibleFocusedRecord,
        ...records.records.filter(
          (record) => record.id !== visibleFocusedRecord.id,
        ),
      ]
    : records.records;
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="border-b-2 border-foreground pb-4">
        <Link
          className="text-sm font-medium underline underline-offset-4"
          href="/collections"
        >
          Collections
        </Link>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{dto.name}</h1>
        {dto.description ? (
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {dto.description}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          {dto.visibility === "PRIVATE" ? "Private" : "Public"}
          {selectedView ? ` · ${selectedView.name}` : ""}
        </p>
      </header>

      {result.viewerCanShare ? (
        <ContentSharePanel
          initialGrants={grants.map((grant) => ({
            accessLevel: grant.accessLevel,
            id: grant.id,
            organization: grant.organization,
            organizationId: grant.organizationId,
            user: grant.user,
            userId: grant.userId,
          }))}
          resource={{ id, type: "collection" }}
        />
      ) : null}

      <CollectionRecordsClient
        canEdit={result.viewerCanEditContent}
        canSaveView={result.viewerCanEditSchema}
        collectionId={id}
        fields={dto.fields}
        initialNextCursor={records.nextCursor}
        initialRecords={initialRecords}
        initialView={selectedView}
        focusedRecordId={visibleFocusedRecord?.id ?? null}
        views={dto.views}
      />
    </main>
  );
}
