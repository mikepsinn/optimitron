import type { APIRequestContext, Page } from "@playwright/test";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  signInViaApi as signInViaApiRuntime,
} from "./auth-api.mjs";

export { DEMO_EMAIL, DEMO_PASSWORD };

export interface TestCredentials {
  email?: string;
  password?: string;
}

export async function signInViaApi(
  request: APIRequestContext,
  credentials: TestCredentials = {},
): Promise<boolean> {
  return signInViaApiRuntime(request, credentials);
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
