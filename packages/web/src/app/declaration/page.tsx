import { ReferendumStepperPage } from "@/components/referendum/ReferendumStepperPage";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { getRouteMetadata } from "@/lib/metadata";
import { declarationLink } from "@/lib/routes";

export const metadata = getRouteMetadata(declarationLink);

export default function DeclarationPage() {
  return (
    <div className="min-h-screen bg-background">
      <ReferendumStepperPage slug={DECLARATION_SLUG} />
    </div>
  );
}
