import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DatingDiscoverClient } from "@/app/love/dating/dating-client";
import { authOptions } from "@/lib/auth";
import { getDatingDiscoverData } from "@/lib/dating.server";
import { getSignInPath } from "@/lib/routes";

async function loadDiscover(userId: string) {
  try {
    return {
      data: await getDatingDiscoverData(userId),
      ready: true,
    };
  } catch {
    return {
      data: null,
      ready: false,
    };
  }
}

export default async function DatingDiscoverPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(getSignInPath("/love/dating/discover"));
  }

  const { data, ready } = await loadDiscover(userId);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm font-black uppercase underline underline-offset-4"
          href="/love/dating"
        >
          Back to Love
        </Link>
        <h1 className="mt-8 text-4xl font-black uppercase leading-none sm:text-5xl">
          Discover
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-muted-foreground">
          Like, pass, or send a short intro. Mutual interest opens messages.
        </p>

        <div className="mt-8">
          {!ready ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">
                Earth Optimization Dates are not ready yet
              </h2>
            </div>
          ) : !data?.profile ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">Profile needed</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Create your Earth Optimization Date profile before browsing
                other humans.
              </p>
              <Link
                className="mt-4 inline-flex border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background"
                href="/love/dating/profile"
              >
                Create profile
              </Link>
            </div>
          ) : data.candidates.length ? (
            <DatingDiscoverClient candidates={data.candidates} />
          ) : (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">No people yet</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                The first Earth Optimization Date pool is empty. This is
                historically common before anyone joins.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
