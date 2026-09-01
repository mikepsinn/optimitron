"use client"

import { useState, useEffect, useRef } from "react"
import {
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_ANNUAL_DALY_BURDEN,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  GLOBAL_YLD_PROPORTION_OF_DALYS,
  GLOBAL_DISEASE_DEATHS_DAILY,
} from "@optimitron/data/parameters"
import { HeartCrack, Skull } from "lucide-react"
import { getParameterValue } from "@optimitron/data/parameters/compact-format"

// Calculate years until predicted death based on user age
function calculateYearsUntilDeath(age: number): number | null {
  const lifeExpectancy = 76
  const yearsRemaining = Math.max(0, lifeExpectancy - age)
  return yearsRemaining > 0 ? yearsRemaining : null
}

interface TimelineScrollyProps {
  userAge: number | null
  onAgeChange: (age: number | null) => void
}

export function TimelineScrolly({ userAge, onAgeChange }: TimelineScrollyProps) {
  // Base parameter values
  const baseCapacityMultiplier = getParameterValue(DFDA_TRIAL_CAPACITY_MULTIPLIER, "round")
  const queueYears = getParameterValue(STATUS_QUO_QUEUE_CLEARANCE_YEARS, "round")
  const diseasesUntreated = getParameterValue(DISEASES_WITHOUT_EFFECTIVE_TREATMENT, "round")

  // Suffering calculations (YLD = Years Lived with Disability)
  const annualDALYs = GLOBAL_ANNUAL_DALY_BURDEN.value // 2.88B DALYs/year
  const avoidablePct = EVENTUALLY_AVOIDABLE_DALY_PCT.value // ~92.6%
  const yldProportion = GLOBAL_YLD_PROPORTION_OF_DALYS.value // 39% of DALYs are suffering (not death)
  const avoidableSufferingYearsPerYear = annualDALYs * avoidablePct * yldProportion // ~1.03B years of suffering/year

  // Deaths calculations (~50.7M avoidable deaths per year)
  const avoidableDeathsPerYear = GLOBAL_DISEASE_DEATHS_DAILY.value * 365 * avoidablePct

  // Funding multiplier state (1 = treaty amount, 2 = double, etc.)
  // Setter intentionally retained for future funding-adjustment UI that hasn't been wired in yet.
  const [fundingMultiplier] = useState(1)

  // Adjusted values based on funding multiplier
  const capacityMultiplier = Math.round(baseCapacityMultiplier * fundingMultiplier)
  const dfdaQueueYears = Math.round(queueYears / capacityMultiplier)

  const yearsUntilDeath = userAge ? calculateYearsUntilDeath(userAge) : null

  // Timeline settings
  const statusQuoHeight = 3000 // px - Timeline height
  const pxPerYear = statusQuoHeight / queueYears // ~6.77 px per year

  // State for scroll tracking
  const [currentYear, setCurrentYear] = useState(0)
  const [isWarping] = useState(false)
  const [dfdaComplete, setDfdaComplete] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const statusQuoRef = useRef<HTMLDivElement>(null)
  const visualCaptureRef = useRef(false)


  // Scroll handler to update year counter
  useEffect(() => {
    const handleScroll = () => {
      if (visualCaptureRef.current) return
      if (!statusQuoRef.current || !timelineRef.current) return

      const statusQuoRect = statusQuoRef.current.getBoundingClientRect()

      // Calculate scroll progress within the Status Quo timeline
      const viewportMiddle = window.innerHeight / 2
      const scrollProgress = (viewportMiddle - statusQuoRect.top) / statusQuoHeight

      // Convert to years
      const year = Math.max(0, Math.min(queueYears, Math.round(scrollProgress * queueYears)))
      setCurrentYear(year)

      // Check if dFDA would be complete
      setDfdaComplete(year >= dfdaQueueYears)
    }

    const completeVisualCapture = () => {
      visualCaptureRef.current = true
      setCurrentYear(queueYears)
      setDfdaComplete(true)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("optimitron:visual-capture", completeVisualCapture)
    handleScroll() // Initial call

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("optimitron:visual-capture", completeVisualCapture)
    }
  }, [queueYears, dfdaQueueYears, statusQuoHeight])



  return (
    <div
      ref={timelineRef}
      className="relative"
      data-visual-capture-ready={dfdaComplete && currentYear === queueYears}
    >
      {/* Explanation */}
      <p className="text-sm sm:text-base text-foreground/80 text-center mb-4 sm:mb-6 max-w-2xl mx-auto">
        This timeline shows how soon we could find a first treatment for all {diseasesUntreated.toLocaleString()} untreated diseases.
        Under the status quo (~15 new treatments/year), it takes <span className="font-black text-foreground">{queueYears} years</span>.
        With increased pragmatic trial funding, we can accelerate discovery dramatically.
      </p>

      {/* Warp Effect Overlay */}
      {isWarping && (
        <div className="fixed inset-0 pointer-events-none z-50 bg-brutal-cyan/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-black text-brutal-cyan animate-pulse">
              TIME WARP
            </div>
          </div>
          {/* Speed lines */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 bg-brutal-cyan opacity-50"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: 0,
                  height: "100%",
                  animation: `warp-line 0.5s ease-out`,
                  animationDelay: `${i * 0.02}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Age Input */}
      <div className="max-w-xs mx-auto mb-4 sm:mb-8">
        <div className="bg-brutal-yellow border-4 border-primary p-3 sm:p-4">
          <div className="text-center">
            <div className="font-black uppercase text-xs sm:text-sm mb-1 sm:mb-2">Make It Personal</div>
            <div className="text-xs mb-2 sm:mb-3">Enter your age to see if treatments arrive on time</div>
            <div className="flex gap-2 justify-center items-center">
              <label htmlFor="scrolly-user-age" className="text-xs font-bold">Your age:</label>
              <input
                id="scrolly-user-age"
                type="number"
                min="1"
                max="120"
                defaultValue={30}
                className="w-20 px-2 py-1 border-4 border-primary font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onChange={(e) => {
                  const age = parseInt(e.target.value)
                  onAgeChange(age > 0 && age <= 120 ? age : null)
                }}
              />
              <span className="text-xs">years old</span>
            </div>
          </div>
        </div>
      </div>

      {/* "You Are Here" Start */}
      <div className="flex justify-center mb-4 sm:mb-8">
        <div className="bg-brutal-yellow border-4 border-primary px-4 sm:px-6 py-2 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-base sm:text-xl font-black uppercase text-center">You Are Here</div>
          <div className="text-[10px] sm:text-xs font-bold text-center mt-1">Year 0 - Choose Your Destiny</div>
        </div>
      </div>

      {/* Single Timeline */}
      <div className="relative max-w-md mx-auto">
        {/* The scrollable timeline */}
        <div
          ref={statusQuoRef}
          className="relative w-3 mx-auto border-2 border-primary overflow-hidden"
          style={{ height: `${statusQuoHeight}px` }}
        >
          {/* dFDA portion (cyan) - first portion of the timeline */}
          <div
            className="absolute top-0 left-0 right-0 bg-brutal-cyan"
            style={{ height: `${dfdaQueueYears * pxPerYear}px` }}
          />
          {/* Status Quo portion (dark) - remainder of the timeline */}
          <div
            className="absolute left-0 right-0 bg-foreground"
            style={{
              top: `${dfdaQueueYears * pxPerYear}px`,
              height: `${(queueYears - dfdaQueueYears) * pxPerYear}px`
            }}
          />
        </div>


        {/* Pragmatic Trials completion marker - left of timeline */}
        <div
          className="absolute left-0 sm:left-4 z-10 w-36 sm:w-44"
          style={{ top: `${dfdaQueueYears * pxPerYear - 80}px` }}
        >
          <div className="bg-brutal-cyan border-4 border-primary p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-lg mb-1">🎉</div>
            <div className="font-black text-xs uppercase leading-tight mb-2">
              Yay! Treatments for most diseases discovered
            </div>
            <div className="text-[10px] font-bold mb-2">
              Due to increased trial capacity ({dfdaQueueYears} years)
            </div>
            <div className="text-2xl">↓</div>
            <div className="text-[9px] font-bold text-foreground/80">
              Now see unnecessary death & suffering on the status quo timeline below
            </div>
          </div>
        </div>

        {/* Death marker - gravestone on timeline */}
        {yearsUntilDeath && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10"
            style={{ top: `${yearsUntilDeath * pxPerYear}px` }}
          >
            <div className="bg-foreground text-background border-4 border-primary px-2 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="text-lg">🪦</div>
              <div className="font-black text-xs uppercase">YOU</div>
            </div>
          </div>
        )}


        {/* Comparison box when scrolling past pragmatic trials completion */}
        {dfdaComplete && (
          <div
            className="absolute left-0 right-0 mx-auto max-w-md z-20"
            style={{ top: `${Math.min(currentYear * pxPerYear + 50, statusQuoHeight - 200)}px` }}
          >
            <div className="grid grid-cols-2 gap-0 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {/* Left: Universal Pragmatic Trials */}
              <div className="bg-brutal-cyan p-3 text-center border-r-2 border-primary">
                <div className="text-[10px] font-black uppercase mb-2">Universal Pragmatic Trials</div>
                <div className="text-sm font-black uppercase mb-1">Treatments Discovered</div>
                <div className="text-xs font-bold">
                  For most conditions {currentYear - dfdaQueueYears} years ago
                </div>
              </div>

              {/* Right: Status Quo */}
              <div className="bg-foreground text-background p-3 text-center border-l-2 border-primary">
                <div className="text-sm font-black uppercase mb-2">Status Quo</div>
                <div className="text-[9px] font-bold uppercase mb-1">Unnecessary from delay:</div>
                <div className="flex items-center justify-center gap-1">
                  <Skull className="w-3 h-3" />
                  <span className="text-xs font-bold">
                    {((currentYear * avoidableDeathsPerYear) / 1_000_000_000).toFixed(1)}B deaths
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <HeartCrack className="w-3 h-3" />
                  <span className="text-xs font-bold">
                    {((currentYear * avoidableSufferingYearsPerYear) / 1_000_000_000).toFixed(0)}B yrs suffering
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Warp animation styles */}
      <style jsx>{`
        @keyframes warp-line {
          0% {
            transform: scaleY(0);
            opacity: 0;
          }
          50% {
            transform: scaleY(1);
            opacity: 0.5;
          }
          100% {
            transform: scaleY(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
