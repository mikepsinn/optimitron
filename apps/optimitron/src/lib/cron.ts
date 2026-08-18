import { serverEnv } from "@/lib/env";

export function isAuthorizedCronRequest(request: Request) {
  const secret = serverEnv.CRON_SECRET;

  if (!secret) {
    return serverEnv.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}
