"use client"

import type { ImageUploadKind } from "./image-upload-types"

export async function uploadImageViaBackend(input: {
  file: File
  kind: ImageUploadKind
}): Promise<{ key: string; publicUrl: string }> {
  const formData = new FormData()
  formData.set("kind", input.kind)
  formData.set("file", input.file)

  const response = await fetch("/api/uploads/images", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string
    }
    throw new Error(payload.error ?? "Could not upload image.")
  }

  const payload = (await response.json()) as {
    key: string
    publicUrl: string
  }
  return {
    key: payload.key,
    publicUrl: payload.publicUrl,
  }
}
