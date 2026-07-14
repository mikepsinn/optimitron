import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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

export class PrivateObjectStorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Private object storage is not configured. Set R2_ENDPOINT, R2_PRIVATE_BUCKET, and either the private or shared R2 credentials in .env.",
    );
    this.name = "PrivateObjectStorageNotConfiguredError";
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

interface PrivateObjectStorageConfig {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  secretAccessKey: string;
}

let cachedPrivateClient: S3Client | null = null;
let cachedPrivateConfig: PrivateObjectStorageConfig | null = null;

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
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return { client: cachedClient, config };
}

function loadPrivateConfig(): PrivateObjectStorageConfig {
  if (cachedPrivateConfig) return cachedPrivateConfig;
  const privateAccessKeyId = serverEnv.R2_PRIVATE_ACCESS_KEY_ID;
  const privateSecretAccessKey = serverEnv.R2_PRIVATE_SECRET_ACCESS_KEY;
  if (Boolean(privateAccessKeyId) !== Boolean(privateSecretAccessKey)) {
    throw new PrivateObjectStorageNotConfiguredError();
  }
  const accessKeyId = privateAccessKeyId ?? serverEnv.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    privateSecretAccessKey ?? serverEnv.R2_SECRET_ACCESS_KEY;
  const endpoint = serverEnv.R2_ENDPOINT;
  const bucket = serverEnv.R2_PRIVATE_BUCKET;
  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
    throw new PrivateObjectStorageNotConfiguredError();
  }
  cachedPrivateConfig = {
    accessKeyId,
    bucket,
    endpoint,
    secretAccessKey,
  };
  return cachedPrivateConfig;
}

function getPrivateClient(): {
  client: S3Client;
  config: PrivateObjectStorageConfig;
} {
  const config = loadPrivateConfig();
  if (!cachedPrivateClient) {
    cachedPrivateClient = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return { client: cachedPrivateClient, config };
}

export interface PresignUploadInput {
  key: string;
  contentType: string;
  contentLength: number;
  checksumSha256?: string;
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
const PRIVATE_DOWNLOAD_EXPIRY_SECONDS = 60;

export async function presignUpload({
  key,
  contentType,
  contentLength,
  checksumSha256,
}: PresignUploadInput): Promise<PresignUploadResult> {
  const { client, config } = getClient();
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    ChecksumSHA256: checksumSha256,
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

export interface PrivateObjectMetadata {
  contentLength: number | null;
  contentType: string | null;
}

export async function presignPrivateUpload(input: PresignUploadInput): Promise<{
  expiresInSeconds: number;
  uploadUrl: string;
}> {
  const { client, config } = getPrivateClient();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
      ChecksumSHA256: input.checksumSha256,
    }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS },
  );
  return { expiresInSeconds: PRESIGN_EXPIRY_SECONDS, uploadUrl };
}

export async function headPrivateObject(
  key: string,
): Promise<PrivateObjectMetadata> {
  const { client, config } = getPrivateClient();
  const result = await client.send(
    new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
  );
  return {
    contentLength: result.ContentLength ?? null,
    contentType: result.ContentType ?? null,
  };
}

export async function readPrivateObjectPrefix(
  key: string,
  maxBytes = 8192,
): Promise<Uint8Array> {
  const { client, config } = getPrivateClient();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Range: `bytes=0-${Math.max(0, maxBytes - 1)}`,
    }),
  );
  if (!result.Body) throw new Error("Private object body is empty.");
  return result.Body.transformToByteArray();
}

export async function presignPrivateDownload(input: {
  contentDisposition: string;
  contentType: string;
  key: string;
}): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
  const { client, config } = getPrivateClient();
  const downloadUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: input.key,
      ResponseContentDisposition: input.contentDisposition,
      ResponseContentType: input.contentType,
      ResponseCacheControl: "private, no-store",
    }),
    { expiresIn: PRIVATE_DOWNLOAD_EXPIRY_SECONDS },
  );
  return {
    downloadUrl,
    expiresInSeconds: PRIVATE_DOWNLOAD_EXPIRY_SECONDS,
  };
}

export async function deletePrivateObject(key: string): Promise<void> {
  const { client, config } = getPrivateClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
  );
}

export function isPrivateObjectStorageConfigured(): boolean {
  try {
    loadPrivateConfig();
    return true;
  } catch {
    return false;
  }
}
