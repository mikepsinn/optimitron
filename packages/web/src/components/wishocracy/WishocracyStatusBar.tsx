"use client"

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
}: WishocracyStatusBarProps) {
  if (!show || isLoading) {
    return null
  }

  // Auth disabled — just show empty status bar area
  return (
    <div className="max-w-2xl mx-auto mb-8" data-auth-prompt>
      <div className="text-center mb-3">
        <p className="text-sm text-muted-foreground">
          Your comparisons are saved locally in your browser.
        </p>
      </div>
    </div>
  )
}
