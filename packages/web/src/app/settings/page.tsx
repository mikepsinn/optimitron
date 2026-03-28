import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { authOptions } from "@/lib/auth";
import { getSettingsData } from "@/lib/settings.server";
import { getSignInPath, settingsLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(settingsLink);

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    redirect(getSignInPath(ROUTES.settings));
  }

  const data = await getSettingsData(userId);

  if (!data) {
    redirect(getSignInPath(ROUTES.settings));
  }

  return (
    <SettingsClient notificationPreferences={data.notificationPreferences} />
  );
}
