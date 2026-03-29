import { Suspense, createElement } from "react";
import { IframeClient } from "./iframe-client";

export default function IframePage() {
  return createElement(Suspense, null, createElement(IframeClient));
}
