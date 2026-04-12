import Link from "next/link";
import { getServerSession } from "next-auth";
import { shareableSnippets } from "@optimitron/data/parameters";
import { TreatySignButton } from "./TreatySignButton";
import { LegislationMarkdown } from "@/components/legislation/LegislationMarkdown";
import { Button } from "@/components/retroui/Button";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { treatyLink, getSignInPath, ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import { TREATY_REFERENDUM_SLUG } from "@optimitron/db";

export const metadata = getRouteMetadata(treatyLink);

export default async function TreatyPage() {
  const session = await getServerSession(authOptions);
  const signInHref = getSignInPath(ROUTES.treaty);

  let alreadySigned = false;
  if (session?.user?.id) {
    const existingVote = await prisma.referendumVote.findFirst({
      where: {
        userId: session.user.id,
        referendum: { slug: TREATY_REFERENDUM_SLUG },
      },
      select: { id: true },
    });
    alreadySigned = existingVote != null;
  }

  const totalSignedResult = await prisma.referendumVote.count({
    where: {
      referendum: { slug: TREATY_REFERENDUM_SLUG },
      answer: "YES",
    },
  });

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
            verified supporters so far.
          </p>
        </header>

        {/* Sign — right here, top of page */}
        <section className="border-2 border-primary bg-muted/30 p-6">
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
            <TreatySignButton alreadySigned={alreadySigned} />
          )}
        </section>

        {/* Treaty text */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold uppercase tracking-wide">Treaty Text</h2>
          <LegislationMarkdown markdown={shareableSnippets.onePercentTreatyText.markdown} />
        </section>

        {/* Links out */}
        <section className="flex flex-wrap items-center gap-4 border-t-2 border-primary pt-6 text-sm font-bold">
          <Link className="underline underline-offset-4" href="/tasks/1-pct-treaty">
            View the full treaty task
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link className="underline underline-offset-4" href={ROUTES.prize}>
            Fund the campaign
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link className="underline underline-offset-4" href={ROUTES.dashboard}>
            Your dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}
