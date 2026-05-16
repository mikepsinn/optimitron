"use client";

import { Button } from "@/components/retroui/Button";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, Hand, Square } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { storage } from "@/lib/storage";
import { TreatyPostVoteShareFlow } from "@/components/landing/TreatyPostVoteShareFlow";
import { AuthForm } from "@/components/auth/AuthForm";
import { CivilizationOsLoaderMark } from "@/components/ui/civilization-os-loader";
import { syncPendingReferendumVotes } from "@/lib/referendum-vote-sync";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  NUCLEAR_OVERKILL_BUTTON_REJECT_RESPONSE,
  NUCLEAR_OVERKILL_FULL_EXPLANATION,
} from "@optimitron/data/campaign";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import { ParameterTemplate } from "@/components/shared/ParameterTemplate";
// Convert the ratio to percentages so the reality-check matches the format
// the user just used on the slider (their answer was a %, today's reality
// should also be a %). Module-level so the math runs once, not per render.
const TRIALS_BUDGET_PCT_TODAY =
  100 / (MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value + 1);
const MILITARY_BUDGET_PCT_TODAY = 100 - TRIALS_BUDGET_PCT_TODAY;
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

const fullExplanationSentences =
  NUCLEAR_OVERKILL_FULL_EXPLANATION.match(/[^.]+\./g)?.map((sentence) =>
    sentence.trim(),
  ) ?? [];

if (fullExplanationSentences.length !== 3) {
  throw new Error("NUCLEAR_OVERKILL_FULL_EXPLANATION must be three sentences.");
}

const fullExplanationParagraphs = [
  fullExplanationSentences[0]!,
  fullExplanationSentences.slice(1).join(" "),
] as const;

interface TreatyVoteFlowProps {
  authCallbackUrl?: string;
  className?: string;
  compactInitialScreen?: boolean;
  defaultFlowVariant?: TreatyFlowVariant;
  organizationSlug?: string | null;
  postVoteBehavior?: "overlay" | "redirect";
  postVoteCompletion?: "share" | "message";
  postVoteRedirectUrl?: string;
  respectStoredFlowVariant?: boolean;
  sliderHeadline?: string;
  surface?: string;
}

const DEFAULT_SLIDER_HEADLINE = "Please Take 30 Seconds to End War and Disease";
const CHOICE_CARD_SETTLED_SCROLL_DELAY_MS = 500;

function NuclearOverkillTemplate({ template }: { template: string }) {
  return (
    <ParameterTemplate
      template={template}
      values={{
        GLOBAL_WARHEAD_COUNT: (
          <ParameterValue param={FLOW_GLOBAL_WARHEAD_COUNT} figures={2} />
        ),
        NUCLEAR_WINTER_OVERKILL_FACTOR: (
          <ParameterValue
            param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
            figures={3}
          />
        ),
        NUCLEAR_WINTER_WARHEAD_THRESHOLD: (
          <ParameterValue
            param={FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD}
            figures={1}
          />
        ),
      }}
    />
  );
}

