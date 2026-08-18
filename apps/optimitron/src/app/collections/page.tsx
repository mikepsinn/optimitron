import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CollectionCreateDialog } from "@/components/collections/collection-create-dialog";
import { authOptions } from "@/lib/auth";
import { listCollectionsForViewer } from "@/lib/collections.server";
import { getRouteMetadata } from "@/lib/metadata";
import { collectionsLink, getSignInPath, ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const metadata = getRouteMetadata(collectionsLink);

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect(getSignInPath(ROUTES.collections));
  const collections = await listCollectionsForViewer({
    limit: 100,
    userId: session.user.id,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured records linked to Optimitron tasks, people, and
            organizations.
          </p>
        </div>
        <CollectionCreateDialog />
      </header>

      {collections.length ? (
        <ul className="divide-y divide-foreground border-b border-foreground">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                className="grid gap-1 py-4 hover:bg-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2"
                href={`/collections/${collection.id}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold">
                    {collection.name}
                  </span>
                  {collection.description ? (
                    <span className="block truncate text-sm text-muted-foreground">
                      {collection.description}
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-muted-foreground">
                  {collection.visibility === "PRIVATE" ? "Private" : "Public"}
                  {" · "}
                  {new Date(collection.updatedAt).toLocaleDateString("en-US", {
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
          <p className="text-muted-foreground">No collections yet.</p>
        </div>
      )}
    </main>
  );
}
