"use client"

import { RefObject } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthForm } from "@/components/auth/AuthForm"

interface WishocracyAuthPromptCardProps {
  show: boolean
  isAuthenticated: boolean
  comparisonsCount: number
  referralCode: string | null
  authCardRef: RefObject<HTMLDivElement>
  onDismiss: () => void
}

export function WishocracyAuthPromptCard({
  show,
  isAuthenticated,
  comparisonsCount,
  referralCode,
  authCardRef,
  onDismiss
}: WishocracyAuthPromptCardProps) {
  return (
    <AnimatePresence>
      {show && !isAuthenticated && (
        <motion.div
          ref={authCardRef}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto mt-8"
        >
          <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl md:text-2xl font-black uppercase mb-3">
                Great Progress! {comparisonsCount} Comparisons Done
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-2">
                Sign in now to save your work and see your personalized priority results.
              </p>
              <p className="text-xs text-muted-foreground">
                Your {comparisonsCount} comparisons are saved locally and will sync automatically.
              </p>
            </div>
            <AuthForm
              callbackUrl="/wishocracy"
              referralCode={referralCode}
              compact={true}
            />
            <Button
              onClick={onDismiss}
              variant="ghost"
              className="w-full mt-4 text-sm"
            >
              Continue without signing in
            </Button>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
