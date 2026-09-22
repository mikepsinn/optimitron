import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { getConfiguredProviders } from "@/lib/auth";
import {
  isOAuthConsentFlowRequest,
  oauthConsentFlowMetadata,
} from "@/lib/oauth-consent-flow";
import { DEFAULT_POST_LOGIN_ROUTE, ROUTES } from "@/lib/routes";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : null;
  if (!isOAuthConsentFlowRequest(ROUTES.signIn, callbackUrl)) return {};
  return oauthConsentFlowMetadata("Sign in", "Sign in to continue.");
}

function getAuthErrorMessage(error: string | null) {
  switch (error) {
    case "OAuthAccountNotLinked":
      return "That email is already attached to another sign-in method.";
    case "AccessDenied":
      return "Access denied.";
    case "Verification":
      return "That sign-in link is invalid or has expired.";
    default:
      return null;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl =
    (typeof params.callbackUrl === "string" ? params.callbackUrl : undefined) ??
    DEFAULT_POST_LOGIN_ROUTE;
  const referralCode = typeof params.ref === "string" ? params.ref : null;
  const shareAttemptId = typeof params.sa === "string" ? params.sa : null;
  const initialError = getAuthErrorMessage(
    typeof params.error === "string" ? params.error : null,
  );
  const providers = getConfiguredProviders();

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-neutral-950">
      <div className="w-full max-w-md">
        <AuthForm
          callbackUrl={callbackUrl}
          referralCode={referralCode}
          shareAttemptId={shareAttemptId}
          initialError={initialError}
          providers={providers}
        />
      </div>
    </main>
  );
}
