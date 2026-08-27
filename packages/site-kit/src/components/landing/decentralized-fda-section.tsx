import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";
import { DfdaUserWorkflows } from "../how-it-works/DfdaUserWorkflows";

interface DecentralizedFDASectionProps {
  showDisclaimer?: boolean;
}

export default function DecentralizedFDASection({
  showDisclaimer = true,
}: DecentralizedFDASectionProps) {
  return (
    <SectionContainer
      id="decentralized-fda-section"
      bgColor="cyan"
      borderPosition="bottom"
      padding="lg"
      className="scroll-mt-[121px]"
    >
      <Container>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            How patients, clinicians, and researchers find what works
          </h2>
          <p className="mx-auto mt-6 max-w-4xl text-xl font-bold text-balance">
            Patients find trials. Clinicians compare options. Researchers learn
            from every result. Here is how a decentralized FDA makes all three
            easier.
          </p>
        </div>

        {showDisclaimer && (
          <div className="mt-12 border-4 border-primary bg-primary p-5 text-center text-primary-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold">
              These are educational interface examples, not medical advice or a
              promise that every option is available. Treatment decisions stay
              with patients and licensed clinicians.
            </p>
          </div>
        )}

        <DfdaUserWorkflows />
      </Container>
    </SectionContainer>
  );
}
