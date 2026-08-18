import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileHub } from "@/components/profile/ProfileHub";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { authOptions } from "@/lib/auth";
import { getProfilePageData } from "@/lib/profile.server";
import { getSignInPath, censusLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(censusLink);

export default async function CensusPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    redirect(getSignInPath(ROUTES.census));
  }

  const initialData = await getProfilePageData(userId);

  if (!initialData) {
    redirect(getSignInPath(ROUTES.census));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ArcadeTag className="mb-4">Census Data</ArcadeTag>
      <ProfileHub initialData={initialData} />
    </div>
  );
}
