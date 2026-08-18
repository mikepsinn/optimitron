"use client";

import { useEffect } from "react";
import { storage } from "@/lib/storage";

/**
 * Captures the FIRST URL the user lands on into localStorage so we can
 * record it as `User.signupLandingUrl` at first signin (for UTM /
 * referral / campaign attribution forensics).
 *
 * Idempotent on re-renders and re-mounts: `setSignupLandingUrlIfMissing`
 * never overwrites a previously-stored URL. The stored value survives the
 * magic-link round-trip because localStorage persists across navigations.
 *
 * Mounted once in `Providers` so every initial page load runs it.
 */
export function SignupLandingUrlCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    storage.setSignupLandingUrlIfMissing(window.location.href);
  }, []);

  return null;
}
