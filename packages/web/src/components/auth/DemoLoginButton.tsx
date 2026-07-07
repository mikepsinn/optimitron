"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { isDemoLoginEnabled } from "@/lib/demo-login";
import { clientEnv } from "@/lib/env";
import { DEFAULT_POST_LOGIN_ROUTE, ROUTES } from "@/lib/routes";

interface DemoLoginButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function DemoLoginButton({
  callbackUrl = DEFAULT_POST_LOGIN_ROUTE,
  className,
}: DemoLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: "demo@thinkbynumbers.org",
        password: "demo1234",
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Demo account not available");
        return;
      }

      window.location.href = callbackUrl;
    } catch {
      setError("Demo sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isDemoLoginEnabled({
    demoLoginEnabled: clientEnv.NEXT_PUBLIC_DEMO_LOGIN_ENABLED,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: clientEnv.NEXT_PUBLIC_VERCEL_ENV,
  })) {
    return null;
  }

  return (
    <div className={className}>
      <Button
        type="button"
        disabled={loading}
        onClick={() => void handleClick()}
        className="border-4 border-primary bg-background font-black uppercase text-foreground shadow-none hover:bg-background/90"
      >
        {loading ? "Signing in..." : "Try Demo"}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-brutal-red font-bold">{error}</p>
      )}
    </div>
  );
}
