"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthPostSigninSync } from "@/components/auth/AuthPostSigninSync";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Web3Provider } from "@/components/providers/Web3Provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <Web3Provider>
          <AuthPostSigninSync />
          {children}
        </Web3Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
