"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/retroui/Button";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { ROUTES } from "@/lib/routes";
import { buildUserReferralUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

export interface ReferendumSignatureBoxProps {
  referendumSlug: string;
  title: string;
  authPromptText: string;
  authCallbackUrl?: string;
  postSignRedirectUrl?: string;
  referralCode?: string | null;
  storePendingVote: (name: string) => void;
  clearPendingVote: () => void;
  shareText: string;
  emailSubject: string;
  signedTitle?: string;
  signedBody?: ReactNode;
  variant?: "stepper" | "reader";
  showReaderShell?: boolean;
  /**
   * Render the pre-checked "display publicly" toggle. Only shown for
   * authenticated users — unauthenticated flow keeps the existing behavior
   * so we don't lose the user's privacy choice through the auth redirect.
   */
  showPrivacyToggle?: boolean;
}

export function ReferendumSignatureBox({
  referendumSlug,
  title,
  authPromptText,
  authCallbackUrl = "/dashboard",
  postSignRedirectUrl,
  referralCode = null,
  storePendingVote,
  clearPendingVote,
  shareText,
  emailSubject,
  signedTitle = "Referendum Signed",
  signedBody = "Share your link. Every signature moves the needle.",
  variant = "stepper",
  showReaderShell = true,
  showPrivacyToggle = false,
}: ReferendumSignatureBoxProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(true);

  const referralUrl = buildUserReferralUrl(session?.user);
  const isReader = variant === "reader";
  const shellClass = isReader && showReaderShell
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
  const buttonClass = isReader
    ? "border-2 border-[#8e6b48]/35 bg-[#23180d] px-8 py-3 text-lg font-black uppercase text-[#f7f1e4] hover:bg-[#3a2a19] disabled:opacity-30"
    : "border-2 border-white/30 bg-white/10 px-8 py-3 text-lg font-black uppercase text-white disabled:opacity-30";
  const shareLabelClass = isReader
    ? "text-[#6b5337]"
    : "text-brutal-pink";
  const errorClass = isReader
    ? "text-[#b42318]"
    : "text-brutal-red";
  const shouldRedirectAfterSign =
    status === "authenticated" && signed && Boolean(postSignRedirectUrl);

  useEffect(() => {
    if (!shouldRedirectAfterSign || !postSignRedirectUrl) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(postSignRedirectUrl);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [postSignRedirectUrl, router, shouldRedirectAfterSign]);

  async function handleSubmit() {
    setSigning(true);
    setError(null);

    storePendingVote("");

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
              ...(showPrivacyToggle ? { makePublic } : {}),
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
    if (postSignRedirectUrl) {
      return (
        <div className={cn("mx-auto flex max-w-md flex-col items-center gap-4", shellClass)}>
          <p className={cn("text-center text-2xl font-black uppercase [font-family:var(--v0-font-libre-baskerville)]", titleClass)}>
            {signedTitle}
          </p>
          <p className={cn("text-center text-base font-bold [font-family:var(--v0-font-libre-baskerville)]", bodyClass)}>
            Taking you to the action dashboard...
          </p>
        </div>
      );
    }

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
        <Link
          href={ROUTES.profile}
          className={cn(
            "text-center text-sm font-black uppercase underline underline-offset-4 hover:no-underline",
            bodyClass,
          )}
        >
          Add your photo and links →
        </Link>
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
      <Button
        onClick={() => void handleSubmit()}
        disabled={signing}
        className={cn(buttonClass, "w-full")}
      >
        {signing ? "..." : "Sign"}
      </Button>
      {showPrivacyToggle && status === "authenticated" ? (
        <div className="mt-4">
          <label className={cn(
            "flex cursor-pointer items-start gap-2 text-sm font-bold",
            bodyClass,
          )}>
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(e) => setMakePublic(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer accent-brutal-pink"
            />
            <span>
              Display my name publicly on the supporters list and leaderboards{" "}
              <span className="opacity-70">(recommended)</span>.
            </span>
          </label>
          {!makePublic ? (
            <p className="mt-2 border-2 border-brutal-red bg-brutal-red px-3 py-2 text-xs font-black uppercase text-brutal-red-foreground">
              Also hides your name from the referral leaderboard. You can reverse this in profile settings.
            </p>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className={cn("mt-3 text-center text-xs font-bold uppercase", errorClass)}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
