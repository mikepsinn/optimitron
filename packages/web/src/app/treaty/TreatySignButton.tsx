"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { Button } from "@/components/retroui/Button";
import { BrutalCard } from "@/components/ui/brutal-card";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildUserReferralUrl } from "@/lib/url";

interface TreatySignButtonProps {
  alreadySigned: boolean;
}

export function TreatySignButton({ alreadySigned }: TreatySignButtonProps) {
  const { data: session } = useSession();
  const [state, setState] = useState<"unsigned" | "signing" | "signed">(
    alreadySigned ? "signed" : "unsigned",
  );
  const [error, setError] = useState<string | null>(null);

  const referralUrl = buildUserReferralUrl(session?.user);
  const shareText =
    "I just signed the 1% Treaty to redirect 1% of military spending to curing disease. Sign it too:";

  async function handleSign() {
    setState("signing");
    setError(null);

    try {
      const response = await fetch(`/api/referendums/${TREATY_REFERENDUM_SLUG}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "YES" }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to record signature.");
      }

      setState("signed");
    } catch (signError) {
      setError(signError instanceof Error ? signError.message : "Failed to sign. Try again.");
      setState("unsigned");
    }
  }

  if (state === "signed") {
    return (
      <div className="flex flex-col items-center gap-6">
        <BrutalCard bgColor="green" padding="lg" shadowSize={8}>
          <div className="space-y-2 text-center">
            <p className="text-2xl font-black uppercase">Treaty Signed</p>
            <p className="text-sm font-bold">
              Your signature is recorded. Now share from your official social media account to verify
              your identity and pressure other leaders to follow.
            </p>
          </div>
        </BrutalCard>

        <ShareLinkButtons
          label="Share Your Signature"
          shareText={shareText}
          url={referralUrl}
          emailSubject="I signed the 1% Treaty"
        />

        <p className="text-xs font-bold text-muted-foreground">
          Your referral link: {referralUrl}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-bold">
        Signed in as {session?.user?.email ?? session?.user?.name ?? "unknown"}.
      </p>
      <Button
        className="border-4 border-primary bg-brutal-green px-8 py-3 text-lg font-black uppercase text-brutal-green-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        disabled={state === "signing"}
        onClick={() => void handleSign()}
      >
        {state === "signing" ? "Signing..." : "Sign The Treaty"}
      </Button>
      {error ? (
        <p className="text-xs font-bold uppercase text-brutal-red">{error}</p>
      ) : null}
    </div>
  );
}
