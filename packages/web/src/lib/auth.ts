import { serverEnv } from "@/lib/env";
import { PersonhoodVerificationStatus } from "@optimitron/db";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { createAuthAdapter } from "@/lib/auth-adapter";
import { sendMagicLinkEmail } from "@/lib/email/magic-link-email";
import { summarizePersonhoodVerifications } from "@/lib/personhood.server";
import { prisma } from "@/lib/prisma";

async function getSessionIdentity(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      email: true,
      id: true,
      image: true,
      name: true,
      newsletterSubscribed: true,
      personId: true,
      // Include the linked Person so the session callback can populate
      // session.user.{name, image} from Person.{displayName, image} —
      // Person is canonical, the User columns are a transitional mirror.
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
        },
      },
      personhoodVerifications: {
        where: {
          deletedAt: null,
          status: PersonhoodVerificationStatus.VERIFIED,
        },
        select: {
          deletedAt: true,
          lastVerifiedAt: true,
          provider: true,
          status: true,
          verificationLevel: true,
          verifiedAt: true,
        },
        orderBy: [{ lastVerifiedAt: "desc" }],
      },
      countryCode: true,
      referralCode: true,
      username: true,
    },
  });

  if (!user) {
    return null;
  }

  const personhood = summarizePersonhoodVerifications(user.personhoodVerifications);

  return {
    ...user,
    ...personhood,
  };
}

const providers: NextAuthOptions["providers"] = [
  EmailProvider({
    from: serverEnv.EMAIL_FROM,
    maxAge: 24 * 60 * 60,
    server: {
      host: "localhost",
      port: 25,
      auth: {
        user: "",
        pass: "",
      },
    },
    sendVerificationRequest: sendMagicLinkEmail,
  }),
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Invalid credentials");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      });

      if (!user?.password) {
        throw new Error("Invalid credentials");
      }

      const isValidPassword = await compare(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        personId: user.personId,
        referralCode: user.referralCode,
        username: user.username,
      };
    },
  }),
];

if (serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/** Which sign-in providers are configured for this deployment (env-var based). */
export function getConfiguredProviders() {
  return {
    email: true,
    google: Boolean(serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET),
  };
}

const DEBUG_AUTH = process.env.DEBUG_AUTH === "true";

function authLog(label: string, data?: unknown) {
  if (!DEBUG_AUTH) return;
  console.log(`[AUTH DEBUG] ${label}`, data !== undefined ? JSON.stringify(data, null, 2) : "");
}

export const authOptions: NextAuthOptions = {
  secret: serverEnv.NEXTAUTH_SECRET,
  debug: DEBUG_AUTH,
  adapter: createAuthAdapter(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  providers,
  events: {
    async signIn({ user, account }) {
      authLog("signIn event", {
        userId: user.id,
        provider: account?.provider,
        NEXTAUTH_URL: serverEnv.NEXTAUTH_URL,
      });
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      authLog("jwt callback", { trigger, hasUser: !!user, userId: user?.id, tokenSub: token.sub });
      const identityUserId =
        user?.id ??
        (trigger === "update" && typeof token.id === "string" ? token.id : undefined);

      // Ensure token.id is set whenever we know the user id, even if the
      // identity enrichment below fails. Without this, a DB blip or race
      // during sign-in issues a token with no `id`, and every subsequent
      // request bounces authenticated users off gated pages.
      if (user?.id) {
        token.id = user.id;
      }

      if (identityUserId) {
        const identity = await getSessionIdentity(identityUserId);
        authLog("jwt identity lookup", { identityUserId, found: !!identity });
        if (identity) {
          token.id = identity.id;
          token.email = identity.email;
          // Person.displayName is canonical; User.name is the legacy mirror.
          // Same for image. The session shape stays unchanged so callers
          // reading session.user.name keep working.
          token.name = identity.person?.displayName ?? identity.name;
          token.personId = identity.personId;
          token.personhoodProvider = identity.personhoodProvider;
          token.personhoodVerificationLevel = identity.personhoodVerificationLevel;
          token.personhoodVerified = identity.isVerified;
          token.personhoodVerifiedAt = identity.personhoodVerifiedAt;
          token.picture = identity.person?.image ?? identity.image;
          token.countryCode = identity.countryCode;
          token.referralCode = identity.referralCode;
          // Person.handle is canonical; User.username is the legacy mirror.
          token.username = identity.person?.handle ?? identity.username;
          token.verifiedProviders = identity.verifiedProviders;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.personhoodProvider =
          (token.personhoodProvider as typeof session.user.personhoodProvider) ?? null;
        session.user.personhoodVerificationLevel =
          (token.personhoodVerificationLevel as string | null | undefined) ?? null;
        session.user.personhoodVerified = Boolean(token.personhoodVerified);
        session.user.personhoodVerifiedAt =
          (token.personhoodVerifiedAt as string | null | undefined) ?? null;
        session.user.personId = (token.personId as string | null | undefined) ?? null;
        session.user.countryCode = (token.countryCode as string | null | undefined) ?? null;
        session.user.referralCode = token.referralCode as string | undefined;
        session.user.username = (token.username as string | null | undefined) ?? null;
        session.user.verifiedProviders = Array.isArray(token.verifiedProviders)
          ? (token.verifiedProviders as typeof session.user.verifiedProviders)
          : [];
      }

      return session;
    },
  },
};

export function hashPassword(password: string) {
  return hash(password, 12);
}
