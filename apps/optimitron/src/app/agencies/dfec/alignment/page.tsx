import Link from "next/link";
import { getServerSession } from "next-auth";
import { AlignmentReport } from "@/components/alignment/AlignmentReport";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { authOptions } from "@/lib/auth";
import { getPersonalAlignmentState } from "@/lib/alignment-report.server";
import { alignmentLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { buildUserAlignmentUrl, getBaseUrl } from "@/lib/url";
import { getUserDisplayLabel } from "@/lib/user-display";

export const metadata = getRouteMetadata(alignmentLink);

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
          className="inline-flex items-center justify-center border-4 border-primary bg-background px-8 py-3 text-lg font-black uppercase text-foreground shadow-none transition-colors hover:bg-foreground hover:text-background"
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
        ownerLabel={getUserDisplayLabel(user)}
      />
    </div>
  );
}
