import Link from "next/link";
import { getServerSession } from "next-auth";
import { shareableSnippets } from "@optimitron/data/parameters";
import { TreatySignButton } from "./TreatySignButton";
import { LegislationMarkdown } from "@/components/legislation/LegislationMarkdown";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { Button } from "@/components/retroui/Button";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { treatyLink, getSignInPath, ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { getTreatyParentTaskHref } from "@/lib/tasks/task-keys";
import { getTreatyBlockerTasks } from "@/lib/tasks.server";

export const metadata = getRouteMetadata(treatyLink);

interface TreatyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TreatyPage({ searchParams }: TreatyPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const referralCode = typeof params.ref === "string" ? params.ref : null;
  const signInHref = getSignInPath(ROUTES.treaty, {
    referralCode,
  });

  let alreadySigned = false;
  if (session?.user?.id) {
    const existingVote = await prisma.referendumVote.findFirst({
      where: {
        deletedAt: null,
        userId: session.user.id,
        referendum: { slug: TREATY_REFERENDUM_SLUG },
      },
      select: { id: true },
    });
    alreadySigned = existingVote != null;
  }

  const totalSignedResult = await prisma.referendumVote.count({
    where: {
      deletedAt: null,
      referendum: { slug: TREATY_REFERENDUM_SLUG },
      answer: "YES",
    },
  });
  const blockerTasks = await getTreatyBlockerTasks(session?.user?.id ?? null, 12);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Sign the 1% Treaty
          </h1>
          <p className="text-base font-bold text-muted-foreground">
            Every signatory nation redirects 1% of its military budget to pragmatic
            clinical trials. The balance of power stays identical — you just stop
            spending quite so much on destroying a planet you are still living on.
          </p>
          <p className="text-sm font-bold text-muted-foreground">
            <span className="text-foreground">{totalSignedResult.toLocaleString()}</span>{" "}
            signatures recorded so far.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold uppercase tracking-wide">Treaty</h2>
          <LegislationMarkdown markdown={shareableSnippets.onePercentTreatyText.markdown} />
        </section>

        <section className="space-y-4 border-2 border-primary bg-muted/30 p-6">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-bold uppercase tracking-wide">Sign Below</h2>
            <p className="text-sm font-bold text-muted-foreground">
              Read it. If you agree, sign it. Then go tell the employees still blocking it to finish their 30-second job.
            </p>
          </div>

          {!session ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-bold">
                Sign in to add your signature.
              </p>
              <Button asChild className="font-bold uppercase">
                <Link href={signInHref}>Sign In</Link>
              </Button>
            </div>
          ) : (
            <TreatySignButton
              alreadySigned={alreadySigned}
              referralCode={referralCode}
            />
          )}

          <div className="text-center">
            <Link className="text-sm font-bold underline underline-offset-4" href={getTreatyParentTaskHref()}>
              Open the full blocker map.
            </Link>
          </div>
        </section>

        {blockerTasks.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Outstanding Employee Blockers
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
              These are the biggest current blockers. Pick one and tell your employee to stop wasting public money on weapons and finish the overdue task.
            </p>
            <SortableTaskList tasks={blockerTasks} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
