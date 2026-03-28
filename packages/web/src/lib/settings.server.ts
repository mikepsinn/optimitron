import { prisma } from "@/lib/prisma";
import type { DashboardNotificationPreference } from "@/types/dashboard";

export interface SettingsData {
  notificationPreferences: DashboardNotificationPreference[];
}

export async function getSettingsData(
  userId: string,
): Promise<SettingsData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      notificationPreferences: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    notificationPreferences: user.notificationPreferences.map((pref) => ({
      type: pref.type,
      channel: pref.channel,
      enabled: pref.enabled,
    })),
  };
}
