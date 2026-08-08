/// <reference path="../types/next-auth.d.ts" />
import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import TwitterProvider from "next-auth/providers/twitter"
import DiscordProvider from "next-auth/providers/discord"
import EmailProvider from "next-auth/providers/email"
import { prisma } from "./prisma"
import { compare, hash } from "bcryptjs"
import { nanoid } from "nanoid"
import { getEmailFrom } from "./email-utils"
import { sendSignupConfirmationEmail } from "./email"
import { SocialPlatform, BadgeType, NotificationType, ActivityType } from "@optimitron/db"
import { env } from "./env"
import { getSiteConfig, DOMAIN_TO_VARIANT } from "./site-config"


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Stateless JWT sessions for better scalability
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request", // Email verification page
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        // DEV MODE BYPASS: Allow test users to login/signup automatically
        if (process.env.NODE_ENV === "development" && credentials.email.startsWith("test")) {
          const name = credentials.email.split("@")[0]
          // Upsert the test user so strict password check is skipped and user exists
          const user = await prisma.user.upsert({
            where: { email: credentials.email },
            update: {},
            create: {
              email: credentials.email,
              name: name,
              username: name,
              // No password needed for this flow
            }
          })
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
    // Email provider - only enable if Resend API key is configured
    ...(env.RESEND_API_KEY
      ? [
        EmailProvider({
          server: {
            host: "smtp.resend.com",
            port: 465,
            auth: {
              user: "resend",
              pass: env.RESEND_API_KEY,
            },
          },
          from: getEmailFrom(),
          maxAge: 24 * 60 * 60, // Magic links valid for 24 hours
          async sendVerificationRequest({ identifier, url, provider: _provider }) {
            // Extract name from email (local part before @) or use generic greeting
            const emailLocalPart = identifier.split("@")[0]

            const userName = emailLocalPart.charAt(0).toUpperCase() + emailLocalPart.slice(1)

            // Try to get user name from database if user exists
            const existingUser = await prisma.user.findUnique({
              where: { email: identifier },
              select: { name: true },
            })

            const config = getSiteConfig()
            const { orgName } = config.emailBranding

            await sendSignupConfirmationEmail({
              to: identifier,
              url,
              userName: existingUser?.name || userName,
              orgName,
            })
          },
        }),
      ]
      : []),
    // Google OAuth - only enable if credentials are configured
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),
    // GitHub OAuth - only enable if credentials are configured
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? [
        GitHubProvider({
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),
    // Twitter/X OAuth - only enable if credentials are configured
    ...(env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET
      ? [
        TwitterProvider({
          clientId: env.TWITTER_CLIENT_ID,
          clientSecret: env.TWITTER_CLIENT_SECRET,
          version: "2.0",
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),
    // Discord OAuth - only enable if credentials are configured
    ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
      ? [
        DiscordProvider({
          clientId: env.DISCORD_CLIENT_ID,
          clientSecret: env.DISCORD_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }

      // If signing in/linking via OAuth, create/update social account record
      if (account && account.provider !== "credentials" && account.provider !== "email") {
        const userId = user?.id || (token.id as string)

        // NextAuth provider names match Prisma SocialPlatform enum (both lowercase)
        const platform = account.provider as SocialPlatform

        await prisma.socialAccount.upsert({
          where: {
            userId_platform: {
              userId,
              platform,
            },
          },
          create: {
            userId,
            platform,
            accountId: account.providerAccountId,
            username: (profile as any)?.username || (profile as any)?.login || user?.email?.split("@")[0] || "",
          },
          update: {
            accountId: account.providerAccountId,
            username: (profile as any)?.username || (profile as any)?.login || user?.email?.split("@")[0] || "",
          },
        })

        // Check for social warrior badge (3+ social accounts connected)
        const socialAccountCount = await prisma.socialAccount.count({
          where: { userId },
        })

        if (socialAccountCount >= 3) {
          const existingBadge = await prisma.badge.findFirst({
            where: {
              userId,
              type: BadgeType.SOCIAL_WARRIOR,
            },
          })

          if (!existingBadge) {
            await prisma.badge.create({
              data: {
                userId,
                type: BadgeType.SOCIAL_WARRIOR,
              },
            })

            await prisma.notification.create({
              data: {
                userId,
                type: NotificationType.BADGE_EARNED,
                title: "Social Warrior Service Medal Earned!",
                message: "You've connected 3+ social accounts for identity verification! Thank you for your service in the War on Disease! 🫡",
                link: "/dashboard",
              },
            })

            await prisma.activity.create({
              data: {
                userId,
                type: ActivityType.EARNED_BADGE,
                description: "", // Description will be generated from type and metadata
                metadata: JSON.stringify({ badgeType: BadgeType.SOCIAL_WARRIOR }),
              },
            })
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string

        // Fetch full user data
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            socialAccounts: true,
            badges: true,
          },
        })

        if (user) {
          session.user.referralCode = user.referralCode
          session.user.username = user.username
          session.user.isPublic = user.isPublic
          session.user.isAdmin = user.isAdmin
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allow redirects to any of our domains (single deployment strategy)
      // Auto-generated from site configs to maintain single source of truth
      const allowedDomains = Object.keys(DOMAIN_TO_VARIANT)

      // Check if the URL is one of our allowed domains
      try {
        const urlObj = new URL(url)
        if (allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`))) {
          return url
        }
      } catch {
        // If URL parsing fails, check if it's a relative URL
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`
        }
      }

      // Default to baseUrl for safety
      return baseUrl
    },
  },
  events: {
    async createUser({ user }) {
      // Generate unique referral code
      const referralCode = nanoid(8).toUpperCase()

      await prisma.user.update({
        where: { id: user.id },
        data: {
          referralCode,
          emailVerified: new Date(), // Mark email as verified on signup
        },
      })

      // Create welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: "Welcome to the War on Disease!",
          message: "Your account has been created. Share your referral link to start saving lives.",
          link: "/dashboard",
        },
      })
    },
  },
}

// Helper function to hash passwords
export async function hashPassword(password: string) {
  return hash(password, 12)
}

// Helper function to verify passwords
export async function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword)
}
