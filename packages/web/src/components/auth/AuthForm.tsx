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
import { cn } from "@/lib/utils";

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
    ? "w-full rounded-[24px] border border-[#8e6b48]/25 bg-[#f7f1e4]/88 p-5 shadow-[0_12px_24px_rgba(58,42,25,0.08)]"
    : "w-full rounded-xl border-4 border-primary bg-background p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
  const titleClassName = isDocument
    ? "text-2xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]"
    : "text-xl font-black uppercase";
  const subtitleClassName = isDocument
    ? "mt-2 text-sm font-bold text-[#6b5337] [font-family:var(--v0-font-libre-baskerville)]"
    : "mt-2 text-sm font-bold text-muted-foreground";
  const dividerClassName = isDocument
    ? "flex items-center gap-3 text-xs font-bold uppercase text-[#8e6b48]"
    : "flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground";
  const dividerLineClassName = isDocument ? "h-px flex-1 bg-[#8e6b48]/30" : "h-px flex-1 bg-border";
  const referralClassName = isDocument
    ? "mb-4 text-center text-xs font-bold uppercase text-[#8e6b48]"
    : "mb-4 text-center text-xs font-bold uppercase text-muted-foreground";
  const labelClassName = isDocument
    ? "font-bold uppercase text-[#3a2a19]"
    : "font-bold uppercase";
  const inputClassName = isDocument
    ? `${fieldClassName} border-[#8e6b48]/35 bg-[#fffaf0] text-[var(--treaty-ink)] placeholder:text-[#8e6b48]/55`
    : fieldClassName;
  const googleClassName = isDocument
    ? `w-full justify-center gap-3 border-[#d6d2cb] bg-[#fffaf0] font-black uppercase text-[#1f1f1f] shadow-[4px_4px_0px_0px_rgba(58,42,25,0.18)] hover:bg-[#f7f4ee] hover:text-[#1f1f1f] ${buttonClassName}`
    : `w-full justify-center gap-3 border-[#d6d2cb] bg-white font-black uppercase text-[#1f1f1f] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] hover:bg-[#f7f4ee] hover:text-[#1f1f1f] ${buttonClassName}`;
  const emailButtonClassName = isDocument
    ? `w-full border-[#8e6b48]/35 bg-[var(--treaty-ink)] font-black uppercase text-[#f7f1e4] shadow-[4px_4px_0px_0px_rgba(58,42,25,0.18)] hover:bg-[#3a2a19] hover:text-[#fff9ef] ${buttonClassName}`
    : `w-full font-black uppercase ${buttonClassName}`;

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

      {error ? <AlertCard type="error" message={error} className="mb-4" /> : null}
      {infoMessage ? (
        <>
          <AlertCard type="info" message={infoMessage} className="mb-4" />
          {emailSuccessFooter ? (
            <p className="mb-4 text-center text-xs font-bold text-muted-foreground">
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
              className={`w-full font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-brutal-cyan-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${buttonClassName}`}
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
          />
        ) : null}
      </div>
    </div>
  );
}
