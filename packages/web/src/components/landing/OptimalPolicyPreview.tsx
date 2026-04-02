import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";

type Grade = "A" | "B" | "D" | "F";
type Action = "ENACT" | "MAINTAIN" | "REPLACE" | "REPEAL";

interface PolicyRow {
  policy: string;
  health: number;
  income: number;
  grade: Grade;
  action: Action;
}

// Sourced from real natural experiments (see slide-optimal-policy-generator.tsx comments)
const POLICIES: PolicyRow[] = [
  { policy: "🇵🇹 Drug Decriminalization", health: 0.25, income: 0.01, grade: "A", action: "ENACT" },
  { policy: "🏥 Universal Healthcare", health: 0.40, income: 0.05, grade: "B", action: "MAINTAIN" },
  { policy: "🚬 Tobacco Tax Reform", health: 0.25, income: -0.02, grade: "A", action: "REPLACE" },
  { policy: "⚔️ War on Drugs", health: -0.15, income: -0.01, grade: "F", action: "REPEAL" },
  { policy: "🏦 Quantitative Easing", health: 0.0, income: -0.03, grade: "D", action: "REPEAL" },
];

const GRADE_COLOR: Record<Grade, string> = {
  A: "bg-brutal-green text-brutal-green-foreground",
  B: "bg-brutal-cyan text-brutal-cyan-foreground",
  D: "bg-brutal-red text-brutal-red-foreground",
  F: "bg-brutal-red text-brutal-red-foreground",
};

const ACTION_ICON: Record<Action, string> = {
  ENACT: "✅",
  MAINTAIN: "✅",
  REPLACE: "🔄",
  REPEAL: "❌",
};

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
              {POLICIES.map((p) => (
                <tr key={p.policy} className="border-b-2 border-primary hover:bg-muted transition-colors">
                  <td className="py-3 px-4 font-black text-foreground">{p.policy}</td>
                  <td className={`py-3 px-4 text-right font-black ${effectColor(p.health)}`}>
                    {formatEffect(p.health, " yrs")}
                  </td>
                  <td className={`py-3 px-4 text-right font-black ${effectColor(p.income)}`}>
                    {formatEffect(p.income, " pp")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 font-black text-sm border-2 border-primary ${GRADE_COLOR[p.grade]}`}>
                      {p.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-sm">
                    {ACTION_ICON[p.action]} {p.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <GameCTA href="/agencies/dcbo" variant="primary">
            See All Policy Grades &rarr;
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
