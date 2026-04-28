"use client";

import { Button } from "@/components/retroui/Button";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Square, CheckSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { storage } from "@/lib/storage";
import { TreatyPostVoteShareFlow } from "@/components/landing/TreatyPostVoteShareFlow";
import { AuthForm } from "@/components/auth/AuthForm";
import { syncPendingReferendumVotes } from "@/lib/referendum-vote-sync";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import {
  trackSliderSubmitted,
  trackTreatyFlowScreenAdvanced,
  trackVoteSubmitted,
} from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";
import { VOTE_SECTION } from "@/lib/messaging";
import {
  buildTreatyWishocraticAllocation,
  getMilitaryAllocationPercentFromPendingTreatyVote,
  getTreatyWishocraticAllocation,
} from "@/lib/treaty-vote";
import { cn } from "@/lib/utils";
import {
  TreatyFlowButtonRow,
  TreatyFlowDivider,
  TreatyFlowParagraph,
  TreatyFlowShell,
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
} from "@/components/landing/TreatyFlowShell";
import {
  DEFAULT_TREATY_FLOW_VARIANT,
  normalizeTreatyFlowVariant,
  TREATY_FLOW_VARIANT_QUERY_PARAM,
  TREATY_FLOW_VARIANTS,
  type TreatyFlowVariant,
} from "@/lib/treaty-flow-variants";
import {
  FLOW_GLOBAL_WARHEAD_COUNT,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  FLOW_WASTEFUL_APOCALYPSES,
} from "@/lib/treaty-share-flow-parameters";

type PreVoteScreen = "apology" | "grandma" | "apocalypse" | "slider";

interface TreatyVoteFlowProps {
  authCallbackUrl?: string;
  className?: string;
  defaultFlowVariant?: TreatyFlowVariant;
  postVoteBehavior?: "overlay" | "redirect";
  postVoteRedirectUrl?: string;
  respectStoredFlowVariant?: boolean;
  surface?: string;
}

