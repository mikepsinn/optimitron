import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileIdentityClient } from "@/components/profile/ProfileIdentityClient";
import { PublicProfileTaskSection } from "@/components/tasks/PublicProfileTaskSection";
import { authOptions } from "@/lib/auth";
import { getUserPersonHref } from "@/lib/person-href";
import { getProfileIdentityData } from "@/lib/profile-identity.server";
import { getSignInPath, profileLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { getPersonTaskProfileData } from "@/lib/tasks.server";

export const metadata = getRouteMetadata(profileLink);

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    redirect(getSignInPath(ROUTES.profile));
  }

  const data = await getProfileIdentityData(userId);

  if (!data) {
    redirect(getSignInPath(ROUTES.profile));
  }

  const publicTaskData = data.user.person
    ? await getPersonTaskProfileData(data.user.person.id, userId)
    : null;
  const availableAuthProviderIds = authOptions.providers.map((provider) => provider.id);
  const publicProfileHref = getUserPersonHref(data.user);

  return (
    <>
      <ProfileIdentityClient
        initialUser={data.user}
        socialAccounts={data.socialAccounts}
        availableAuthProviderIds={availableAuthProviderIds}
        linkedAuthProviderIds={data.linkedAuthProviderIds}
      />
      <div className="mx-auto max-w-4xl px-4 pb-12">
        <PublicProfileTaskSection
          completedTasks={publicTaskData?.verifiedTasks ?? []}
          heading="Your Public Tasks"
          intro="These are the public tasks assigned to your profile. This is the task record other humans can open, share, and push forward."
          openTasks={publicTaskData?.openTasks ?? []}
          ownerName={data.user.name ?? "you"}
          profileHref={publicProfileHref}
        />
      </div>
    </>
  );
}
