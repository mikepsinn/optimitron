"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { ROUTES } from "@/lib/routes";

function getAuthErrorMessage(error: string | null) {
  switch (error) {
    case "OAuthAccountNotLinked":
      return "That email is already attached to another sign-in method.";
    case "AccessDenied":
      return "Access denied.";
    case "Verification":
      return "That magic link is invalid or has expired.";
    default:
      return null;
  }
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? ROUTES.dashboard;
  const referralCode = searchParams.get("ref");
  const initialError = getAuthErrorMessage(searchParams.get("error"));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-yellow">
      <div className="w-full max-w-md">
        <AuthForm
          callbackUrl={callbackUrl}
          referralCode={referralCode}
          initialError={initialError}
        />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
