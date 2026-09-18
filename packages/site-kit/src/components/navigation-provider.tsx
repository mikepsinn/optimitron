"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppNavigation } from "../lib/app-navigation";

const NavigationContext = createContext<AppNavigation | null>(null);

export function NavigationProvider({ navigation, children }: { navigation: AppNavigation; children: ReactNode }) {
  return <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>;
}

export function useAppNavigation() {
  const navigation = useContext(NavigationContext);
  if (!navigation) throw new Error("The app root layout must supply its navigation.");
  return navigation;
}
