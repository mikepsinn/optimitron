import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDatingMatchesData } from "@/lib/dating.server";
import { getSignInPath } from "@/lib/routes";

async function loadMatches(userId: string) {
  try {
    return {
      data: await getDatingMatchesData(userId),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Could not load matches.",
    };
  }
}

export default async function DatingMatchesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(getSignInPath("/love/dating/matches"));
  }

  const { data, error } = await loadMatches(userId);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm font-black uppercase underline underline-offset-4"
          href="/love/dating"
        >
          Back to dating
        </Link>
        <h1 className="mt-8 text-4xl font-black uppercase leading-none sm:text-5xl">
          Matches
        </h1>

        <div className="mt-8 grid gap-4">
          {error ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">Profile needed</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                {error}
              </p>
            </div>
          ) : data?.matches.length ? (
            data.matches.map((match) => {
              const other =
                match.profileAId === data.profile.id
                  ? match.profileB
                  : match.profileA;
              const lastMessage = match.conversation?.messages[0]?.body;

              return (
                <Link
                  className="grid gap-3 border-2 border-foreground p-5 text-foreground transition-colors hover:bg-foreground hover:text-background sm:grid-cols-[1fr_auto] sm:items-center"
                  href={
                    match.conversation
                      ? `/love/dating/messages/${match.conversation.id}`
                      : "/love/dating/matches"
                  }
                  key={match.id}
                >
                  <span>
                    <span className="block text-xl font-black uppercase">
                      {other.user.person?.displayName ?? other.user.email}
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-relaxed text-muted-foreground">
                      {lastMessage ?? other.headline ?? "No messages yet."}
                    </span>
                  </span>
                  <span className="text-sm font-black uppercase">
                    Message
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">No matches yet</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Like someone who also likes you. Ancient technology.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
