import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCheckInPageData } from "@/lib/profile.server";
import { checkInLink, getSignInPath, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { CheckInPageClient } from "@/components/check-in/CheckInPageClient";

export const metadata = getRouteMetadata(checkInLink);

export default async function CheckInPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    redirect(getSignInPath(ROUTES.checkIn));
  }

  const initialData = await getCheckInPageData(userId);

  if (!initialData) {
    redirect(getSignInPath(ROUTES.checkIn));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <CheckInPageClient initialData={initialData} />
    </div>
  );
}
