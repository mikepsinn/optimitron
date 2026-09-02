"use client"

import { useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout"
import { AuthForm } from "@/components/auth/AuthForm"
import { getSurveyPostAuthPath } from "@/lib/auth-redirect"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = getSurveyPostAuthPath(
    searchParams?.get("callbackUrl"),
    typeof window === "undefined" ? "https://trialabundancesurvey.org" : window.location.origin,
  )

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-beige">
        <div className="w-full max-w-md">
          <AuthForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </Layout>
  )
}
