"use client"

import Layout from "../../../components/layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { CheckCircle, ExternalLink, Copy, Code, Link as LinkIcon, BarChart3 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { ROUTES } from '@/lib/routes'
import { getEmail } from '@/lib/site-config'

export default function InstituteSuccessPage() {
  const searchParams = useSearchParams()
  const slug = searchParams?.get("slug") || null
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const surveyUrl = `${baseUrl}/survey/${slug}`
  const embedCode = `<iframe src="${surveyUrl}" width="100%" height="800" frameborder="0"></iframe>`

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(surveyUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  return (
    <Layout>
      {/* Success Hero */}
      <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
        <Container size="md" className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-foreground border-4 border-primary w-24 h-24 flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle className="h-16 w-16 text-brutal-cyan" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-6 text-foreground">
            YOU'RE <span className="text-background">LIVE!</span>
          </h1>

          <p className="text-lg sm:text-xl font-bold text-foreground mb-8 max-w-2xl mx-auto">
            YOUR PARTNER INSTITUTE IS SET UP AND READY TO COLLECT DATA. START SHARING YOUR SURVEY NOW!
          </p>
        </Container>
      </SectionContainer>

      {/* Survey Links */}
      {slug && (
        <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
          <Container size="md">
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-center mb-12 text-foreground">
              YOUR SURVEY LINKS
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Direct Link */}
              <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-brutal-cyan border-4 border-primary w-12 h-12 flex items-center justify-center">
                    <LinkIcon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-foreground">DIRECT LINK</h3>
                </div>
                <p className="font-bold text-foreground/80 mb-4">
                  Share this URL in emails, social media, or as a button on your site.
                </p>
                <div className="bg-foreground/5 border-2 border-primary p-3 mb-4 overflow-x-auto">
                  <code className="text-sm font-bold text-foreground break-all">{surveyUrl}</code>
                </div>
                <Button
                  onClick={handleCopyUrl}
                  className="w-full bg-foreground text-background border-4 border-primary hover:bg-brutal-cyan hover:text-foreground font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedUrl ? "COPIED!" : "COPY LINK"}
                </Button>
              </Card>

              {/* Embed Code */}
              <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-background">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-brutal-pink border-4 border-primary w-12 h-12 flex items-center justify-center">
                    <Code className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-foreground">EMBED CODE</h3>
                </div>
                <p className="font-bold text-foreground/80 mb-4">
                  Paste this into your website HTML to embed the survey directly.
                </p>
                <div className="bg-foreground/5 border-2 border-primary p-3 mb-4 overflow-x-auto">
                  <code className="text-xs font-bold text-foreground break-all">{embedCode}</code>
                </div>
                <Button
                  onClick={handleCopyEmbed}
                  className="w-full bg-foreground text-background border-4 border-primary hover:bg-brutal-pink hover:text-foreground font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedEmbed ? "COPIED!" : "COPY EMBED CODE"}
                </Button>
              </Card>
            </div>

            <div className="text-center">
              <a href={surveyUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-foreground text-background border-4 border-primary hover:bg-brutal-pink hover:text-foreground font-black uppercase text-xl px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  PREVIEW YOUR SURVEY
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </Container>
        </SectionContainer>
      )}

      {/* What to do next */}
      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container size="md">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-center mb-12 text-foreground">
            START COLLECTING DATA
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
              <div className="bg-brutal-cyan border-4 border-primary w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl font-black text-foreground">1</span>
              </div>
              <h3 className="text-xl font-black uppercase mb-3 text-foreground">SHARE</h3>
              <p className="font-bold text-foreground">
                Post your survey link on social media, newsletters, or your website.
              </p>
            </Card>

            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
              <div className="bg-brutal-yellow border-4 border-primary w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl font-black text-foreground">2</span>
              </div>
              <h3 className="text-xl font-black uppercase mb-3 text-foreground">COLLECT</h3>
              <p className="font-bold text-foreground">
                Watch responses come in from your community.
              </p>
            </Card>

            <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 bg-card">
              <div className="bg-brutal-pink border-4 border-primary w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl font-black text-foreground">3</span>
              </div>
              <h3 className="text-xl font-black uppercase mb-3 text-foreground">USE DATA</h3>
              <p className="font-bold text-foreground">
                Export results for grants, advocacy, and donor communications.
              </p>
            </Card>
          </div>
        </Container>
      </SectionContainer>

      {/* Dashboard link */}
      {slug && (
        <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
          <Container size="md" className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-foreground border-4 border-primary w-16 h-16 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-background" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase mb-6 text-foreground">
              YOUR DASHBOARD
            </h2>
            <p className="text-lg font-bold mb-8 text-foreground max-w-2xl mx-auto">
              TRACK VOTE COUNTS, YOUR RANK AMONG OTHER ORGS, AND WEEK-OVER-WEEK GROWTH.
            </p>
            <a href={`/organizations/${slug}`}>
              <Button className="bg-foreground text-background border-4 border-primary hover:bg-background hover:text-foreground font-black uppercase text-xl px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                OPEN DASHBOARD
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </Container>
        </SectionContainer>
      )}

      {/* CTA Section */}
      <SectionContainer bgColor="foreground" borderPosition="none" padding="lg">
        <Container size="md" className="text-center">
          <h2 className="text-3xl sm:text-4xl font-black uppercase mb-6">QUESTIONS?</h2>
          <p className="text-lg font-bold mb-8">
            CONTACT US AT{" "}
            <a href={`mailto:${getEmail('institutes')}`} className="text-brutal-cyan underline">
              {getEmail('institutes').toUpperCase()}
            </a>
          </p>

          <a href={ROUTES.institutes}>
            <Button className="bg-brutal-cyan text-foreground border-4 border-background hover:bg-background hover:text-foreground font-black uppercase text-xl px-8 py-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              BACK TO INSTITUTES
            </Button>
          </a>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
