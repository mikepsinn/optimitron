import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

vi.mock("@/lib/env", () => ({
  serverEnv: {
    EMAIL_FROM: "test@test.local",
    NEXTAUTH_SECRET: "test-secret",
    NEXTAUTH_URL: "http://localhost:3001",
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-adapter", () => ({
  createAuthAdapter: () => ({}),
}));

vi.mock("@/lib/email/magic-link-email", () => ({
  sendMagicLinkEmail: vi.fn(),
}));

vi.mock("@/lib/email/referral-email.server", () => ({
  sendWelcomeReferralEmailForUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type JwtParams = {
  token: JWT;
  user?: { id: string; email?: string | null };
  trigger?: "signIn" | "signUp" | "update";
};

type SessionParams = {
  session: Session;
  token: JWT;
};

const callJwt = (params: JwtParams) =>
  // next-auth's type on callback signatures is wider than we use in tests
  (authOptions.callbacks!.jwt as (p: unknown) => Promise<JWT>)(params);

const callSession = (params: SessionParams) =>
  (authOptions.callbacks!.session as (p: unknown) => Promise<Session>)(params);

const mockedFindUnique = vi.mocked(prisma.user.findUnique);

const fullIdentityRow = {
  createdAt: new Date("2026-01-01T00:00:00Z"),
  email: "demo@optimitron.org",
  id: "user_123",
  image: null,
  name: "Demo",
  newsletterSubscribed: false,
  personId: "person_123",
  person: {
    id: "person_123",
    handle: "demo-handle",
    displayName: "Demo Person",
    image: null,
  },
  personhoodVerifications: [],
  countryCode: "US",
  referralCode: "REF123",
  referralEmailSequenceLastSentAt: null,
  referralEmailSequenceStep: 0,
  username: "demo",
};

describe("authOptions.callbacks.jwt", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
  });

  it("keeps token.id set to user.id even when the identity lookup returns null", async () => {
    // Regression guard for the treaty-variant bug where a failed identity
    // lookup left token.id undefined, so session.user.id was undefined, so
    // /dashboard bounced authenticated users back to /auth/signin.
    mockedFindUnique.mockResolvedValueOnce(null);

    const token = await callJwt({
      token: {},
      user: { id: "user_123", email: "demo@optimitron.org" },
      trigger: "signIn",
    });

    expect(token.id).toBe("user_123");
  });

  it("populates every identity field when the lookup succeeds", async () => {
    // Cast to satisfy the strict Prisma User return type — getSessionIdentity
    // only selects the fields we include, so the shape is a structural match
    // even if the full type has many more columns.
    mockedFindUnique.mockResolvedValueOnce(fullIdentityRow as never);

    const token = await callJwt({
      token: {},
      user: { id: "user_123", email: "demo@optimitron.org" },
      trigger: "signIn",
    });

    expect(token.id).toBe("user_123");
    expect(token.email).toBe("demo@optimitron.org");
    // Person.displayName takes precedence over User.name
    expect(token.name).toBe("Demo Person");
    expect(token.personId).toBe("person_123");
    expect(token.referralCode).toBe("REF123");
    // Person.handle takes precedence over User.username
    expect(token.username).toBe("demo-handle");
    expect(token.personhoodVerified).toBe(false);
    expect(token.verifiedProviders).toEqual([]);
  });

  it("preserves token.id across subsequent requests when user arg is absent", async () => {
    // This is the steady-state case: user only flows through on sign-in;
    // later requests just decode the existing JWT and pass it back.
    const token = await callJwt({
      token: { id: "user_123", email: "demo@optimitron.org" },
    });

    expect(token.id).toBe("user_123");
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });
});

describe("authOptions.callbacks.session", () => {
  it("copies token.id onto session.user.id", async () => {
    const session = await callSession({
      session: { user: {}, expires: "2099-01-01T00:00:00Z" } as Session,
      token: { id: "user_123" } as JWT,
    });

    expect(session.user.id).toBe("user_123");
  });
});
