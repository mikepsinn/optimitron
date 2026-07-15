import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocumentForViewer } from "@/lib/documents.server";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { DocumentEditForm } from "@/components/documents/document-edit-form";
import { ContentAttachments } from "@/components/content/content-attachments";
import { ContentSharePanel } from "@/components/content/content-share-panel";
import { ContentAccessLevel } from "@optimitron/db/enums";
import { listContentAttachments } from "@/lib/content-attachments.server";
import { listContentAccessGrants } from "@/lib/content-access.server";

export const dynamic = "force-dynamic";

const DOCUMENT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const result = await getDocumentForViewer(id, session?.user.id ?? null);
  if (!result) {
    return { title: "Document not found" };
  }
  return {
    title: result.revision.title,
    robots: { index: false },
  };
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;

  const result = await getDocumentForViewer(id, userId);
  if (!result) {
    notFound();
  }

  const { document, revision, versions, visibleTaskId, viewerCanEdit } = result;
  const isCurrent = revision.id === document.currentRevisionId;
  const currentVersion = versions.find((v) => v.isCurrent) ?? null;
  const canShare =
    result.effectivePermission === ContentAccessLevel.FULL_ACCESS;
  const [attachments, grants] = await Promise.all([
    listContentAttachments({ documentId: document.id, userId }),
    canShare && userId
      ? listContentAccessGrants({
          actorUserId: userId,
          resource: { id: document.id, type: "document" },
        })
      : Promise.resolve([]),
  ]);
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="border-b-2 border-foreground pb-4">
        <Link
          className="text-sm font-medium underline underline-offset-4"
          href="/documents"
        >
          Documents
        </Link>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          {revision.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Version {revision.version}
          {isCurrent ? " (current)" : ""}.{" "}
          {document.visibility === "PRIVATE" ? "Private." : "Public."}{" "}
          {revision.createdAt.toLocaleDateString("en-US", DOCUMENT_DATE_FORMAT)}
          .
        </p>
        {visibleTaskId ? (
          <p className="mt-1 text-sm font-medium">
            <Link
              className="underline underline-offset-4"
              href={`/tasks/${visibleTaskId}`}
            >
              Attached task.
            </Link>
          </p>
        ) : null}
        {!isCurrent && currentVersion ? (
          <p className="mt-1 text-sm font-medium">
            This is an old version.{" "}
            <Link
              className="underline underline-offset-4"
              href={`/documents/${currentVersion.id}`}
            >
              Read the current version.
            </Link>
          </p>
        ) : null}
      </header>

      <section className="border-b border-foreground py-6">
        <RichMarkdown markdown={revision.body} />
      </section>

      <ContentAttachments
        attachments={attachments.map((attachment) => ({
          ...attachment,
          uploadedAt: attachment.uploadedAt?.toISOString() ?? null,
        }))}
        canEdit={viewerCanEdit && isCurrent}
        resource={{ documentId: document.id }}
      />

      {canShare ? (
        <ContentSharePanel
          initialGrants={grants.map((grant) => ({
            accessLevel: grant.accessLevel,
            id: grant.id,
            organization: grant.organization,
            organizationId: grant.organizationId,
            user: grant.user,
            userId: grant.userId,
          }))}
          resource={{ id: document.id, type: "document" }}
        />
      ) : null}

      {viewerCanEdit && isCurrent ? (
        <details className="border-b border-foreground py-5">
          <summary className="cursor-pointer font-bold">Edit</summary>
          <div className="mt-4">
            <DocumentEditForm
              documentId={document.id}
              expectedVersion={document.version}
              initialTitle={revision.title}
              initialBody={revision.body}
            />
          </div>
        </details>
      ) : null}

      {versions.length > 1 ? (
        <section className="py-5">
          <h2 className="font-bold">Versions</h2>
          <ul className="mt-3 space-y-1">
            {versions.map((version) => (
              <li key={version.id} className="text-sm font-medium">
                {version.id === revision.id ? (
                  <span>
                    v{version.version} - {version.title} (you are here)
                  </span>
                ) : (
                  <Link
                    className="underline underline-offset-4"
                    href={`/documents/${version.id}`}
                  >
                    v{version.version} - {version.title}
                    {version.isCurrent ? " (current)" : ""}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
