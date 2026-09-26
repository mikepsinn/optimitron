import Link from "next/link";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import { getPolicyPath } from "@/lib/routes";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";

export function OptimalPolicyPreview({
  subtitle = "Proposals for healthcare, education, housing and drug policy.",
  title = "Compare Policy Proposals",
}: {
  subtitle?: string;
  title?: string;
}) {
  const policies = usPolicyAnalysis.policies.filter((policy) => !policy.oecdSpendingField);
  return (
    <SectionContainer>
      <Container>
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="grid gap-4 sm:grid-cols-2">
          {policies.map((policy) => (
            <Link key={policy.name} href={getPolicyPath(policy.name)} className="border-4 border-primary p-5 block">
              <h3 className="font-black underline mb-2">{policy.name}</h3>
              <p className="text-sm">{policy.recommendedTarget}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center"><GameCTA href="/opg" variant="primary">Explore policies →</GameCTA></div>
      </Container>
    </SectionContainer>
  );
}
