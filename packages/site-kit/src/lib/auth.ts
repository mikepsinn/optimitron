/// <reference path="../types/next-auth.d.ts" />
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import TwitterProvider from "next-auth/providers/twitter"
import DiscordProvider from "next-auth/providers/discord"
import EmailProvider from "next-auth/providers/email"
import { prisma } from "./prisma"
import { compare, hash } from "bcryptjs"
import { getEmailFrom } from "./email-utils"
import { sendSignupConfirmationEmail } from "./email"
import { SocialPlatform, NotificationType } from "@optimitron/db"
import { env } from "./env"
import { getSiteConfig, DOMAIN_TO_VARIANT } from "./site-config"
import { createAuthAdapter } from "./auth-adapter"
import { ensurePersonForUser } from "./person.server"

const personIdentitySelect = {
  id: true,
  handle: true,
  displayName: true,
  image: true,
  isPublic: true,
} as const

/** Map NextAuth OAuth provider ids to SocialPlatform (wallet/social enum). */
function oauthProviderToSocialPlatform(
  provider: string,
): SocialPlatform | null {
  switch (provider) {
    case "github":
      return SocialPlatform.GITHUB
    case "twitter":
      return SocialPlatform.TWITTER
    case "discord":
      return SocialPlatform.DISCORD
    default:
      // google / email / credentials are not SocialPlatform values
      return null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: createAuthAdapter(),
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
          const displayName = credentials.email.split("@")[0]
          const user = await prisma.user.upsert({
            where: { email: credentials.email },
            update: {},
            create: {
              email: credentials.email,
            },
            include: {
              person: { select: personIdentitySelect },
            },
          })

          await ensurePersonForUser(user.id, {
            displayName,
            image: null,
          })

          const withPerson = await prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            include: { person: { select: personIdentitySelect } },
          })

          return {
            id: withPerson.id,
            email: withPerson.email,
            name: withPerson.person?.displayName ?? displayName,
            image: withPerson.person?.image ?? null,
            handle: withPerson.person?.handle ?? null,
            personId: withPerson.personId,
            referralCode: withPerson.referralCode,
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            person: { select: personIdentitySelect },
          },
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
          name: user.person?.displayName ?? null,
          image: user.person?.image ?? null,
          handle: user.person?.handle ?? null,
          personId: user.personId,
          referralCode: user.referralCode,
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

            // Try to get display name from Person if user exists
            const existingUser = await prisma.user.findUnique({
              where: { email: identifier },
              select: {
                person: { select: { displayName: true } },
              },
            })

            const config = getSiteConfig()
            const { orgName } = config.emailBranding

            await sendSignupConfirmationEmail({
              to: identifier,
              url,
              userName: existingUser?.person?.displayName || userName,
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

      // Link OAuth providers that exist on SocialPlatform (github/twitter/discord).
      // Google is auth-only — it is not a SocialPlatform value in the restored schema.
      if (account && account.provider !== "credentials" && account.provider !== "email") {
        const userId = user?.id || (token.id as string)
        const platform = oauthProviderToSocialPlatform(account.provider)

        if (platform && userId) {
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
              username:
                (profile as { username?: string; login?: string } | undefined)?.username ||
                (profile as { username?: string; login?: string } | undefined)?.login ||
                user?.email?.split("@")[0] ||
                "",
            },
            update: {
              accountId: account.providerAccountId,
              username:
                (profile as { username?: string; login?: string } | undefined)?.username ||
                (profile as { username?: string; login?: string } | undefined)?.login ||
                user?.email?.split("@")[0] ||
                "",
            },
          })
        }
      }

      // Enrich token with Person-owned identity when we know the user id
      const identityUserId = user?.id ?? (typeof token.id === "string" ? token.id : undefined)
      if (identityUserId) {
        const identity = await prisma.user.findUnique({
          where: { id: identityUserId },
          select: {
            id: true,
            email: true,
            personId: true,
            referralCode: true,
            isAdmin: true,
            person: { select: personIdentitySelect },
          },
        })

        if (identity) {
          token.id = identity.id
          token.email = identity.email
          token.name = identity.person?.displayName ?? null
          token.picture = identity.person?.image ?? null
          token.personId = identity.personId
          token.referralCode = identity.referralCode
          token.handle = identity.person?.handle ?? null
          token.isPublic = identity.person?.isPublic ?? false
          token.isAdmin = identity.isAdmin
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = (token.name as string | null | undefined) ?? session.user.name ?? null
        session.user.image =
          (token.picture as string | null | undefined) ?? session.user.image ?? null
        session.user.referralCode = token.referralCode as string | undefined
        session.user.handle = (token.handle as string | null | undefined) ?? null
        // Deprecated alias for gradual UI migration
        session.user.username = session.user.handle
        session.user.isPublic = Boolean(token.isPublic)
        session.user.isAdmin = Boolean(token.isAdmin)
        session.user.personId = (token.personId as string | null | undefined) ?? null
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
      // Referral code + Person are created in the auth adapter.
      // Mark email verified and send welcome notification here.
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
        },
      })

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
