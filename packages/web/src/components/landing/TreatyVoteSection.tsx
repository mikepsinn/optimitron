"use client";

import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";

export default function TreatyVoteSection() {
  return (
    <SectionContainer
      id="vote"
      bgColor="yellow"
      borderPosition="bottom"
      padding="sm"
      className="pb-32"
    >
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center mb-10">
          THE <span className="text-brutal-yellow-foreground">QUESTION</span>
        </h2>
        <TreatyVoteFlow />
      </Container>
    </SectionContainer>
  );
}
