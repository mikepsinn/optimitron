import type { APIRequestContext, Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@optimitron.org";
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

  return signInResponse.status() < 400;
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
