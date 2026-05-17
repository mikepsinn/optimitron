import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { JsonLdScript } from "@/components/site/JsonLdScript";
import { authOptions } from "@/lib/auth";
import { buildVoteStructuredData } from "@/lib/campaign-structured-data";
import { getRouteMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { ROUTES, voteLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export const metadata = getRouteMetadata(voteLink);

export default async function VotePage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  // Mirror the home page's already-voted guard at app/page.tsx:48-66.
  // A signed-in user who already voted on the primary referendum gets
  // redirected to /dashboard so they don't re-render the slider they
  // already filled out. Vote upserts are idempotent (no data harm if
  // they re-submit), but the dashboard is the right post-vote
  // experience.
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  if (userId) {
    if (site.primaryReferendumSlug) {
      const existingVote = await prisma.referendumVote.findFirst({
        where: {
          userId,
          referendum: { slug: site.primaryReferendumSlug },
          deletedAt: null,
        },
        select: { id: true },
      });
      if (existingVote) {
        redirect(ROUTES.dashboard);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--treaty-paper)]">
      <JsonLdScript data={buildVoteStructuredData(site)} />
      <section id="vote" className="min-h-screen bg-[var(--treaty-paper)]">
        <TreatyVoteFlow
          authCallbackUrl={ROUTES.dashboard}
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          postVoteBehavior="redirect"
          postVoteRedirectUrl={ROUTES.dashboard}
          respectStoredFlowVariant={false}
          surface="fast_vote_page"
        />
      </section>
    </div>
  );
}
