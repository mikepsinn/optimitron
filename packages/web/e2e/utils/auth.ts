import type { APIRequestContext, Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@thinkbynumbers.org";
export const DEMO_PASSWORD = "demo1234";

export interface TestCredentials {
  email?: string;
  password?: string;
}

export async function signInViaApi(
  request: APIRequestContext,
  credentials: TestCredentials = {},
): Promise<boolean> {
  const email = credentials.email ?? DEMO_EMAIL;
  const password = credentials.password ?? DEMO_PASSWORD;
  const csrfResponse = await request.get("/api/auth/csrf");
  if (csrfResponse.status() >= 500) {
    return false;
  }

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const signInResponse = await request.post(
    "/api/auth/callback/credentials",
    {
      form: {
        email,
        password,
        csrfToken,
        json: "true",
      },
    },
  );

  if (signInResponse.status() >= 400) {
    return false;
  }

  // Credentials can return 200 while the session cookie is still missing
  // (wrong host / CSRF reuse). Confirm the browser context is actually signed in.
  const sessionResponse = await request.get("/api/auth/session");
  if (sessionResponse.status() >= 400) {
    return false;
  }
  const session = (await sessionResponse.json()) as {
    user?: { id?: string | null } | null;
  };
  return Boolean(session.user?.id);
}

export async function signInUser(
  page: Page,
  credentials: Required<TestCredentials>,
): Promise<boolean> {
  return signInViaApi(page.context().request, credentials);
}

export async function signInDemoUser(page: Page): Promise<boolean> {
  return signInViaApi(page.context().request);
}
