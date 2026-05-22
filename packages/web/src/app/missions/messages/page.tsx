import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DatingSafetyNotice } from "@/app/missions/dating-safety-notice";
import { authOptions } from "@/lib/auth";
import { getDatingMatchesData } from "@/lib/dating.server";
import { getSignInPath } from "@/lib/routes";
import { getUserDisplayName } from "@/lib/user-display";

async function loadMessages(userId: string) {
  try {
    return {
      data: await getDatingMatchesData(userId),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Could not load messages.",
    };
  }
}

function getDisplayError(message: string) {
  return message === "Create a mission profile first."
    ? "Create a mission profile first."
    : message;
}

export default async function DatingMessagesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(getSignInPath("/missions/messages"));
  }

  const { data, error } = await loadMessages(userId);
  const conversations = data?.matches.filter((match) => match.conversation) ?? [];

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm font-black uppercase underline underline-offset-4"
          href="/missions"
        >
          Back to missions
        </Link>
        <h1 className="mt-8 text-4xl font-black uppercase leading-none sm:text-5xl">
          Messages
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-muted-foreground">
          Open a mutual match, propose a public campaign session, and do not ask
          anyone for money. Grant officers have email for that.
        </p>
        <div className="mt-6">
          <DatingSafetyNotice compact />
        </div>

        <div className="mt-8 grid gap-4">
          {error ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">Profile needed</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                {getDisplayError(error)}
              </p>
              <Link
                className="mt-4 inline-flex border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background"
                href="/missions/profile"
              >
                Create profile
              </Link>
            </div>
          ) : conversations.length ? (
            conversations.map((match) => {
              const other =
                match.profileAId === data!.profile.id
                  ? match.profileB
                  : match.profileA;
              const lastMessage = match.conversation?.messages[0]?.body;

              return (
                <Link
                  className="grid gap-3 border-2 border-foreground p-5 text-foreground transition-colors hover:bg-foreground hover:text-background sm:grid-cols-[1fr_auto] sm:items-center"
                  href={`/missions/messages/${match.conversation!.id}`}
                  key={match.id}
                >
                  <span>
                    <span className="block text-xl font-black uppercase">
                      {getUserDisplayName(other.user)}
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-relaxed text-muted-foreground">
                      {lastMessage ?? other.headline ?? "No messages yet."}
                    </span>
                  </span>
                  <span className="text-sm font-black uppercase">Open</span>
                </Link>
              );
            })
          ) : (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">No messages yet</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Like someone who likes you back. Then discuss posters like two
                responsible adults with a civilization to repair.
              </p>
              <Link
                className="mt-4 inline-flex border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background"
                href="/missions/discover"
              >
                Discover humans
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
