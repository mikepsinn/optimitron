"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { clientEnv } from "@/lib/env";

const CLARITY_ALLOWED_PATHS = new Set([
  "/eos",
  "/fix-ai",
  "/impact",
  "/joke",
  "/poster",
  "/wishonia",
]);

function isClarityAllowedPath(pathname: string | null) {
  if (!pathname) return false;
  return CLARITY_ALLOWED_PATHS.has(pathname);
}

function buildClaritySnippet(projectId: string) {
  return `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");`;
}

export function MicrosoftClarity() {
  const pathname = usePathname();
  const projectId = clientEnv.NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID;

  if (!projectId || !isClarityAllowedPath(pathname)) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: buildClaritySnippet(projectId) }}
    />
  );
}
