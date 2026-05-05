"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { AlertCard } from "@/components/ui/alert-card";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { createLogger } from "@/lib/logger";
import { DEFAULT_POST_LOGIN_ROUTE, ROUTES } from "@/lib/routes";
import { storage } from "@/lib/storage";

const logger = createLogger("auth-form");

interface ProviderFlags {
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
  /** Message shown below the success alert after a magic link is sent */
  emailSuccessFooter?: string;
  /** When true, skip the bordered/shadowed outer container (use inside a Card that already provides the box). */
  hideContainer?: boolean;
  /** Pre-resolved provider flags from the server — skips the client-side fetch when provided */
  providers?: ProviderFlags;
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
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"google" | "magic" | "demo" | null>(null);

  const isLoading = pendingAction !== null;
  const isDocument = variant === "document";
  const fieldClassName = compact ? "h-11 text-base" : "h-12 text-base";
  const buttonClassName = compact ? "h-11 text-sm" : "h-12 text-base";
  const magicLinkEnabled = providers?.email ?? true;
  const googleEnabled = providers?.google ?? true;
  const containerClassName = hideContainer
    ? "w-full"
    : isDocument
    ? "w-full border border-black bg-white p-5 text-black shadow-none"
    : "w-full border border-neutral-950 bg-white p-6 shadow-none sm:p-7";
  const titleClassName = isDocument
    ? "text-2xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]"
    : "text-2xl font-semibold tracking-tight text-neutral-950";
  const subtitleClassName = isDocument
    ? "mt-2 text-sm font-bold text-black [font-family:var(--v0-font-libre-baskerville)]"
    : "mt-2 text-sm leading-6 text-neutral-600";
  const dividerClassName = isDocument
    ? "flex items-center gap-3 text-xs font-bold uppercase text-black"
    : "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500";
  const dividerLineClassName = isDocument ? "h-px flex-1 bg-black/30" : "h-px flex-1 bg-neutral-200";
  const referralClassName = isDocument
    ? "mb-4 text-center text-xs font-bold uppercase text-black"
    : "mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500";
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

  useEffect(() => {
    if (!initialError) {
      return;
    }

    setError(initialError);
  }, [initialError]);

  function persistAuthContext() {
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
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfoMessage("");
    setPendingAction("magic");

    try {
      if (!email.trim()) {
        throw new Error("Email is required for a magic link.");
      }

      persistAuthContext();

      const result = await signIn("email", {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Unable to send a magic link right now.");
      }

      setInfoMessage("Check your email for a sign-in link.");
    } catch (caughtError) {
      logger.error("Magic-link request failed", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to send a magic link right now.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setInfoMessage("");
    setPendingAction("google");

    try {
      persistAuthContext();
      await signIn("google", { callbackUrl });
    } catch (caughtError) {
      logger.error("Google sign-in failed", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to continue with Google.",
      );
      setPendingAction(null);
    }
  }

  async function handleDemoSignIn() {
    setError("");
    setInfoMessage("");
    setPendingAction("demo");

    try {
      const result = await signIn("credentials", {
        email: "demo@optimitron.org",
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
        caughtError instanceof Error ? caughtError.message : "Demo sign-in failed.",
      );
      setPendingAction(null);
    }
  }

  return (
    <div className={containerClassName}>
      {title || subtitle ? (
        <div className="mb-5 text-center">
          {title ? <h2 className={titleClassName}>{title}</h2> : null}
          {subtitle ? (
            <p className={subtitleClassName}>{subtitle}</p>
          ) : null}
        </div>
      ) : null}

      {error ? <AlertCard type="error" message={error} className="mb-4" variant="minimal" /> : null}
      {infoMessage ? (
        <>
          <AlertCard type="info" message={infoMessage} className="mb-4" variant="minimal" />
          {emailSuccessFooter ? (
            <p className="mb-4 text-center text-xs font-semibold text-neutral-500">
              {emailSuccessFooter}
            </p>
          ) : null}
        </>
      ) : null}

      {referralCode ? (
        <p className={referralClassName}>
          Referral detected: {referralCode}
        </p>
      ) : null}

      <div className="space-y-4">
        {process.env.NODE_ENV !== "production" && (
          <>
            <Button
              type="button"
              disabled={isLoading}
              className={demoButtonClassName}
              onClick={() => {
                void handleDemoSignIn();
              }}
            >
              {pendingAction === "demo" ? "Signing in..." : "Try Demo — No Account Needed"}
            </Button>

            <div className={dividerClassName}>
              <span className={dividerLineClassName} />
              <span>or create an account</span>
              <span className={dividerLineClassName} />
            </div>
          </>
        )}

        {googleEnabled ? (
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

        {googleEnabled && magicLinkEnabled ? (
          <div className={dividerClassName}>
            <span className={dividerLineClassName} />
            <span>{emailDividerLabel}</span>
            <span className={dividerLineClassName} />
          </div>
        ) : null}

        {magicLinkEnabled ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="space-y-2">
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

        {!googleEnabled && !magicLinkEnabled ? (
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
