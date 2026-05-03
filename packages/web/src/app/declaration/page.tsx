import { ReferendumStepperPage } from "@/components/referendum/ReferendumStepperPage";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { getRouteMetadata } from "@/lib/metadata";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { declarationLink } from "@/lib/routes";

export const metadata = getRouteMetadata(declarationLink);

export default async function DeclarationPage() {
  const referendumContent = await getReferendumPageContent(DECLARATION_SLUG);

  return (
    <div className="min-h-screen bg-background">
      <ReferendumStepperPage
        slug={DECLARATION_SLUG}
        question={referendumContent?.question}
        bodyMarkdown={referendumContent?.bodyMarkdown}
      />
    </div>
  );
}
