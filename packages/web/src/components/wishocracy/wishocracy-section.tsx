"use client"

import { motion, AnimatePresence } from "framer-motion"
import { BudgetPairSlider } from "./budget-pair-slider"
import { ProgressIndicator } from "./progress-indicator"
import { WishocracyIntroCard } from "./WishocracyIntroCard"
import { WishocracyCategorySelection } from "./WishocracyCategorySelection"
import { WishocracyStatusBar } from "./WishocracyStatusBar"
import { WishocracyAuthPromptCard } from "./WishocracyAuthPromptCard"
import { WishocracyAllocationCard } from "./WishocracyAllocationCard"
import { WishocracyEditSection } from "./WishocracyEditSection"
import { WishocracyResetButton } from "./WishocracyResetButton"
import { WishocracyCompletionCard } from "./WishocracyCompletionCard"
import { WishocracyLoadingCard } from "./WishocracyLoadingCard"
import { useWishocracyState } from "@/hooks/useWishocracyState"

export default function WishocracySection() {
  const { state, handlers } = useWishocracyState()

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  return (
    <section className="bg-brutal-yellow pt-4 pb-32 border-b-4 border-primary min-h-screen">
      <div className="mx-auto max-w-6xl px-4">

        {/* Loading Genie */}
        <WishocracyLoadingCard isLoading={state.isLoading} />

        {/* Intro Card */}
        <WishocracyIntroCard
          show={state.showIntro}
          isLoading={state.isLoading}
          onStart={() => {
            handlers.setShowIntro(false)
            handlers.setShowCategorySelection(true)
          }}
        />

        {/* Category Selection */}
        <WishocracyCategorySelection
          show={state.showCategorySelection}
          onComplete={handlers.handleCategorySelectionComplete}
          onBack={() => {
            handlers.setShowCategorySelection(false)
            handlers.setShowIntro(true)
          }}
        />

        {/* Progress Bar */}
        {!state.isLoading && !state.showIntro && !state.showCategorySelection && state.comparisons.length < state.totalPossiblePairs && (
          <ProgressIndicator
            current={state.comparisons.length}
            total={state.totalPossiblePairs}
          />
        )}

        {/* Status Bar */}
        <WishocracyStatusBar
          show={!state.isLoading && !state.showIntro && !state.showCategorySelection}
          isLoading={state.isLoading}
          isAuthenticated={false}
          referralCode={null}
          onShowAuthPrompt={() => handlers.setShowAuthPrompt(true)}
        />

        {/* Current Pair Slider */}
        <AnimatePresence mode="wait">
          {!state.showIntro &&
           !state.showCategorySelection &&
           state.shuffledPairs[state.currentPairIndex] && (
            <motion.div
              key={state.currentPairIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <BudgetPairSlider
                key={`${state.shuffledPairs[state.currentPairIndex][0]}_${state.shuffledPairs[state.currentPairIndex][1]}`}
                categoryA={state.shuffledPairs[state.currentPairIndex][0]}
                categoryB={state.shuffledPairs[state.currentPairIndex][1]}
                onSubmit={handlers.handlePairSubmit}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Prompt (disabled) */}
        <WishocracyAuthPromptCard
          show={state.showAuthPrompt}
          isAuthenticated={false}
          comparisonsCount={state.comparisons.length}
          referralCode={null}
          authCardRef={state.authCardRef}
          onDismiss={() => handlers.setShowAuthPrompt(false)}
        />

        {/* Completion Celebration Card */}
        <WishocracyCompletionCard
          show={!state.showIntro && !state.showCategorySelection && state.comparisons.length >= state.totalPossiblePairs}
          comparisons={state.comparisons}
          isAuthenticated={false}
          userEmail={null}
          shareUrl={shareUrl}
        />

        {/* Budget Allocation Results */}
        <WishocracyAllocationCard
          show={!state.showIntro && !state.showCategorySelection}
          isLoading={state.isLoading}
          comparisons={state.comparisons}
        />

        {/* Edit Section - available for all users when survey is complete */}
        {!state.showIntro && !state.showCategorySelection && state.comparisons.length >= state.totalPossiblePairs && (
          <WishocracyEditSection
            comparisons={state.comparisons}
            selectedCategories={state.selectedCategories}
            onSave={handlers.handleEditSave}
          />
        )}

        {/* Reset Button */}
        <WishocracyResetButton
          show={!state.showIntro && !state.showCategorySelection && state.comparisons.length >= state.totalPossiblePairs}
          isLoading={state.isLoading}
          hasComparisons={state.comparisons.length > 0}
          onReset={handlers.handleReset}
        />
      </div>
    </section>
  )
}
