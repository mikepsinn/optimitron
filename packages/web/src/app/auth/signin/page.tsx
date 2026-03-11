"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/vote";
  const referralCode = searchParams?.get("ref") || null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-yellow-300">
      <div className="w-full max-w-md">
        <AuthForm callbackUrl={callbackUrl} referralCode={referralCode} />
      </div>
    </div>
  );
}
