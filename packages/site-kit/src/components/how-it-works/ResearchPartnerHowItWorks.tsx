import Link from "next/link";
import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { ArrowRight } from "lucide-react";
import { ResearchPartnerSteps } from "./ResearchPartnerSteps";

interface ResearchPartnerHowItWorksProps {
  createTrialHref?: string;
}

export function ResearchPartnerHowItWorks({
  createTrialHref = "https://dfda.earth/contact",
}: ResearchPartnerHowItWorksProps = {}) {
  return (
    <div
      className="relative mt-12 mb-16 scroll-mt-[121px]"
      id="how-it-works-research-partner"
    >
      <div className="mx-auto max-w-5xl">
        <h3 className="text-3xl font-bold text-center mb-8">
          How it Works For Researchers
        </h3>
        <p className="text-center mb-8">
          The new and improved FDA.gov would make it effortless for researchers
          to create a trial and invite patients to join.
        </p>

        <ResearchPartnerSteps />

        <div className="flex justify-center mt-12">
          {/* No self-serve trial-creation workflow exists yet; route to
              Contact so researchers can reach us instead of hitting a 404. */}
          <Link href={createTrialHref}>
            <Button size="lg" className="gap-1">
              Create a Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
