"use client";

import { Card } from "@/components/retroui/Card";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { Button } from "@/components/retroui/Button";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { useState, useEffect, useRef } from "react";
import { Square, CheckSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { storage } from "@/lib/storage";
import { ReferralLinkCard } from "@/components/dashboard/ReferralLinkCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { syncPendingTreatyVote } from "@/lib/treaty-vote-sync";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters";
import { trackSliderSubmitted, trackVoteSubmitted } from "@/lib/analytics";
import { VOTE_SECTION } from "@/lib/messaging";
import {
  buildTreatyWishocraticAllocation,
  getMilitaryAllocationPercentFromPendingTreatyVote,
  getTreatyWishocraticAllocation,
} from "@/lib/treaty-vote";

const militarySpendingPct = Math.round(
  (MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value /
    (MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value + 1)) *
    1000,
) / 10; // one decimal place: 99.8%
const clinicalTrialsSpendingPct = Math.round((100 - militarySpendingPct) * 10) / 10;

export default function TreatyVoteSection() {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [militaryAllocation, setMilitaryAllocation] = useState<number>(50);
  const [showSlider, setShowSlider] = useState(true);
  const [sliderSubmitted, setSliderSubmitted] = useState(false);
  const [userHasDragged, setUserHasDragged] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(50);
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const sliderSectionRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

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
      setMilitaryAllocation(Math.round(value));
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
      void syncPendingTreatyVote(session);
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
    const timestamp = existingVote?.timestamp || new Date().toISOString();

    storage.setPendingTreatyVote({
      answer: existingVote?.answer ?? "",
      referredBy: referralCode,
      timestamp,
      wishocraticAllocation: buildTreatyWishocraticAllocation(militaryAllocation, timestamp),
      organizationId: existingVote?.organizationId ?? null,
    });
    trackSliderSubmitted({ militaryAllocationPercent: militaryAllocation });
    setSliderSubmitted(true);
    setShowSlider(false);

    if (status === "authenticated" && session) {
      void syncPendingTreatyVote(session);
    }
  };

  const clinicalTrialsAllocation = 100 - militaryAllocation;

  const handleAnswer = async (choice: "yes" | "no") => {
    setAnswer(choice);
    trackVoteSubmitted({
      voteType: "treaty_vote",
      answer: choice.toUpperCase(),
      authenticated: status === "authenticated",
    });

    if (choice === "yes") {
      triggerConfetti();
    }

    const existingVote = storage.getPendingTreatyVote();
    const referralCode = searchParams?.get("ref") || existingVote?.referredBy || null;
    const timestamp = existingVote?.timestamp || new Date().toISOString();

    storage.setPendingTreatyVote({
      answer: choice.toUpperCase(),
      referredBy: referralCode,
      timestamp,
      wishocraticAllocation:
        getTreatyWishocraticAllocation(existingVote) ??
        buildTreatyWishocraticAllocation(militaryAllocation, timestamp),
      organizationId: existingVote?.organizationId ?? null,
    });

    storage.clearVoteStatusCache();

    setTimeout(() => {
      shareCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 600);

    if (status === "authenticated" && session) {
      await syncPendingTreatyVote(session);
      const referralIdentifier = getUsernameOrReferralCode(session.user);
      if (referralIdentifier) {
        storage.setVoteStatusCache({
          hasVoted: true,
          voteAnswer: choice.toUpperCase(),
          referralCode: referralIdentifier,
        });
      }
    }
  };

  const baseUrl = getBaseUrl();
  const shareUrl = session?.user
    ? buildUserReferralUrl(session.user, baseUrl)
    : baseUrl;

  return (
    <SectionContainer
      id="vote"
      bgColor="yellow"
      borderPosition="bottom"
      padding="sm"
      className="pb-32"
    >
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center mb-10">
          THE <span className="text-brutal-pink">QUESTION</span>
        </h2>

        {/* Slider Card — Shows First */}
        <AnimatePresence>
          {showSlider && (
            <motion.div
              ref={sliderSectionRef}
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-background text-foreground border-4 border-primary p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto mb-12">
                <p className="font-bold text-lg sm:text-xl md:text-2xl leading-snug text-center mb-8">
                  {VOTE_SECTION.sliderPrompt}
                </p>

                {/* Allocation Display */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex-1 text-center">
                      <div className="text-4xl sm:text-5xl font-black text-brutal-pink mb-2">
                        {militaryAllocation}%
                      </div>
                      <div className="text-sm sm:text-base font-bold uppercase">
                        Military &amp; Weapons
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-4xl sm:text-5xl font-black text-brutal-cyan mb-2">
                        {clinicalTrialsAllocation}%
                      </div>
                      <div className="text-sm sm:text-base font-bold uppercase">
                        Clinical Trials
                      </div>
                    </div>
                  </div>

                  {/* Slider with Animation */}
                  <div className="relative px-2">
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
                            <div className="bg-brutal-yellow border-4 border-primary px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <p className="font-black uppercase text-sm whitespace-nowrap">
                                👇 Slide Me!
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
                            <div className="text-4xl">☝️</div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={militaryAllocation}
                      onChange={(e) =>
                        handleSliderChange(Number(e.target.value))
                      }
                      className="w-full h-4 bg-background border-4 border-primary rounded-none appearance-none cursor-pointer slider-brutal"
                      style={{
                        background: `linear-gradient(to right, var(--brutal-pink) ${militaryAllocation}%, var(--brutal-cyan) ${militaryAllocation}%)`,
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
                        className="w-full h-16 text-xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-brutal-cyan-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        SUBMIT
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
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
              <Card className="bg-background text-foreground border-4 border-primary p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto mb-12">
                <p className="font-bold text-lg sm:text-xl md:text-2xl leading-snug text-center mb-2">
                  Your governments spend{" "}
                  <br className="hidden sm:block" />
                  <span className="text-brutal-pink">
                    $<ParameterValue param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO} />
                  </span>{" "}
                  {VOTE_SECTION.realityCheck}
                </p>

                <div className="text-base sm:text-lg font-bold text-center">
                  That&apos;s {" "}
                  <span className="text-brutal-pink text-xl">
                    {militarySpendingPct}%
                  </span>{" "}
                  to military and {" "}
                  <span className="text-brutal-pink text-xl">
                    {clinicalTrialsSpendingPct}%
                  </span>{" "}
                  to clinical trials.
                </div>

                <div className="text-xl sm:text-2xl md:text-3xl font-black text-center mb-4">
                  {VOTE_SECTION.theQuestion}
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button
                    onClick={() => void handleAnswer("yes")}
                    className="w-full sm:w-64 h-20 text-2xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-brutal-cyan-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3"
                  >
                    {answer === "yes" ? (
                      <CheckSquare className="w-8 h-8" />
                    ) : (
                      <Square className="w-8 h-8" />
                    )}
                    YES
                  </Button>
                  <Button
                    onClick={() => void handleAnswer("no")}
                    className="w-full sm:w-64 h-20 text-2xl font-black uppercase bg-brutal-pink hover:bg-brutal-pink/90 text-brutal-pink-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3"
                  >
                    {answer === "no" ? (
                      <CheckSquare className="w-8 h-8" />
                    ) : (
                      <Square className="w-8 h-8" />
                    )}
                    NO
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth or Share Card — Shows After Vote */}
        <AnimatePresence>
          {answer && (
            <motion.div
              ref={shareCardRef}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.87, 0, 0.13, 1],
                type: "spring",
                stiffness: 100,
              }}
              className="max-w-2xl mx-auto mb-16"
            >
              {status === "authenticated" ? (
                <ReferralLinkCard referralLink={shareUrl} />
              ) : (
                <Card className="bg-background text-foreground border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-4">
                    <p className="text-center font-bold text-lg sm:text-xl mb-2">
                      {VOTE_SECTION.authPrompt}
                    </p>
                    <p className="text-center text-base font-bold text-muted-foreground">
                      {VOTE_SECTION.authSubtext}
                    </p>
                    <p className="text-center text-base text-muted-foreground">
                      {VOTE_SECTION.authPrivacy}
                    </p>
                  </div>
                  <AuthForm
                    callbackUrl="/dashboard"
                    referralCode={searchParams?.get("ref")}
                    compact={true}
                    emailSuccessFooter={VOTE_SECTION.emailSuccessFooter}
                  />
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Slider thumb styles */}
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
    </SectionContainer>
  );
}
