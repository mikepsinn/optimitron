"use client"

import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { ImpactExplainer } from "../shared/ImpactExplainer"
import {
  DFDA_ROI_RD_ONLY,
  SMALLPOX_ERADICATION_ROI,
  CHILDHOOD_VACCINATION_ROI,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  DFDA_NET_SAVINGS_RD_ONLY_ANNUAL,
  TREATY_QALYS_GAINED_ANNUAL_GLOBAL,
  DRUG_DISCOVERY_TO_APPROVAL_YEARS,
} from "@optimitron/data/parameters"
import { formatParameter, getParameterValue } from "@optimitron/data/parameters/compact-format"
import { ParameterValue } from "../shared/ParameterValue"

// Derived values from parameters
const mainROI = formatParameter(DFDA_ROI_RD_ONLY)
const mainROIRaw = getParameterValue(DFDA_ROI_RD_ONLY, "round")
const smallpoxROI = formatParameter(SMALLPOX_ERADICATION_ROI)
const vaccineROI = formatParameter(CHILDHOOD_VACCINATION_ROI)
const costReduction = formatParameter(RECOVERY_TRIAL_COST_REDUCTION_FACTOR)
// Calculate bar widths based on relative ROI values
const smallpoxPct = Math.round((SMALLPOX_ERADICATION_ROI.value / DFDA_ROI_RD_ONLY.value) * 100)
const vaccinePct = Math.round((CHILDHOOD_VACCINATION_ROI.value / DFDA_ROI_RD_ONLY.value) * 100)

export function ROICard() {
  return (
    <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
      <div className="flex flex-col items-center gap-3 mb-4">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-center">The Returns on Not Dying</h3>
        <ImpactExplainer className="h-9 w-9 border-primary text-primary" label="Explain ROI" />
      </div>
      <p className="text-base sm:text-lg font-bold mb-8 text-center max-w-3xl mx-auto">
        When you stop making people fill out paperwork and start letting them not die, something magical happens:
      </p>

      {/* Main ROI Number */}
      <div className="bg-brutal-pink border-4 border-primary p-8 mb-8 text-center">
        <div className="text-6xl sm:text-7xl md:text-8xl font-black text-brutal-pink-foreground mb-2">
          <ParameterValue param={DFDA_ROI_RD_ONLY} />
        </div>
        <div className="text-xl sm:text-2xl font-black uppercase text-brutal-pink-foreground">
          RETURN ON INVESTMENT
        </div>
        <p className="text-base sm:text-lg font-bold text-brutal-pink-foreground mt-4">
          <span className="underline">${mainROIRaw} returned for every $1 invested</span>
        </p>
        <p className="text-sm sm:text-base font-bold text-brutal-pink-foreground mt-2">
          Not a typo. Not a fever dream. Actual math.
        </p>
      </div>

      {/* Historical Comparison Chart */}
      <div className="bg-brutal-yellow border-4 border-primary p-6 mb-8">
        <p className="text-base sm:text-lg font-bold text-center mb-6">
          This beats humanity&apos;s previous greatest hits in the &quot;not dying&quot; genre:
        </p>
        <div className="space-y-4">
          {/* 1% Treaty - Main ROI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm sm:text-base font-black uppercase">1% Treaty</div>
              <div className="text-lg sm:text-xl font-black text-brutal-pink">{mainROI}</div>
            </div>
            <div className="w-full h-12 bg-brutal-pink border-2 border-primary" />
          </div>

          {/* Smallpox */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm sm:text-base font-black uppercase">Smallpox Eradication</div>
              <div className="text-lg sm:text-xl font-black">{smallpoxROI}</div>
            </div>
            <div style={{ width: `${smallpoxPct}%` }} className="h-12 bg-background border-2 border-primary" />
          </div>

          {/* Vaccinations */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm sm:text-base font-black uppercase">Childhood Vaccinations</div>
              <div className="text-lg sm:text-xl font-black">{vaccineROI}</div>
            </div>
            <div style={{ width: `${vaccinePct}%` }} className="h-12 bg-background border-2 border-primary" />
          </div>
        </div>
      </div>

      {/* Where It Comes From */}
      <div className="mb-6">
        <p className="text-lg font-black uppercase text-center mb-6">WHERE THE VALUE COMES FROM:</p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* R&D Savings Card */}
          <Card className="bg-brutal-cyan border-4 border-primary p-6 text-center">
            <div className="text-4xl sm:text-5xl font-black mb-2">
              <ParameterValue param={DFDA_NET_SAVINGS_RD_ONLY_ANNUAL} />
            </div>
            <div className="font-black uppercase text-sm mb-2">ANNUAL RESEARCH SAVINGS</div>
            <div className="text-xs sm:text-sm font-bold">Drug trials cost {costReduction} less</div>
          </Card>

          {/* QALYs Gained Card */}
          <Card className="bg-brutal-pink border-4 border-primary p-6 text-center">
            <div className="text-4xl sm:text-5xl font-black text-brutal-pink-foreground mb-2">
              <ParameterValue param={TREATY_QALYS_GAINED_ANNUAL_GLOBAL} />
            </div>
            <div className="font-black uppercase text-sm mb-2 text-brutal-pink-foreground">QALYS GAINED ANNUALLY</div>
            <div className="text-xs sm:text-sm font-bold text-brutal-pink-foreground">Quality-adjusted life years</div>
          </Card>
        </div>

        {/* Breakdown - simplified to avoid hardcoded values */}
        <div className="bg-background border-2 border-primary p-4 text-center">
          <p className="font-bold text-sm">
            Value comes from faster drug approvals ({DRUG_DISCOVERY_TO_APPROVAL_YEARS.value} years → 2 years), better treatment matching through real-world data, and addressing neglected diseases that companies ignore.
          </p>
        </div>
      </div>
    </Card>
  )
}
