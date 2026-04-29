"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function usesMinimalChrome(
  pathname: string | null,
  minimalRoutePrefixes: readonly string[],
) {
  return minimalRoutePrefixes.some((prefix) =>
    pathname === prefix || pathname?.startsWith(`${prefix}/`),
  );
}

export function SiteChromeFrame({
  bottomBar,
  children,
  footer,
  minimalRoutePrefixes,
  navbar,
}: {
  bottomBar?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  minimalRoutePrefixes: readonly string[];
  navbar: ReactNode;
}) {
  const pathname = usePathname();
  const minimal = usesMinimalChrome(pathname, minimalRoutePrefixes);

  return (
    <>
      {minimal ? null : navbar}
      <main className="min-h-screen">{children}</main>
      {minimal ? null : footer}
      {minimal ? null : bottomBar}
    </>
  );
}
