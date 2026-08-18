"use client"

import { Button } from "@/components/retroui/Button"

interface WishocracyResetButtonProps {
  show: boolean
  isLoading: boolean
  hasAllocations: boolean
  onReset: () => void
}

export function WishocracyResetButton({
  show,
  isLoading,
  hasAllocations,
  onReset
}: WishocracyResetButtonProps) {
  if (!show || isLoading || !hasAllocations) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Button
        onClick={onReset}
        variant="outline"
        className="w-full h-14 text-base font-black uppercase bg-background hover:bg-muted text-foreground border-4 border-primary shadow-none"
      >
        🔄 START OVER
      </Button>
      <p className="text-center text-xs text-muted-foreground mt-2">
        Clear all comparisons and begin fresh
      </p>
    </div>
  )
}
