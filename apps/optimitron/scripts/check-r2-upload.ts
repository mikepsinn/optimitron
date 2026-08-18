import "./load-env";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  buildImageUploadKey,
  normalizeImageUpload,
} from "../src/lib/image-upload.server";
import type { ImageUploadKind } from "../src/lib/image-upload-types";
import { uploadObject } from "../src/lib/object-storage.server";

/**
 * Smoke-test the backend image upload path against the configured R2 bucket.
 * This intentionally does not test browser PUT CORS because image uploads now
 * go through the application server.
 *
 * Run:
 *   pnpm --filter @optimitron/web run check:r2-upload
 *
 * Optional:
 *   pnpm --filter @optimitron/web run check:r2-upload -- --keep-object
 *   pnpm --filter @optimitron/web run check:r2-upload -- --kind organization-square-logo
 */

const REQUIRED_ENV = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENDPOINT",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
] as const;

const PNG_1X1_TRANSPARENT = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

const IMAGE_UPLOAD_KINDS = [
  "memorial-evidence-image",
  "organization-square-logo",
  "organization-wordmark-logo",
  "person-photo",
] as const satisfies readonly ImageUploadKind[];

function env(name: (typeof REQUIRED_ENV)[number]) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function parseUploadKind(): ImageUploadKind {
  const inlineArg = process.argv.find((arg) => arg.startsWith("--kind="));
  const separateArgIndex = process.argv.indexOf("--kind");
  const value =
    inlineArg?.slice("--kind=".length) ??
    (separateArgIndex >= 0 ? process.argv[separateArgIndex + 1] : undefined) ??
    "person-photo";
  if (!IMAGE_UPLOAD_KINDS.includes(value as ImageUploadKind)) {
    throw new Error(`Unsupported upload kind: ${value}`);
  }
  return value as ImageUploadKind;
}

async function waitForPublicUrl(url: string) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { method: "GET" });
    lastStatus = response.status;
    if (response.ok) return { ok: true, status: response.status };
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return { ok: false, status: lastStatus };
}

async function main() {
  const keepObject = process.argv.includes("--keep-object");
  const kind = parseUploadKind();
  const bucket = env("R2_BUCKET");
  const endpoint = env("R2_ENDPOINT");
  env("R2_PUBLIC_URL");
  const sourceFile = new File([PNG_1X1_TRANSPARENT], "r2-smoke.png", {
    type: "image/png",
  });
  const normalized = await normalizeImageUpload(sourceFile, {
    kind,
  });
  const key = buildImageUploadKey({ filename: normalized.filename, kind });
  const uploaded = await uploadObject({
    body: normalized.buffer,
    contentLength: normalized.buffer.byteLength,
    contentType: normalized.contentType,
    key,
  });

  const publicCheck = await waitForPublicUrl(uploaded.publicUrl);
  let deleted = false;
  if (!publicCheck.ok) {
    throw new Error(
      `Public uploaded image URL returned ${publicCheck.status}: ${uploaded.publicUrl}`,
    );
  }

  if (!keepObject) {
    const client = new S3Client({
      credentials: {
        accessKeyId: env("R2_ACCESS_KEY_ID"),
        secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
      },
      endpoint,
      region: "auto",
    });
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    deleted = true;
  }

  console.log(
    JSON.stringify(
      {
        bucket,
        contentType: normalized.contentType,
        deleted,
        endpointHost: new URL(endpoint).host,
        kind,
        keyPrefix: key.split("/").slice(0, 2).join("/"),
        publicHost: new URL(uploaded.publicUrl).host,
        publicStatus: publicCheck.status,
        sizeBytes: normalized.buffer.byteLength,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
