import { prisma } from "@/lib/prisma";
import { isEmailScope } from "@/lib/email/scopes";
import type { EmailPreferencesState } from "@/types/settings";
import type { DashboardNotificationPreference } from "@/types/dashboard";

export interface SettingsData {
  emailPreferences: EmailPreferencesState;
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
    emailPreferences: {
      newsletterSubscribed: user.newsletterSubscribed,
      unsubscribedScopes: user.unsubscribedScopes.filter(isEmailScope),
    },
    notificationPreferences: user.notificationPreferences.map((pref) => ({
      type: pref.type,
      channel: pref.channel,
      enabled: pref.enabled,
    })),
  };
}
