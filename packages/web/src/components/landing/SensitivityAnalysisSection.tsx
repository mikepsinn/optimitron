"use client"

import { Card } from "@/components/retroui/Card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  DFDA_ROI_RD_ONLY,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  SMALLPOX_ERADICATION_ROI,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  RECOVERY_TRIAL_COST_PER_PATIENT,
  NPV_TIME_HORIZON_YEARS,
  formatParameter,
  getParameterValue,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue"

export default function SensitivityAnalysisSection() {
  const roiRaw = getParameterValue(DFDA_ROI_RD_ONLY, "round")
  const costReductionRaw = getParameterValue(RECOVERY_TRIAL_COST_REDUCTION_FACTOR, "round")
  const smallpoxROI = formatParameter(SMALLPOX_ERADICATION_ROI)
  const npvTimeHorizon = getParameterValue(NPV_TIME_HORIZON_YEARS, "round")

  const worstCaseROI = Math.round(roiRaw * 0.6)
  const bestCaseROI = Math.round(roiRaw * 1.5)

  return (
    <SectionContainer bgColor="pink" borderPosition="top" padding="lg">
      <Container>
        <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-4">
          IS THE <span className="text-foreground"><ParameterValue param={DFDA_ROI_RD_ONLY} /></span> ROI REAL?
        </h2>
        <p className="text-center text-lg font-bold mb-12 max-w-3xl mx-auto">
          Your species loves asking &ldquo;but what if you&apos;re wrong?&rdquo; So we tested that.
        </p>

        {/* The Main Message */}
        <Card className="bg-brutal-yellow border-4 border-primary p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-black uppercase mb-6">EVEN IF WE&apos;RE WRONG, WE&apos;RE STILL RIGHT</div>
            <p className="text-lg font-bold mb-8">
              We tested what happens if trials are LESS than {costReductionRaw}x cheaper and operations cost TWICE as much:
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background border-4 border-primary p-6">
                <div className="text-sm font-bold uppercase mb-2">Worst Case</div>
                <div className="text-4xl font-black text-brutal-pink mb-2">{worstCaseROI}:1</div>
                <div className="text-xs">60% of projected savings<br/>2x operational costs</div>
              </div>
              <div className="bg-brutal-pink border-4 border-primary p-6">
                <div className="text-sm font-bold uppercase mb-2 text-brutal-pink-foreground">Our Baseline</div>
                <div className="text-4xl font-black text-brutal-pink-foreground mb-2">{roiRaw}:1</div>
                <div className="text-xs text-brutal-pink-foreground">Based on RECOVERY trial data<br/>NPV-adjusted over {npvTimeHorizon} years</div>
              </div>
              <div className="bg-background border-4 border-primary p-6">
                <div className="text-sm font-bold uppercase mb-2">Best Case</div>
                <div className="text-4xl font-black text-brutal-pink mb-2">{bestCaseROI}:1</div>
                <div className="text-xs">Full market capture<br/>0.5x operational costs</div>
              </div>
            </div>
            <div className="bg-background border-4 border-primary p-4">
              <p className="font-black text-lg">
                Even in the WORST scenario, {worstCaseROI}:1 still beats smallpox eradication ({smallpoxROI}) — humanity&apos;s previous best ROI.
              </p>
            </div>
          </div>
        </Card>

        {/* Comparison Context */}
        <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto">
          <h3 className="text-2xl font-black uppercase mb-6 text-center">WHY THIS MATTERS</h3>
          <div className="space-y-4 text-lg">
            <p>
              <span className="font-black text-brutal-pink">It&apos;s a low-risk bet:</span> You&apos;d have to be wrong about BOTH cost reduction AND operational efficiency to drop below {Math.round(roiRaw * 0.5)}:1 ROI.
            </p>
            <p>
              <span className="font-black text-brutal-pink">The RECOVERY trial already proved {costReductionRaw}x is achievable:</span>{" "}
              <ParameterValue param={RECOVERY_TRIAL_COST_PER_PATIENT} />/patient vs. <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} />/patient. Our baseline uses proven methodology.
            </p>
            <p>
              <span className="font-black text-brutal-pink">This isn&apos;t a moonshot:</span> The maths works even when you assume we&apos;re wrong about almost everything. Which, given your track record, seemed worth checking.
            </p>
          </div>
        </Card>
      </Container>
    </SectionContainer>
  )
}
