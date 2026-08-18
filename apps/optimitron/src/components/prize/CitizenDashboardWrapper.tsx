"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CitizenDashboard } from "@/components/prize/CitizenDashboard";

export function CitizenDashboardWrapper() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("ref", ref);
    }
  }, [searchParams]);

  return <CitizenDashboard />;
}
