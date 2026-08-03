"use client";

import { useEffect, type ReactNode } from "react";
import type { State } from "wagmi";
import { usePathname, useSearchParams } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { AuthPostSigninSync } from "@/components/auth/AuthPostSigninSync";
import { SignupLandingUrlCapture } from "@/components/auth/SignupLandingUrlCapture";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { WishPointProvider } from "@/components/wishes/WishPointProvider";
import { DeclarationSigningPopup } from "@/components/declaration/DeclarationSigningPopup";

const ENABLE_DECLARATION_POPUP =
  process.env.NEXT_PUBLIC_ENABLE_DECLARATION_POPUP === "true";

function VisualReviewSessionReadiness() {
  const { status } = useSession();

  useEffect(() => {
    const visualReviewWindow = window as Window & {
      __OPTIMITRON_VISUAL_REVIEW__?: boolean;
    };
    if (!visualReviewWindow.__OPTIMITRON_VISUAL_REVIEW__) {
      return;
    }

    document.documentElement.dataset.visualAuthState = status;
    return () => {
      delete document.documentElement.dataset.visualAuthState;
    };
  }, [status]);

  return null;
}

export function Providers({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const declarationRequested = searchParams.get("declaration") === "1";
  const showDeclarationPopup =
    ENABLE_DECLARATION_POPUP && pathname === "/";

  return (
    <SessionProvider>
      <VisualReviewSessionReadiness />
      <ThemeProvider>
        <Web3Provider initialState={initialState}>
          <WishPointProvider>
            <SignupLandingUrlCapture />
            <AuthPostSigninSync />
            {showDeclarationPopup ? (
              <DeclarationSigningPopup forceOpen={declarationRequested} />
            ) : null}
            {children}
          </WishPointProvider>
        </Web3Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
