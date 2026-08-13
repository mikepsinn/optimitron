"use client"

import Layout from "../../components/layout"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { InstituteHero } from "@/components/institutes/InstituteHero"
import { WhatTheSurveyMeasures } from "@/components/institutes/WhatTheSurveyMeasures"
import { TheBrutalTruth } from "@/components/institutes/TheBrutalTruth"
import { WhatOnePercentChanges } from "@/components/institutes/WhatOnePercentChanges"
import { DataAssetValue } from "@/components/institutes/DataAssetValue"
import { SurveyImplementationGuide } from "@/components/institutes/SurveyImplementationGuide"
import { CoalitionBenefits } from "@/components/institutes/CoalitionBenefits"
import { FutureGrants } from "@/components/institutes/FutureGrants"
import { HowItWorks } from "@/components/institutes/HowItWorks"
import { SafeForCharities } from "@/components/institutes/SafeForCharities"
import { WhoShouldApply } from "@/components/institutes/WhoShouldApply"
import { WhatPartnerInstituteMeans } from "@/components/institutes/WhatPartnerInstituteMeans"
import { InstituteBecomePartnerSection } from "@/components/institutes/InstituteBecomePartnerSection"
import { BecomePartnerCTA } from "@/components/institutes/BecomePartnerCTA"

export default function InstitutesPage() {
  return (
    <Layout>
      {/* Hero */}
      <InstituteHero />

      {/* What the Survey Is */}
      <WhatTheSurveyMeasures />

      {/* Why This Matters */}
      <TheBrutalTruth />

      {/* CTA after emotional hook */}
      <SectionContainer bgColor="yellow" borderPosition="bottom" padding="sm">
        <Container size="md">
          <BecomePartnerCTA variant="large" />
        </Container>
      </SectionContainer>

      <WhatOnePercentChanges />

      {/* CTA after showing impact */}
      <SectionContainer bgColor="background" borderPosition="bottom" padding="sm">
        <Container size="md">
          <p className="text-center text-xl font-bold mb-6 max-w-2xl mx-auto">
            Ready to demonstrate your community's support for clinical trial abundance?
          </p>
          <BecomePartnerCTA />
        </Container>
      </SectionContainer>

      {/* What You Get as a Partner Institute */}
      <DataAssetValue />
      <SurveyImplementationGuide />
      <CoalitionBenefits />

      {/* CTA after showing benefits */}
      <SectionContainer bgColor="cyan" borderPosition="bottom" padding="sm">
        <Container size="md">
          <p className="text-center text-xl font-bold mb-6 max-w-2xl mx-auto">
            Get your survey links and start collecting responses today
          </p>
          <BecomePartnerCTA variant="large" />
        </Container>
      </SectionContainer>

      <FutureGrants />

      {/* How It Works */}
      <HowItWorks />

      {/* Nonpartisan and Compliant */}
      <SafeForCharities />

      {/* Who Should Apply */}
      <WhoShouldApply />

      {/* CTA after qualification criteria */}
      <SectionContainer bgColor="pink" borderPosition="bottom" padding="sm">
        <Container size="md">
          <p className="text-center text-xl font-bold mb-6 max-w-2xl mx-auto">
            Does this sound like your organization? Endorse the treaty.
          </p>
          <BecomePartnerCTA variant="large" />
        </Container>
      </SectionContainer>

      {/* What Partner Institute Means */}
      <WhatPartnerInstituteMeans />

      {/* Application Form */}
      <InstituteBecomePartnerSection />
    </Layout>
  )
}
