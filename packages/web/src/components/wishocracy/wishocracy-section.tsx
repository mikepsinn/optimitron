"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useWishocracyState } from "@/hooks/useWishocracyState";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";
import { WishocraticPairSlider } from "./wishocratic-pair-slider";
import { ProgressIndicator } from "./progress-indicator";
import { WishocracyAllocationCard } from "./WishocracyAllocationCard";
import { WishocracyAuthPromptCard } from "./WishocracyAuthPromptCard";
import { WishocracyItemInclusion } from "./WishocracyItemInclusion";
import { WishocracyCompletionCard } from "./WishocracyCompletionCard";
import { WishocracyEditSection } from "./WishocracyEditSection";
import { WishocracyIntroCard } from "./WishocracyIntroCard";
import { WishocracyLoadingCard } from "./WishocracyLoadingCard";
import { WishocracyReferralCard } from "./WishocracyReferralCard";
import { WishocracyResetButton } from "./WishocracyResetButton";
import { WishocracyStatusBar } from "./WishocracyStatusBar";
import { WorldIdVerificationCard } from "@/components/personhood/WorldIdVerificationCard";

export default function WishocracySection() {
  const { state, handlers } = useWishocracyState();
  const baseUrl = getBaseUrl();
  const shareUrl = state.session?.user
    ? buildUserReferralUrl(state.session.user, baseUrl)
    : `${baseUrl}/wishocracy`;
  const isAuthenticated = state.status === "authenticated";
  const referralCode = state.searchParams?.get("ref") ?? null;
  const isComplete =
    !state.showIntro &&
    !state.showItemInclusion &&
    state.allocations.length >= state.totalPossiblePairs;

  return (
    <section className="min-h-screen border-b-4 border-primary bg-brutal-yellow pb-32 pt-4">
      <div className="mx-auto max-w-6xl px-4">
        <WishocracyLoadingCard isLoading={state.isLoading} />

        <WishocracyIntroCard
          show={state.showIntro}
          isLoading={state.isLoading}
          onStart={() => {
            handlers.setShowIntro(false);
            handlers.setShowItemInclusion(true);
          }}
        />

        <WishocracyItemInclusion
          show={state.showItemInclusion}
          onComplete={handlers.handleItemInclusionComplete}
          onBack={() => {
            handlers.setShowItemInclusion(false);
            handlers.setShowIntro(true);
          }}
        />

        {!state.isLoading &&
        !state.showIntro &&
        !state.showItemInclusion &&
        state.allocations.length < state.totalPossiblePairs ? (
          <ProgressIndicator current={state.allocations.length} total={state.totalPossiblePairs} />
        ) : null}

        <WishocracyStatusBar
          show={!state.isLoading && !state.showIntro && !state.showItemInclusion}
          isLoading={state.isLoading}
          isAuthenticated={isAuthenticated}
          referralCode={referralCode}
          onShowAuthPrompt={() => handlers.setShowAuthPrompt(true)}
        />

        <WorldIdVerificationCard show={isAuthenticated && !state.isLoading} />

        <WishocracyReferralCard
          show={isAuthenticated && !state.isLoading}
          shareUrl={shareUrl}
        />

        <AnimatePresence mode="wait">
          {!state.showIntro &&
          !state.showItemInclusion &&
          state.shuffledPairs[state.currentPairIndex] ? (
            <motion.div
              key={state.currentPairIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <WishocraticPairSlider
                key={`${state.shuffledPairs[state.currentPairIndex][0]}_${state.shuffledPairs[state.currentPairIndex][1]}`}
                itemA={state.shuffledPairs[state.currentPairIndex][0]}
                itemB={state.shuffledPairs[state.currentPairIndex][1]}
                onSubmit={handlers.handlePairSubmit}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <WishocracyAuthPromptCard
          show={state.showAuthPrompt}
          isAuthenticated={isAuthenticated}
          allocationsCount={state.allocations.length}
          referralCode={referralCode}
          authCardRef={state.authCardRef}
          onDismiss={() => handlers.setShowAuthPrompt(false)}
        />

        <WishocracyCompletionCard
          show={isComplete}
          allocations={state.allocations}
          isAuthenticated={isAuthenticated}
          userEmail={state.session?.user?.email}
          shareUrl={shareUrl}
        />

        <WishocracyAllocationCard
          show={!state.showIntro && !state.showItemInclusion}
          isLoading={state.isLoading}
          allocations={state.allocations}
        />

        {isAuthenticated && isComplete ? (
          <WishocracyEditSection
            allocations={state.allocations}
            selectedItemIds={state.selectedItemIds}
            onSave={handlers.handleEditSave}
          />
        ) : null}

        <WishocracyResetButton
          show={isComplete}
          isLoading={state.isLoading}
          hasAllocations={state.allocations.length > 0}
          onReset={handlers.handleReset}
        />
      </div>
    </section>
  );
}
