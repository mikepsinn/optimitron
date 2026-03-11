import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { createAuthAdapter } from "@/lib/auth-adapter";
import { sendMagicLinkEmail } from "@/lib/magic-link-email";
import { prisma } from "@/lib/prisma";
import { sendWelcomeReferralEmailForUser } from "@/lib/referral-email.server";

async function getSessionIdentity(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      email: true,
      id: true,
      image: true,
      name: true,
      newsletterSubscribed: true,
      referralCode: true,
      referralEmailSequenceLastSentAt: true,
      referralEmailSequenceStep: true,
      username: true,
    },
  });
}

const providers = [
  EmailProvider({
    from: process.env.EMAIL_FROM,
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
        referralCode: user.referralCode,
        username: user.username,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authOptions: NextAuthOptions = {
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
    async createUser({ user }) {
      const referralUser = await getSessionIdentity(user.id);
      if (!referralUser) {
        return;
      }

      try {
        await sendWelcomeReferralEmailForUser(referralUser);
      } catch (error) {
        console.error("[AUTH] Failed to send welcome referral email:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const identity = await getSessionIdentity(user.id);
        if (identity) {
          token.id = identity.id;
          token.email = identity.email;
          token.name = identity.name;
          token.picture = identity.image;
          token.referralCode = identity.referralCode;
          token.username = identity.username;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.referralCode = token.referralCode as string | undefined;
        session.user.username = (token.username as string | null | undefined) ?? null;
      }

      return session;
    },
  },
};

export function hashPassword(password: string) {
  return hash(password, 12);
}
