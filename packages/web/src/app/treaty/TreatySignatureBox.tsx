"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { BrutalCard } from "@/components/ui/brutal-card";
import { storage } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildUserReferralUrl } from "@/lib/url";

interface TreatySignatureBoxProps {
  alreadySigned: boolean;
  referralCode?: string | null;
}

export function TreatySignatureBox({
  alreadySigned,
  referralCode = null,
}: TreatySignatureBoxProps) {
  const { data: session, status } = useSession();
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(alreadySigned);
  const [error, setError] = useState<string | null>(null);

  const referralUrl = buildUserReferralUrl(session?.user);
  const shareText =
    "I just signed the 1% Treaty to redirect 1% of military spending to curing disease. Sign it too:";

  async function handleSubmit() {
    const name = signatureName.trim();
    if (!name) return;
    setSigning(true);
    setError(null);

    storage.setPendingTreatyVote({
      answer: "YES",
      referredBy: referralCode,
      timestamp: new Date().toISOString(),
      organizationId: null,
    });

    if (status === "authenticated") {
      try {
        const response = await fetch(
          `/api/referendums/${TREATY_REFERENDUM_SLUG}/vote`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answer: "YES",
              ref: referralCode ?? undefined,
            }),
          },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Failed to record signature.");
        }
        storage.removePendingTreatyVote();
      } catch (signError) {
        setError(
          signError instanceof Error
            ? signError.message
            : "Failed to sign. Try again.",
        );
        setSigning(false);
        return;
      }
    }

    setSigning(false);
    setSigned(true);
  }

  if (signed && status === "authenticated") {
    return (
      <div className="flex flex-col items-center gap-6">
        <BrutalCard bgColor="green" padding="lg" shadowSize={8}>
          <div className="space-y-2 text-center">
            <p className="text-2xl font-black uppercase">Treaty Signed</p>
            <p className="text-sm font-bold">
              Your signature is recorded. Share your link to bring in more
              signatures and pressure leaders to follow.
            </p>
          </div>
        </BrutalCard>

        <ShareLinkButtons
          label="Share Your Signature"
          shareText={shareText}
          url={referralUrl}
          emailSubject="I signed the 1% Treaty"
        />

        <p className="break-all text-xs font-bold text-muted-foreground">
          Personal referral link: {referralUrl}
        </p>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-xl font-black uppercase">
          Your signature has been recorded.
        </p>
        <p className="mb-6 text-sm font-bold text-muted-foreground">
          Verify your identity to become an official signatory of the 1% Treaty.
        </p>
        <AuthForm callbackUrl="/treaty" referralCode={referralCode} compact />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={signatureName}
          onChange={(e) => setSignatureName(e.target.value)}
          placeholder="Your name"
          className="flex-1 border-2 border-primary px-4 py-3 text-lg font-bold"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && signatureName.trim()) {
              void handleSubmit();
            }
          }}
        />
        <Button
          onClick={() => void handleSubmit()}
          disabled={!signatureName.trim() || signing}
          className="border-4 border-primary bg-brutal-green px-8 py-3 text-lg font-black uppercase text-brutal-green-foreground disabled:opacity-40"
        >
          {signing ? "..." : "Sign"}
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-center text-xs font-bold uppercase text-brutal-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