export function TreatyVoteFlow({
  authCallbackUrl = ROUTES.dashboard,
  className,
  compactInitialScreen = false,
  defaultFlowVariant = DEFAULT_TREATY_FLOW_VARIANT,
  organizationSlug = null,
  postVoteBehavior = "overlay",
  postVoteCompletion = "share",
  postVoteRedirectUrl = ROUTES.dashboard,
  respectStoredFlowVariant = true,
  sliderHeadline = DEFAULT_SLIDER_HEADLINE,
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
  const [sliderTutorialFinished, setSliderTutorialFinished] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(50);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const sliderSectionRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLDivElement>(null);
  const choiceCardRef = useRef<HTMLDivElement>(null);
  const shouldScrollChoiceCardRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const postVoteRedirectStartedRef = useRef(false);
  const initialVoteShellClassName = compactInitialScreen
    ? "min-h-0 overflow-visible px-4 py-0 sm:px-8 sm:py-0"
    : "py-3 sm:py-10";
  // Cut mobile vertical spacing so the submit button (which appears after
  // first slider drag) fits in the viewport. TreatyFlowShell defaults to
  // `space-y-10 py-10` between children; on mobile that adds ~120px of
  // gap stacked across headline / paragraph / allocation / submit, which
  // pushes the submit below the fold.
  const initialVoteContentClassName = compactInitialScreen
    ? "max-w-4xl flex-none justify-start space-y-3 py-2 sm:space-y-6 sm:py-0"
    : "max-w-4xl space-y-5 py-4 sm:space-y-10 sm:py-12";

  // Give AnimatePresence a moment to mount the submit button before scrolling.
  const handleSliderRelease = () => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      submitButtonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 75);
  };

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
      setSliderTutorialFinished(true);
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
    if (!sliderSectionRef.current || userHasDragged || sliderTutorialFinished) return;

    let animationTimeout: number | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animationTimeout) {
            animationTimeout = window.setTimeout(() => setShowAnimation(true), 500);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(sliderSectionRef.current);
    return () => {
      observer.disconnect();
      if (animationTimeout !== null) {
        window.clearTimeout(animationTimeout);
      }
    };
  }, [sliderTutorialFinished, userHasDragged]);

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
        setSliderTutorialFinished(true);
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
      setSliderTutorialFinished(true);
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
      organizationSlug: existingVote?.organizationSlug ?? organizationSlug,
    });
    trackSliderSubmitted({
      flowVariant,
      militaryAllocationPercent: militaryAllocation,
    });
    shouldScrollChoiceCardRef.current = true;
    setSliderSubmitted(true);
    setShowSlider(false);
    setSliderTutorialFinished(true);

    if (status === "authenticated" && session) {
      void syncPendingReferendumVotes(session);
    }
  };

  useEffect(() => {
    if (!sliderSubmitted || !shouldScrollChoiceCardRef.current) return;

    const scrollChoiceCardToTop = () => {
      choiceCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };
    const animationFrameId = window.requestAnimationFrame(scrollChoiceCardToTop);
    const settledScrollId = window.setTimeout(() => {
      scrollChoiceCardToTop();
      shouldScrollChoiceCardRef.current = false;
    }, CHOICE_CARD_SETTLED_SCROLL_DELAY_MS);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(settledScrollId);
    };
  }, [sliderSubmitted]);

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
      organizationSlug: existingVote?.organizationSlug ?? organizationSlug,
    });

    storage.clearVoteStatusCache();

    if (status === "authenticated" && session && postVoteBehavior === "overlay") {
      void syncPendingReferendumVotes(session).then(() => {
        const referralIdentifier = getHandleOrReferralCode(session.user);
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
        const referralIdentifier = getHandleOrReferralCode(session.user);
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
              Give me 30 seconds. If this is wrong, leave. If it is right,
              your vote helps move money from war to medicine.
            </TreatyFlowParagraph>
            <TreatyFlowButtonRow>
              <Button
                className={treatySecondaryButtonClass}
                onClick={() => advancePreVote("grandma", true)}
              >
                Leave
              </Button>
              <Button
                className={treatyPrimaryButtonClass}
                onClick={() => advancePreVote("grandma")}
              >
                Continue
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
              <figure className="mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden border border-[var(--treaty-ink)] bg-[#fffdf8]">
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
                <TreatyFlowParagraph>
                  <NuclearOverkillTemplate
                    template={NUCLEAR_OVERKILL_BUTTON_REJECT_RESPONSE}
                  />
                </TreatyFlowParagraph>
              ) : null}
              {fullExplanationParagraphs.map((paragraph) => (
                <TreatyFlowParagraph key={paragraph}>
                  <NuclearOverkillTemplate template={paragraph} />
                </TreatyFlowParagraph>
              ))}
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
          "relative left-1/2 w-screen max-w-none -translate-x-1/2 bg-[var(--treaty-paper)]",
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
            <TreatyFlowShell
              className="py-6 sm:py-10"
              contentClassName="max-w-2xl justify-center py-10 sm:py-12"
            >
              <div className="space-y-6 text-center">
                <CivilizationOsLoaderMark
                  size="sm"
                  className="mx-auto text-[var(--treaty-ink)]"
                />
                <p className="text-2xl font-black uppercase leading-tight tracking-[0.08em] text-[var(--treaty-ink)] sm:text-3xl">
                  Saving your vote.
                </p>
              </div>
            </TreatyFlowShell>
          ) : (
            <TreatyFlowShell
              className="py-6 sm:py-10"
              contentClassName="max-w-2xl justify-center space-y-6 py-6 sm:py-8"
            >
              <div className="space-y-3">
                <p className="text-center text-2xl font-black uppercase leading-tight tracking-[0.08em] text-[var(--treaty-ink)] sm:text-3xl">
                  Save your vote.
                </p>
                <p className="text-center text-base font-bold leading-8 text-[var(--treaty-ink-soft)] sm:text-lg">
                  Please verify humanity so your vote counts. No robots allowed!
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
        "relative left-1/2 w-screen max-w-none -translate-x-1/2 bg-[var(--treaty-paper)]",
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
              data-visual-state={
                showSlider && !userHasDragged && !sliderTutorialFinished
                  ? "animating"
                  : "settled"
              }
              className={initialVoteShellClassName}
              contentClassName={initialVoteContentClassName}
            >
              <h1 className="mx-auto max-w-4xl text-center text-2xl font-black uppercase leading-tight tracking-tight text-[var(--treaty-ink)] sm:text-5xl [font-family:var(--v0-font-libre-baskerville)]">
                {sliderHeadline}
              </h1>

              <TreatyFlowParagraph
                dropCap
                className="mx-auto max-w-3xl text-base leading-7 sm:text-2xl sm:leading-10"
              >
                {VOTE_SECTION.sliderPrompt}
              </TreatyFlowParagraph>

              {/* Allocation Display */}
              <div className="space-y-3 sm:space-y-8">
                <div className="grid grid-cols-2 gap-3 sm:gap-12">
                  <div className="text-center">
                    <div className="mb-1 text-4xl font-black text-[var(--treaty-ink)] sm:mb-2 sm:text-6xl">
                      {militaryAllocation}%
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
                      Military &amp; Weapons
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 text-4xl font-black text-[var(--treaty-ink)] sm:mb-2 sm:text-6xl">
                      {clinicalTrialsAllocation}%
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
                      Clinical Trials
                    </div>
                  </div>
                </div>

                {/* Slider with Animation */}
                <div className="relative px-0 pb-3 pt-1 sm:px-2 sm:pb-10 sm:pt-3">
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
                          <div className="border border-black bg-white px-4 py-2">
                            <p className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em] text-black">
                              Slide me
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute z-20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            left: `${animatedValue}%`,
                            transform: "translateX(-50%)",
                            top: "30px",
                          }}
                        >
                          <motion.div
                            animate={{ rotate: [-12, -18, -12], y: [0, 2, 0] }}
                            className="flex h-8 w-8 items-center justify-center text-black"
                            transition={{
                              duration: 0.8,
                              ease: "easeInOut",
                              repeat: Infinity,
                            }}
                          >
                            <Hand className="h-7 w-7" strokeWidth={2.5} />
                          </motion.div>
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
                    onPointerUp={handleSliderRelease}
                    onKeyUp={handleSliderRelease}
                    className="h-3 w-full cursor-pointer appearance-none rounded-none border border-black bg-white slider-treaty"
                    style={{
                      background: `linear-gradient(to right, #000 ${militaryAllocation}%, #fff ${militaryAllocation}%)`,
                      accentColor: "#000",
                    }}
                  />
                </div>
              </div>

              {/* Submit Button — Only shows after user has dragged */}
              <AnimatePresence>
                {userHasDragged && (
                  <motion.div
                    ref={submitButtonRef}
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
            ref={choiceCardRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TreatyFlowShell
              data-screen="choice"
              data-testid="treaty-vote-choice-card"
              className="overflow-y-auto py-6 sm:py-10"
              contentClassName="max-w-4xl justify-center space-y-6 py-8 sm:space-y-8 sm:py-12"
            >
              <div className="space-y-8 text-center">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
                    Today&apos;s actual allocation
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:gap-12">
                      <div className="text-center">
                        <div className="mb-2 text-5xl font-black text-[var(--treaty-ink)] sm:text-6xl">
                          <ParameterValue
                            param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                            valueOverride={`${MILITARY_BUDGET_PCT_TODAY.toFixed(1)}%`}
                            className="!no-underline"
                          />
                        </div>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
                          Military &amp; Weapons
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="mb-2 text-5xl font-black text-[var(--treaty-ink)] sm:text-6xl">
                          <ParameterValue
                            param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                            valueOverride={`${TRIALS_BUDGET_PCT_TODAY.toFixed(1)}%`}
                            className="!no-underline"
                          />
                        </div>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
                          Clinical Trials
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
                      What moving 1% could do
                    </div>
                    <div className="mt-3 space-y-3 text-xl font-bold leading-snug text-[var(--treaty-ink)] sm:text-3xl">
                      <div>
                        <ParameterValue
                          param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                          display="withUnit"
                          figures={2}
                        />{" "}
                        more clinical trials
                      </div>
                      <div>
                        Disease eradication in{" "}
                        <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} figures={2} />{" "}
                        years instead of{" "}
                        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} figures={3} />
                      </div>
                    </div>
                  </div>
                </div>

              <div className="text-center text-xl font-black leading-tight text-[var(--treaty-ink)] sm:text-3xl md:text-4xl">
                {VOTE_SECTION.theQuestion}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
            className="fixed inset-0 z-[150] overflow-y-auto bg-[var(--treaty-paper)]"
          >
            {status === "authenticated" && postVoteCompletion === "share" ? (
              <TreatyPostVoteShareFlow
                answer={answer}
                flowVariant={flowVariant}
                initialAlt={isContextFirstVariant && preVoteDismissiveCount > 0}
                initialDismissiveCount={
                  isContextFirstVariant ? preVoteDismissiveCount : 0
                }
                initialScreen={isContextFirstVariant ? "stakes" : "opening"}
              />
            ) : status === "authenticated" ? (
              <TreatyFlowShell contentClassName="max-w-2xl">
                <div className="space-y-4 text-center">
                  <p className="text-2xl font-black uppercase leading-tight tracking-[0.08em] text-[var(--treaty-ink)] sm:text-3xl">
                    Response saved.
                  </p>
                  <p className="text-base font-bold leading-8 text-[var(--treaty-ink-soft)] sm:text-lg">
                    Your verified survey response has been recorded.
                  </p>
                </div>
              </TreatyFlowShell>
            ) : (
              <TreatyFlowShell contentClassName="max-w-2xl space-y-6 py-6 sm:py-8">
                <div className="space-y-3">
                  <p className="text-center text-2xl font-black uppercase leading-tight tracking-[0.08em] text-[var(--treaty-ink)] sm:text-3xl">
                    {isContextFirstVariant ? "Vote counted." : "Save Your Vote"}
                  </p>
                  <p className="text-center text-base font-bold leading-8 text-[var(--treaty-ink-soft)] sm:text-lg">
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
                          className="font-black text-[var(--treaty-ink)]"
                        />{" "}
                        lives and preventing{" "}
                        <ParameterValue
                          param={VOTER_SUFFERING_HOURS_PREVENTED}
                          className="font-black text-[var(--treaty-ink)]"
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
          accent-color: #000;
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
