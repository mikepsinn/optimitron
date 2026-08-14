export const DEMO_EMAIL = "demo@thinkbynumbers.org";
export const DEMO_PASSWORD = "demo1234";

export async function signInViaApi(request, credentials = {}) {
  const email = credentials.email ?? DEMO_EMAIL;
  const password = credentials.password ?? DEMO_PASSWORD;
  const csrfResponse = await request.get("/api/auth/csrf");
  if (csrfResponse.status() >= 500) {
    return false;
  }

  const { csrfToken } = await csrfResponse.json();
  const signInResponse = await request.post("/api/auth/callback/credentials", {
    form: {
      email,
      password,
      csrfToken,
      json: "true",
    },
  });

  if (signInResponse.status() >= 400) {
    return false;
  }

  const sessionResponse = await request.get("/api/auth/session");
  if (sessionResponse.status() >= 400) {
    return false;
  }
  const session = await sessionResponse.json();
  return Boolean(session.user?.id);
}
