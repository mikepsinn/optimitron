export interface CopyPreviewMetadata {
  canonical?: string | null;
  description?: string | null;
  openGraphDescription?: string | null;
  openGraphImage?: string | null;
  openGraphTitle?: string | null;
  title?: string | null;
  twitterDescription?: string | null;
  twitterTitle?: string | null;
}

export interface CopyPreviewMarkdownInput {
  bodyMarkdown: string;
  metadata: CopyPreviewMetadata;
  route: string;
}

function cleanMetadataValue(value: string | null | undefined): string {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned && cleaned.length > 0 ? cleaned : "[missing]";
}

function cleanBodyMarkdown(value: string): string {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : "- [no visible copy captured]";
}

export function buildCopyPreviewMarkdown({
  bodyMarkdown,
  metadata,
  route,
}: CopyPreviewMarkdownInput): string {
  const lines = [
    `# ${route}`,
    "",
    "## Metadata",
    "",
    `- Page title: ${cleanMetadataValue(metadata.title)}`,
    `- Meta description: ${cleanMetadataValue(metadata.description)}`,
    `- Canonical: ${cleanMetadataValue(metadata.canonical)}`,
    `- Open Graph title: ${cleanMetadataValue(metadata.openGraphTitle)}`,
    `- Open Graph description: ${cleanMetadataValue(
      metadata.openGraphDescription,
    )}`,
    `- Open Graph image: ${cleanMetadataValue(metadata.openGraphImage)}`,
    `- Twitter title: ${cleanMetadataValue(metadata.twitterTitle)}`,
    `- Twitter description: ${cleanMetadataValue(metadata.twitterDescription)}`,
    "",
    "## Visible Page Copy",
    "",
    cleanBodyMarkdown(bodyMarkdown),
    "",
  ];

  return lines.join("\n");
}
