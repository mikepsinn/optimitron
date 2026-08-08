import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TreatyVoteSection from "@/components/landing/treaty-vote-section"
import { Container } from "@/components/ui/container"
import { OrgStatus } from "@optimitron/db"
import type { Metadata } from "next"
import { getSiteConfig, getBaseUrl, getPrimaryDomain } from "@/lib/site-config"
import { ROUTES } from "@/lib/routes"

interface SurveyPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: SurveyPageProps): Promise<Metadata> {
  const { slug } = await params
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: { name: true, slug: true, status: true },
  })

  if (!organization || organization.status !== OrgStatus.APPROVED) {
    return {
      title: "Survey Not Found",
    }
  }

  const baseUrl = getBaseUrl()
  const primaryDomain = getPrimaryDomain()
  const ogImageUrl = `${baseUrl}/api/og/organization?org=${encodeURIComponent(organization.name)}`
  const surveyUrl = `${baseUrl}/survey/${organization.slug}`

  return {
    title: `${organization.name} - Clinical Trial Abundance Survey`,
    description: `Take ${organization.name}'s 2-question Global Clinical Trial Abundance Survey. Take 30 seconds to make suffering optional.`,
    alternates: {
      canonical: `${primaryDomain}/survey/${slug}`,
    },
    openGraph: {
      title: `Take the 2-Question Global Clinical Trial Abundance Survey`,
      description: `Sponsored by ${organization.name}. Take 30 seconds to make suffering optional.`,
      url: surveyUrl,
      siteName: getSiteConfig().title,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${organization.name} Clinical Trial Abundance Survey`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Take the 2-Question Global Clinical Trial Abundance Survey`,
      description: `Sponsored by ${organization.name}. Take 30 seconds to make suffering optional.`,
      images: [ogImageUrl],
    },
  }
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { slug } = await params

  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      squareLogoUrl: true,
      slug: true,
      status: true,
    },
  })

  if (!organization || organization.status !== OrgStatus.APPROVED) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-foreground text-background py-4 border-b-4 border-primary">
        <Container size="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {organization.squareLogoUrl && (
              <img
                src={organization.squareLogoUrl}
                alt={organization.name}
                className="h-8 w-8 object-contain border-2 border-background"
              />
            )}
            <h1 className="text-lg sm:text-xl font-black uppercase">{organization.name}</h1>
          </div>
        </Container>
      </header>

      <main className="flex-1 bg-background">
        <TreatyVoteSection
          organizationId={organization.id}
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

export async function generateStaticParams() {
  let organizations: Array<{ slug: string | null }>

  try {
    organizations = await prisma.organization.findMany({
      where: {
        status: OrgStatus.APPROVED,
      },
      select: { slug: true },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL is required")) {
      return []
    }

    throw error
  }

  return organizations.map((org) => ({
    slug: org.slug as string, // Cast since we filtered out nulls
  }))
}

// Enable ISR (Incremental Static Regeneration) - revalidate every hour
export const revalidate = 3600
