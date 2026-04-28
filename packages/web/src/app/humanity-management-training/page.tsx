import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TaskStatus } from "@optimitron/db";
import { HumanityManagementTrainingFlow } from "@/components/landing/HumanityManagementTrainingFlow";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import {
  getSignInPath,
  humanityManagementTrainingLink,
  ROUTES,
} from "@/lib/routes";
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";

export const metadata = getRouteMetadata(humanityManagementTrainingLink);

export default async function HumanityManagementTrainingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect(getSignInPath(ROUTES.humanityManagementTraining));
  }

  const treatyTask = await ensureUserTreatyTask({
    personId: session.user.personId ?? null,
    userId: session.user.id,
  });
  const referralUser = {
    name: session.user.name ?? null,
    referralCode: session.user.referralCode ?? null,
    username: session.user.username ?? null,
  };
  const initialCompletedContactCount = [
    treatyTask.subtaskStatuses.assignFirstHuman,
    treatyTask.subtaskStatuses.assignSecondHuman,
  ].filter((status) => status === TaskStatus.VERIFIED).length;

  return (
    <div className="min-h-screen bg-[#fbf7ee]">
      <HumanityManagementTrainingFlow
        initialCompletedContactCount={initialCompletedContactCount}
        initialShareCompleted={
          treatyTask.subtaskStatuses.shareReferralUrl === TaskStatus.VERIFIED
        }
        initialTrainingCompleted={
          treatyTask.subtaskStatuses.completeTraining === TaskStatus.VERIFIED
        }
        referralUrl={buildUserReferralUrl(referralUser, getBaseUrl())}
        referralUser={referralUser}
        shareReferralTaskId={treatyTask.subtaskIds.shareReferralUrl}
      />
    </div>
  );
}
