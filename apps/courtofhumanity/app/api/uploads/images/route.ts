import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import {
  buildImageUploadKey,
  normalizeImageUpload,
} from "@/lib/image-upload.server";
import {
  IMAGE_UPLOAD_KINDS,
  type ImageUploadKind,
} from "@/lib/image-upload-types";
import {
  ObjectStorageNotConfiguredError,
  uploadObject,
} from "@/lib/object-storage.server";

const uploadImageSchema = z.object({
  kind: z.enum(IMAGE_UPLOAD_KINDS),
});

export async function POST(request: Request) {
  try {
    await requireAuth();
    const formData = await request.formData();
    const parsed = uploadImageSchema.safeParse({
      kind: formData.get("kind"),
    });
    const file = formData.get("file");

    if (!parsed.success || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload an image file." },
        { status: 400 },
      );
    }

    const kind = parsed.data.kind as ImageUploadKind;
    const normalized = await normalizeImageUpload(file, { kind });
    const key = buildImageUploadKey({ filename: normalized.filename, kind });
    const uploaded = await uploadObject({
      body: normalized.buffer,
      contentLength: normalized.buffer.byteLength,
      contentType: normalized.contentType,
      key,
    });

    return NextResponse.json({
      contentType: normalized.contentType,
      key,
      publicUrl: uploaded.publicUrl,
      sizeBytes: normalized.buffer.byteLength,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ObjectStorageNotConfiguredError) {
      console.error("Object storage is not configured", error);
      return NextResponse.json(
        { error: "Uploads are not configured yet." },
        { status: 503 },
      );
    }
    if (error instanceof Error) {
      const expectedUploadError =
        error.message.startsWith("Unsupported image type") ||
        error.message.startsWith("Image must be") ||
        error.message.startsWith("Could not read") ||
        error.message.startsWith("Could not process");
      if (expectedUploadError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Image upload failed", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 },
    );
  }
}
