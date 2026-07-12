import Link from "next/link";
import { listDocumentsForViewer } from "@/lib/documents.server";

/**
 * Small list of documents attached to a task, shown under the description.
 * Renders nothing when the viewer can see no documents on the task.
 */
export async function TaskDocumentsList({
  taskId,
  userId,
}: {
  taskId: string;
  userId: string | null;
}) {
  // Swallow query errors (e.g. code deployed ahead of the Document migration)
  // instead of taking down the whole task page for a side list.
  const documents = await listDocumentsForViewer({
    taskId,
    userId,
    limit: 50,
  }).catch(() => []);
  if (documents.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-foreground py-5">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
        Documents
      </h2>
      <ul className="mt-3 space-y-1">
        {documents.map((document) => (
          <li key={document.id} className="text-sm font-bold">
            <Link
              className="underline underline-offset-4"
              href={`/documents/${document.id}`}
            >
              {document.title}
            </Link>{" "}
            <span className="text-muted-foreground">v{document.version}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
