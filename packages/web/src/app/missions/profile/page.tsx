import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DatingProfileForm } from "@/app/missions/dating-client";
import { authOptions } from "@/lib/auth";
import { getOwnDatingProfile } from "@/lib/dating.server";
import { getSignInPath } from "@/lib/routes";

async function loadProfile(userId: string) {
  try {
    return await getOwnDatingProfile(userId);
  } catch {
    return null;
  }
}

export default async function DatingProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(getSignInPath("/missions/profile"));
  }

  const profile = await loadProfile(userId);

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
          Mission profile
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-muted-foreground">
          Keep it minimal. Enough for another adult to decide whether coffee,
          flyers, and not being weird for an hour are worth leaving the house.
        </p>
        <div className="mt-8">
          <DatingProfileForm profile={profile} />
        </div>
      </div>
    </main>
  );
}
