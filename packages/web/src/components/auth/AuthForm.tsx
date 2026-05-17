"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { AlertCard } from "@/components/ui/alert-card";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { isDemoLoginEnabled } from "@/lib/demo-login";
import { clientEnv } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { DEFAULT_POST_LOGIN_ROUTE, ROUTES } from "@/lib/routes";
import { storage } from "@/lib/storage";

const logger = createLogger("auth-form");
const SIGN_IN_LINK_SENT_MESSAGE =
  "Sign-in link sent. Check spam if you do not see it within 60 seconds.";

function detectEmbeddedFrame(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

interface ProviderFlags {
  demo?: boolean;
  email: boolean;
  google: boolean;
}

interface AuthFormProps {
  callbackUrl?: string;
  referralCode?: string | null;
  shareAttemptId?: string | null;
  initialError?: string | null;
  compact?: boolean;
  variant?: "default" | "document";
  /** Pass `null` to omit the heading entirely (e.g. when the surrounding card already titles the surface). */
  title?: string | null;
  subtitle?: string;
  googleButtonLabel?: string;
  emailButtonLabel?: string;
  emailPendingButtonLabel?: string;
  /** Divider label shown between the Google button and the email form. Default "or use email". */
  emailDividerLabel?: string;
  /** Message shown below the confirmation after a magic link is sent */
  emailSuccessFooter?: string;
  /** When true, skip the bordered/shadowed outer container (use inside a Card that already provides the box). */
  hideContainer?: boolean;
  /** Pre-resolved provider flags from the server — skips the client-side fetch when provided */
  providers?: ProviderFlags;
  /** Return false to stop auth when the surrounding form is incomplete. */
  onBeforeAuth?: () => boolean | void;
}

export function AuthForm({
  callbackUrl = DEFAULT_POST_LOGIN_ROUTE,
  referralCode,
  shareAttemptId,
  initialError = null,
  compact = false,
  variant = "default",
  title = "Sign In",
  subtitle,
  googleButtonLabel = "Continue with Google",
  emailButtonLabel = "Email Me a Sign-In Link",
  emailPendingButtonLabel = "Sending Sign-In Link...",
  emailDividerLabel = "or use email",
  emailSuccessFooter,
  hideContainer = false,
  providers,
  onBeforeAuth,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "google" | "magic" | "demo" | null
  >(null);
  const [isEmbeddedFrame, setIsEmbeddedFrame] = useState(false);

  const isLoading = pendingAction !== null;
  const isDocument = variant === "document";
  const fieldClassName = compact ? "h-11 text-base" : "h-12 text-base";
  const buttonClassName = compact ? "h-11 text-sm" : "h-12 text-base";
  const magicLinkEnabled = providers?.email ?? true;
  const googleEnabled = (providers?.google ?? true) && !isEmbeddedFrame;
  const demoLoginEnabled =
    providers?.demo ??
    isDemoLoginEnabled({
      demoLoginEnabled: clientEnv.NEXT_PUBLIC_DEMO_LOGIN_ENABLED,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: clientEnv.NEXT_PUBLIC_VERCEL_ENV,
    });
  const containerClassName = hideContainer
    ? "w-full"
    : isDocument
      ? "w-full border border-black bg-white p-4 text-black shadow-none"
      : compact
        ? "w-full border border-foreground bg-background p-4 shadow-none sm:p-5"
        : "w-full border border-neutral-950 bg-white p-5 shadow-none sm:p-6";
  const titleWrapperClassName = compact
    ? "mb-3 text-center"
    : "mb-4 text-center";
  const titleClassName = isDocument
    ? "text-2xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]"
    : "text-2xl font-semibold tracking-tight text-neutral-950";
  const subtitleClassName = isDocument
    ? "mt-2 text-sm font-bold text-black [font-family:var(--v0-font-libre-baskerville)]"
    : "mt-2 text-sm leading-6 text-neutral-600";
  const dividerClassName = isDocument
    ? "flex items-center gap-3 text-xs font-bold uppercase text-black"
    : "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500";
  const dividerLineClassName = isDocument
    ? "h-px flex-1 bg-black/30"
    : "h-px flex-1 bg-neutral-200";
  const referralClassName = isDocument
    ? "mb-3 text-center text-xs font-bold uppercase text-black"
    : "mb-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500";
  const labelClassName = isDocument
    ? "font-bold uppercase text-black"
    : "text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700";
  const inputClassName = isDocument
    ? `${fieldClassName} !border !border-black bg-white text-black !shadow-none placeholder:text-black/45 focus:!shadow-none focus-visible:outline-black`
    : `${fieldClassName} !border !border-neutral-300 bg-white text-neutral-950 !shadow-none placeholder:text-neutral-400 focus:!border-neutral-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950`;
  const googleClassName = isDocument
    ? `w-full justify-center gap-3 !border !border-black bg-white font-black uppercase text-black !shadow-none hover:!translate-x-0 hover:!translate-y-0 hover:bg-black hover:text-white active:!translate-x-0 active:!translate-y-0 ${buttonClassName}`
    : `w-full justify-center gap-3 !border !border-neutral-300 !bg-white font-semibold !text-neutral-950 !shadow-none hover:!translate-x-0 hover:!translate-y-0 hover:!border-neutral-950 hover:!bg-neutral-50 hover:!text-neutral-950 active:!translate-x-0 active:!translate-y-0 ${buttonClassName}`;
  const emailButtonClassName = isDocument
    ? `w-full justify-center !border !border-black bg-black font-black uppercase text-white !shadow-none hover:!translate-x-0 hover:!translate-y-0 hover:bg-white hover:text-black active:!translate-x-0 active:!translate-y-0 ${buttonClassName}`
    : `w-full justify-center !border !border-neutral-950 !bg-neutral-950 font-semibold !text-white !shadow-none hover:!translate-x-0 hover:!translate-y-0 hover:!bg-neutral-800 hover:!text-white active:!translate-x-0 active:!translate-y-0 ${buttonClassName}`;
  const demoButtonClassName = isDocument
    ? `w-full justify-center !border !border-black bg-white font-black uppercase text-black !shadow-none hover:!translate-x-0 hover:!translate-y-0 hover:bg-black hover:text-white active:!translate-x-0 active:!translate-y-0 ${buttonClassName}`
    : `w-full justify-center !border !border-neutral-950 !bg-white font-semibold !text-neutral-950 !shadow-none hover:!translate-x-0 hover:!translate-y-0 hover:!bg-neutral-50 active:!translate-x-0 active:!translate-y-0 ${buttonClassName}`;
  const alertClassName = compact ? "mb-3" : "mb-4";
  const controlsSpacingClassName = compact ? "space-y-3" : "space-y-4";
  const formSpacingClassName = compact ? "space-y-3" : "space-y-4";
  const fieldSpacingClassName = compact ? "space-y-1.5" : "space-y-2";
  const confirmationClassName = compact
    ? "flex min-h-24 flex-col items-center justify-center text-center"
    : "flex min-h-28 flex-col items-center justify-center text-center";
  const confirmationTextClassName = isDocument
    ? "text-sm font-black uppercase leading-6 text-foreground"
    : "text-sm font-semibold leading-6 text-muted-foreground";
  const confirmationFooterClassName = isDocument
    ? "mt-2 text-xs font-bold leading-5 text-muted-foreground"
    : "mt-2 text-xs font-semibold leading-5 text-muted-foreground";

  useEffect(() => {
    if (!initialError) {
      return;
    }

    setError(initialError);
    setHasSubmitted(false);
  }, [initialError]);

  useEffect(() => {
    setIsEmbeddedFrame(detectEmbeddedFrame());
  }, []);

  function persistAuthContext() {
    if (onBeforeAuth?.() === false) {
      return false;
    }

    if (referralCode !== undefined) {
      if (referralCode) {
        storage.setSignupReferral(referralCode);
      } else {
        storage.clearSignupReferral();
      }
    }

    if (shareAttemptId !== undefined) {
      if (shareAttemptId) {
        storage.setSignupShareAttempt(shareAttemptId);
      } else {
        storage.clearSignupShareAttempt();
      }
    }

    storage.clearSignupName();
    storage.clearSignupSubscribe();
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setHasSubmitted(false);
    setPendingAction("magic");

    try {
      if (!email.trim()) {
        throw new Error("Email is required for a sign-in link.");
      }

      if (!persistAuthContext()) return;

      const result = await signIn("email", {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Unable to send a sign-in link right now.");
      }

      setHasSubmitted(true);
    } catch (caughtError) {
      logger.error("Magic-link request failed", caughtError);
      setHasSubmitted(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send a sign-in link right now.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setHasSubmitted(false);
    setPendingAction("google");

    try {
      if (!persistAuthContext()) {
        setPendingAction(null);
        return;
      }
      await signIn("google", { callbackUrl });
    } catch (caughtError) {
      logger.error("Google sign-in failed", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to continue with Google.",
      );
      setPendingAction(null);
    }
  }

  async function handleDemoSignIn() {
    setError("");
    setHasSubmitted(false);
    setPendingAction("demo");

    try {
      if (!persistAuthContext()) {
        setPendingAction(null);
        return;
      }

      const result = await signIn("credentials", {
        email: "demo@thinkbynumbers.org",
        password: "demo1234",
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Demo account not available. Run: npx prisma db seed");
      }

      window.location.href = callbackUrl;
    } catch (caughtError) {
      logger.error("Demo sign-in failed", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Demo sign-in failed.",
      );
      setPendingAction(null);
    }
  }

  return (
    <div className={containerClassName}>
      {title || subtitle ? (
        <div className={titleWrapperClassName}>
          {title ? <h2 className={titleClassName}>{title}</h2> : null}
          {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
        </div>
      ) : null}

      {error ? (
        <AlertCard
          type="error"
          message={error}
          className={alertClassName}
          variant="minimal"
        />
      ) : null}

      {referralCode ? (
        <p className={referralClassName}>Referral detected: {referralCode}</p>
      ) : null}

      <div className={controlsSpacingClassName}>
        {hasSubmitted ? (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={confirmationClassName}
          >
            <p className={confirmationTextClassName}>
              {SIGN_IN_LINK_SENT_MESSAGE}
            </p>
            {emailSuccessFooter ? (
              <p className={confirmationFooterClassName}>
                {emailSuccessFooter}
              </p>
            ) : null}
          </div>
        ) : null}

        {!hasSubmitted && demoLoginEnabled && (
          <>
            <Button
              type="button"
              disabled={isLoading}
              className={demoButtonClassName}
              onClick={() => {
                void handleDemoSignIn();
              }}
            >
              {pendingAction === "demo"
                ? "Signing in..."
                : "Try Demo — No Account Needed"}
            </Button>

            <div className={dividerClassName}>
              <span className={dividerLineClassName} />
              <span>or create an account</span>
              <span className={dividerLineClassName} />
            </div>
          </>
        )}

        {!hasSubmitted && googleEnabled ? (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className={googleClassName}
            onClick={() => {
              void handleGoogleSignIn();
            }}
          >
            <FcGoogle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {pendingAction === "google" ? "Redirecting..." : googleButtonLabel}
          </Button>
        ) : null}

        {!hasSubmitted && googleEnabled && magicLinkEnabled ? (
          <div className={dividerClassName}>
            <span className={dividerLineClassName} />
            <span>{emailDividerLabel}</span>
            <span className={dividerLineClassName} />
          </div>
        ) : null}

        {!hasSubmitted && magicLinkEnabled ? (
          <form
            className={formSpacingClassName}
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className={fieldSpacingClassName}>
              <Label className={labelClassName} htmlFor="auth-email">
                Email
              </Label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputClassName}
                disabled={isLoading}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className={emailButtonClassName}
            >
              {pendingAction === "magic"
                ? emailPendingButtonLabel
                : emailButtonLabel}
            </Button>
          </form>
        ) : null}

        {!hasSubmitted && !googleEnabled && !magicLinkEnabled ? (
          <AlertCard
            type="warning"
            message="No sign-in methods are enabled for this environment."
            variant="minimal"
          />
        ) : null}
      </div>
    </div>
  );
}
