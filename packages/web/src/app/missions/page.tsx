import Link from "next/link";
import { getServerSession } from "next-auth";
import { GLOBAL_DISEASE_DEATHS_DAILY } from "@optimitron/data/parameters";
import { MissionSafetyNotice } from "@/components/missions/MissionSafetyNotice";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { authOptions } from "@/lib/auth";
import { getOwnDatingProfile } from "@/lib/dating.server";
import { getRouteMetadata } from "@/lib/metadata";
import { getSignInPath, missionsLink, ROUTES } from "@/lib/routes";

export const metadata = getRouteMetadata(missionsLink);

const MISSION_ACTIONS = [
  {
    href: `${ROUTES.profile}#missions`,
    title: "Turn on missions",
    body: "Use your profile to say what kind of human should find you and what useful hour would not make you flee.",
  },
  {
    href: `${ROUTES.people}?missions=1`,
    title: "Find mission people",
    body: "Filter people who turned on missions. Like, pass, or send one actual sentence before the species collapses.",
  },
  {
    href: ROUTES.messages,
    title: "Open messages",
    body: "Talk to mutual matches and propose a useful campaign session. No money requests. More posters.",
  },
] as const;

const MISSION_EXAMPLES = [
  {
    title: "Coffee plus QR flyers",
    body: "Acquire caffeine. Tape up evidence that your species can still coordinate.",
  },
  {
    title: "Walk plus two votes",
    body: "Walk outside briefly. Text two humans the treaty vote before returning indoors.",
  },
  {
    title: "Video call plus task",
    body: "Pick one open task, do the first useful step, and leave a comment so the next human can continue.",
  },
  {
    title: "Museum plus posters",
    body: "Look at civilization. Then help keep it from becoming a cautionary exhibit.",
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

export default async function MissionsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
        <MissionLanding signedIn={false} />
      </main>
    );
  }

  const { profile, ready } = await loadProfile(userId);
  const hasActiveProfile = profile?.status === "ACTIVE";

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <MissionLanding
        profileStatus={
          !ready
            ? "unavailable"
            : hasActiveProfile
              ? "active"
              : profile
                ? profile.status.toLowerCase()
                : "off"
        }
        signedIn
      />
    </main>
  );
}

function MissionLanding({
  profileStatus,
  signedIn,
}: {
  profileStatus?: string;
  signedIn: boolean;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.7fr)] lg:items-start">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Earth Optimization Missions
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase leading-none sm:text-7xl">
            Find someone you would not mind saving the world with.
          </h1>
          <p className="mt-5 text-xl font-bold leading-9 text-muted-foreground">
            Spend one hour with a human you like. Figure out one useful thing to
            do for the campaign. Do it together. Have fun. Fall madly in love if
            you insist.
          </p>
          <p className="mt-4 text-base font-bold leading-7 text-muted-foreground">
            Disease kills about{" "}
            <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} /> humans a day.
            Love may reduce the urge to explode people and increase the urge to
            cure them. The scheduled activity is still optimizing Earth.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center border-2 border-foreground bg-foreground px-5 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
              href={
                signedIn
                  ? `${ROUTES.profile}#missions`
                  : getSignInPath(ROUTES.missions)
              }
            >
              {signedIn ? "Turn on missions" : "Sign in to start"}
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center border-2 border-foreground bg-background px-5 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={`${ROUTES.people}?missions=1`}
            >
              Find mission people
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <MissionSafetyNotice compact />
          {profileStatus ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">Mission status</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                {profileStatus === "active"
                  ? "Active. Other opted-in humans can find you."
                  : profileStatus === "off"
                    ? "Off. Use your profile when you want to be findable."
                    : profileStatus === "unavailable"
                      ? "Not ready yet."
                      : `Current status: ${profileStatus}.`}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {MISSION_ACTIONS.map((route) => (
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
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-black uppercase leading-none">
          Good missions
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MISSION_EXAMPLES.map((example) => (
            <Link
              className="border-2 border-foreground p-5 text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={`${ROUTES.people}?missions=1`}
              key={example.title}
            >
              <span className="block text-xl font-black uppercase">
                {example.title}
              </span>
              <span className="mt-2 block text-sm font-bold leading-relaxed text-muted-foreground">
                {example.body}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
