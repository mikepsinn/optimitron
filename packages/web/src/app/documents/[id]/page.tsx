import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocumentForViewer } from "@/lib/documents.server";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { DocumentEditForm } from "@/components/documents/document-edit-form";

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
    title: result.document.title,
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

  const { document, versions, viewerCanEdit } = result;
  const currentVersion = versions.find((v) => v.isCurrent) ?? null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="border-b-2 border-foreground pb-4">
        <h1 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
          {document.title}
        </h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          Version {document.version}
          {document.isCurrent ? " (current)" : ""}.{" "}
          {document.visibility === "PRIVATE" ? "Private." : "Public."}{" "}
          {document.createdAt.toLocaleDateString("en-US", DOCUMENT_DATE_FORMAT)}.
        </p>
        {document.taskId ? (
          <p className="mt-1 text-sm font-bold">
            <Link
              className="underline underline-offset-4"
              href={`/tasks/${document.taskId}`}
            >
              Attached task.
            </Link>
          </p>
        ) : null}
        {!document.isCurrent && currentVersion ? (
          <p className="mt-1 text-sm font-bold">
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
        <RichMarkdown markdown={document.body} />
      </section>

      {viewerCanEdit && document.isCurrent ? (
        <details className="border-b border-foreground py-5">
          <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em]">
            Edit
          </summary>
          <div className="mt-4">
            <DocumentEditForm
              documentId={document.id}
              initialTitle={document.title}
              initialBody={document.body}
            />
          </div>
        </details>
      ) : null}

      {versions.length > 1 ? (
        <section className="py-5">
          <h2 className="text-sm font-black uppercase tracking-[0.12em]">
            Versions
          </h2>
          <ul className="mt-3 space-y-1">
            {versions.map((version) => (
              <li key={version.id} className="text-sm font-bold">
                {version.id === document.id ? (
                  <span>
                    v{version.version} — {version.title} (you are here)
                  </span>
                ) : (
                  <Link
                    className="underline underline-offset-4"
                    href={`/documents/${version.id}`}
                  >
                    v{version.version} — {version.title}
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
