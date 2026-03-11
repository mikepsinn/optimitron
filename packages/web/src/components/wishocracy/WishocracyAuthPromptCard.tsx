"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WishocracyAuthPromptCardProps {
  show: boolean;
  isAuthenticated: boolean;
  comparisonsCount: number;
  referralCode: string | null;
  authCardRef: RefObject<HTMLDivElement>;
  onDismiss: () => void;
}

export function WishocracyAuthPromptCard({
  show,
  isAuthenticated,
  comparisonsCount,
  referralCode,
  authCardRef,
  onDismiss,
}: WishocracyAuthPromptCardProps) {
  return (
    <AnimatePresence>
      {show && !isAuthenticated ? (
        <motion.div
          ref={authCardRef}
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 40 }}
          transition={{ duration: 0.3 }}
          className="mx-auto mt-8 max-w-2xl"
        >
          <Card className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-6 text-center">
              <div className="mb-4 text-4xl">ALLOCATE</div>
              <h3 className="text-xl font-black uppercase">
                {comparisonsCount} Comparisons Saved Locally
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Create an account now and Optomitron will keep your allocations, progress, and
                referral link synced across sessions.
              </p>
            </div>

            <AuthForm callbackUrl="/vote" referralCode={referralCode} compact />

            <Button type="button" variant="ghost" className="mt-4 w-full" onClick={onDismiss}>
              Continue Without Signing In
            </Button>
          </Card>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
