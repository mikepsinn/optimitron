"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
  authEnabled?: boolean;
}

export function Providers({
  children,
  session,
  authEnabled = true,
}: ProvidersProps) {
  return (
    <SessionProvider
      session={authEnabled ? session : null}
      refetchOnWindowFocus={authEnabled}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
