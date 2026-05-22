import Link from "next/link";
import { getServerSession } from "next-auth";
import { DatingSafetyNotice } from "@/app/missions/dating-safety-notice";
import { authOptions } from "@/lib/auth";
import { getOwnDatingProfile } from "@/lib/dating.server";
import { getRouteMetadata } from "@/lib/metadata";
import { getSignInPath, missionsLink } from "@/lib/routes";

export const metadata = getRouteMetadata(missionsLink);

const DATING_ROUTES = [
  {
    href: "/missions/profile",
    title: "Mission profile",
    body: "Opt in, add photos, confirm the safety rules, and say what kind of useful Earth Optimization Mission would not make you flee.",
  },
  {
    href: "/missions/questions",
    title: "Questions",
    body: "Answer compatibility questions with the answers you accept from someone else.",
  },
  {
    href: "/missions/discover",
    title: "Discover",
    body: "Like, pass, or send one actual sentence before the species collapses.",
  },
  {
    href: "/missions/matches",
    title: "Matches",
    body: "Message mutual matches and propose Earth Optimization Missions that can also produce votes.",
  },
  {
    href: "/missions/messages",
    title: "Messages",
    body: "Open conversations with mutual matches. No money requests. No weird pressure. More posters.",
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
            Earth Optimization Missions
          </h1>
          <p className="mt-4 text-lg font-bold leading-relaxed text-muted-foreground">
            Enable Earth Optimization Missions on your profile, meet someone,
            and make even a bad Earth Optimization Mission produce votes.
          </p>
          <Link
            className="mt-6 inline-flex border-2 border-foreground bg-foreground px-4 py-3 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
            href={getSignInPath("/missions")}
          >
            Sign in to start a mission
          </Link>
        </div>
      </main>
    );
  }

  const { profile, ready } = await loadProfile(userId);
  const hasActiveProfile = profile?.status === "ACTIVE";

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl">
            Earth Optimization Missions
          </h1>
          <p className="mt-4 text-lg font-bold leading-relaxed text-muted-foreground">
            Meet people who want fewer wars, fewer incurable diseases, and
            better first Earth Optimization Missions than "drinks?"
          </p>
        </div>
        <div className="mt-6">
          <DatingSafetyNotice />
        </div>

        {!ready ? (
          <div className="mt-8 border-2 border-foreground p-5">
            <h2 className="text-lg font-black uppercase">
              Earth Optimization Missions are not ready yet
            </h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              Earth Optimization Missions are still being prepared.
            </p>
          </div>
        ) : (
          <div className="mt-6 border-2 border-foreground p-5">
            <h2 className="text-lg font-black uppercase">
              {hasActiveProfile
                ? "Earth Optimization Missions are enabled"
                : profile
                  ? "Earth Optimization Missions are not active"
                  : "Earth Optimization Missions are off"}
            </h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              {profile
                ? `Current status: ${profile.status.toLowerCase()}.`
                : "Create a mission profile when you want to be visible to other opted-in humans."}
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
