"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { buildUserReferralUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

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
  variant?: "stepper" | "reader";
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
  variant = "stepper",
}: ReferendumSignatureBoxProps) {
  const { data: session, status } = useSession();
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralUrl = buildUserReferralUrl(session?.user);
  const isReader = variant === "reader";
  const shellClass = isReader
    ? "rounded-[24px] border border-[#8e6b48]/25 bg-[#f7f1e4]/88 px-6 py-6 shadow-[0_12px_24px_rgba(58,42,25,0.08)]"
    : "";
  const titleClass = isReader
    ? "text-[#23180d]"
    : "text-white";
  const bodyClass = isReader
    ? "text-[#5f4830]"
    : "text-white/70";
  const referralLinkClass = isReader
    ? "text-[#6b5337]"
    : "text-white/40";
  const inputClass = isReader
    ? "flex-1 border-2 border-[#8e6b48]/35 bg-[#fffaf0] px-4 py-3 text-lg font-bold text-[#23180d] placeholder:text-[#8e6b48]/55"
    : "flex-1 border-2 border-white/30 bg-white/10 px-4 py-3 text-lg font-bold text-white placeholder:text-white/30";
  const buttonClass = isReader
    ? "border-2 border-[#8e6b48]/35 bg-[#23180d] px-8 py-3 text-lg font-black uppercase text-[#f7f1e4] hover:bg-[#3a2a19] disabled:opacity-30"
    : "border-2 border-white/30 bg-white/10 px-8 py-3 text-lg font-black uppercase text-white disabled:opacity-30";
  const shareLabelClass = isReader
    ? "text-[#6b5337]"
    : "text-brutal-pink";
  const errorClass = isReader
    ? "text-[#b42318]"
    : "text-brutal-red";

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
      <div className={cn("mx-auto flex max-w-md flex-col items-center gap-6", shellClass)}>
        <p className={cn("text-center text-2xl font-black uppercase [font-family:var(--v0-font-libre-baskerville)]", titleClass)}>
          {signedTitle}
        </p>
        <p className={cn("text-center text-base font-bold [font-family:var(--v0-font-libre-baskerville)]", bodyClass)}>
          {signedBody}
        </p>
        <ShareLinkButtons
          label="Share Your Signature"
          shareText={shareText}
          url={referralUrl}
          emailSubject={emailSubject}
          labelClassName={shareLabelClass}
        />
        <p className={cn("break-all text-xs font-bold", referralLinkClass)}>
          Personal referral link: {referralUrl}
        </p>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="mx-auto max-w-md">
        <AuthForm
          callbackUrl={authCallbackUrl}
          referralCode={referralCode}
          compact
          variant={isReader ? "document" : "default"}
          title="Finish Signing"
          subtitle={authPromptText}
          googleButtonLabel="Finish with Google"
          emailButtonLabel="Email Me a Link to Finish Signing"
          emailPendingButtonLabel="Sending Finish-Signing Link..."
        />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const resolvedTitle = title.replace("{date}", today);

  return (
    <div className={cn("mx-auto w-full max-w-md", shellClass)}>
      <p className={cn("mb-6 text-center text-xl font-bold [font-family:var(--v0-font-libre-baskerville)]", titleClass)}>
        {resolvedTitle}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={signatureName}
          onChange={(e) => setSignatureName(e.target.value)}
          placeholder="Your name"
          className={inputClass}
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
          className={buttonClass}
        >
          {signing ? "..." : "Sign"}
        </Button>
      </div>
      {error ? (
        <p className={cn("mt-3 text-center text-xs font-bold uppercase", errorClass)}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
