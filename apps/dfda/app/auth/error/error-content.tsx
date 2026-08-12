"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Lightbulb } from "lucide-react"
import { ROUTES } from '@/lib/routes'
import { AlertCard } from "@/components/ui/alert-card"

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 border-4 border-black">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-black mb-2">Authentication Error</h1>
          <div className="mx-auto my-6 h-1 w-20 bg-black"></div>
        </div>

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
            <Link href={ROUTES.signIn}>
              <Button className="w-full h-12 text-lg font-black bg-brutal-pink border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                Try Again
              </Button>
            </Link>

            <Link href="/">
              <Button
                variant="outline"
                className="w-full h-12 text-lg font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                Go Home
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600 pt-4 border-t-4 border-gray-200">
            <p>Still having issues?</p>
            <Link href={ROUTES.contact} className="font-bold underline hover:text-brutal-pink">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
