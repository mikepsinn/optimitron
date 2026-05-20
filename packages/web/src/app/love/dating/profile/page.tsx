import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DatingProfileForm } from "@/app/love/dating/dating-client";
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
    redirect(getSignInPath("/love/dating/profile"));
  }

  const profile = await loadProfile(userId);

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
          Dating profile
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-muted-foreground">
          Keep it minimal. Enough for another human to decide whether coffee,
          flyers, and possible affection are worth leaving the house.
        </p>
        <div className="mt-8">
          <DatingProfileForm profile={profile} />
        </div>
      </div>
    </main>
  );
}
