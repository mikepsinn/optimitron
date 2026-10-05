"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { storage } from "./storage";

/**
 * Referral links land with ?ref= (plus ?invite= for directed invitations).
 * Save the pair so a visitor who reads other pages before voting or signing
 * still credits the person who sent the link. A newer link replaces both.
 */
export function useReferralAttribution(): {
  referralCode: string | null;
  inviteToken: string | null;
} {
  const searchParams = useSearchParams();
  const urlReferralCode = searchParams?.get("ref") || null;
  const urlInviteToken = searchParams?.get("invite") || null;
  const [referralCode, setReferralCode] = useState(urlReferralCode);
  const [inviteToken, setInviteToken] = useState(urlInviteToken);

  useEffect(() => {
    if (urlReferralCode) {
      storage.setSignupReferral(urlReferralCode);
      if (urlInviteToken) storage.setSignupInviteToken(urlInviteToken);
      else storage.removeSignupInviteToken();
      setReferralCode(urlReferralCode);
      setInviteToken(urlInviteToken);
      return;
    }
    setReferralCode(storage.getSignupReferral());
    setInviteToken(storage.getSignupInviteToken());
  }, [urlReferralCode, urlInviteToken]);

  return { referralCode, inviteToken };
}
