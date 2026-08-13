"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AuthForm } from "@/components/auth/AuthForm"
import { X } from "lucide-react"

interface WishocracyStatusBarProps {
  show: boolean
  isLoading: boolean
  isAuthenticated: boolean
  referralCode: string | null
  onShowAuthPrompt: () => void
}

export function WishocracyStatusBar({
  show,
  isLoading,
  isAuthenticated,
  referralCode,
  onShowAuthPrompt: _onShowAuthPrompt
}: WishocracyStatusBarProps) {
  const [showInlineAuth, setShowInlineAuth] = useState(false)

  if (!show || isLoading) {
    return null
  }

  // Show inline auth form
  if (!isAuthenticated && showInlineAuth) {
    return (
      <div className="max-w-2xl mx-auto mb-8">
        <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
          <Button
            onClick={() => setShowInlineAuth(false)}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-center mb-4">
            <h3 className="text-lg font-black uppercase mb-2">
              Sign In to Save Your Work
            </h3>
            <p className="text-sm text-muted-foreground">
              Your comparisons will be saved and synced automatically
            </p>
          </div>
          <AuthForm
            callbackUrl="/wishocracy"
            referralCode={referralCode}
            compact={true}
          />
        </Card>
      </div>
    )
  }

  // Show sign-in button
  return (
    <div className="max-w-2xl mx-auto mb-8" data-auth-prompt>
      <div className="text-center mb-3">
        {!isAuthenticated && (
          <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              Sign in to save your comparisons and see results
            </p>
            <Button
              onClick={() => setShowInlineAuth(true)}
              size="sm"
              className="font-bold uppercase bg-brutal-pink hover:bg-brutal-pink/90 text-foreground border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
