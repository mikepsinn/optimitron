import type { Metadata } from "next";
import Link from "next/link";
import { GLOBAL_DISEASE_DEATHS_DAILY } from "@optimitron/data/parameters";
import Layout from "@/components/layout";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { getSessionUserId } from "@/lib/auth-utils";
import { OPTIMITRON_LINKS, optimitronUrl } from "@/lib/optimitron-links";
import { ROUTES } from "@/lib/routes";
import { MissionSafetyNotice } from "./mission-safety-notice";
import { getOwnMissionProfileStatus } from "./missions.server";

export const metadata: Metadata = {
  title: "Earth Optimization Missions",
  description:
    "Find someone you would not mind ending war and disease with. Spend one useful hour optimizing Earth together. Love may occur. Flyers should occur first.",
};

export const dynamic = "force-dynamic";

/**
 * Mission profiles, discovery, and messaging stay on optimitron.com — this page
 * is the campaign-side front door for them, so the three action cards and the
 * sign-in target point back across the domain boundary.
 */
const MISSION_PEOPLE_URL = optimitronUrl("/people?missions=1");

const MISSION_ACTIONS = [
  {
    href: OPTIMITRON_LINKS.profileMissions.url,
    title: "Turn on missions",
    body: "Say what kind of human should find you, and which useful hour would not make you flee.",
  },
  {
    href: MISSION_PEOPLE_URL,
    title: "Find mission people",
    body: "Filter people who turned on missions. Like, pass, or send one actual sentence before the species collapses.",
  },
  {
    href: OPTIMITRON_LINKS.messages.url,
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

async function loadProfileStatus(userId: string) {
  try {
    return {
      ready: true,
      status: await getOwnMissionProfileStatus(userId),
    };
  } catch {
    return {
      ready: false,
      status: null,
    };
  }
}

export default async function MissionsPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <Layout>
        <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
          <MissionLanding signedIn={false} />
        </main>
      </Layout>
    );
  }

  const { ready, status } = await loadProfileStatus(userId);

  return (
    <Layout>
      <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
        <MissionLanding
          profileStatus={
            !ready
              ? "unavailable"
              : status
                ? status.toLowerCase()
                : "off"
          }
          signedIn
        />
      </main>
    </Layout>
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
            {signedIn ? (
              <a
                className="inline-flex min-h-12 items-center justify-center border-2 border-foreground bg-foreground px-5 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
                href={OPTIMITRON_LINKS.profileMissions.url}
              >
                Turn on missions
              </a>
            ) : (
              <Link
                className="inline-flex min-h-12 items-center justify-center border-2 border-foreground bg-foreground px-5 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
                href={`${ROUTES.signIn}?callbackUrl=${encodeURIComponent(ROUTES.missions)}`}
              >
                Sign in to start
              </Link>
            )}
            <a
              className="inline-flex min-h-12 items-center justify-center border-2 border-foreground bg-background px-5 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={MISSION_PEOPLE_URL}
            >
              Find mission people
            </a>
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
                    ? "Off. Turn on missions and other humans can find you."
                    : profileStatus === "unavailable"
                      ? "Not ready yet. Try again in a moment."
                      : `Current status: ${profileStatus}.`}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {MISSION_ACTIONS.map((route) => (
          <a
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
          </a>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-black uppercase leading-none">
          Good missions
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MISSION_EXAMPLES.map((example) => (
            <a
              className="border-2 border-foreground p-5 text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={MISSION_PEOPLE_URL}
              key={example.title}
            >
              <span className="block text-xl font-black uppercase">
                {example.title}
              </span>
              <span className="mt-2 block text-sm font-bold leading-relaxed text-muted-foreground">
                {example.body}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
