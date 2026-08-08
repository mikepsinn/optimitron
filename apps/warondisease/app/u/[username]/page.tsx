import { notFound, redirect } from "next/navigation"
import { Layout } from "@/components/layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Globe, Award, Link as LinkIcon } from "lucide-react"
import { VoteOrShareButton } from "@/components/shared/VoteOrShareButton"
import { getPublicUserProfile, resolveUsernameAlias } from "@/lib/user"
import { getBadgeName, getBadgeDescription } from "@/lib/activity-descriptions"
import { BadgesSection } from "@/components/dashboard/BadgesSection"
import { ImpactLedgerCard } from "@/components/dashboard/ImpactLedgerCard"
import type { DashboardBadge } from "@/types/dashboard"
import type { Metadata } from 'next'
import { getBaseUrl, getPrimaryDomain } from '@/lib/site-config'

interface UserProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params

  // Check for alias redirect (e.g. mikepsinn -> WarOnDisease)
  const canonicalUsername = resolveUsernameAlias(username)
  if (canonicalUsername !== username && canonicalUsername.toLowerCase() !== username.toLowerCase()) {
    redirect(`/u/${canonicalUsername}`)
  }

  const userData = await getPublicUserProfile(username)

  if (!userData) {
    notFound()
  }

  // Handle private profiles
  if (userData.isPrivate) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="border-4 border-primary p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-6xl mb-6">🔒</div>
                <h1 className="font-black text-3xl uppercase mb-4">
                  Private Profile
                </h1>
                <p className="text-lg font-bold mb-8">
                  This soldier has chosen to keep their profile private.
                </p>
                <VoteOrShareButton
                  variant="default"
                  size="lg"
                  className="text-xl"
                />
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Transform badges for dashboard component
  const badges: DashboardBadge[] = userData.badges.map((badge) => ({
    id: badge.id,
    name: getBadgeName(badge.type),
    description: getBadgeDescription(badge.type),
    earned: true,
  }))

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Cover Image */}
        {userData.coverImage && (
          <div className="w-full h-48 md:h-64 border-b-4 border-primary overflow-hidden bg-brutal-yellow">
            <img
              src={userData.coverImage}
              alt={`${userData.name}'s cover`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-brutal-pink border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden shrink-0 relative z-10">
                {userData.image ? (
                  <img
                    src={userData.image}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl md:text-5xl font-black text-white">
                    {userData.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className={userData.coverImage ? "mt-16 md:mt-0" : ""}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-2">
                  {userData.name}
                </h1>
                {userData.headline && (
                  <p className="text-lg sm:text-xl font-bold text-brutal-pink mb-2">
                    {userData.headline}
                  </p>
                )}
                <p className="text-lg sm:text-xl font-bold text-muted-foreground mb-2">
                  Soldier in the War on Disease
                </p>
                <div className="flex flex-wrap gap-3 items-center">
                  {userData.location && (
                    <span className="font-bold text-muted-foreground">
                      📍 {userData.location}
                    </span>
                  )}
                  {userData.website && (
                    <a
                      href={userData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-brutal-pink hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {userData.bio && (
            <Card className="border-2 border-primary p-6 mb-8">
              <h2 className="font-black text-xl uppercase mb-3">About</h2>
              <p className="font-bold whitespace-pre-wrap">{userData.bio}</p>
            </Card>
          )}

          {/* Skills Section */}
          {userData.skills && userData.skills.length > 0 && (
            <Card className="border-2 border-primary p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5" />
                <h2 className="font-black text-xl uppercase">Skills</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="border-2 border-primary bg-brutal-cyan text-white text-sm px-3 py-2 font-bold"
                  >
                    {skill.name}
                    {skill.endorsements > 0 && (
                      <span className="ml-2 text-xs opacity-80">
                        ({skill.endorsements})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Links Section */}
          {userData.links && userData.links.length > 0 && (
            <Card className="border-2 border-primary p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5" />
                <h2 className="font-black text-xl uppercase">Links</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {userData.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-primary rounded-lg p-4 bg-background hover:bg-brutal-yellow hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                          {link.title}
                          <ExternalLink className="w-4 h-4 shrink-0" />
                        </h3>
                        {link.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {link.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {link.url}
                        </p>
                      </div>
                      {link.imageUrl && (
                        <img
                          src={link.imageUrl}
                          alt={link.title}
                          className="w-16 h-16 object-cover border-2 border-primary rounded"
                        />
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Impact Ledger */}
          <div className="mb-8">
            <ImpactLedgerCard
              votesLogged={userData.referralCount}
              variant="public"
              userName={userData.name}
            />
          </div>

          {/* Badges Section - reusing dashboard component */}
          {badges.length > 0 && (
            <BadgesSection badges={badges} showPoliticalContent={false} />
          )}

        </div>
      </div>
    </Layout>
  )
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const userData = await getPublicUserProfile(username)
  const baseUrl = getBaseUrl()
  const primaryDomain = getPrimaryDomain()

  if (!userData) {
    return {
      title: "User Not Found",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  if (userData.isPrivate) {
    return {
      title: "Private Profile",
      description: "This soldier has chosen to keep their profile private. Join the movement to make suffering optional through pragmatic clinical trials.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const userDisplayName = userData.name || username
  const referralCount = userData.referralCount
  const livesSaved = Math.round(referralCount * 1.49)

  return {
    title: `${userDisplayName} - Hero in the War on Disease`,
    description: `${userDisplayName} has recruited ${referralCount} soldiers and saved ~${livesSaved} lives in the war on disease. Join the movement to make suffering optional.`,
    alternates: {
      canonical: `${primaryDomain}/u/${username}`,
    },
    openGraph: {
      title: `${userDisplayName} saved ${livesSaved} lives`,
      description: `${referralCount} soldiers recruited. Join ${userDisplayName} in the war on disease.`,
      type: 'profile',
      url: `${baseUrl}/u/${username}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${userDisplayName} saved ${livesSaved} lives`,
      description: `${referralCount} soldiers recruited in the war on disease.`,
    },
  }
}
