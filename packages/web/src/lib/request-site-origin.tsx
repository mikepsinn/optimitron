"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getBaseUrl } from "@/lib/url";

const RequestSiteOriginContext = createContext<string | null>(null);

export function RequestSiteOriginProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) {
  return (
    <RequestSiteOriginContext.Provider value={value}>
      {children}
    </RequestSiteOriginContext.Provider>
  );
}

export function useRequestSiteOrigin() {
  return useContext(RequestSiteOriginContext) ?? getBaseUrl();
}
