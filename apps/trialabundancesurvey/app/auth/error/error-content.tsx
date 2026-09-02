"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lightbulb } from "lucide-react"
import { ROUTES } from '@/lib/routes'
import { AlertCard } from "@/components/ui/alert-card"
import { getSurveyPostAuthPath } from "@/lib/auth-redirect"

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or has already been used.",
  Default: "An error occurred during authentication.",
  OAuthSignin: "Error starting OAuth sign in.",
  OAuthCallback: "Error handling OAuth callback.",
  OAuthCreateAccount: "Could not create OAuth account.",
  EmailCreateAccount: "Could not create email account.",
  Callback: "Error in callback handler.",
  OAuthAccountNotLinked: "This email is already associated with another account.",
  EmailSignin: "Could not send email. Please try again.",
  CredentialsSignin: "Invalid email or password.",
  SessionRequired: "Please sign in to access this page.",
}

export default function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error") || "Default"
  const isVerificationError = error === "Verification"
  const callbackUrl = getSurveyPostAuthPath(
    searchParams?.get("callbackUrl"),
    typeof window === "undefined" ? "https://trialabundancesurvey.org" : window.location.origin,
  )

  return (
    <>
      <h1 className="text-4xl font-black">
        {isVerificationError ? "Sign in again" : "Authentication Error"}
      </h1>

      <div className="space-y-4">
        <AlertCard
          type="error"
          message={errorMessages[error] || errorMessages.Default}
        />

        {error === "OAuthAccountNotLinked" && (
          <AlertCard
            type="warning"
            icon={Lightbulb}
            message="Tip: Try signing in with the same method you used when you first created your account."
          />
        )}

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full h-12 text-lg font-black bg-brutal-pink border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <Link href={`${ROUTES.signIn}?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              {isVerificationError ? "Get a new sign-in link" : "Try Again"}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full h-12 text-lg font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        <div className="text-sm text-gray-600 pt-4">
          <p>Still having issues?</p>
          <Link href={ROUTES.contact} className="font-bold underline hover:text-brutal-pink">
            Contact Support
          </Link>
        </div>
      </div>
    </>
  )
}
