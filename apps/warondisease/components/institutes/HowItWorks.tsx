import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { ClipboardCheck, Code, BarChart3, Phone, Link as LinkIcon, Download, Palette } from "lucide-react"

export function HowItWorks() {
  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg" data-how-it-works>
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-4 text-foreground">
          HOW IT WORKS
        </h2>
        <p className="text-xl font-bold text-center text-foreground/80 mb-16 max-w-3xl mx-auto">
          THREE SIMPLE STEPS TO START COLLECTING DATA
        </p>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="grid md:grid-cols-[120px_1fr] gap-6 items-start">
            <div className="flex md:flex-col items-center gap-4">
              <div className="bg-brutal-cyan border-4 border-primary w-20 h-20 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-4xl font-black text-foreground">1</span>
              </div>
            </div>
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
              <h3 className="text-2xl font-black uppercase mb-4 text-foreground">
                CREATE YOUR PARTNER INSTITUTE
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ClipboardCheck className="h-6 w-6 text-brutal-cyan flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-foreground">
                    Fill in your organization name below to get started instantly.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-6 w-6 text-brutal-cyan flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-foreground">
                    You'll receive onboarding materials and, if useful, an invitation for a short call.
                  </span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Step 2 */}
          <div className="grid md:grid-cols-[120px_1fr] gap-6 items-start">
            <div className="flex md:flex-col items-center gap-4">
              <div className="bg-brutal-pink border-4 border-primary w-20 h-20 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-4xl font-black text-foreground">2</span>
              </div>
            </div>
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
              <h3 className="text-2xl font-black uppercase mb-4 text-foreground">
                ADD THE SURVEY TO YOUR SUPPORTER JOURNEY
              </h3>
              <p className="font-bold text-foreground mb-4">Choose one or both integration options:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-brutal-cyan/10 border-4 border-primary p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-5 w-5 text-foreground" />
                    <span className="font-black uppercase text-foreground">EMBED OPTION</span>
                  </div>
                  <p className="font-bold text-foreground text-sm">
                    Paste a small code snippet into a campaign page, "Get involved" page, or a dedicated survey page. The widget loads using your colors and logo.
                  </p>
                </div>
                <div className="bg-brutal-pink/10 border-4 border-primary p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-5 w-5 text-foreground" />
                    <span className="font-black uppercase text-foreground">HOSTED LINK OPTION</span>
                  </div>
                  <p className="font-bold text-foreground text-sm">
                    Add a button or text link: "Take the Global Clinical Trial Abundance Survey." Opens a co-branded survey page.
                  </p>
                </div>
              </div>
              <div className="mt-4 bg-brutal-yellow border-4 border-primary p-4">
                <p className="font-bold text-foreground text-sm">
                  <Palette className="h-4 w-4 inline mr-2" />
                  Both options include optional email verification (magic link) for one-response-per-person + anti-bot measures.
                </p>
              </div>
            </Card>
          </div>

          {/* Step 3 */}
          <div className="grid md:grid-cols-[120px_1fr] gap-6 items-start">
            <div className="flex md:flex-col items-center gap-4">
              <div className="bg-brutal-yellow border-4 border-primary w-20 h-20 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-4xl font-black text-foreground">3</span>
              </div>
            </div>
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
              <h3 className="text-2xl font-black uppercase mb-4 text-foreground">
                USE THE DATA
              </h3>
              <p className="font-bold text-foreground mb-4">Once you are live, you can:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <BarChart3 className="h-6 w-6 text-brutal-yellow flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-foreground">
                    Log in to see and export results from your traffic.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Download className="h-6 w-6 text-brutal-yellow flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-foreground">
                    Request custom cuts or visualizations if needed.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ClipboardCheck className="h-6 w-6 text-brutal-yellow flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-foreground">
                    Use the findings wherever evidence of supporter priorities for clinical trials strengthens your case.
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </Container>
    </SectionContainer>
  )
}
