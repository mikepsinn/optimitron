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

        <div className="space-y-3 md:hidden">
          {PREVIEW_POLICIES.map((p) => {
            const grade = p.evidenceGrade as Grade;
            const action = ACTION_LABEL[p.recommendationType] ?? {
              icon: "📋",
              label: p.recommendationType.toUpperCase(),
            };

            return (
              <Link
                key={p.name}
                href={getPolicyPath(p.name)}
                className="block border-4 border-primary bg-background p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 flex-1 break-words text-base font-black leading-tight text-foreground">
                    {p.name}
                  </h3>
                  <span className={`shrink-0 border-2 border-primary px-3 py-1 text-sm font-black ${GRADE_COLOR[grade] ?? GRADE_COLOR.D}`}>
                    {grade}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="font-black uppercase text-muted-foreground">Health</dt>
                    <dd className={`mt-1 font-black ${effectColor(p.healthEffect)}`}>
                      {formatEffect(p.healthEffect, " yrs")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-black uppercase text-muted-foreground">Income</dt>
                    <dd className={`mt-1 font-black ${effectColor(p.incomeEffect)}`}>
                      {formatEffect(p.incomeEffect, " pp")}
                    </dd>
                  </div>
                  <div className="col-span-2 border-t-2 border-primary pt-3">
                    <dt className="font-black uppercase text-muted-foreground">Action</dt>
                    <dd className="mt-1 break-words font-black">
                      {action.icon} {action.label}
                    </dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>

        <div className="hidden overflow-hidden border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:block">
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
