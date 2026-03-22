import Link from "next/link";
import { getServerSession } from "next-auth";
import { AlignmentReport } from "@/components/alignment/AlignmentReport";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { authOptions } from "@/lib/auth";
import { getPersonalAlignmentState } from "@/lib/alignment-report.server";
import { getSignInPath, ROUTES } from "@/lib/routes";
import { buildUserAlignmentUrl, getBaseUrl } from "@/lib/url";

export const metadata = {
  title: "Alignment Report | Optimitron",
  description:
    "Find out which politicians actually vote the way you'd want. Most people are surprised. Not pleasantly.",
};

export default async function AlignmentPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <ArcadeTag className="mb-3">Boss Fight</ArcadeTag>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-4">
          Which Politicians Match Your Priorities?
        </h1>
        <p className="text-lg text-foreground font-bold mb-8 max-w-xl mx-auto">
          Tell me what you&apos;d spend money on. I&apos;ll check whether your
          elected officials have ever agreed with you. It takes two minutes
          and the results are usually disappointing.
        </p>
        <Link
          href={getSignInPath(ROUTES.alignment)}
          className="inline-flex items-center justify-center border-4 border-primary bg-brutal-cyan px-8 py-3 text-lg font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          Sign In to Check Alignment
        </Link>
      </div>
    );
  }

  const state = await getPersonalAlignmentState(user.id);
  const shareUrl = buildUserAlignmentUrl(user, getBaseUrl());

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AlignmentReport
        state={state}
        shareUrl={shareUrl}
        ownerLabel={user.username ? `@${user.username}` : user.name ?? null}
      />
    </div>
  );
}
