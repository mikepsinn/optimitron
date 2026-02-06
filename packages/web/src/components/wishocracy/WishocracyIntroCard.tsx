"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface WishocracyIntroCardProps {
  show: boolean
  isLoading: boolean
  onStart: () => void
}

export function WishocracyIntroCard({ show, isLoading, onStart }: WishocracyIntroCardProps) {
  return (
    <AnimatePresence>
      {show && !isLoading && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-background border-4 border-primary p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-black uppercase text-center mb-6">
              Wishocracy
            </h1>
            <p className="font-bold text-lg sm:text-xl md:text-2xl leading-snug text-center mb-6">
              Which public goods matter most to you? Compare different priorities to help shape a crowdsourced budget.
            </p>
            <p className="text-center mb-4 text-muted-foreground">
              Answer as many or as few as you like. More comparisons = clearer picture of your priorities.
            </p>
            <p className="text-center mb-8 text-sm text-muted-foreground">
              Using pairwise preference allocation, we aggregate your choices with others to determine collective priorities.
            </p>
            <Button
              onClick={onStart}
              className="w-full h-16 text-xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              START COMPARISONS
            </Button>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
