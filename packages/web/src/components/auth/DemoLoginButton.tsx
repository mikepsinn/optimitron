"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
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
        email: "demo@optimitron.org",
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

  return (
    <div className={className}>
      <Button
        type="button"
        disabled={loading}
        onClick={() => void handleClick()}
        className="font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-brutal-cyan-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        {loading ? "Signing in..." : "Try Demo"}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-brutal-red font-bold">{error}</p>
      )}
    </div>
  );
}
