"use client"

import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer, type SectionBgColor } from "@optimitron/neobrutalist-ui/ui/section-container"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { useState, useEffect, useRef } from "react"
import { Square, CheckSquare } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { storage } from "../../lib/storage"
import { syncPendingVote } from "../../lib/vote-utils"
import { getUsernameOrReferralCode } from "../../lib/referral.client"
import { buildUserReferralUrl, getBaseUrl } from "../../lib/url"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"
import {
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters"
import { ParameterValue } from "../shared/ParameterValue"
import { trackVoteSubmitted } from "../../lib/analytics"
import { ManualPromoCard } from "../shared/ManualPromoCard"
import { PragmaticTrialsDialog } from "./PragmaticTrialsDialog"
import { TreatyPostVoteFlow, type TreatyPostVoteMode } from "./TreatyPostVoteFlow"
import { cn } from "@optimitron/neobrutalist-ui/cn"

// Display as "$604 per $1" — deliberate dollar framing; ratio's canonical "604:1" display isn't used here.
const ratio = MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value
const militaryToClinicalsRatioFormatted = `$${Math.round(ratio)}`
const militarySpendingPct = Number(((ratio / (ratio + 1)) * 100).toFixed(1))
const clinicalTrialsSpendingPct = Number((100 - militarySpendingPct).toFixed(1))

interface TreatyVoteSectionProps {
  organizationId?: string // Optional: which organization's survey page is this
  sectionId?: string
  hideHeading?: boolean
  frameless?: boolean
  bgColor?: SectionBgColor
  showManualPromo?: boolean
  postVoteMode?: TreatyPostVoteMode
  authenticatedPostVoteRedirectUrl?: string
  disableIntroAnimation?: boolean
}

export default function TreatyVoteSection({
  organizationId,
  sectionId = "vote",
  hideHeading = false,
  frameless = false,
  bgColor = "yellow",
  showManualPromo = true,
  postVoteMode = "full",
  authenticatedPostVoteRedirectUrl,
  disableIntroAnimation = false
}: TreatyVoteSectionProps = {}) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null)
  const [militaryAllocation, setMilitaryAllocation] = useState<number>(50)
  const [showSlider, setShowSlider] = useState(true)
  const [sliderSubmitted, setSliderSubmitted] = useState(false)
  const [userHasDragged, setUserHasDragged] = useState(disableIntroAnimation)
  const [showAnimation, setShowAnimation] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(50)
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get("ref") || null
  const inviteToken = searchParams?.get("invite") || null
  const shareCardRef = useRef<HTMLDivElement>(null)
  const sliderSectionRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const introAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visualCaptureRef = useRef(false)

  // Restore state from localStorage on mount
  useEffect(() => {
    const pendingVote = storage.getPendingVote()
    if (pendingVote?.militaryAllocationPercent !== undefined) {
      setMilitaryAllocation(pendingVote.militaryAllocationPercent)
      setSliderSubmitted(true)
      setShowSlider(false)
      setUserHasDragged(true) // They already interacted
      // If they already voted, show that too
      if (pendingVote.answer) {
        setAnswer(pendingVote.answer.toLowerCase() as "yes" | "no")
      }
    }
  }, [])

  // Intersection Observer to trigger animation when slider comes into view
  useEffect(() => {
    if (!sliderSectionRef.current || userHasDragged) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !userHasDragged &&
            !visualCaptureRef.current &&
            !introAnimationTimeoutRef.current
          ) {
            // Start animation after a brief delay
            introAnimationTimeoutRef.current = setTimeout(() => {
              introAnimationTimeoutRef.current = null
              if (!visualCaptureRef.current) setShowAnimation(true)
            }, 500)
          }
        })
      },
      { threshold: 0.5 } // Trigger when 50% visible
    )

    observer.observe(sliderSectionRef.current)

    return () => {
      observer.disconnect()
      if (introAnimationTimeoutRef.current) {
        clearTimeout(introAnimationTimeoutRef.current)
        introAnimationTimeoutRef.current = null
      }
    }
  }, [userHasDragged])

  useEffect(() => {
    const completeVisualCapture = () => {
      visualCaptureRef.current = true
      if (introAnimationTimeoutRef.current) {
        clearTimeout(introAnimationTimeoutRef.current)
        introAnimationTimeoutRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (!userHasDragged) {
        setAnimatedValue(50)
        setMilitaryAllocation(50)
      }
      setShowAnimation(false)
    }

    window.addEventListener("optimitron:visual-capture", completeVisualCapture)
    return () => {
      window.removeEventListener("optimitron:visual-capture", completeVisualCapture)
    }
  }, [userHasDragged])

  // Animate the slider thumb across the track until the user interacts.
  useEffect(() => {
    if (!showAnimation || userHasDragged) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    let startTime: number | null = null
    const cycleDuration = 2000 // 2 seconds for one full cycle (left->right->left)
    const totalCycles = 2 // Number of complete cycles
    const totalDuration = cycleDuration * totalCycles // Total animation time
    const minValue = 20
    const maxValue = 80
    const centerValue = 50

    const animate = (timestamp: number) => {
      if (visualCaptureRef.current) return
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      // Stop animation after completing cycles and return to center
      if (elapsed >= totalDuration) {
        setAnimatedValue(centerValue)
        setMilitaryAllocation(100 - centerValue)
        setShowAnimation(false) // Stop showing animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        return
      }

      const progress = (elapsed % cycleDuration) / cycleDuration

      // Ease in and out, back and forth
      let value: number
      if (progress < 0.5) {
        // Moving from min to max
        const t = progress * 2
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        value = minValue + (maxValue - minValue) * eased
      } else {
        // Moving from max to min
        const t = (progress - 0.5) * 2
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        value = maxValue - (maxValue - minValue) * eased
      }

      setAnimatedValue(value)
      setMilitaryAllocation(100 - Math.round(value))

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [showAnimation, userHasDragged])

  // Check for pending vote in localStorage on mount
  const hasSyncedRef = useRef(false)
  useEffect(() => {
    if (status === "authenticated" && session && !hasSyncedRef.current) {
      hasSyncedRef.current = true
      syncPendingVote(session)
    }
  }, [status, session])

  // Trigger confetti celebration
  const triggerConfetti = () => {
    const colors = ["#FF6B9D", "#00D9FF", "#FFE66D"] // brutal-pink, brutal-cyan, brutal-yellow

    // Fire multiple bursts for extra impact
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      colors: colors,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    })

    fire(0.2, {
      spread: 60,
    })

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }

  // Handle slider change - detect user interaction
  const handleSliderChange = (value: number) => {
    setMilitaryAllocation(100 - value)
    if (!userHasDragged) {
      setUserHasDragged(true)
      setShowAnimation(false) // Stop animation once user interacts
    }
  }

  // Handle slider submission
  const handleSliderSubmit = () => {
    // Save allocation to pendingVote (partial vote data)
    storage.setPendingVote({
      answer: "", // Will be filled when they click YES/NO
      referredBy: referralCode,
      inviteToken,
      timestamp: new Date().toISOString(),
      militaryAllocationPercent: militaryAllocation,
      organizationId: organizationId || null, // Track which org's survey page
    })
    setSliderSubmitted(true)
    setShowSlider(false)
  }

  // Calculate clinical trials percentage
  const clinicalTrialsAllocation = 100 - militaryAllocation
  const sliderValue = clinicalTrialsAllocation

  // Save pending vote and sync if logged in
  const handleAnswer = async (choice: "yes" | "no") => {
    setAnswer(choice)

    // Track vote submitted event
    trackVoteSubmitted({
      voteType: "treaty_vote",
      answer: choice.toUpperCase(),
      authenticated: status === "authenticated",
    })

    // Trigger confetti for YES votes
    if (choice === "yes") {
      triggerConfetti()
    }

    // Get existing pendingVote or create new one
    const existingVote = storage.getPendingVote()
    // Capture which page the vote was cast on (for per-page EV scorecard).
    // origin + pathname so /research on warondisease.org isn't conflated with /research on dih.earth.
    // API strips query/hash, but do it client-side too to keep localStorage tidy.
    const sourceUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : null
    // document.referrer = parent page URL when this component is rendered inside an iframe embed.
    const sourceReferrer = typeof document !== "undefined" ? document.referrer || null : null

    // Save complete vote data to localStorage
    const voteData = {
      answer: choice.toUpperCase(),
      referredBy: referralCode,
      inviteToken,
      timestamp: existingVote?.timestamp || new Date().toISOString(),
      militaryAllocationPercent: existingVote?.militaryAllocationPercent ?? militaryAllocation,
      organizationId: organizationId || existingVote?.organizationId || null, // Preserve or set org ID
      sourceUrl: existingVote?.sourceUrl ?? sourceUrl,
      sourceReferrer: existingVote?.sourceReferrer ?? sourceReferrer,
    }
    storage.setPendingVote(voteData)

    // Clear vote status cache since user just voted
    storage.clearVoteStatusCache()

    // Scroll to share card after animation
    setTimeout(() => {
      shareCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 600)

    // If user is logged in, sync immediately
    if (status === "authenticated" && session) {
      await syncPendingVote(session)
      const referralIdentifier = getUsernameOrReferralCode(session.user)
      if (referralIdentifier) {
        storage.setVoteStatusCache({
          hasVoted: true,
          VotePosition: choice.toUpperCase(),
          referralCode: referralIdentifier,
        })
      }
      if (authenticatedPostVoteRedirectUrl) {
        router.push(authenticatedPostVoteRedirectUrl)
        return
      }
    }
    // No need to show auth dialog anymore - signup form shows inline
  }

  // Use user's referral code if logged in, otherwise use base URL
  const baseUrl = getBaseUrl()
  const shareUrl = session?.user ? buildUserReferralUrl(session.user, baseUrl) : baseUrl

  const panelClassName = cn(
    "mx-auto mb-12 flex max-w-3xl flex-col gap-6",
    frameless
      ? ""
      : "bg-background border-4 border-primary p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
  )
  const PanelShell = frameless ? "div" : Card

  return (
    <SectionContainer id={sectionId} bgColor={bgColor} borderPosition="bottom" padding="sm" className="pb-32">
      <Container>
        {!hideHeading && (
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center mb-10">
            THE <span className="text-brutal-pink">QUESTION</span>
          </h2>
        )}

        {/* Slider Card - Shows First */}
        <AnimatePresence>
          {showSlider && (
            <motion.div
              ref={sliderSectionRef}
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.4 }}
            >
              <PanelShell className={panelClassName}>
                <p className="font-bold text-lg sm:text-xl md:text-2xl leading-snug text-center mb-8">
                  Adjust slider to show how you'd split your country's finite resources between the{" "}
                  <span className="text-brutal-pink">weapons and military</span> vs{" "}
                  <PragmaticTrialsDialog
                    triggerClassName="inline text-brutal-pink underline decoration-dotted decoration-[1px] decoration-brutal-pink/45 underline-offset-2 transition-opacity hover:opacity-80"
                  >
                    pragmatic clinical trials
                  </PragmaticTrialsDialog>{" "}
                  to cure diseases.
                </p>

                {/* Allocation Display */}
                <div className="mb-8">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex-1 text-center">
                      <div className="text-4xl sm:text-5xl font-black text-brutal-pink mb-2">
                        {militaryAllocation}%
                      </div>
                      <div className="text-sm sm:text-base font-bold uppercase">Military & Weapons</div>
                    </div>
                    <div className="shrink-0 border-4 border-primary bg-brutal-yellow px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-sm sm:text-base font-black uppercase">VS</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-4xl sm:text-5xl font-black text-brutal-cyan mb-2">
                        {clinicalTrialsAllocation}%
                      </div>
                      <div className="text-sm sm:text-base font-bold uppercase">Clinical Trials</div>
                    </div>
                  </div>

                  {/* Slider with Animation */}
                  <div className="relative px-2">
                    {/* Animated Hand Icon and "Slide Me" Text */}
                    <AnimatePresence>
                      {showAnimation && !userHasDragged && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute -top-20 z-10 pointer-events-none"
                            style={{ left: `${animatedValue}%`, transform: "translateX(-50%)" }}
                          >
                            <div className="bg-brutal-yellow border-4 border-primary px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <p className="font-black uppercase text-sm whitespace-nowrap">👇 Slide Me!</p>
                            </div>
                          </motion.div>

                          <motion.div
                            className="absolute z-20 pointer-events-none"
                            style={{
                              left: `${animatedValue}%`,
                              transform: "translateX(-50%)",
                              top: "16px"
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
                      value={sliderValue}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      className="w-full h-4 bg-background border-4 border-primary rounded-none appearance-none cursor-pointer slider-brutal"
                      style={{
                        background:
                          "linear-gradient(to right, #FF6B9D 0%, #FF6B9D 49%, #FFE66D 49%, #FFE66D 51%, #00D9FF 51%, #00D9FF 100%)",
                      }}
                    />
                  </div>
                </div>

                {/* Submit Button - Only shows after user has dragged */}
                <AnimatePresence>
                  {userHasDragged && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                    >
                      <Button
                        onClick={handleSliderSubmit}
                        className="w-full h-16 text-xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        SUBMIT
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </PanelShell>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reality Check + Vote Card - Shows After Slider */}
        <AnimatePresence>
          {sliderSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PanelShell className={panelClassName}>
                <p className="font-bold text-lg sm:text-xl md:text-2xl leading-snug text-center mb-2">
                  Governments spend{" "}
                  <br className="hidden sm:block" />
                  <span className="text-brutal-pink">{militaryToClinicalsRatioFormatted}</span> on weapons and military systems{" "}
                  <br className="hidden sm:block" />
                  for every{" "}
                  <br className="hidden sm:block" />
                  <span className="text-brutal-pink">$1</span> on <span className="text-brutal-pink">CLINICAL TRIALS TO CURE DISEASE</span>.
                </p>

                <div className="text-base sm:text-lg font-bold text-center mb-4">
                  That&apos;s {militarySpendingPct}% to military and just{" "}
                  <span className="text-brutal-pink text-xl">{clinicalTrialsSpendingPct}%</span> to clinical trials.
                </div>

                <div className="text-base sm:text-lg font-bold text-center mb-4 p-4 bg-brutal-yellow border-4 border-primary">
                  Redirecting just 1% of military spending would increase clinical trial capacity by{" "}
                  <ParameterValue
                    param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                    format={{ precision: 1 }}
                    className="text-brutal-pink font-black text-xl"
                  />, compressing the projected disease eradication timeline from{" "}
                  <ParameterValue
                    param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                    format={{ precision: 0 }}
                    className="text-brutal-pink font-black text-xl"
                  />{" "}
                  <span className="text-brutal-pink font-black text-xl">years</span> to{" "}
                  <ParameterValue
                    param={DFDA_QUEUE_CLEARANCE_YEARS}
                    format={{ precision: 0 }}
                    className="text-brutal-pink font-black text-xl"
                  />{" "}
                  <span className="text-brutal-pink font-black text-xl">years</span>.
                </div>

                <div className="text-xl sm:text-2xl md:text-3xl font-black text-center mb-4">
                  Should all nations allocate just {" "}
                  <br className="hidden sm:block" />
                  <span className="text-brutal-pink">1% of military spending</span> to <span className="text-brutal-pink"> pragmatic clinical trials to treat and cure disease</span> {" "}
                  <br className="hidden sm:block" />
                  together, making the world safer and ensuring no country is at a disadvantage?
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button
                    onClick={() => handleAnswer("yes")}
                    className="w-full sm:w-64 h-20 text-2xl font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3"
                  >
                    {answer === "yes" ? <CheckSquare className="w-8 h-8" /> : <Square className="w-8 h-8" />}
                    YES
                  </Button>
                  <Button
                    onClick={() => handleAnswer("no")}
                    className="w-full sm:w-64 h-20 text-2xl font-black uppercase bg-brutal-pink hover:bg-brutal-pink/90 text-brutal-pink-foreground border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3"
                  >
                    {answer === "no" ? <CheckSquare className="w-8 h-8" /> : <Square className="w-8 h-8" />}
                    NO
                  </Button>
                </div>
              </PanelShell>
            </motion.div>
          )}
        </AnimatePresence>

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
                stiffness: 100
              }}
              className="max-w-2xl mx-auto mb-16"
            >
              {authenticatedPostVoteRedirectUrl && status === "authenticated" && session ? (
                <Card
                  className="border-4 border-primary bg-background p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  data-testid="treaty-vote-saving"
                >
                  <p className="text-2xl font-black uppercase">Saving your vote.</p>
                </Card>
              ) : (
                <TreatyPostVoteFlow
                  answer={answer}
                  mode={postVoteMode}
                  status={status}
                  session={session}
                  shareUrl={shareUrl}
                  referralCode={referralCode}
                  inviteToken={inviteToken}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Go Deeper - Manual/Podcast CTA (shows after voting) */}
        {/* <AnimatePresence>
          {showManualPromo && answer && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="max-w-2xl mx-auto"
            >
              <ManualPromoCard utmSource="post_vote" />
            </motion.div>
          )}
        </AnimatePresence> */}
      </Container>

      {/* Custom Slider Styles */}
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
  )
}
