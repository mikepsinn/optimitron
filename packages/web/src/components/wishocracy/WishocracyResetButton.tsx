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
        className="w-full h-14 text-base font-black uppercase bg-background hover:bg-muted text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        🔄 START OVER
      </Button>
      <p className="text-center text-xs text-muted-foreground mt-2">
        Clear all comparisons and begin fresh
      </p>
    </div>
  )
}
