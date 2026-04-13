"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { buildUserReferralUrl } from "@/lib/url";

export interface ReferendumSignatureBoxProps {
  referendumSlug: string;
  title: string;
  authPromptText: string;
  authCallbackUrl?: string;
  referralCode?: string | null;
  storePendingVote: (name: string) => void;
  clearPendingVote: () => void;
  shareText: string;
  emailSubject: string;
  signedTitle?: string;
  signedBody?: string;
}

export function ReferendumSignatureBox({
  referendumSlug,
  title,
  authPromptText,
  authCallbackUrl = "/dashboard",
  referralCode = null,
  storePendingVote,
  clearPendingVote,
  shareText,
  emailSubject,
  signedTitle = "Referendum Signed",
  signedBody = "Share your link. Every signature moves the needle.",
}: ReferendumSignatureBoxProps) {
  const { data: session, status } = useSession();
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralUrl = buildUserReferralUrl(session?.user);

  async function handleSubmit() {
    const name = signatureName.trim();
    if (!name) return;
    setSigning(true);
    setError(null);

    storePendingVote(name);

    if (status === "authenticated") {
      try {
        const response = await fetch(
          `/api/referendums/${referendumSlug}/vote`,
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
        clearPendingVote();
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
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        <p className="text-center text-2xl font-black uppercase text-white [font-family:var(--v0-font-libre-baskerville)]">
          {signedTitle}
        </p>
        <p className="text-center text-base font-bold text-white/70 [font-family:var(--v0-font-libre-baskerville)]">
          {signedBody}
        </p>
        <ShareLinkButtons
          label="Share Your Signature"
          shareText={shareText}
          url={referralUrl}
          emailSubject={emailSubject}
        />
        <p className="break-all text-xs font-bold text-white/40">
          Personal referral link: {referralUrl}
        </p>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-xl font-black uppercase text-white [font-family:var(--v0-font-libre-baskerville)]">
          Your signature has been recorded.
        </p>
        <p className="mb-6 text-sm font-bold text-white/60 [font-family:var(--v0-font-libre-baskerville)]">
          {authPromptText}
        </p>
        <AuthForm
          callbackUrl={authCallbackUrl}
          referralCode={referralCode}
          compact
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-6 text-center text-xl font-bold text-white [font-family:var(--v0-font-libre-baskerville)]">
        {title}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={signatureName}
          onChange={(e) => setSignatureName(e.target.value)}
          placeholder="Your name"
          className="flex-1 border-2 border-white/30 bg-white/10 px-4 py-3 text-lg font-bold text-white placeholder:text-white/30"
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
          className="border-2 border-white/30 bg-white/10 px-8 py-3 text-lg font-black uppercase text-white disabled:opacity-30"
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
