import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AlignmentReport } from "@/components/alignment/AlignmentReport";
import { authOptions } from "@/lib/auth";
import { getPersonalAlignmentState } from "@/lib/alignment-report.server";
import { getSignInPath, ROUTES } from "@/lib/routes";
import { buildUserAlignmentUrl, getBaseUrl } from "@/lib/url";

export const metadata = {
  title: "Alignment Report | Optomitron",
  description:
    "See which politicians match your priorities with Optomitron, the Earth Optimization Machine.",
};

export default async function AlignmentPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    redirect(getSignInPath(ROUTES.alignment));
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
