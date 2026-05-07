import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@/lib/env";

export class ObjectStorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Object storage is not configured. Set R2_ENDPOINT, R2_BUCKET, R2_PUBLIC_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.",
    );
    this.name = "ObjectStorageNotConfiguredError";
  }
}

interface ObjectStorageConfig {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  publicBaseUrl: string;
  secretAccessKey: string;
}

let cachedClient: S3Client | null = null;
let cachedConfig: ObjectStorageConfig | null = null;

function loadConfig(): ObjectStorageConfig {
  if (cachedConfig) return cachedConfig;
  const accessKeyId = serverEnv.R2_ACCESS_KEY_ID;
  const secretAccessKey = serverEnv.R2_SECRET_ACCESS_KEY;
  const endpoint = serverEnv.R2_ENDPOINT;
  const bucket = serverEnv.R2_BUCKET;
  const publicBaseUrl = serverEnv.R2_PUBLIC_URL;
  if (
    !accessKeyId ||
    !secretAccessKey ||
    !endpoint ||
    !bucket ||
    !publicBaseUrl
  ) {
    throw new ObjectStorageNotConfiguredError();
  }
  cachedConfig = {
    accessKeyId,
    bucket,
    endpoint,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
    secretAccessKey,
  };
  return cachedConfig;
}

function getClient(): { client: S3Client; config: ObjectStorageConfig } {
  const config = loadConfig();
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return { client: cachedClient, config };
}

export interface PresignUploadInput {
  key: string;
  contentType: string;
  contentLength: number;
}

export interface PresignUploadResult {
  expiresInSeconds: number;
  publicUrl: string;
  uploadUrl: string;
}

export interface UploadObjectInput {
  body: Buffer | Uint8Array;
  contentLength?: number;
  contentType: string;
  key: string;
}

export interface UploadObjectResult {
  publicUrl: string;
}

const PRESIGN_EXPIRY_SECONDS = 60 * 5;

export async function presignUpload({
  key,
  contentType,
  contentLength,
}: PresignUploadInput): Promise<PresignUploadResult> {
  const { client, config } = getClient();
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  });
  return {
    expiresInSeconds: PRESIGN_EXPIRY_SECONDS,
    publicUrl: `${config.publicBaseUrl}/${key}`,
    uploadUrl,
  };
}

/**
 * Public URL for an existing object key. Use when the key was generated
 * outside the presign flow, such as server-side uploads or admin tooling.
 */
export function publicUrl(key: string): string {
  const config = loadConfig();
  return `${config.publicBaseUrl}/${key}`;
}

export async function uploadObject({
  body,
  contentLength,
  contentType,
  key,
}: UploadObjectInput): Promise<UploadObjectResult> {
  const { client, config } = getClient();
  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: config.bucket,
      ContentLength: contentLength ?? body.byteLength,
      ContentType: contentType,
      Key: key,
    }),
  );
  return {
    publicUrl: `${config.publicBaseUrl}/${key}`,
  };
}

export function isObjectStorageConfigured(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}
