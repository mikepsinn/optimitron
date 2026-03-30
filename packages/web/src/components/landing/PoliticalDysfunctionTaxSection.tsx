"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CountUp } from "@/components/animations/CountUp";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { politicalDysfunctionTaxPaperLink } from "@/lib/routes";
import {
  fmtParam,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
const milSpendFmt = fmtParam({ ...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD" });
const milToTrialsRatio = Math.round(
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value /
    GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value,
);

const wasteBreakdown = [
  {
    label: "Healthcare Inefficiency",
    stat: "17.3%",
    detail: "US spends 17.3% of GDP on healthcare. Singapore spends 4.1% and lives 6 years longer. You are paying quadruple for a worse product. On purpose, apparently.",
    color: "bg-brutal-cyan",
  },
  {
    label: "Administrative Bloat",
    stat: "$4.9T",
    detail: "Allocative inefficiency in the US alone. That is money spent deciding how to spend money. Your bureaucracy has a bureaucracy and it also needs a meeting.",
    color: "bg-brutal-yellow",
  },
  {
    label: "Regulatory Capture",
    stat: "Systemic",
    detail: "Industries writing their own regulations. It is like letting students grade their own exams, except the students have lobbyists and the exams affect whether people live or die.",
    color: "bg-brutal-pink",
  },
  {
    label: "Military Overspend",
    stat: `${milSpendFmt}/yr`,
    detail: `Global military spending. That is ${milToTrialsRatio} times more than you spend on disease research. You have prioritised blowing things up over not dying. Bold strategy.`,
    color: "bg-brutal-cyan",
  },
];

const pieData = [
  { name: "Healthcare", value: 34 },
  { name: "Migration", value: 57 },
  { name: "Science", value: 4 },
  { name: "Lead/Pollution", value: 6 },
];

export function PoliticalDysfunctionTaxSection() {
  return (
    <section className="bg-brutal-red">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            The $<CountUp value={Math.round(POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value / 1e12)} className="text-brutal-red-foreground" /> Trillion Stupidity Tax
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
            Your civilisation loses <ParameterValue param={{...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"}} /> per year to governance dysfunction.
            That is <ParameterValue param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL} /> per human per year in pure waste. Your overhead is almost
            equal to your entire economic output. My toaster runs more efficiently.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {wasteBreakdown.map((item) => (
            <ScrollReveal key={item.label} delay={0.1}>
              <div className={`p-6 border-4 border-primary ${item.color} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-black px-2.5 py-1 bg-foreground text-background uppercase">
                    {item.label}
                  </span>
                  <span className="text-2xl font-black text-foreground">{item.stat}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed font-bold">
                  {item.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Pie chart breakdown */}
        <ScrollReveal delay={0.2}>
          <div className="mb-12 flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
              {pieData.map((item) => (
                <div key={item.name} className="text-center p-4 border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="font-black text-3xl text-brutal-red">${item.value}T</div>
                  <div className="font-bold text-sm text-muted-foreground mt-1">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="p-8 border-4 border-primary bg-brutal-red shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-4xl sm:text-5xl font-black text-brutal-red-foreground mb-2">
              $<CountUp value={Math.round(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL.value)} className="text-brutal-red-foreground" />/person/year
            </div>
            <p className="text-background font-bold max-w-xl mx-auto">
              Every human on Earth pays <ParameterValue param={POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL} /> per year in governance dysfunction.
              Not in taxes — in waste. The taxes are on top of that.
            </p>
            <NavItemLink
              item={politicalDysfunctionTaxPaperLink}
              variant="custom"
              external
              className="mt-6 inline-flex items-center text-sm font-black text-muted-foreground uppercase hover:text-background transition-colors"
            >
              Read the paper &rarr;
            </NavItemLink>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
