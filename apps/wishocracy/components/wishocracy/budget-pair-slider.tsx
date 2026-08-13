"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data"

interface BudgetPairSliderProps {
  categoryA: BudgetCategoryId
  categoryB: BudgetCategoryId
  initialAllocation?: number
  onSubmit: (allocationA: number, allocationB: number) => void
}

export function BudgetPairSlider({
  categoryA,
  categoryB,
  initialAllocation = 50,
  onSubmit,
}: BudgetPairSliderProps) {
  // Slider value represents allocation to categoryB (0-100)
  // This makes dragging right (toward B) increase B's allocation
  const [sliderValue, setSliderValue] = useState(100 - initialAllocation)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showHandHint, setShowHandHint] = useState(true)
  const [animatedSliderValue, setAnimatedSliderValue] = useState(100 - initialAllocation)

  // Reset interaction state when categories change (new pair)
  useEffect(() => {
    setHasInteracted(false)
    setShowHandHint(true)
    setSliderValue(100 - initialAllocation)
    setAnimatedSliderValue(100 - initialAllocation)

    // Animate the slider during the hand tutorial - one back and forth movement
    const animationSteps = [
      { value: 50, delay: 0 },      // Start at center
      { value: 30, delay: 600 },    // Move left (slower)
      { value: 70, delay: 1300 },   // Move right (slower)
      { value: 50, delay: 2000 },   // Return to center (slower)
    ]

    const timers: NodeJS.Timeout[] = []

    animationSteps.forEach(({ value, delay }) => {
      const timer = setTimeout(() => {
        if (!hasInteracted) {
          setAnimatedSliderValue(value)
        }
      }, delay)
      timers.push(timer)
    })

    // Hide hand hint after animation completes
    const hideTimer = setTimeout(() => {
      setShowHandHint(false)
      setAnimatedSliderValue(50)
    }, 2800)
    timers.push(hideTimer)

    return () => timers.forEach(timer => clearTimeout(timer))
  }, [categoryA, categoryB, initialAllocation])

  const catA = BUDGET_CATEGORIES[categoryA]
  const catB = BUDGET_CATEGORIES[categoryB]

  // Calculate allocations from slider value
  // Always use actual slider value (not animated) so slider stays at 50% during tutorial
  const displayValue = sliderValue
  const allocationB = displayValue
  const allocation = 100 - displayValue

  const handleSliderChange = (value: number) => {
    setSliderValue(value)
    if (!hasInteracted) {
      setHasInteracted(true)
      setShowHandHint(false) // Hide tutorial immediately on interaction
    }
  }

  const handleSubmit = () => {
    onSubmit(allocation, allocationB)
  }

  // Guard against invalid categories
  if (!catA || !catB) {
    return (
      <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto">
        <p className="text-center text-red-500 font-bold">
          Error: Invalid category data. Please refresh the page.
        </p>
      </Card>
    )
  }

  return (
    <Card className="bg-background border-4 border-primary p-6 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto">
      {/* Instructions */}
      <p className="text-center text-sm text-muted-foreground mb-6">
        Of total funding available for both, drag slider to indicate how much should go to one vs the other.
      </p>

      {/* Icons + Percentages + Names Above Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 text-center">
            <div className="text-6xl mb-3">{catA.icon}</div>
            <div className="text-4xl sm:text-5xl font-black text-brutal-pink mb-2">
              {allocation}%
            </div>
            <div className="text-sm sm:text-base font-bold uppercase px-2">
              {catA.name}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-6xl mb-3">{catB.icon}</div>
            <div className="text-4xl sm:text-5xl font-black text-brutal-cyan mb-2">
              {allocationB}%
            </div>
            <div className="text-sm sm:text-base font-bold uppercase px-2">
              {catB.name}
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="relative px-2 mb-6">
          {/* Animated cursor hand hint - positioned above slider thumb */}
          {showHandHint && (
            <motion.div
              className="absolute -top-3 text-5xl pointer-events-none z-10 transition-all duration-300"
              style={{
                left: `calc(${animatedSliderValue}% - 20px)`,
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ☝️
            </motion.div>
          )}

          <input
            type="range"
            min="0"
            max="100"
            value={displayValue}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-4 bg-background border-4 border-primary rounded-none appearance-none cursor-pointer slider-brutal"
            style={{
              background: `linear-gradient(to right, #FF6B9D ${allocation}%, #00D9FF ${allocation}%)`,
            }}
          />
        </div>

        {/* Descriptions Below Slider */}
        <div className="flex justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="text-xs md:text-sm text-muted-foreground max-w-[250px] mx-auto">
              {catA.description}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs md:text-sm text-muted-foreground max-w-[250px] mx-auto">
              {catB.description}
            </div>
          </div>
        </div>
      </div>

      {hasInteracted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={handleSubmit}
            className="w-full h-16 text-xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            SUBMIT CHOICE
          </Button>
        </motion.div>
      )}

      {/* Slider styles */}
      <style jsx>{`
        .slider-brutal::-webkit-slider-thumb {
          appearance: none;
          width: 32px;
          height: 32px;
          background: black;
          border: 4px solid black;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
        }

        .slider-brutal::-moz-range-thumb {
          width: 32px;
          height: 32px;
          background: black;
          border: 4px solid black;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
          border-radius: 0;
        }
      `}</style>
    </Card>
  )
}
