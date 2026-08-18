#!/usr/bin/env tsx
/**
 * Upload one or more files to the Cloudflare R2 bucket configured in env.
 *
 * Usage:
 *   pnpm --filter @optimitron/web exec tsx scripts/upload-media-to-r2.ts \
 *     <local-path> [<key>]
 *
 *   - <local-path>  path on disk (relative or absolute)
 *   - <key>         optional object key in the bucket. Defaults to basename.
 *
 * Examples:
 *   tsx scripts/upload-media-to-r2.ts public/media/chaplin-great-dictator-320.mp4
 *   tsx scripts/upload-media-to-r2.ts ./video.mp4 chaplin-great-dictator-320.mp4
 *
 * Required env (loaded from monorepo root .env then apps/optimitron/.env):
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET, R2_PUBLIC_URL
 */
import "./load-env";

import { readFileSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { lookup as lookupMime } from "mime-types";

const REQUIRED = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENDPOINT",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
] as const;

function readEnv(): Record<(typeof REQUIRED)[number], string> {
  const out: Partial<Record<(typeof REQUIRED)[number], string>> = {};
  const missing: string[] = [];
  for (const key of REQUIRED) {
    const value = process.env[key];
    if (!value) missing.push(key);
    else out[key] = value;
  }
  if (missing.length) {
    console.error(
      `Missing env: ${missing.join(", ")}. Set them in the root .env or apps/optimitron/.env.`,
    );
    process.exit(1);
  }
  return out as Record<(typeof REQUIRED)[number], string>;
}

async function main() {
  const [, , localPathArg, keyArg] = process.argv;
  if (!localPathArg) {
    console.error(
      "Usage: tsx scripts/upload-media-to-r2.ts <local-path> [<key>]",
    );
    process.exit(1);
  }

  const env = readEnv();
  const localPath = resolve(localPathArg);
  const stat = statSync(localPath);
  if (!stat.isFile()) {
    console.error(`Not a file: ${localPath}`);
    process.exit(1);
  }

  const key = keyArg ?? basename(localPath);
  const body = readFileSync(localPath);
  const contentType = lookupMime(localPath) || "application/octet-stream";

  const client = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  console.log(
    `Uploading ${localPath} → ${env.R2_BUCKET}/${key} (${(stat.size / 1024 / 1024).toFixed(2)} MB, ${contentType})`,
  );

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Cache aggressively — these are immutable media assets.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  console.log(`Done. Public URL: ${publicUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
