import { Suspense } from "react";
import { IframeClient } from "./iframe-client";

export default function IframePage() {
  return (
    <Suspense fallback={null}>
      <IframeClient />
    </Suspense>
  );
}
