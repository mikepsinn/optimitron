"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getPersonhoodProviderLabel,
  type PersonhoodProviderValue,
} from "@/lib/personhood";

interface PersonhoodStatusBadgeProps {
  provider?: PersonhoodProviderValue | null;
  verified?: boolean;
}

export function PersonhoodStatusBadge({
  provider = null,
  verified = false,
}: PersonhoodStatusBadgeProps) {
  if (verified) {
    return (
      <Badge className="border border-emerald-800 bg-emerald-100 px-2 py-1 font-bold text-emerald-950">
        <ShieldCheck className="h-3.5 w-3.5" />
        {getPersonhoodProviderLabel(provider)}
      </Badge>
    );
  }

  return (
    <Badge className="border border-amber-800 bg-amber-100 px-2 py-1 font-bold text-amber-950">
      <ShieldAlert className="h-3.5 w-3.5" />
      Unverified
    </Badge>
  );
}
