import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * Public R2 object storage for campaign-app uploads (plaintiff photos and
 * memorial evidence).
 *
 * This is the public-bucket half of the Optimitron app's object-storage
 * module. The private bucket, download presigning, and object deletion stay in
 * `apps/optimitron` because no campaign surface uses them. Configuration is
 * read straight from `process.env` rather than `lib/env.ts` so the shared env
 * schema does not gain five optional keys that only two routes read.
 */
export class ObjectStorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Object storage is not configured. Set R2_ENDPOINT, R2_BUCKET, R2_PUBLIC_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.",
    )
    this.name = "ObjectStorageNotConfiguredError"
  }
}

interface ObjectStorageConfig {
  accessKeyId: string
  bucket: string
  endpoint: string
  publicBaseUrl: string
  secretAccessKey: string
}

let cachedClient: S3Client | null = null
let cachedConfig: ObjectStorageConfig | null = null

function loadConfig(): ObjectStorageConfig {
  if (cachedConfig) return cachedConfig
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const endpoint = process.env.R2_ENDPOINT
  const bucket = process.env.R2_BUCKET
  const publicBaseUrl = process.env.R2_PUBLIC_URL
  if (
    !accessKeyId ||
    !secretAccessKey ||
    !endpoint ||
    !bucket ||
    !publicBaseUrl
  ) {
    throw new ObjectStorageNotConfiguredError()
  }
  cachedConfig = {
    accessKeyId,
    bucket,
    endpoint,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
    secretAccessKey,
  }
  return cachedConfig
}

function getClient(): { client: S3Client; config: ObjectStorageConfig } {
  const config = loadConfig()
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
    })
  }
  return { client: cachedClient, config }
}

export interface PresignUploadInput {
  key: string
  contentType: string
  contentLength: number
  checksumSha256?: string
}

export interface PresignUploadResult {
  expiresInSeconds: number
  publicUrl: string
  uploadUrl: string
}

export interface UploadObjectInput {
  body: Buffer | Uint8Array
  contentLength?: number
  contentType: string
  key: string
}

export interface UploadObjectResult {
  publicUrl: string
}

const PRESIGN_EXPIRY_SECONDS = 60 * 5

export async function presignUpload({
  key,
  contentType,
  contentLength,
  checksumSha256,
}: PresignUploadInput): Promise<PresignUploadResult> {
  const { client, config } = getClient()
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    ChecksumSHA256: checksumSha256,
  })
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  })
  return {
    expiresInSeconds: PRESIGN_EXPIRY_SECONDS,
    publicUrl: `${config.publicBaseUrl}/${key}`,
    uploadUrl,
  }
}

export async function uploadObject({
  body,
  contentLength,
  contentType,
  key,
}: UploadObjectInput): Promise<UploadObjectResult> {
  const { client, config } = getClient()
  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: config.bucket,
      ContentLength: contentLength ?? body.byteLength,
      ContentType: contentType,
      Key: key,
    }),
  )
  return {
    publicUrl: `${config.publicBaseUrl}/${key}`,
  }
}
