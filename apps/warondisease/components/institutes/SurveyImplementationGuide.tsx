"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import {
  Code,
  Link as LinkIcon,
  ExternalLink,
  PanelsTopLeft,
  Mail,
  Globe,
  Info,
} from "lucide-react"
import { getSiteConfig } from "@/lib/site-config"

export function SurveyImplementationGuide() {
  const [showEmbedCode, setShowEmbedCode] = useState(true)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const siteBaseUrl = getSiteConfig().baseUrl
  const origin = typeof window !== "undefined" ? window.location.origin : siteBaseUrl
  const surveyExampleUrl = `${origin}/survey/YOUR-ORG-SLUG`
  const surveyDemoUrl = `${origin}/survey/demo`
  const embedCode = `<iframe src="${surveyExampleUrl}" width="100%" height="800" frameborder="0" title="Global Clinical Trial Abundance Survey"></iframe>`
  const directLinkSnippet = `<a href="${surveyExampleUrl}" target="_blank" rel="noopener noreferrer">Take the Global Clinical Trial Abundance Survey</a>`

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyExampleUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-6 text-foreground">
            ADD THE <span className="text-foreground">SURVEY</span> TO YOUR SITE
          </h2>
          <p className="text-lg sm:text-xl font-bold text-foreground max-w-3xl mx-auto">
            ONCE APPROVED, YOU&apos;LL GET A CUSTOM SURVEY PAGE TO EMBED ON YOUR SITE OR SHARE WITH YOUR SUPPORTERS.
            THIS SECTION SHOWS THE BEST DEFAULTS.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brutal-cyan border-4 border-primary w-12 h-12 flex items-center justify-center">
                <PanelsTopLeft className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground">BEST DEFAULT</h3>
            </div>
            <p className="font-bold text-foreground text-sm leading-relaxed">
              Put a direct survey button in emails, social posts, and newsletter flows. Add the iframe on a
              homepage, &quot;Get Involved&quot; page, or campaign landing page where supporters already expect to act.
            </p>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brutal-pink border-4 border-primary w-12 h-12 flex items-center justify-center">
                <Code className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground">EMBED IF...</h3>
            </div>
            <p className="font-bold text-foreground text-sm leading-relaxed">
              You want supporters to answer without leaving your site, or you already have a campaign page where a
              full survey block makes sense.
            </p>
          </Card>

          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brutal-yellow border-4 border-primary w-12 h-12 flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground">LINK IF...</h3>
            </div>
            <p className="font-bold text-foreground text-sm leading-relaxed">
              Your CMS fights iframes, your web team is cautious, or you mainly want a clean CTA in email, social, or
              a donate/take-action flow.
            </p>
          </Card>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={() => setShowEmbedCode(true)}
            className={`border-4 border-primary font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
              showEmbedCode
                ? "bg-foreground text-background"
                : "bg-background text-foreground hover:bg-foreground hover:text-background"
            }`}
          >
            <Code className="mr-2 h-4 w-4" />
            EMBED CODE
          </Button>
          <Button
            onClick={() => setShowEmbedCode(false)}
            className={`border-4 border-primary font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
              !showEmbedCode
                ? "bg-foreground text-background"
                : "bg-background text-foreground hover:bg-foreground hover:text-background"
            }`}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            DIRECT LINK
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {showEmbedCode ? (
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
              <div className="mb-4">
                <h3 className="text-2xl font-black uppercase mb-2 text-foreground">IFRAME EMBED CODE</h3>
                <p className="font-bold text-foreground/80">COPY AND PASTE THIS INTO YOUR WEBSITE HTML:</p>
              </div>
              <div className="bg-foreground text-background p-4 border-2 border-primary mb-4 overflow-x-auto">
                <code className="text-sm font-mono break-all">{embedCode}</code>
              </div>
              <Button
                onClick={handleCopyEmbed}
                className="w-full bg-brutal-cyan text-foreground border-4 border-primary hover:bg-foreground hover:text-background font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {copiedEmbed ? "COPIED!" : "COPY EMBED CODE"}
              </Button>
              <div className="mt-6 bg-brutal-pink border-4 border-primary p-4">
                <p className="font-black text-foreground text-sm">
                  TIP: REPLACE &quot;YOUR-ORG-SLUG&quot; WITH YOUR CUSTOM SLUG. YOU&apos;LL GET THAT AFTER APPROVAL.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
              <div className="mb-4">
                <h3 className="text-2xl font-black uppercase mb-2 text-foreground">DIRECT LINK URL</h3>
                <p className="font-bold text-foreground/80">
                  SHARE THIS LINK ON SOCIAL MEDIA, EMAIL, OR YOUR WEBSITE:
                </p>
              </div>
              <div className="bg-foreground text-background p-4 border-2 border-primary mb-4 overflow-x-auto">
                <code className="text-sm font-mono break-all">{surveyExampleUrl}</code>
              </div>
              <Button
                onClick={handleCopyLink}
                className="w-full bg-brutal-cyan text-foreground border-4 border-primary hover:bg-foreground hover:text-background font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {copiedLink ? "COPIED!" : "COPY LINK"}
              </Button>
              <div className="mt-6">
                <p className="font-bold text-foreground/80 mb-2 uppercase text-sm">Optional HTML snippet:</p>
                <div className="bg-foreground text-background p-4 border-2 border-primary overflow-x-auto">
                  <code className="text-sm font-mono break-all">{directLinkSnippet}</code>
                </div>
              </div>
              <div className="mt-6 bg-brutal-pink border-4 border-primary p-4">
                <p className="font-black text-foreground text-sm">
                  TIP: USE THIS FOR EMAIL CAMPAIGNS, SOCIAL POSTS, OR AS A BUTTON ON YOUR SITE.
                </p>
              </div>
            </Card>
          )}
        </div>

        <div className="mt-12 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-3xl font-black uppercase text-foreground">LIVE DEMO EMBED</h3>
              <p className="font-bold text-foreground/80">
                This is what the embedded survey looks like inside a normal page container.
              </p>
            </div>
            <a
              href={surveyDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-black uppercase underline decoration-4 underline-offset-4 decoration-brutal-pink text-foreground hover:text-brutal-pink transition-colors"
            >
              OPEN DEMO IN NEW TAB
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 bg-background">
            <iframe
              src={surveyDemoUrl}
              title="Survey Embed Demo"
              className="w-full h-[780px] border-0 bg-background"
              loading="lazy"
            />
          </Card>
        </div>

        <div className="mt-12 max-w-5xl mx-auto">
          <h3 className="text-3xl font-black uppercase text-center mb-8 text-foreground">PLATFORM NOTES</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brutal-cyan border-4 border-primary w-12 h-12 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-foreground" />
                </div>
                <h4 className="text-xl font-black uppercase text-foreground">WORDPRESS</h4>
              </div>
              <p className="font-bold text-foreground text-sm leading-relaxed">
                Use a Custom HTML block for the iframe. If your setup strips iframe code or your team prefers a safer
                path, use the hosted link or a normal button block instead.
              </p>
            </Card>

            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brutal-pink border-4 border-primary w-12 h-12 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-foreground" />
                </div>
                <h4 className="text-xl font-black uppercase text-foreground">EMAIL & SOCIAL</h4>
              </div>
              <p className="font-bold text-foreground text-sm leading-relaxed">
                Use the direct link in newsletters, social posts, petitions, donate confirmations, and any flow where
                asking for a full on-site embed would be overkill.
              </p>
            </Card>

            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brutal-yellow border-4 border-primary w-12 h-12 flex items-center justify-center">
                  <Info className="h-6 w-6 text-foreground" />
                </div>
                <h4 className="text-xl font-black uppercase text-foreground">SCRIPT TAGS / FABS</h4>
              </div>
              <p className="font-bold text-foreground text-sm leading-relaxed">
                We do not recommend a JavaScript snippet or floating action button by default. Iframes and direct
                links are easier to approve, easier to debug, and less likely to fight your styles, consent tools, or
                IT rules.
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </SectionContainer>
  )
}
