"use client";

import Link from "next/link";
import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import {
  agenciesLink,
  wishocracyLink,
  referendumLink,
  dtreasuryLink,
  dirsLink,
  federalReserveLink,
  dssaLink,
  opgLink,
  obgLink,
  transparencyLink,
  discoveriesLink,
  departmentOfWarLink,
  type NavItem,
} from "@/lib/routes";

const agencies: NavItem[] = [
  wishocracyLink,
  referendumLink,
  dtreasuryLink,
  federalReserveLink,
  dirsLink,
  dssaLink,
  opgLink,
  obgLink,
  transparencyLink,
  discoveriesLink,
  departmentOfWarLink,
];

export function OptimizedGovernancePreview() {
  return (
    <SectionContainer bgColor="background" borderPosition="top" padding="lg">
      <Container>
        <SectionHeader
          title="Optimized Governance"
          subtitle="Ten agencies running a civilisation. No bureaucracy, no corruption, no seventy-four-thousand-page tax code. Just code."
          size="lg"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agencies.map((agency) => (
            <Link
              key={agency.href}
              href={agency.href}
              className="p-4 border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="text-3xl mb-2">{agency.emoji}</div>
              <div className="font-black text-lg text-foreground uppercase mb-1">
                {agency.label}
              </div>
              <p className="text-sm font-bold text-muted-foreground leading-snug">
                {agency.description}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <GameCTA href={agenciesLink.href} variant="primary">
            🏛️ Explore All Agencies
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
