"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"

interface WishocracyLoadingCardProps {
  isLoading: boolean
}

export function WishocracyLoadingCard({ isLoading }: WishocracyLoadingCardProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <Card className="bg-background border-4 border-primary p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-8xl mb-6"
              >
                🧞
              </motion.div>
              <h3 className="text-2xl font-black uppercase mb-2">Summoning Your Budget!</h3>
              <p className="text-muted-foreground text-center">
                Loading your previous comparisons...
              </p>
              <div className="mt-6 flex gap-2">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-3 h-3 bg-brutal-cyan border-2 border-primary"
                />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-3 h-3 bg-brutal-pink border-2 border-primary"
                />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-3 h-3 bg-brutal-cyan border-2 border-primary"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
