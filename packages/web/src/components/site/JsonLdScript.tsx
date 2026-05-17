interface JsonLdScriptProps {
  data: unknown;
}

export function serializeJsonLd(data: unknown) {
  const serialized = JSON.stringify(data);
  if (serialized === undefined) return "null";
  return serialized.replace(/</g, "\\u003c");
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
