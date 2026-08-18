import type { EmailScope } from "@/lib/email/scopes";

export interface EmailPreferencesState {
  newsletterSubscribed: boolean;
  unsubscribedScopes: EmailScope[];
}
