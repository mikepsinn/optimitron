"use client"

import { Card } from "@/components/retroui/Card"
import { LatexBlock } from "@/components/ui/latex"
import { ImpactExplainer } from "@/components/shared/ImpactExplainer"
import {
  DFDA_NET_SAVINGS_RD_ONLY_ANNUAL,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  TREATY_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_CAMPAIGN_TOTAL_COST,
  formatParameter,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue"

const escapeLatex = (str: string) => str.replace(/\$/g, '\\$')

export function InfiniteROICard() {
  const totalValueFormatted = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE)
  const campaignCostFormatted = formatParameter(TREATY_CAMPAIGN_TOTAL_COST)
  const roiFormatted = formatParameter(TREATY_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG)

  const totalValueLatex = escapeLatex(totalValueFormatted)
  const campaignCostLatex = escapeLatex(campaignCostFormatted)

  return (
    <Card className="bg-brutal-pink border-4 border-primary p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-12">
      <div className="flex flex-col items-center gap-3 mb-4 text-brutal-pink-foreground">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-center">The Math That Broke Excel</h3>
        <p className="font-bold text-center">A <ParameterValue param={TREATY_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG} /> Return on Investment</p>
        <ImpactExplainer className="h-9 w-9 border-primary text-brutal-pink-foreground bg-brutal-pink" label="Show impact math" />
      </div>

      <p className="text-base font-bold text-brutal-pink-foreground">
        A <ParameterValue param={TREATY_CAMPAIGN_TOTAL_COST} /> campaign yields{" "}
        <span className="text-background text-2xl font-black"><ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE} /></span> in health value.
      </p>

      <div className="bg-brutal-yellow border-4 border-primary p-4 my-4">
        <LatexBlock className="text-center">
          {`\\begin{aligned}
\\text{ROI} &= \\frac{\\text{Health Value Created}}{\\text{Campaign Cost}} \\\\[1em]
&= \\frac{${totalValueLatex}}{${campaignCostLatex}} = ${roiFormatted}
\\end{aligned}`}
        </LatexBlock>
      </div>

      <div className="bg-background border-4 border-primary p-6">
        <p className="text-lg sm:text-xl font-black uppercase text-center mb-6">Where The Value Comes From:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="bg-brutal-yellow border-4 border-primary p-4 text-center">
            <div className="text-3xl sm:text-4xl font-black mb-2">
              <ParameterValue param={TREATY_CAMPAIGN_TOTAL_COST} />
            </div>
            <div className="text-xs sm:text-sm font-black uppercase mb-1">Campaign Cost</div>
            <div className="text-xs font-bold">Total investment needed</div>
          </Card>

          <Card className="bg-brutal-cyan border-4 border-primary p-4 text-center">
            <div className="text-3xl sm:text-4xl font-black mb-2">
              <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE} />
            </div>
            <div className="text-xs sm:text-sm font-black uppercase mb-1">Health Value</div>
            <div className="text-xs font-bold">From timeline acceleration</div>
          </Card>

          <Card className="bg-background border-4 border-primary p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black mb-2">
              <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} />
            </div>
            <div className="text-xs sm:text-sm font-black uppercase mb-1">Lives Saved</div>
            <div className="text-xs font-bold">From treatments arriving earlier</div>
          </Card>

          <Card className="bg-background border-4 border-primary p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black mb-2">
              <ParameterValue param={DFDA_NET_SAVINGS_RD_ONLY_ANNUAL} />/yr
            </div>
            <div className="text-xs sm:text-sm font-black uppercase mb-1">R&D Savings</div>
            <div className="text-xs font-bold">Per year, forever</div>
          </Card>
        </div>

        <div className="bg-brutal-pink border-4 border-primary p-6 text-center text-brutal-pink-foreground">
          <p className="font-black text-lg sm:text-xl mb-2">
            Math says this is the best possible use of a billion dollars.
          </p>
          <p className="font-bold text-sm sm:text-base">
            Math is rarely wrong about money. People are frequently wrong about money.
          </p>
        </div>
      </div>
    </Card>
  )
}
