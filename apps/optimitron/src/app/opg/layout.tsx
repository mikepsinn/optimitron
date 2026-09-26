import type { ReactNode } from "react";
import { getRouteMetadata } from "@/lib/metadata";
import { opgLink } from "@/lib/routes";

export const metadata = getRouteMetadata(opgLink);

export default function PolicyLayout({ children }: { children: ReactNode }) {
  return children;
}
