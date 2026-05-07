export const IMAGE_UPLOAD_KINDS = [
  "memorial-evidence-image",
  "organization-square-logo",
  "organization-wordmark-logo",
  "person-photo",
] as const;

export type ImageUploadKind = (typeof IMAGE_UPLOAD_KINDS)[number];

export function isImageUploadKind(value: unknown): value is ImageUploadKind {
  return (
    typeof value === "string" &&
    (IMAGE_UPLOAD_KINDS as readonly string[]).includes(value)
  );
}
