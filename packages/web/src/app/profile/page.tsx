import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { OpenTaskRequestAction } from "@/components/people/OpenTaskRequestAction";
import { ProfileIdentityClient } from "@/components/profile/ProfileIdentityClient";
import { PublicProfileTaskSection } from "@/components/tasks/PublicProfileTaskSection";
import { authOptions } from "@/lib/auth";
import { getUserPersonHref } from "@/lib/person-href";
import { getProfileIdentityData } from "@/lib/profile-identity.server";
import { getSignInPath, editProfileLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { getPersonTaskProfileData } from "@/lib/tasks.server";
import { getUserDisplayName } from "@/lib/user-display";

export const metadata = getRouteMetadata(editProfileLink);

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
          assignedByTasks={publicTaskData?.assignedByOpenTasks ?? []}
          completedTasks={publicTaskData?.completedTasks ?? []}
          heading="Your Public Tasks"
          intro="This is how other humans help you find and complete the highest-value actions to end war and disease."
          openTasks={publicTaskData?.openTasks ?? []}
          ownerName={getUserDisplayName(data.user)}
          profileHref={publicProfileHref}
          requestAction={
            publicProfileHref ? (
              <OpenTaskRequestAction
                buttonLabel="Ask for help"
                callbackUrl={ROUTES.profile}
                isAuthenticated={Boolean(userId)}
                signInHref={getSignInPath(ROUTES.profile)}
              />
            ) : null
          }
          requestedTasks={publicTaskData?.requestedOpenTasks ?? []}
        />
      </div>
    </>
  );
}
