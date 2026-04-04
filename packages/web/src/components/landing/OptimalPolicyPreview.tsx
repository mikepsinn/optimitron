import Link from "next/link";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { getPolicyPath } from "@/lib/routes";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";
import type { PolicyReportJSON } from "@optimitron/opg";

type Grade = "A" | "B" | "C" | "D" | "F";

const GRADE_COLOR: Record<Grade, string> = {
  A: "bg-brutal-green text-brutal-green-foreground",
  B: "bg-brutal-cyan text-brutal-cyan-foreground",
  C: "bg-brutal-yellow text-brutal-yellow-foreground",
  D: "bg-brutal-red text-brutal-red-foreground",
  F: "bg-brutal-red text-brutal-red-foreground",
};

const ACTION_LABEL: Record<string, { icon: string; label: string }> = {
  implement: { icon: "✅", label: "IMPLEMENT" },
  reallocate: { icon: "🔄", label: "REALLOCATE" },
  repeal: { icon: "❌", label: "REPEAL" },
  maintain: { icon: "✅", label: "MAINTAIN" },
};

/** Hand-picked policies that showcase diversity of categories and effects */
const PREVIEW_NAMES = [
  "Shift Drug Policy from Criminal to Health Approach",
  "Universal Pre-K (Ages 3-4)",
  "Pragmatic Clinical Trial Funding Reform",
  "Military: Adopt Switzerland's Approach",
  "Housing Supply Deregulation",
];

const PREVIEW_POLICIES = PREVIEW_NAMES.map((name) =>
  (usPolicyAnalysis as PolicyReportJSON).policies.find(
    (p) => p.name === name,
  ),
).filter((p): p is NonNullable<typeof p> => p != null);

function formatEffect(value: number, unit: string): string {
  if (value === 0) return "0.00" + unit;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}${unit}`;
}

function effectColor(value: number): string {
  if (value > 0) return "text-brutal-green";
  if (value < 0) return "text-brutal-red";
  return "text-muted-foreground";
}

export function OptimalPolicyPreview() {
  return (
    <SectionContainer bgColor="cyan" borderPosition="top" padding="lg">
      <Container>
        <SectionHeader
          title="Every Policy Graded A Through F"
          subtitle="I ran causal inference on decades of data across dozens of countries. Most of your policies fail."
          size="lg"
        />

        <div className="overflow-x-auto border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-primary bg-foreground text-background">
                <th className="py-3 px-4 text-left font-black uppercase text-sm">Policy</th>
                <th className="py-3 px-4 text-right font-black uppercase text-sm">Health</th>
                <th className="py-3 px-4 text-right font-black uppercase text-sm">Income</th>
                <th className="py-3 px-4 text-center font-black uppercase text-sm">Grade</th>
                <th className="py-3 px-4 text-center font-black uppercase text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {PREVIEW_POLICIES.map((p) => {
                const grade = p.evidenceGrade as Grade;
                const action = ACTION_LABEL[p.recommendationType] ?? {
                  icon: "📋",
                  label: p.recommendationType.toUpperCase(),
                };
                return (
                  <tr key={p.name} className="border-b-2 border-primary hover:bg-muted transition-colors relative">
                    <td className="py-3 px-4 font-black text-foreground">
                      <Link href={getPolicyPath(p.name)} className="absolute inset-0" aria-label={p.name} />
                      {p.name}
                    </td>
                    <td className={`py-3 px-4 text-right font-black ${effectColor(p.healthEffect)}`}>
                      {formatEffect(p.healthEffect, " yrs")}
                    </td>
                    <td className={`py-3 px-4 text-right font-black ${effectColor(p.incomeEffect)}`}>
                      {formatEffect(p.incomeEffect, " pp")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-3 py-1 font-black text-sm border-2 border-primary ${GRADE_COLOR[grade] ?? GRADE_COLOR.D}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-sm">
                      {action.icon} {action.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <GameCTA href="/opg" variant="primary">
            See All Policy Grades &rarr;
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
