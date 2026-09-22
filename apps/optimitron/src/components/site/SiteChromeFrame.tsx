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
  children,
  footer,
  forceMinimal = false,
  minimalRoutePrefixes,
  navbar,
}: {
  children: ReactNode;
  footer: ReactNode;
  /** Server-side decision that cannot be made from the pathname alone. */
  forceMinimal?: boolean;
  minimalRoutePrefixes: readonly string[];
  navbar: ReactNode;
}) {
  const pathname = usePathname();
  const minimal =
    forceMinimal || usesMinimalChrome(pathname, minimalRoutePrefixes);

  return (
    <>
      {minimal ? null : navbar}
      <main className="min-h-screen">{children}</main>
      {minimal ? null : footer}
    </>
  );
}
