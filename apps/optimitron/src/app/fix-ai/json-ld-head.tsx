"use client";

import { useServerInsertedHTML } from "next/navigation";
import { serializeJsonLd } from "@/components/site/JsonLdScript";

interface FixAiJsonLdHeadProps {
  data: unknown;
}

export function FixAiJsonLdHead({ data }: FixAiJsonLdHeadProps) {
  useServerInsertedHTML(() => (
    <script
      id="fix-ai-faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  ));

  return null;
}
