import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { getRouteMetadata } from "@/lib/metadata";
import { voteLink } from "@/lib/routes";

export const metadata = getRouteMetadata(voteLink);

export default function VotePage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#fbf7ee]">
      <section id="vote" className="min-h-screen bg-[#fbf7ee]">
        <TreatyVoteFlow />
      </section>
    </div>
  );
}
