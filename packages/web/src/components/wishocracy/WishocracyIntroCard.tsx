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
          <Card className="bg-background border-4 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-black uppercase text-center mb-6">
              Wishocracy
            </h1>
            <p className="font-bold text-lg sm:text-xl md:text-2xl leading-snug text-center mb-6">
              Your government spends $6.75 trillion a year and nobody asked you how. Let&apos;s fix that.
            </p>
            <p className="text-center mb-4 text-muted-foreground">
              I&apos;m going to show you pairs of budget categories. Pick which one matters more. It takes about four minutes. On my planet this is called &ldquo;governance.&rdquo; Here it seems to be called &ldquo;radical.&rdquo;
            </p>
            <p className="text-center mb-8 text-sm text-muted-foreground">
              Your choices get aggregated with everyone else&apos;s using eigenvector analysis. It&apos;s like PageRank, but for civilisation.
            </p>
            <Button
              onClick={onStart}
              className="w-full h-16 text-xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              LET&apos;S GO
            </Button>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
