"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/retroui/Button";
import { SecretChainPitch } from "@/components/referendum/SecretChainPitch";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { REFERRAL_SHARE_LABEL } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
import { buildUserReferralUrl } from "@/lib/url";
import { getUserDisplayName } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type ReferralUser = {
  handle?: string | null;
  referralCode?: string | null;
};

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
  signedShare?: ReactNode;
  variant?: "stepper" | "reader";
  showReaderShell?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  authTitle?: string;
  emailButtonLabel?: string;
  emailPendingButtonLabel?: string;
  buildShareUrl?: (
    user: ReferralUser | null | undefined,
    baseUrl?: string,
  ) => string;
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
  authCallbackUrl = ROUTES.dashboard,
  postSignRedirectUrl,
  referralCode = null,
  storePendingVote,
  clearPendingVote,
  shareText,
  emailSubject,
  signedTitle = "Referendum Signed",
  signedBody = "You just did the 30-second thing. Now do the 90-second thing.",
  signedShare,
  variant = "stepper",
  showReaderShell = true,
  submitLabel = "Sign",
  submittingLabel = "...",
  authTitle = "Finish Signing",
  emailButtonLabel = "Email Me a Link to Finish Signing",
  emailPendingButtonLabel = "Sending Finish-Signing Link...",
  buildShareUrl = buildUserReferralUrl,
  showPrivacyToggle = false,
}: ReferendumSignatureBoxProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(true);

  const referralUrl = buildShareUrl(session?.user);
  const isReader = variant === "reader";
  const shellClass =
    isReader && showReaderShell
      ? "border-2 border-foreground bg-background px-6 py-6 text-foreground shadow-none"
      : "";
  const titleClass = isReader
    ? "text-[var(--treaty-ink)]"
    : "text-primary-foreground";
  const bodyClass = isReader
    ? "text-[var(--treaty-ink)]"
    : "text-primary-foreground";
  const referralLinkClass = isReader
    ? "text-[var(--treaty-ink-muted)]"
    : "text-primary-foreground";
  const buttonClass = isReader
    ? "border-2 border-foreground bg-foreground px-8 py-3 text-lg font-black uppercase text-background shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-background hover:text-foreground disabled:opacity-30"
    : "border-2 border-primary-foreground bg-transparent px-8 py-3 text-lg font-black uppercase text-primary-foreground disabled:opacity-30";
  const shareLabelClass = isReader
    ? "text-[var(--treaty-ink)] normal-case tracking-normal text-sm leading-6 font-bold"
    : "text-primary-foreground normal-case tracking-normal text-sm leading-6 font-bold";
  const errorClass = isReader ? "text-[var(--treaty-ink)]" : "text-brutal-red";
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
              originUrl:
                typeof window !== "undefined"
                  ? window.location.href
                  : undefined,
            }),
          },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
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
        <div
          className={cn(
            "mx-auto flex max-w-md flex-col items-center gap-4",
            shellClass,
          )}
        >
          <p
            className={cn(
              "text-center text-2xl font-black uppercase [font-family:var(--v0-font-libre-baskerville)]",
              titleClass,
            )}
          >
            {signedTitle}
          </p>
          <p
            className={cn(
              "text-center text-base font-bold [font-family:var(--v0-font-libre-baskerville)]",
              bodyClass,
            )}
          >
            Taking you to the action dashboard...
          </p>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col gap-6",
          shellClass,
        )}
      >
        <p
          className={cn(
            "text-center text-2xl font-black uppercase [font-family:var(--v0-font-libre-baskerville)]",
            titleClass,
          )}
        >
          {signedTitle}
        </p>
        <p
          className={cn(
            "text-center text-base font-bold [font-family:var(--v0-font-libre-baskerville)]",
            bodyClass,
          )}
        >
          {signedBody}
        </p>
        {signedShare ? (
          signedShare
        ) : (
          <>
            <SecretChainPitch citizenName={getUserDisplayName(session?.user)} />
            <ShareLinkButtons
              label={REFERRAL_SHARE_LABEL}
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
          </>
        )}
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
          title={authTitle}
          subtitle={authPromptText}
          googleButtonLabel="Finish with Google"
          emailButtonLabel={emailButtonLabel}
          emailPendingButtonLabel={emailPendingButtonLabel}
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
      <p
        className={cn(
          "mb-6 text-center text-xl font-bold [font-family:var(--v0-font-libre-baskerville)]",
          titleClass,
        )}
      >
        {resolvedTitle}
      </p>
      <Button
        onClick={() => void handleSubmit()}
        disabled={signing}
        className={cn(buttonClass, "w-full")}
      >
        {signing ? submittingLabel : submitLabel}
      </Button>
      {showPrivacyToggle && status === "authenticated" ? (
        <div className="mt-4">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-2 text-sm font-bold",
              bodyClass,
            )}
          >
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(e) => setMakePublic(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer accent-black"
            />
            <span>
              Display my name publicly on the signer list and leaderboards{" "}
              <span className="opacity-70">(recommended)</span>.
            </span>
          </label>
          {!makePublic ? (
            <p className="mt-2 border-2 border-foreground bg-background px-3 py-2 text-xs font-black uppercase text-foreground">
              Also hides your name from the referral leaderboard. You can
              reverse this in profile settings.
            </p>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p
          className={cn(
            "mt-3 text-center text-xs font-bold uppercase",
            errorClass,
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
