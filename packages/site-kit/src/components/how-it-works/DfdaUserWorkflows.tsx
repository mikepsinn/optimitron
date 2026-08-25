import { PatientHowItWorks } from "./PatientHowItWorks";
import { ProviderHowItWorks } from "./ProviderHowItWorks";
import { ResearchPartnerHowItWorks } from "./ResearchPartnerHowItWorks";

interface DfdaUserWorkflowsProps {
  findTrialsHref?: string;
  createTrialHref?: string;
}

export function DfdaUserWorkflows({
  findTrialsHref,
  createTrialHref,
}: DfdaUserWorkflowsProps = {}) {
  return (
    <>
      <div className="mb-20">
        <PatientHowItWorks findTrialsHref={findTrialsHref} />
      </div>
      <div className="mb-20">
        <ProviderHowItWorks />
      </div>
      <ResearchPartnerHowItWorks createTrialHref={createTrialHref} />
    </>
  );
}
