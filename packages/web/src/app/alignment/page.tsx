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
    "Compare your saved budget priorities against real federal benchmark politician profiles.",
};

export default async function AlignmentPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const userId = user?.id;

  if (!userId || !user) {
    redirect(getSignInPath(ROUTES.alignment));
  }

  const state = await getPersonalAlignmentState(userId);
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
