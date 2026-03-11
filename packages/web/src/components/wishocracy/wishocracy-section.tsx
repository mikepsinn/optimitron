"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useWishocracyState } from "@/hooks/useWishocracyState";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";
import { BudgetPairSlider } from "./budget-pair-slider";
import { ProgressIndicator } from "./progress-indicator";
import { WishocracyAllocationCard } from "./WishocracyAllocationCard";
import { WishocracyAuthPromptCard } from "./WishocracyAuthPromptCard";
import { WishocracyCategorySelection } from "./WishocracyCategorySelection";
import { WishocracyCompletionCard } from "./WishocracyCompletionCard";
import { WishocracyEditSection } from "./WishocracyEditSection";
import { WishocracyIntroCard } from "./WishocracyIntroCard";
import { WishocracyLoadingCard } from "./WishocracyLoadingCard";
import { WishocracyResetButton } from "./WishocracyResetButton";
import { WishocracyStatusBar } from "./WishocracyStatusBar";

export default function WishocracySection() {
  const { state, handlers } = useWishocracyState();
  const baseUrl = getBaseUrl();
  const shareUrl = state.session?.user
    ? buildUserReferralUrl(state.session.user, baseUrl)
    : `${baseUrl}/vote`;
  const isAuthenticated = state.status === "authenticated";
  const referralCode = state.searchParams?.get("ref") ?? null;
  const isComplete =
    !state.showIntro &&
    !state.showCategorySelection &&
    state.comparisons.length >= state.totalPossiblePairs;

  return (
    <section className="min-h-screen border-b-4 border-black bg-brutal-yellow pb-32 pt-4">
      <div className="mx-auto max-w-6xl px-4">
        <WishocracyLoadingCard isLoading={state.isLoading} />

        <WishocracyIntroCard
          show={state.showIntro}
          isLoading={state.isLoading}
          onStart={() => {
            handlers.setShowIntro(false);
            handlers.setShowCategorySelection(true);
          }}
        />

        <WishocracyCategorySelection
          show={state.showCategorySelection}
          onComplete={handlers.handleCategorySelectionComplete}
          onBack={() => {
            handlers.setShowCategorySelection(false);
            handlers.setShowIntro(true);
          }}
        />

        {!state.isLoading &&
        !state.showIntro &&
        !state.showCategorySelection &&
        state.comparisons.length < state.totalPossiblePairs ? (
          <ProgressIndicator current={state.comparisons.length} total={state.totalPossiblePairs} />
        ) : null}

        <WishocracyStatusBar
          show={!state.isLoading && !state.showIntro && !state.showCategorySelection}
          isLoading={state.isLoading}
          isAuthenticated={isAuthenticated}
          referralCode={referralCode}
          onShowAuthPrompt={() => handlers.setShowAuthPrompt(true)}
        />

        <AnimatePresence mode="wait">
          {!state.showIntro &&
          !state.showCategorySelection &&
          state.shuffledPairs[state.currentPairIndex] ? (
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
          ) : null}
        </AnimatePresence>

        <WishocracyAuthPromptCard
          show={state.showAuthPrompt}
          isAuthenticated={isAuthenticated}
          comparisonsCount={state.comparisons.length}
          referralCode={referralCode}
          authCardRef={state.authCardRef}
          onDismiss={() => handlers.setShowAuthPrompt(false)}
        />

        <WishocracyCompletionCard
          show={isComplete}
          comparisons={state.comparisons}
          isAuthenticated={isAuthenticated}
          userEmail={state.session?.user?.email}
          shareUrl={shareUrl}
        />

        <WishocracyAllocationCard
          show={!state.showIntro && !state.showCategorySelection}
          isLoading={state.isLoading}
          comparisons={state.comparisons}
        />

        {isAuthenticated && isComplete ? (
          <WishocracyEditSection
            comparisons={state.comparisons}
            selectedCategories={state.selectedCategories}
            onSave={handlers.handleEditSave}
          />
        ) : null}

        <WishocracyResetButton
          show={isComplete}
          isLoading={state.isLoading}
          hasComparisons={state.comparisons.length > 0}
          onReset={handlers.handleReset}
        />
      </div>
    </section>
  );
}
