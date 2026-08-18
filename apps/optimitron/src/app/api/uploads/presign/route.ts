import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import {
  ObjectStorageNotConfiguredError,
  presignUpload,
} from "@/lib/object-storage.server";

const KIND_LIMITS = {
  "person-photo": {
    maxBytes: 5 * 1024 * 1024,
    allowedTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    keyPrefix: "people/photos",
  },
  "memorial-evidence": {
    maxBytes: 25 * 1024 * 1024,
    allowedTypes: new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "text/plain",
    ]),
    keyPrefix: "memorial-evidence",
  },
} as const;

type UploadKind = keyof typeof KIND_LIMITS;

const presignSchema = z.object({
  kind: z.enum(["person-photo", "memorial-evidence"]),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  filename: z.string().max(160).optional(),
});

function buildKey(kind: UploadKind, filename: string | undefined): string {
  const { keyPrefix } = KIND_LIMITS[kind];
  const ext = filename?.match(/\.([a-z0-9]+)$/iu)?.[1]?.toLowerCase() ?? "bin";
  const dateSegment = new Date().toISOString().slice(0, 10);
  return `${keyPrefix}/${dateSegment}/${randomUUID()}.${ext}`;
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid presign request", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { kind, contentType, sizeBytes, filename } = parsed.data;
    const limits = KIND_LIMITS[kind];

    if (!limits.allowedTypes.has(contentType)) {
      return NextResponse.json(
        {
          error: `Unsupported content type for kind=${kind}.`,
          allowed: Array.from(limits.allowedTypes),
        },
        { status: 400 },
      );
    }
    if (sizeBytes > limits.maxBytes) {
      return NextResponse.json(
        {
          error: `File exceeds ${limits.maxBytes} bytes for kind=${kind}.`,
        },
        { status: 413 },
      );
    }

    const key = buildKey(kind, filename);
    const presigned = await presignUpload({ key, contentType, contentLength: sizeBytes });
    return NextResponse.json({
      key,
      kind,
      ...presigned,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ObjectStorageNotConfiguredError) {
      console.error("Object storage is not configured", error);
      return NextResponse.json({ error: "Uploads are not configured yet." }, { status: 503 });
    }
    console.error("Presign upload failed", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
