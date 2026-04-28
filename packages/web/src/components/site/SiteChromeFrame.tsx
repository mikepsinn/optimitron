"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const MINIMAL_ROUTE_PREFIXES = [
  "/vote",
  "/questions",
  "/humanity-management-training",
];

function usesMinimalChrome(pathname: string | null) {
  return MINIMAL_ROUTE_PREFIXES.some((prefix) =>
    pathname === prefix || pathname?.startsWith(`${prefix}/`),
  );
}

export function SiteChromeFrame({
  bottomBar,
  children,
  footer,
  navbar,
}: {
  bottomBar?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  navbar: ReactNode;
}) {
  const pathname = usePathname();
  const minimal = usesMinimalChrome(pathname);

  return (
    <>
      {minimal ? null : navbar}
      <main className="min-h-screen">{children}</main>
      {minimal ? null : footer}
      {minimal ? null : bottomBar}
    </>
  );
}
