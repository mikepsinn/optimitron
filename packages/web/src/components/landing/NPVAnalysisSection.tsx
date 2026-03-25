"use client"

import { Card } from "@/components/retroui/Card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { useState } from "react"
import {
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  DFDA_NPV_UPFRONT_COST_TOTAL,
  DFDA_ANNUAL_OPEX,
  DFDA_NET_SAVINGS_RD_ONLY_ANNUAL,
  DFDA_ROI_RD_ONLY,
  NPV_TIME_HORIZON_YEARS,
  DFDA_NPV_ADOPTION_RAMP_YEARS,
} from "@/lib/parameters-calculations-citations"
import { formatParameter, getParameterValue } from "@/lib/format-parameter"
import { ParameterValue } from "@/components/shared/ParameterValue"

const costReduction = formatParameter(RECOVERY_TRIAL_COST_REDUCTION_FACTOR)
const roiRaw = getParameterValue(DFDA_ROI_RD_ONLY, "round")
const timeHorizonYears = NPV_TIME_HORIZON_YEARS.value
const adoptionRampYearsValue = DFDA_NPV_ADOPTION_RAMP_YEARS.value

export default function NPVAnalysisSection() {
  const [showTable, setShowTable] = useState(false)

  const discountRate = 0.08
  const years = timeHorizonYears
  const upfrontCost = DFDA_NPV_UPFRONT_COST_TOTAL.value / 1e9
  const annualOpex = DFDA_ANNUAL_OPEX.value / 1e9
  const annualSavingsMax = DFDA_NET_SAVINGS_RD_ONLY_ANNUAL.value / 1e9
  const adoptionRampYears = adoptionRampYearsValue

  const yearlyData = []
  for (let year = 1; year <= years; year++) {
    const adoptionRate = year <= adoptionRampYears ? year / adoptionRampYears : 1.0
    const savings = adoptionRate * annualSavingsMax
    const costs = annualOpex
    const netCashFlow = savings - costs
    const discountFactor = Math.pow(1 + discountRate, year)
    const presentValue = netCashFlow / discountFactor

    yearlyData.push({
      year,
      adoptionRate: (adoptionRate * 100).toFixed(0),
      savings: savings.toFixed(1),
      costs: costs.toFixed(3),
      netCashFlow: netCashFlow.toFixed(1),
      presentValue: presentValue.toFixed(1),
    })
  }

  const totalNPVSavings = yearlyData.reduce((sum, row) => sum + parseFloat(row.presentValue), 0)
  const npvOperationalCosts = yearlyData.reduce((sum, _row, idx) => sum + annualOpex / Math.pow(1 + discountRate, idx + 1), 0)
  const totalNPVCosts = upfrontCost + npvOperationalCosts

  return (
    <SectionContainer bgColor="background" borderPosition="top" padding="lg">
      <Container>
        <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-4">
          NPV ANALYSIS: <span className="text-brutal-pink">10-YEAR PROJECTION</span>
        </h2>
        <p className="text-center text-lg font-bold mb-12 max-w-3xl mx-auto">
          Rigorous financial modeling using{" "}
          <span className="text-brutal-pink font-black">Net Present Value (NPV)</span> to account for time value of
          money and gradual adoption
        </p>

        {/* Key Parameters */}
        <Card className="bg-brutal-cyan border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
          <h3 className="text-2xl font-black uppercase mb-6 text-center">MODEL PARAMETERS</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-background border-4 border-primary p-4">
                <div className="text-sm font-bold uppercase mb-2">Investment</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Upfront Platform Cost</span>
                    <span className="font-black"><ParameterValue param={DFDA_NPV_UPFRONT_COST_TOTAL} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Operations</span>
                    <span className="font-black"><ParameterValue param={DFDA_ANNUAL_OPEX} format={{ includeUnit: true }} /></span>
                  </div>
                </div>
              </div>
              <div className="bg-background border-4 border-primary p-4">
                <div className="text-sm font-bold uppercase mb-2">Adoption Curve</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ramp Period</span>
                    <span className="font-black">{adoptionRampYears} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Full Adoption</span>
                    <span className="font-black">Year {adoptionRampYears + 1}+</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-background border-4 border-primary p-4">
                <div className="text-sm font-bold uppercase mb-2">Returns</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Max Annual Savings</span>
                    <span className="font-black"><ParameterValue param={DFDA_NET_SAVINGS_RD_ONLY_ANNUAL} format={{ includeUnit: true }} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>From Cost Reduction</span>
                    <span className="font-black">{costReduction} cheaper</span>
                  </div>
                </div>
              </div>
              <div className="bg-background border-4 border-primary p-4">
                <div className="text-sm font-bold uppercase mb-2">Financial Assumptions</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Discount Rate</span>
                    <span className="font-black">{(discountRate * 100).toFixed(0)}% annual</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Horizon</span>
                    <span className="font-black">{years} years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* NPV Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-brutal-pink border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-sm font-bold uppercase mb-2 text-brutal-pink-foreground">NPV of Costs</div>
            <div className="text-4xl font-black text-brutal-pink-foreground">${totalNPVCosts.toFixed(1)}B</div>
            <div className="text-xs text-brutal-pink-foreground mt-2">Upfront + discounted operations</div>
          </Card>
          <Card className="bg-brutal-cyan border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-sm font-bold uppercase mb-2">NPV of Savings</div>
            <div className="text-4xl font-black">${totalNPVSavings.toFixed(1)}B</div>
            <div className="text-xs mt-2">Discounted cash flows over {years} years</div>
          </Card>
          <Card className="bg-brutal-yellow border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-sm font-bold uppercase mb-2">NPV-Adjusted ROI</div>
            <div className="text-4xl font-black text-brutal-pink"><ParameterValue param={DFDA_ROI_RD_ONLY} /></div>
            <div className="text-xs mt-2">After time value of money</div>
          </Card>
        </div>

        {/* Collapsible Year-by-Year Breakdown */}
        <div className="mb-12">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full bg-primary text-primary-foreground px-8 py-4 text-lg font-black uppercase border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all mb-6"
          >
            {showTable ? "HIDE" : "SHOW"} YEAR-BY-YEAR CASH FLOW BREAKDOWN
          </button>

          {showTable && (
            <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black uppercase mb-6 text-center">YEAR-BY-YEAR CASH FLOW</h3>
              <p className="text-center text-sm mb-6 text-muted-foreground">
                This table shows how savings accumulate over time, accounting for gradual adoption and the time value of money.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-4 border-primary">
                      <th className="text-left py-3 px-2 font-black uppercase">Year</th>
                      <th className="text-right py-3 px-2 font-black uppercase">Adoption</th>
                      <th className="text-right py-3 px-2 font-black uppercase">Savings</th>
                      <th className="text-right py-3 px-2 font-black uppercase">Costs</th>
                      <th className="text-right py-3 px-2 font-black uppercase">Net</th>
                      <th className="text-right py-3 px-2 font-black uppercase">NPV</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b-2 border-primary/20">
                      <td className="py-3 px-2 font-bold">Year 0</td>
                      <td className="text-right py-3 px-2">-</td>
                      <td className="text-right py-3 px-2">-</td>
                      <td className="text-right py-3 px-2 text-brutal-pink font-bold"><ParameterValue param={DFDA_NPV_UPFRONT_COST_TOTAL} /></td>
                      <td className="text-right py-3 px-2 text-brutal-pink font-bold">-<ParameterValue param={DFDA_NPV_UPFRONT_COST_TOTAL} /></td>
                      <td className="text-right py-3 px-2 text-brutal-pink font-bold">-<ParameterValue param={DFDA_NPV_UPFRONT_COST_TOTAL} /></td>
                    </tr>
                    {yearlyData.map((row) => (
                      <tr key={row.year} className="border-b-2 border-primary/20">
                        <td className="py-3 px-2 font-bold">Year {row.year}</td>
                        <td className="text-right py-3 px-2">{row.adoptionRate}%</td>
                        <td className="text-right py-3 px-2 text-brutal-cyan font-bold">${row.savings}B</td>
                        <td className="text-right py-3 px-2 text-brutal-pink">-${row.costs}B</td>
                        <td className="text-right py-3 px-2 font-bold">${row.netCashFlow}B</td>
                        <td className="text-right py-3 px-2 font-black">${row.presentValue}B</td>
                      </tr>
                    ))}
                    <tr className="border-t-4 border-primary font-black">
                      <td className="py-3 px-2" colSpan={5}>
                        TOTAL NPV ({years} years)
                      </td>
                      <td className="text-right py-3 px-2 text-brutal-pink text-lg">${totalNPVSavings.toFixed(1)}B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Why NPV Matters */}
        <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
          <h3 className="text-2xl font-black uppercase mb-6 text-center">WHY NPV ANALYSIS MATTERS</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="bg-brutal-pink border-l-4 border-brutal-pink p-4 mb-4">
                <div className="font-black uppercase text-sm mb-2 text-brutal-pink">Simple ROI (higher)</div>
                <ul className="text-sm space-y-2">
                  <li>Easy to understand</li>
                  <li>Good for headlines</li>
                  <li>X Ignores time value of money</li>
                  <li>X Treats future $ = today&apos;s $</li>
                  <li>X Overstates true return</li>
                </ul>
              </div>
            </div>
            <div>
              <div className="bg-brutal-cyan border-l-4 border-brutal-cyan p-4 mb-4">
                <div className="font-black uppercase text-sm mb-2 text-brutal-cyan">NPV-Adjusted ROI ({roiRaw}:1)</div>
                <ul className="text-sm space-y-2">
                  <li>Academically rigorous</li>
                  <li>Accounts for time value</li>
                  <li>Includes adoption curve</li>
                  <li>Applies discount rate ({(discountRate * 100).toFixed(0)}%)</li>
                  <li>Conservative estimate</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-brutal-yellow border-4 border-primary p-4">
            <p className="font-bold text-center">
              The {roiRaw}:1 NPV-adjusted ROI is the <span className="text-brutal-pink">canonical figure</span> we use for
              academic credibility. It&apos;s conservative and passes rigorous financial scrutiny.
            </p>
          </div>
        </Card>

        {/* Adoption Curve Visualization */}
        <Card className="bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black uppercase mb-6 text-center">ADOPTION CURVE</h3>
          <p className="text-center text-sm mb-6">
            We assume a linear {adoptionRampYears}-year ramp to 100% adoption (conservative - could be faster)
          </p>
          <div className="space-y-2">
            {Array.from({ length: adoptionRampYears + 1 }, (_, i) => ({
              year: i + 1,
              pct: i < adoptionRampYears ? Math.round(((i + 1) / adoptionRampYears) * 100) : 100,
              note: i === adoptionRampYears ? " (sustained)" : undefined,
            })).map((item) => (
              <div key={item.year} className="flex items-center gap-4">
                <div className="w-20 text-sm font-bold">Year {item.year}:</div>
                <div className="flex-1 bg-brutal-pink border-4 border-primary h-12 relative">
                  <div
                    className="bg-brutal-pink h-full flex items-center justify-end pr-2 font-black text-sm text-brutal-pink-foreground"
                    style={{ width: `${item.pct}%` }}
                  >
                    {item.pct}%{item.note || ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-6 text-muted-foreground">
            This conservative assumption models gradual market penetration. Reality: RECOVERY trial scaled to 40,000+
            patients in months.
          </p>
        </Card>
      </Container>
    </SectionContainer>
  )
}
