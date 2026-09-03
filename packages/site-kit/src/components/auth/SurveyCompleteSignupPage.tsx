"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Layout } from "../layout"
import { storage } from "../../lib/storage"
import { syncPendingTrialAbundanceResponse } from "../../lib/trial-abundance-survey"
import { createLogger } from "../../lib/logger"
import { getSurveyPostAuthPath } from "../../lib/auth-redirect"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"

const log = createLogger("complete-signup-page")

export default function CompleteSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const visualPreview = searchParams?.get("visual") === "1"
  const previewError = visualPreview && searchParams?.get("recovery") === "error"
  const failureMessage = "We could not finish verification. Your answers are still saved in this browser. Please try again."
  const [isProcessing, setIsProcessing] = useState(!previewError)
  const [error, setError] = useState(previewError ? failureMessage : "")
  const [attempt, setAttempt] = useState(0)
  const inFlight = useRef(false)

  useEffect(() => {
    const processVerification = async () => {
      if (visualPreview) return

      // Wait for session to be available
      if (status === "loading") return
      const callbackUrl = getSurveyPostAuthPath(
        searchParams?.get("callbackUrl"),
        window.location.origin,
      )
      if (status === "unauthenticated") {
        router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }

      if (!session?.user?.id || inFlight.current) return
      inFlight.current = true

      try {
        // Get stored verification data from localStorage
        const name = storage.getSignupName()
        const referralCode = storage.getSignupReferral()
        const inviteToken = storage.getSignupInviteToken()
        const newsletterSubscribed = storage.getSignupSubscribe()

        if (name || referralCode || inviteToken || newsletterSubscribed !== null) {
          // Call API to complete vote verification
          const response = await fetch("/api/auth/complete-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name || null,
              referralCode: referralCode || null,
              inviteToken: inviteToken || null,
              ...(newsletterSubscribed !== null ? { newsletterSubscribed } : {}),
            }),
          })

          if (!response.ok) {
            setError(failureMessage)
            return
          } else {
            // Clear localStorage
            storage.clearSignupData()
          }
        }

        await syncPendingTrialAbundanceResponse(session)

        // Redirect to callback URL or dashboard
        router.replace(callbackUrl)
      } catch (error) {
        log.error("Complete vote verification error", { error })
        setError(failureMessage)
      } finally {
        inFlight.current = false
        setIsProcessing(false)
      }
    }

    processVerification()
  }, [session, status, router, searchParams, visualPreview, attempt])

  if (isProcessing || status === "loading") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-beige">
          <div className="w-full max-w-md">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h1 className="text-4xl font-black mb-2">Verifying response...</h1>
              <p className="text-lg">Please wait while we save your survey response.</p>
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
                <p role="alert" className="font-bold text-red-700">{error}</p>
              </div>
              <Button onClick={() => {
                setError("")
                setIsProcessing(true)
                setAttempt((current) => current + 1)
              }}>Retry verification</Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return null
}
