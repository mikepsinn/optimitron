import Link from "next/link"
import type { Metadata } from "next"
import TreatyVoteSection from "@/components/landing/treaty-vote-section"
import { Container } from "@/components/ui/container"
import { ROUTES } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Survey Embed Demo",
  description: "Live demo of the embeddable Global Clinical Trial Abundance Survey.",
}

export default function SurveyDemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-foreground text-background py-4 border-b-4 border-primary">
        <Container size="md" className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-black uppercase text-brutal-yellow mb-1">Live Preview</p>
            <h1 className="text-lg sm:text-xl font-black uppercase">Example Partner Survey</h1>
          </div>
        </Container>
      </header>

      <main className="flex-1 bg-background">
        <TreatyVoteSection
          hideHeading
          frameless
          bgColor="background"
          showManualPromo={false}
          postVoteMode="lite"
        />
      </main>

      <footer className="bg-foreground text-background py-6 border-t-4 border-primary">
        <Container size="md" className="text-center">
          <nav aria-label="Legal" className="text-sm font-bold">
            <Link href={ROUTES.privacy} className="text-brutal-cyan underline underline-offset-2 hover:opacity-80 transition-opacity">
              Privacy Policy
            </Link>{" "}
            •{" "}
            <Link href={ROUTES.terms} className="text-brutal-cyan underline underline-offset-2 hover:opacity-80 transition-opacity">
              Terms of Service
            </Link>
          </nav>
        </Container>
      </footer>
    </div>
  )
}
