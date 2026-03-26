"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { Stat } from "@/components/ui/stat"
import { US_FEDERAL_SPENDING_2024 } from "@optimitron/data/parameters"

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
          <div className="max-w-4xl mx-auto mb-12 space-y-8">
            {/* Hero */}
            <Card className="bg-background border-4 border-primary p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h1 className="text-3xl md:text-4xl font-black uppercase text-center mb-6">
                Wishocracy
              </h1>
              <p className="font-bold text-lg sm:text-xl md:text-2xl leading-snug text-center mb-6">
                Your government spends <Stat param={{...US_FEDERAL_SPENDING_2024, unit: "USD"}} /> a year and nobody asked you how. Let&apos;s fix that.
              </p>
              <p className="text-center mb-4 text-muted-foreground">
                I&apos;m going to show you pairs of budget categories. Pick which one matters more. It takes about four minutes. On my planet this is called &ldquo;governance.&rdquo; Here it seems to be called &ldquo;radical.&rdquo;
              </p>
              <p className="text-center mb-8 text-sm text-muted-foreground">
                Your choices get aggregated with everyone else&apos;s using eigenvector analysis. It&apos;s like PageRank, but for civilisation.
              </p>
            </Card>

            {/* The Problem / The Fix — collapses with the intro when user clicks LET'S GO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-4 border-brutal-red bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-lg font-black text-foreground mb-3 uppercase">
                  What Politicians Actually Do
                </h3>
                <ul className="space-y-2 text-sm text-foreground font-bold">
                  <li className="flex gap-2">
                    <span className="text-brutal-red font-black shrink-0">&times;</span>
                    <span>Spend <span className="font-black">70% of their time</span> fundraising, not governing</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brutal-red font-black shrink-0">&times;</span>
                    <span>Donor alignment: ~80%. Citizen alignment: ~30%</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brutal-red font-black shrink-0">&times;</span>
                    <span>Block evidence-based policy that threatens their coalition</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brutal-red font-black shrink-0">&times;</span>
                    <span>Represent the median <span className="font-black">donor</span>, not the median <span className="font-black">citizen</span></span>
                  </li>
                </ul>
              </div>
              <div className="border-4 border-brutal-cyan bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-lg font-black text-foreground mb-3 uppercase">
                  What Wishocracy Does Instead
                </h3>
                <ul className="space-y-2 text-sm text-foreground font-bold">
                  <li className="flex gap-2">
                    <span className="text-brutal-cyan font-black shrink-0">&#10003;</span>
                    <span>Citizens vote directly on priorities. No fundraising. No middleman</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brutal-cyan font-black shrink-0">&#10003;</span>
                    <span>Causal engine determines which policies actually work</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brutal-cyan font-black shrink-0">&#10003;</span>
                    <span>Alignment scores expose how much each official deviates from citizen preferences</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brutal-cyan font-black shrink-0">&#10003;</span>
                    <span>Optimises for <span className="font-black">outcomes</span>, not re-election</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={onStart}
              className="w-full h-16 text-xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              LET&apos;S GO
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
