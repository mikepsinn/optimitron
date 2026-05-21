import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnDatingProfile } from "@/lib/dating.server";
import { getRouteMetadata } from "@/lib/metadata";
import { getSignInPath, loveLink } from "@/lib/routes";

export const metadata = getRouteMetadata(loveLink);

const DATING_ROUTES = [
  {
    href: "/love/dating/profile",
    title: "Profile",
    body: "Opt in, add photos, and say what kind of useful Earth Optimization Date would not make you flee.",
  },
  {
    href: "/love/dating/questions",
    title: "Questions",
    body: "Answer compatibility questions with the answers you accept from someone else.",
  },
  {
    href: "/love/dating/discover",
    title: "Discover",
    body: "Like, pass, or send one actual sentence before the species collapses.",
  },
  {
    href: "/love/dating/matches",
    title: "Matches",
    body: "Message mutual matches and propose Earth Optimization Dates that can also produce votes.",
  },
] as const;

async function loadProfile(userId: string) {
  try {
    return {
      profile: await getOwnDatingProfile(userId),
      ready: true,
    };
  } catch {
    return {
      profile: null,
      ready: false,
    };
  }
}

export default async function DatingHomePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl">
            Earth Optimization Dates
          </h1>
          <p className="mt-4 text-lg font-bold leading-relaxed text-muted-foreground">
            Enable Earth Optimization Dates on your profile, meet someone, and
            make even a bad Earth Optimization Date produce votes.
          </p>
          <Link
            className="mt-6 inline-flex border-2 border-foreground bg-foreground px-4 py-3 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
            href={getSignInPath("/love/dating")}
          >
            Sign in to enable Earth Optimization Dates
          </Link>
        </div>
      </main>
    );
  }

  const { profile, ready } = await loadProfile(userId);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl">
            Earth Optimization Dates
          </h1>
          <p className="mt-4 text-lg font-bold leading-relaxed text-muted-foreground">
            Meet people who want fewer wars, fewer incurable diseases, and
            better first Earth Optimization Dates than "drinks?"
          </p>
        </div>

        {!ready ? (
          <div className="mt-8 border-2 border-foreground p-5">
            <h2 className="text-lg font-black uppercase">
              Earth Optimization Dates are not ready yet
            </h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              Earth Optimization Dates are still being prepared.
            </p>
          </div>
        ) : (
          <div className="mt-6 border-2 border-foreground p-5">
            <h2 className="text-lg font-black uppercase">
              {profile
                ? "Earth Optimization Dates are enabled"
                : "Earth Optimization Dates are off"}
            </h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              {profile
                ? `Current status: ${profile.status.toLowerCase()}.`
                : "Create an Earth Optimization Date profile when you want to be visible to other opted-in humans."}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {DATING_ROUTES.map((route) => (
            <Link
              className="border-2 border-foreground p-5 text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={route.href}
              key={route.href}
            >
              <span className="block text-xl font-black uppercase">
                {route.title}
              </span>
              <span className="mt-2 block text-sm font-bold leading-relaxed text-muted-foreground">
                {route.body}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
