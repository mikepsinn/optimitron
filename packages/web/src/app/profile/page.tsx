import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileIdentityClient } from "@/components/profile/ProfileIdentityClient";
import { authOptions } from "@/lib/auth";
import { getProfileIdentityData } from "@/lib/profile-identity.server";
import { getSignInPath, profileLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

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

  const availableAuthProviderIds = authOptions.providers.map((provider) => provider.id);

  return (
    <ProfileIdentityClient
      initialUser={data.user}
      socialAccounts={data.socialAccounts}
      availableAuthProviderIds={availableAuthProviderIds}
      linkedAuthProviderIds={data.linkedAuthProviderIds}
    />
  );
}
