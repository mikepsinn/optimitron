"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data"
import { ChevronLeft } from "lucide-react"

interface WishocracyCategorySelectionProps {
  show: boolean
  onComplete: (selectedCategories: Set<BudgetCategoryId>) => void
  onBack: () => void
}

export function WishocracyCategorySelection({
  show,
  onComplete,
  onBack
}: WishocracyCategorySelectionProps) {
  const allCategories = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<Set<BudgetCategoryId>>(new Set())
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  const currentCategory = allCategories[currentIndex]
  const category = BUDGET_CATEGORIES[currentCategory]
  const progress = ((currentIndex / allCategories.length) * 100).toFixed(0)
  const isComplete = currentIndex >= allCategories.length

  // Keyboard shortcuts
  useEffect(() => {
    if (!show || isComplete) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'y' || e.key === 'Y') {
        handleFund()
      } else if (e.key === 'ArrowLeft' || e.key === 'n' || e.key === 'N') {
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [show, currentIndex, isComplete])

  const handleFund = () => {
    setDirection('right')
    setSelectedCategories(prev => new Set([...prev, currentCategory]))
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setDirection(null)
    }, 300)
  }

  const handleSkip = () => {
    setDirection('left')
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setDirection(null)
    }, 300)
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      handleFund()
    } else if (info.offset.x < -threshold) {
      handleSkip()
    }
  }

  const handleComplete = () => {
    onComplete(selectedCategories)
  }

  if (!show) return null

  return (
    <div className="max-w-2xl mx-auto mb-12">
      {/* Intro Text - Only show on first category */}
      {currentIndex === 0 && !isComplete && (
        <div className="text-center mb-6">
          <p className="text-lg font-bold mb-2">
            First, select which categories you want to fund
          </p>
          <p className="text-sm text-muted-foreground">
            This makes the comparison process faster and more relevant to you
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={currentIndex === 0 ? onBack : () => setCurrentIndex(prev => prev - 1)}
            className="flex items-center gap-1 text-sm font-bold uppercase hover:text-brutal-pink transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-sm font-bold uppercase">
            {isComplete ? 'Complete!' : `${currentIndex + 1} of ${allCategories.length}`}
          </span>
        </div>
        <div className="w-full h-3 bg-background border-2 border-primary">
          <motion.div
            className="h-full bg-brutal-cyan border-r-2 border-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Completion Screen */}
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-background border-4 border-primary p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl md:text-3xl font-black uppercase mb-4">
                  {selectedCategories.size === 0
                    ? 'All Selections Complete!'
                    : `${selectedCategories.size} ${selectedCategories.size === 1 ? 'Category' : 'Categories'} Selected!`}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {selectedCategories.size >= 2
                    ? "Now let's compare them to discover your priorities."
                    : selectedCategories.size === 1
                    ? "You've selected one category. Ready to continue?"
                    : "You've chosen $0 for all categories. Ready to continue?"}
                </p>
                <Button
                  onClick={handleComplete}
                  className="w-full h-16 text-xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {selectedCategories.size >= 2 ? 'Start Comparing →' : 'Continue →'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Category Card */
          <motion.div
            key={currentCategory}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: direction === 'left' ? -300 : 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
              transition: { duration: 0.3 }
            }}
            transition={{ duration: 0.3 }}
            className="cursor-grab active:cursor-grabbing"
          >
            <Card className="bg-background border-4 border-primary p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {/* Category Info */}
              <div className="text-center mb-8">
                <div className="text-7xl mb-6">{category.icon}</div>
                <p className="text-lg font-bold mb-2">
                  How much of your tax dollars should go to funding
                </p>
                <h3 className="text-2xl md:text-3xl font-black uppercase mb-4">
                  {category.name}
                </h3>
                <p className="text-lg text-muted-foreground">
                  {category.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="h-16 text-base sm:text-lg font-black uppercase bg-background hover:bg-muted text-foreground border-4 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-normal"
                >
                  $0
                </Button>
                <Button
                  onClick={handleFund}
                  className="h-16 text-base sm:text-lg font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-normal"
                >
                  More Than $0
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