export function TreatyVoteFlow({
  authCallbackUrl = ROUTES.dashboard,
  className,
  defaultFlowVariant = DEFAULT_TREATY_FLOW_VARIANT,
  postVoteBehavior = "overlay",
  postVoteRedirectUrl = ROUTES.dashboard,
  respectStoredFlowVariant = true,
  surface = "treaty_vote_flow",
}: TreatyVoteFlowProps) {
  const searchParams = useSearchParams();
  const queryFlowVariant =
    normalizeTreatyFlowVariant(searchParams?.get(TREATY_FLOW_VARIANT_QUERY_PARAM)) ??
    normalizeTreatyFlowVariant(searchParams?.get("flowVariant"));
  const initialFlowVariant = queryFlowVariant ?? defaultFlowVariant;
  const initialPreVoteScreen: PreVoteScreen =
    initialFlowVariant === TREATY_FLOW_VARIANTS.contextFirstV2
      ? "apology"
      : "slider";

  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [militaryAllocation, setMilitaryAllocation] = useState<number>(50);
  const [flowVariant, setFlowVariant] =
    useState<TreatyFlowVariant>(initialFlowVariant);
  const [preVoteScreen, setPreVoteScreen] =
    useState<PreVoteScreen>(initialPreVoteScreen);
  const [preVoteAlt, setPreVoteAlt] = useState(false);
  const [preVoteDismissiveCount, setPreVoteDismissiveCount] = useState(0);
  const [showSlider, setShowSlider] = useState(initialPreVoteScreen === "slider");
  const [sliderSubmitted, setSliderSubmitted] = useState(false);
  const [userHasDragged, setUserHasDragged] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(50);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const sliderSectionRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const postVoteRedirectStartedRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const requestedVariant =
      normalizeTreatyFlowVariant(searchParams?.get(TREATY_FLOW_VARIANT_QUERY_PARAM)) ??
      normalizeTreatyFlowVariant(searchParams?.get("flowVariant")) ??
      (respectStoredFlowVariant
        ? normalizeTreatyFlowVariant(storage.getTreatyFlowVariant())
        : null) ??
      defaultFlowVariant;

    setFlowVariant(requestedVariant);
    storage.setTreatyFlowVariant(requestedVariant);

    if (!sliderSubmitted && !answer) {
      const nextPreVoteScreen =
        requestedVariant === TREATY_FLOW_VARIANTS.contextFirstV2
          ? "apology"
          : "slider";
      setPreVoteScreen(nextPreVoteScreen);
      setShowSlider(nextPreVoteScreen === "slider");
      setPreVoteAlt(false);
      setPreVoteDismissiveCount(0);
    }
  }, [answer, defaultFlowVariant, respectStoredFlowVariant, searchParams, sliderSubmitted]);

  // Restore state from localStorage on mount
  useEffect(() => {
    const pendingTreatyVote = storage.getPendingTreatyVote();
    const pendingMilitaryAllocation = getMilitaryAllocationPercentFromPendingTreatyVote(pendingTreatyVote);

    if (pendingTreatyVote && pendingMilitaryAllocation !== null) {
      setMilitaryAllocation(pendingMilitaryAllocation);
      setSliderSubmitted(true);
      setShowSlider(false);
      setUserHasDragged(true);
      if (pendingTreatyVote.answer) {
        setAnswer(pendingTreatyVote.answer.toLowerCase() as "yes" | "no");
      }
    }
  }, []);

  useEffect(() => {
    const referralCode = searchParams?.get("ref");
    const shareAttemptId = searchParams?.get("sa");
    const inviteToken = searchParams?.get("invite");

    if (referralCode) {
      storage.setSignupReferral(referralCode);
    }
    if (shareAttemptId) {
      storage.setSignupShareAttempt(shareAttemptId);
    }
    if (inviteToken) {
      storage.setSignupInviteToken(inviteToken);
    }
  }, [searchParams]);

  // Intersection Observer to trigger animation when slider comes into view
  useEffect(() => {
    if (!sliderSectionRef.current || userHasDragged) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !userHasDragged) {
            setTimeout(() => setShowAnimation(true), 500);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(sliderSectionRef.current);
    return () => observer.disconnect();
  }, [userHasDragged]);

  // Animate the slider value when animation is active
  useEffect(() => {
    if (!showAnimation || userHasDragged) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let startTime: number | null = null;
    const cycleDuration = 2000;
    const totalCycles = 2;
    const totalDuration = cycleDuration * totalCycles;
    const minValue = 20;
    const maxValue = 80;
    const centerValue = 50;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed >= totalDuration) {
        setAnimatedValue(centerValue);
        setMilitaryAllocation(centerValue);
        setShowAnimation(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const progress = (elapsed % cycleDuration) / cycleDuration;
      let value: number;
      if (progress < 0.5) {
        const t = progress * 2;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        value = minValue + (maxValue - minValue) * eased;
      } else {
        const t = (progress - 0.5) * 2;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        value = maxValue - (maxValue - minValue) * eased;
      }

      setAnimatedValue(value);
      setMilitaryAllocation(100 - Math.round(value));
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showAnimation, userHasDragged]);

  // Sync pending vote when user authenticates
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (status === "authenticated" && session && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      void syncPendingReferendumVotes(session);
    }
  }, [status, session]);

  const triggerConfetti = () => {
    const colors = ["#FF6B9D", "#00D9FF", "#FFE66D"];
    const count = 200;
    const defaults = { origin: { y: 0.7 }, colors };

    function fire(particleRatio: number, opts: confetti.Options) {
      void confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const isContextFirstVariant =
    flowVariant === TREATY_FLOW_VARIANTS.contextFirstV2;

  const advancePreVote = (next: PreVoteScreen, dismissive = false) => {
    const nextDismissiveCount = dismissive
      ? preVoteDismissiveCount + 1
      : preVoteDismissiveCount;

    trackTreatyFlowScreenAdvanced({
      from: preVoteScreen,
      to: next,
      dismissive,
      dismissiveCount: nextDismissiveCount,
      flowVariant,
    });

    setPreVoteAlt(dismissive);
    if (dismissive) {
      setPreVoteDismissiveCount((count) => count + 1);
    }
    setPreVoteScreen(next);
    if (next === "slider") {
      setShowSlider(true);
    }
  };

  const handleSliderChange = (value: number) => {
    setMilitaryAllocation(value);
    if (!userHasDragged) {
      setUserHasDragged(true);
      setShowAnimation(false);
    }
  };

  const handleSliderSubmit = () => {
    const existingVote = storage.getPendingTreatyVote();
    const referralCode = searchParams?.get("ref") || existingVote?.referredBy || null;
    const inviteToken = searchParams?.get("invite") || existingVote?.inviteToken || storage.getSignupInviteToken();
    const timestamp = existingVote?.timestamp || new Date().toISOString();

    storage.setPendingTreatyVote({
      answer: existingVote?.answer ?? "",
      referredBy: referralCode,
      inviteToken,
      timestamp,
      wishocraticAllocation: buildTreatyWishocraticAllocation(militaryAllocation, timestamp),
      organizationId: existingVote?.organizationId ?? null,
    });
    trackSliderSubmitted({
      flowVariant,
      militaryAllocationPercent: militaryAllocation,
    });
    setSliderSubmitted(true);
    setShowSlider(false);

    if (status === "authenticated" && session) {
      void syncPendingReferendumVotes(session);
    }
  };

  const clinicalTrialsAllocation = 100 - militaryAllocation;

  const handleAnswer = async (choice: "yes" | "no") => {
    setAnswer(choice);
    trackVoteSubmitted({
      voteType: "treaty_vote",
      answer: choice.toUpperCase(),
      authenticated: status === "authenticated",
      flowVariant,
      surface,
    });

    if (choice === "yes") {
      triggerConfetti();
    }

    const existingVote = storage.getPendingTreatyVote();
    const referralCode = searchParams?.get("ref") || existingVote?.referredBy || null;
    const inviteToken = searchParams?.get("invite") || existingVote?.inviteToken || storage.getSignupInviteToken();
    const timestamp = existingVote?.timestamp || new Date().toISOString();

    storage.setPendingTreatyVote({
      answer: choice.toUpperCase(),
      referredBy: referralCode,
      inviteToken,
      timestamp,
      wishocraticAllocation:
        getTreatyWishocraticAllocation(existingVote) ??
        buildTreatyWishocraticAllocation(militaryAllocation, timestamp),
      organizationId: existingVote?.organizationId ?? null,
    });

    storage.clearVoteStatusCache();

    if (status === "authenticated" && session && postVoteBehavior === "overlay") {
      void syncPendingReferendumVotes(session).then(() => {
        const referralIdentifier = getUsernameOrReferralCode(session.user);
        if (referralIdentifier) {
          storage.setVoteStatusCache({
            hasVoted: true,
            voteAnswer: choice.toUpperCase(),
            referralCode: referralIdentifier,
          });
        }
      });
    }
  };

  useEffect(() => {
    if (
      !answer ||
      postVoteBehavior !== "redirect" ||
      status !== "authenticated" ||
      !session ||
      postVoteRedirectStartedRef.current
    ) {
      return;
    }

    postVoteRedirectStartedRef.current = true;
    void syncPendingReferendumVotes(session)
      .then(() => {
        const referralIdentifier = getUsernameOrReferralCode(session.user);
        if (referralIdentifier) {
          storage.setVoteStatusCache({
            hasVoted: true,
            voteAnswer: answer.toUpperCase(),
            referralCode: referralIdentifier,
          });
        }
      })
      .finally(() => {
        window.location.href = postVoteRedirectUrl;
      });
  }, [answer, postVoteBehavior, postVoteRedirectUrl, session, status]);

  const renderPreVoteScreen = () => {
    switch (preVoteScreen) {
      case "apology":
        return (
          <TreatyFlowShell
            data-screen="apology"
            data-testid="treaty-vote-prelude-card"
            contentClassName="max-w-3xl"
          >
            <TreatyFlowParagraph
              dropCap
              className="mx-auto max-w-3xl text-xl leading-9 sm:text-2xl sm:leading-10"
            >
              I&apos;m very sorry to bother you, but this is kind of the most
              important thing in the universe and it will only take a few
              moments of your time.
            </TreatyFlowParagraph>
            <TreatyFlowButtonRow>
              <Button
                className={treatySecondaryButtonClass}
                onClick={() => advancePreVote("grandma", true)}
              >
                Go to hell
              </Button>
              <Button
                className={treatyPrimaryButtonClass}
                onClick={() => advancePreVote("grandma")}
              >
                Fine
              </Button>
            </TreatyFlowButtonRow>
          </TreatyFlowShell>
        );
      case "grandma":
        return (
          <TreatyFlowShell
            data-screen="grandma"
            data-testid="treaty-vote-prelude-card"
            contentClassName="max-w-3xl"
          >
            <div className="space-y-6">
              {preVoteAlt ? (
                <TreatyFlowParagraph>I don&apos;t have the ability to go to hell. Continuing.</TreatyFlowParagraph>
              ) : null}
              <figure className="mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden border border-[#23180d] bg-[#fffdf8]">
                <img
                  alt="Grandma Kay sitting on a bench"
                  className="h-full w-full object-cover object-[50%_15%] grayscale"
                  data-testid="treaty-grandma-photo"
                  src="/img/grandma.jpg"
                />
              </figure>
              <TreatyFlowParagraph>
                This is Grandma Kay.
              </TreatyFlowParagraph>
              <TreatyFlowParagraph>
                She&apos;s really nice.
              </TreatyFlowParagraph>
              <TreatyFlowParagraph>
                Her brain is turning into mush because the money for fixing that was busy turning into missiles.
              </TreatyFlowParagraph>
            </div>
            <TreatyFlowButtonRow>
              <Button
                className={treatySecondaryButtonClass}
                onClick={() => advancePreVote("apocalypse", true)}
              >
                I don&apos;t care
              </Button>
              <Button
                className={treatyPrimaryButtonClass}
                onClick={() => advancePreVote("apocalypse")}
              >
                That&apos;s a shame
              </Button>
            </TreatyFlowButtonRow>
          </TreatyFlowShell>
        );
      case "apocalypse":
        return (
          <TreatyFlowShell
            data-screen="apocalypse"
            data-testid="treaty-vote-prelude-card"
            contentClassName="max-w-3xl"
          >
            <div className="space-y-4">
              {preVoteDismissiveCount > 0 ? (
                <TreatyFlowParagraph>Cool. The 122 apocalypses haven&apos;t moved.</TreatyFlowParagraph>
              ) : null}
              <TreatyFlowParagraph>
                <ParameterValue param={FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD} figures={1} />{" "}
                nuclear weapons exploding triggers a nuclear winter that
                collapses the food chain and kills most humans.
              </TreatyFlowParagraph>
              <TreatyFlowParagraph>
                Humanity has about{" "}
                <ParameterValue param={FLOW_GLOBAL_WARHEAD_COUNT} figures={2} />{" "}
                nuclear weapons. That&apos;s{" "}
                <ParameterValue param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} figures={3} />{" "}
                apocalypses of mass murder capacity.
              </TreatyFlowParagraph>
              <TreatyFlowParagraph>
                You can only ruin Earth once. The other{" "}
                <ParameterValue param={FLOW_WASTEFUL_APOCALYPSES} figures={3} />{" "}
                are just wasteful.
              </TreatyFlowParagraph>
              <TreatyFlowParagraph>
                The 1% Treaty asks you to trade one apocalypse for something
                slightly nicer.
              </TreatyFlowParagraph>
            </div>
            <TreatyFlowButtonRow>
              <Button
                className={treatySecondaryButtonClass}
                onClick={() => advancePreVote("slider", true)}
              >
                More apocalypses please
              </Button>
              <Button
                className={treatyPrimaryButtonClass}
                onClick={() => advancePreVote("slider")}
              >
                Fewer apocalypses please
              </Button>
            </TreatyFlowButtonRow>
          </TreatyFlowShell>
        );
      case "slider":
        return null;
    }
  };

  if (answer && isMounted && postVoteBehavior === "redirect") {
    const isWaitingForAuth = status === "loading" || status === "authenticated";

    return (
      <div
        className={cn(
          "relative left-1/2 w-screen max-w-none -translate-x-1/2 bg-[#fbf7ee]",
          className,
        )}
      >
        <motion.div
          ref={shareCardRef}
          data-testid="treaty-post-vote-redirect"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: [0.87, 0, 0.13, 1],
          }}
        >
          {isWaitingForAuth ? (
            <TreatyFlowShell contentClassName="max-w-2xl">
              <div className="space-y-4 text-center">
                <p className="text-2xl font-black uppercase leading-tight tracking-[0.08em] text-[#23180d] sm:text-3xl">
                  Vote counted.
                </p>
                <p className="text-base font-bold leading-8 text-[#2f2417] sm:text-lg">
                  Saving your vote and opening Humanity Management Training.
                </p>
              </div>
            </TreatyFlowShell>
          ) : (
            <TreatyFlowShell contentClassName="max-w-2xl">
              <div className="space-y-4">
                <p className="text-center text-2xl font-black uppercase leading-tight tracking-[0.08em] text-[#23180d] sm:text-3xl">
                  Vote counted.
                </p>
                <p className="text-center text-base font-bold leading-8 text-[#2f2417] sm:text-lg">
                  Governments won&apos;t listen to bot votes. They barely
                  listen to human ones, but at least yours will be on file.
                  Verify you&apos;re a real human so yours counts in the final
                  tally and opens Humanity Management Training.
                </p>
              </div>
              <AuthForm
                callbackUrl={authCallbackUrl}
                referralCode={searchParams?.get("ref")}
                shareAttemptId={searchParams?.get("sa")}
                compact={true}
                hideContainer
                title={null}
                googleButtonLabel="Verify with Google"
                emailButtonLabel="Verify by email"
                emailPendingButtonLabel="Sending verification link..."
                emailSuccessFooter={VOTE_SECTION.emailSuccessFooter}
              />
            </TreatyFlowShell>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative left-1/2 w-screen max-w-none -translate-x-1/2 bg-[#fbf7ee]",
        className,
      )}
    >
      {isContextFirstVariant && !sliderSubmitted && !showSlider
        ? renderPreVoteScreen()
        : null}

      {/* Slider Card — Shows First */}
      <AnimatePresence>
        {showSlider && (
          <motion.div
            ref={sliderSectionRef}
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ duration: 0.4 }}
          >
            <TreatyFlowShell
              data-screen="slider"
              data-testid="treaty-vote-slider-card"
              contentClassName="max-w-4xl"
            >
              <TreatyFlowParagraph
                dropCap
                className="mx-auto max-w-3xl text-xl leading-9 sm:text-2xl sm:leading-10"
              >
                {VOTE_SECTION.sliderPrompt}
              </TreatyFlowParagraph>
              <TreatyFlowDivider />

              {/* Allocation Display */}
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 sm:gap-12">
                  <div className="text-center">
                    <div className="mb-2 text-5xl font-black text-[#23180d] sm:text-6xl">
                      {militaryAllocation}%
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[#5e513f] sm:text-sm">
                      Military &amp; Weapons
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 text-5xl font-black text-[#23180d] sm:text-6xl">
                      {clinicalTrialsAllocation}%
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[#5e513f] sm:text-sm">
                      Clinical Trials
                    </div>
                  </div>
                </div>

                {/* Slider with Animation */}
                <div className="relative px-2 pt-3">
                  <AnimatePresence>
                    {showAnimation && !userHasDragged && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="absolute -top-20 z-10 pointer-events-none"
                          style={{
                            left: `${animatedValue}%`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          <div className="border border-[#23180d] bg-[#fffdf8] px-4 py-2">
                            <p className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em] text-[#23180d]">
                              Slide me
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          className="absolute z-20 pointer-events-none"
                          style={{
                            left: `${animatedValue}%`,
                            transform: "translateX(-50%)",
                            top: "16px",
                          }}
                        >
                          <div className="h-8 w-px bg-[#23180d]" />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={clinicalTrialsAllocation}
                    onChange={(e) =>
                      handleSliderChange(100 - Number(e.target.value))
                    }
                    className="h-3 w-full cursor-pointer appearance-none rounded-none border border-[#23180d] bg-[#fbf7ee] slider-treaty"
                    style={{
                      background: `linear-gradient(to right, #23180d ${militaryAllocation}%, #d8c7a4 ${militaryAllocation}%)`,
                      accentColor: "#23180d",
                    }}
                  />
                </div>
              </div>

              {/* Submit Button — Only shows after user has dragged */}
              <AnimatePresence>
                {userHasDragged && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <Button
                      onClick={handleSliderSubmit}
                      className={`${treatyPrimaryButtonClass} w-full text-base sm:text-lg`}
                    >
                      SUBMIT
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </TreatyFlowShell>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reality Check + Vote Card — Shows After Slider */}
      <AnimatePresence>
        {sliderSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TreatyFlowShell
              data-screen="choice"
              data-testid="treaty-vote-choice-card"
              contentClassName="max-w-4xl space-y-5 py-6 sm:space-y-8 sm:py-12"
            >
              <TreatyFlowParagraph dropCap className="text-lg leading-8 sm:text-2xl sm:leading-10">
                Your governments spend{" "}
                <br className="hidden sm:block" />
                <span className="font-black text-[#23180d]">
                  $<ParameterValue param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO} />
                </span>{" "}
                {VOTE_SECTION.realityCheck}
              </TreatyFlowParagraph>

              <TreatyFlowParagraph center className="text-sm leading-7 sm:text-lg sm:leading-8">
                Moving 1% of military spending to pragmatic clinical trials
                would increase clinical trial capacity by{" "}
                <ParameterValue
                  param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                  className="font-black text-[#23180d]"
                  display="withUnit"
                  figures={2}
                />
                , compressing disease eradication from{" "}
                <ParameterValue
                  param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                  className="font-black text-[#23180d]"
                  figures={3}
                />{" "}
                years to{" "}
                <ParameterValue
                  param={DFDA_QUEUE_CLEARANCE_YEARS}
                  className="font-black text-[#23180d]"
                  figures={2}
                />
                {" "}years.
              </TreatyFlowParagraph>

              <div className="text-center text-xl font-black leading-tight text-[#23180d] sm:text-3xl md:text-4xl">
                {VOTE_SECTION.theQuestion}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Button
                  onClick={() => void handleAnswer("yes")}
                  className={`${treatyPrimaryButtonClass} h-14 w-full text-lg sm:h-16 sm:text-xl`}
                >
                  {answer === "yes" ? (
                    <CheckSquare className="h-6 w-6" />
                  ) : (
                    <Square className="h-6 w-6" />
                  )}
                  YES
                </Button>
                <Button
                  onClick={() => void handleAnswer("no")}
                  className={`${treatySecondaryButtonClass} h-14 w-full text-lg sm:h-16 sm:text-xl`}
                >
                  {answer === "no" ? (
                    <CheckSquare className="h-6 w-6" />
                  ) : (
                    <Square className="h-6 w-6" />
                  )}
                  NO
                </Button>
              </div>
            </TreatyFlowShell>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth or Share Card — Shows After Vote */}
      {answer && isMounted && postVoteBehavior === "overlay"
        ? createPortal(
          <motion.div
            ref={shareCardRef}
            data-testid="treaty-post-vote-overlay"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.87, 0, 0.13, 1],
            }}
            className="fixed inset-0 z-[150] overflow-y-auto bg-[#fbf7ee]"
          >
            {status === "authenticated" ? (
              <TreatyPostVoteShareFlow
                answer={answer}
                flowVariant={flowVariant}
                initialAlt={isContextFirstVariant && preVoteDismissiveCount > 0}
                initialDismissiveCount={
                  isContextFirstVariant ? preVoteDismissiveCount : 0
                }
                initialScreen={isContextFirstVariant ? "stakes" : "opening"}
              />
            ) : (
              <TreatyFlowShell contentClassName="max-w-2xl">
                <div className="space-y-4">
                  <p className="text-center text-2xl font-black uppercase leading-tight tracking-[0.08em] text-[#23180d] sm:text-3xl">
                    {isContextFirstVariant ? "Vote counted." : "Save Your Vote"}
                  </p>
                  <p className="text-center text-base font-bold leading-8 text-[#2f2417] sm:text-lg">
                    {isContextFirstVariant ? (
                      <>
                        Governments won&apos;t listen to bot votes. They barely
                        listen to human ones, but at least yours will be on
                        file. Verify you&apos;re a real human so yours counts in
                        the final tally.
                      </>
                    ) : (
                      <>
                        When the treaty passes, you will be personally to blame
                        for saving{" "}
                        <ParameterValue
                          param={VOTER_LIVES_SAVED}
                          className="font-black text-[#23180d]"
                        />{" "}
                        lives and preventing{" "}
                        <ParameterValue
                          param={VOTER_SUFFERING_HOURS_PREVENTED}
                          className="font-black text-[#23180d]"
                        />{" "}
                        hours of suffering.
                      </>
                    )}
                  </p>
                </div>
                <AuthForm
                  callbackUrl={authCallbackUrl}
                  referralCode={searchParams?.get("ref")}
                  shareAttemptId={searchParams?.get("sa")}
                  compact={true}
                  hideContainer
                  title={null}
                  googleButtonLabel={isContextFirstVariant ? "Verify with Google" : "Save with Google"}
                  emailButtonLabel={isContextFirstVariant ? "Verify by email" : "Email me a save link"}
                  emailPendingButtonLabel={isContextFirstVariant ? "Sending verification link..." : "Sending save link..."}
                  emailSuccessFooter={VOTE_SECTION.emailSuccessFooter}
                />
              </TreatyFlowShell>
            )}
          </motion.div>
          ,
          document.body,
        )
        : null}

      {/* Slider thumb styles */}
      <style jsx global>{`
        input.slider-treaty {
          appearance: none;
          accent-color: #23180d;
        }

        .slider-treaty::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: black;
          border: 1px solid black;
          border-radius: 0;
          cursor: pointer;
          box-shadow: none;
        }

        .slider-treaty::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: black;
          border: 1px solid black;
          cursor: pointer;
          box-shadow: none;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}
