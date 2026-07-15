import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DocumentCreateDialog } from "@/components/documents/document-create-dialog";
import { authOptions } from "@/lib/auth";
import { listDocumentsForViewer } from "@/lib/documents.server";
import { getRouteMetadata } from "@/lib/metadata";
import { documentsLink, getSignInPath, ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const metadata = getRouteMetadata(documentsLink);

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect(getSignInPath(ROUTES.documents));
  const documents = await listDocumentsForViewer({
    limit: 100,
    userId: session.user.id,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notes, plans, and decisions that need more than a task description.
          </p>
        </div>
        <DocumentCreateDialog />
      </header>

      {documents.length ? (
        <ul className="divide-y divide-foreground border-b border-foreground">
          {documents.map((document) => (
            <li key={document.id}>
              <Link
                className="grid gap-1 py-4 hover:bg-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2"
                href={`/documents/${document.id}`}
              >
                <span className="min-w-0 truncate font-bold">
                  {document.title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {document.visibility === "PRIVATE" ? "Private" : "Public"}
                  {" · "}
                  {new Date(document.updatedAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                    year: "numeric",
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No documents yet.</p>
        </div>
      )}
    </main>
  );
}
