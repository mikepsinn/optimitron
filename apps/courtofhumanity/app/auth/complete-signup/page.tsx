"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { buildCompleteSignupBody } from "@/lib/complete-signup-body"
import { resolveCallbackUrl } from "@/lib/callback-url"
import { useSession } from "next-auth/react"
import { Layout } from "@/components/layout"
import { storage } from "@/lib/storage"
import { createLogger } from "@/lib/logger"

const log = createLogger("complete-signup-page")

export default function CompleteSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const processVerification = async () => {
      // Wait for session to be available
      if (status === "loading") return
      if (status === "unauthenticated") {
        router.push("/auth/signin")
        return
      }

      if (!session?.user?.id) return

      try {
        // Get stored verification data from localStorage
        const name = storage.getSignupName()
        const referralCode = storage.getSignupReferral()
        const inviteToken = storage.getSignupInviteToken()
        const newsletterSubscribed = storage.getSignupSubscribe()

        if (name || referralCode || inviteToken || newsletterSubscribed !== null) {
          // Call API to finish creating the account
          const response = await fetch("/api/auth/complete-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              buildCompleteSignupBody({
                name,
                referralCode,
                inviteToken,
                newsletterSubscribed,
              }),
            ),
          })

          if (!response.ok) {
            const data = await response.json()
            setError(data.error || "Failed to complete signup")
            setTimeout(() => {
              router.push("/dashboard")
            }, 2000)
            return
          }

          // Clear localStorage
          storage.clearSignupData()
        }

        // No vote sync here: this app has no vote surface yet, so nothing can
        // stage a pending vote on this origin. The sync call and its
        // /api/votes/sync route arrive together with the court vote routes
        // (#254) — calling it now would only ever 404 against a missing route.
        router.push(resolveCallbackUrl(searchParams?.get("callbackUrl"), window.location.origin))
      } catch (error) {
        log.error("Complete signup error", { error })
        setError("An error occurred. Redirecting to dashboard...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } finally {
        setIsProcessing(false)
      }
    }

    processVerification()
  }, [session, status, router, searchParams])

  if (isProcessing || status === "loading") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-beige">
          <div className="w-full max-w-md">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h1 className="text-4xl font-black mb-2">Finishing signup...</h1>
              <p className="text-lg">Please wait while we finish setting up your account.</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-beige">
          <div className="w-full max-w-md">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-red-100 border-4 border-red-500 p-4 mb-6">
                <p className="font-bold text-red-700">{error}</p>
              </div>
              <p className="text-sm">Redirecting you now...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return null
}

