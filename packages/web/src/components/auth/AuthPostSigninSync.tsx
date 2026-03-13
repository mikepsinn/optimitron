"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { API_ROUTES } from "@/lib/api-routes";
import { createLogger } from "@/lib/logger";
import { storage } from "@/lib/storage";

const logger = createLogger("auth-post-signin-sync");

export function AuthPostSigninSync() {
  const { data: session, status } = useSession();
  const [completedUserId, setCompletedUserId] = useState<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (status !== "authenticated" || !userId || completedUserId === userId) {
      return;
    }

    const referralCode = storage.getSignupReferral();
    const name = storage.getSignupName();
    const newsletterSubscribed = storage.getSignupSubscribe();

    if (!referralCode && !name && newsletterSubscribed === null) {
      setCompletedUserId(userId);
      return;
    }

    let cancelled = false;

    void fetch(API_ROUTES.auth.postSignin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referralCode,
        name,
        newsletterSubscribed,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to sync post-sign-in state.");
        }

        storage.clearSignupData();
      })
      .catch((error) => {
        logger.error("Unable to sync post-sign-in state", error);
      })
      .finally(() => {
        if (!cancelled) {
          setCompletedUserId(userId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [completedUserId, session?.user?.id, status]);

  return null;
}
