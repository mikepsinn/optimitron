"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/retroui/Badge";
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
      <Badge className="border border-primary bg-brutal-cyan px-2 py-1 font-bold text-brutal-cyan-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        {getPersonhoodProviderLabel(provider)}
      </Badge>
    );
  }

  return (
    <Badge className="border border-primary bg-brutal-yellow px-2 py-1 font-bold text-brutal-yellow-foreground">
      <ShieldAlert className="h-3.5 w-3.5" />
      Unverified
    </Badge>
  );
}
