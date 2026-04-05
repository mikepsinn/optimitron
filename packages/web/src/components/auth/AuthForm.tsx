"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
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
  initialError?: string | null;
  compact?: boolean;
  /** Message shown below the success alert after a magic link is sent */
  emailSuccessFooter?: string;
  /** Pre-resolved provider flags from the server — skips the client-side fetch when provided */
  providers?: ProviderFlags;
}

export function AuthForm({
  callbackUrl = DEFAULT_POST_LOGIN_ROUTE,
  referralCode,
  initialError = null,
  compact = false,
  emailSuccessFooter,
  providers,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"google" | "magic" | "demo" | null>(null);

  const isLoading = pendingAction !== null;
  const fieldClassName = compact ? "h-11 text-base" : "h-12 text-base";
  const buttonClassName = compact ? "h-11 text-sm" : "h-12 text-base";
  const magicLinkEnabled = providers?.email ?? true;
  const googleEnabled = providers?.google ?? true;

  useEffect(() => {
    if (!initialError) {
      return;
    }

    setError(initialError);
  }, [initialError]);

  function persistAuthContext() {
    if (referralCode) {
      storage.setSignupReferral(referralCode);
    } else {
      storage.clearSignupReferral();
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

      setInfoMessage("Check your email for a secure sign-in link.");
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
    <div className="w-full rounded-xl border-4 border-primary bg-background p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-5 text-center">
        <h2 className="text-xl font-black uppercase">Sign In</h2>
      </div>

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
        <p className="mb-4 text-center text-xs font-bold uppercase text-muted-foreground">
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

            <div className="flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or create an account</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        {googleEnabled ? (
          <Button
            type="button"
            disabled={isLoading}
            className={`w-full font-black uppercase ${buttonClassName}`}
            onClick={() => {
              void handleGoogleSignIn();
            }}
          >
            {pendingAction === "google" ? "Redirecting..." : "Continue with Google"}
          </Button>
        ) : null}

        {googleEnabled && magicLinkEnabled ? (
          <div className="flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-border" />
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
              <Label className="font-bold uppercase" htmlFor="auth-email">
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
                className={fieldClassName}
                disabled={isLoading}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full font-black uppercase ${buttonClassName}`}
            >
              {pendingAction === "magic" ? "Sending Link..." : "Email Me Proof of Existence"}
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
