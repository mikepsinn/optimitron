/**
 * Image kinds the campaign apps accept. The Optimitron app also accepts
 * organization logo/wordmark kinds; those are not listed here because no
 * campaign-app surface uploads them yet.
 */
export const IMAGE_UPLOAD_KINDS = [
  "memorial-evidence-image",
  "person-photo",
] as const

export type ImageUploadKind = (typeof IMAGE_UPLOAD_KINDS)[number]
