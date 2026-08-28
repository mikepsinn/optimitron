"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Input } from "@optimitron/neobrutalist-ui/ui/input"
import { Label } from "@optimitron/neobrutalist-ui/ui/label"
import { storage } from "../../lib/storage"
import { FaGoogle } from "react-icons/fa6"
import { createLogger } from "../../lib/logger"
import { trackSignUp } from "../../lib/analytics"
import { AlertCard } from "@optimitron/neobrutalist-ui/ui/alert-card"

const logger = createLogger('auth-form')

interface AuthFormProps {
  callbackUrl?: string
  referralCode?: string | null
  inviteToken?: string | null
  onSuccess?: () => void
  compact?: boolean
  emailOnly?: boolean
  /** Start with the email form expanded while still offering social sign-in. */
  defaultEmailOpen?: boolean
  showNameField?: boolean
  showSubscribe?: boolean
  subscribeDefault?: boolean
  emailLabel?: string
  emailPlaceholder?: string
  emailButtonLabel?: string
  emailLoadingLabel?: string
  preSubmitContent?: React.ReactNode
  // Configurable success messaging
  emailSuccessTitle?: string
  emailSuccessMessage?: string
  emailSuccessFooter?: string
}

export function AuthForm({
  callbackUrl = "/dashboard",
  referralCode,
  inviteToken,
  onSuccess,
  compact = false,
  emailOnly = false,
  defaultEmailOpen = false,
  showNameField = true,
  showSubscribe = true,
  subscribeDefault = true,
  emailLabel = "Email",
  emailPlaceholder = "Enter your email",
  emailButtonLabel = "Send magic link",
  emailLoadingLabel = "Sending magic link...",
  preSubmitContent,
  emailSuccessTitle = "Check your email!",
  emailSuccessMessage = "We've sent you a magic link to continue.",
  emailSuccessFooter
}: AuthFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [subscribe, setSubscribe] = useState(subscribeDefault)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(emailOnly || defaultEmailOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email) {
      setError("Email is required")
      setIsLoading(false)
      return
    }

    try {
      // Store name, referral, and subscribe preference in localStorage for post-verification processing
      if (name) {
        storage.setSignupName(name)
      }
      if (referralCode) {
        storage.setSignupReferral(referralCode)
      }
      if (inviteToken) {
        storage.setSignupInviteToken(inviteToken)
      }
      storage.setSignupSubscribe(subscribe)

      // Redirect to completion page after email verification
      const completionUrl = `/auth/complete-signup?callbackUrl=${encodeURIComponent(callbackUrl)}`

      // Send magic link via email
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: completionUrl,
      })

      if (result?.error) {
        setError("Failed to send email. Please try again.")
        // Clear localStorage on error
        storage.clearSignupData()
      } else {
        setEmailSent(true)
        // Track signup/login via email
        trackSignUp({ method: "email" })
        onSuccess?.()
      }
    } catch (error) {
      logger.error("Auth error", { error })
      setError("An error occurred. Please try again.")
      // Clear localStorage on error
      storage.clearSignupData()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    setIsLoading(true)
    storage.setSignupSubscribe(subscribe)
    // Track signup/login via social provider
    trackSignUp({ method: provider })
    const url = new URL(callbackUrl, window.location.origin)
    if (referralCode) {
      url.searchParams.set("ref", referralCode)
    }
    if (inviteToken) {
      url.searchParams.set("invite", inviteToken)
    }
    await signIn(provider, { callbackUrl: `${url.pathname}${url.search}${url.hash}` })
  }

  const formClasses = compact ? "space-y-3" : "space-y-4"
  const buttonHeight = compact ? "h-12" : "h-14"
  const textSize = compact ? "text-base" : "text-lg"

  // Detect if running in iframe.
  //
  // Resolved after mount rather than during render: the server has no window,
  // so reading it inline renders one tree on the server and a different one in
  // the browser. That was tolerable while this only drove a hint, but it now
  // also decides whether a button exists.
  // null until resolved. Defaulting to false would render the Google button on
  // the server and the first client paint, so an embedded voter would see it
  // -- and could click it -- for a tick before the effect removed it. Starting
  // unresolved means the server and the first client render agree on omitting
  // it, and it appears a tick later only where it actually works.
  const [isInIframe, setIsInIframe] = useState<boolean | null>(null)
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])
  const canUseSocialSignIn = !emailOnly && isInIframe === false

  return (
    <div className="w-full">

      {/* Iframe-specific tip */}
      {isInIframe === true && compact && !emailOnly && (
        <div className="mb-4 border-4 border-brutal-cyan bg-brutal-cyan p-3">
          <p className="text-xs font-bold text-center text-foreground">
            Email verification works best in embedded surveys.
          </p>
        </div>
      )}

      {error && (
        <AlertCard type="error" message={error} className="mb-6" />
      )}

      {emailSent ? (
        <div className="bg-brutal-yellow border-4 border-black p-4 mb-6">
          <p className="font-bold text-lg">{emailSuccessTitle}</p>
          <p className="text-sm mt-2">{emailSuccessMessage}</p>
          {emailSuccessFooter && (
            <p className="text-xs mt-2 text-muted-foreground">
              {emailSuccessFooter}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Dev Mode Login */}
          {!emailOnly && process.env.NODE_ENV === "development" && (
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLoading(true)
                  signIn("credentials", {
                    email: "test@example.com",
                    password: "dev",
                    callbackUrl: callbackUrl
                  })
                }}
                disabled={isLoading}
                className={`w-full border-4 border-dashed border-red-500 text-red-700 bg-red-100 font-bold ${buttonHeight} ${textSize}`}
              >
                🛠️ DEV LOGIN (Test User)
              </Button>
            </div>
          )}

          {/* Google Login.
              Hidden inside an iframe: NextAuth's signIn() navigates the frame
              it runs in, and Google refuses to render its account pages in a
              third-party frame, so an embedded voter who clicks this lands on
              a blocked frame instead of a sign-in. The partner survey embed at
              apps/trialabundancesurvey/app/embed/page.tsx reaches this form
              through TreatyVoteSection -> TreatyPostVoteFlow, which is exactly
              the case the "email works best in embedded surveys" hint above
              was written for. Email verification still works there. */}
          {canUseSocialSignIn && (
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialSignIn("google")}
                disabled={isLoading}
                className={`w-full border-4 border-black font-bold ${buttonHeight} ${textSize}`}
              >
                {FaGoogle({ className: "w-5 h-5 mr-2" })}
                Continue with Google
              </Button>
            </div>
          )}

          {!showEmailForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEmailForm(true)}
              className={`w-full border-4 border-black font-bold ${buttonHeight} ${textSize}`}
            >
              Continue with Email
            </Button>
          ) : (
            <>
              {/* "OR USE EMAIL" only means something when a social option
                  precedes it. In an iframe there is none, so the separator
                  would divide the email form from nothing. */}
              {canUseSocialSignIn && (
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-4 border-black"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white font-bold">OR USE EMAIL</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className={formClasses}>
                {showNameField && (
                  <div>
                    <Label htmlFor="auth-name" className={`${textSize} font-bold`}>
                      Name
                    </Label>
                    <Input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      className={`border-4 border-black ${buttonHeight} ${textSize}`}
                      disabled={isLoading}
                      placeholder="Enter your name (optional)"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="auth-email" className={`${textSize} font-bold`}>
                    {emailLabel}
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                    className={`border-4 border-black ${buttonHeight} ${textSize}`}
                    disabled={isLoading}
                    placeholder={emailPlaceholder}
                  />
                </div>

                {preSubmitContent}

                {showSubscribe && (
                  <div className="flex items-start gap-3">
                    <input
                      id="auth-subscribe"
                      type="checkbox"
                      checked={subscribe}
                      onChange={(e) => setSubscribe(e.target.checked)}
                      disabled={isLoading}
                      className="mt-1 h-5 w-5 border-4 border-black accent-brutal-pink cursor-pointer"
                    />
                    <Label htmlFor="auth-subscribe" className="text-sm font-bold cursor-pointer select-none">
                      Subscribe for updates on our progress
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  className={`w-full ${buttonHeight} ${textSize} font-black bg-brutal-pink text-brutal-pink-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all`}
                  disabled={isLoading}
                >
                  {isLoading ? emailLoadingLabel : emailButtonLabel}
                </Button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  )
}
