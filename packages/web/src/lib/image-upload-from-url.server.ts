import { lookup } from "node:dns/promises";
import * as http from "node:http";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import * as https from "node:https";
import net from "node:net";
import {
  buildImageUploadKey,
  getImageUploadMaxInputBytes,
  normalizeImageUpload,
} from "@/lib/image-upload.server";
import type { ImageUploadKind } from "@/lib/image-upload-types";
import { uploadObject } from "@/lib/object-storage.server";

const ALLOWED_REMOTE_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

export interface UploadImageFromUrlInput {
  filename?: string | null;
  kind: ImageUploadKind;
  url: string;
}

export interface UploadImageFromUrlResult {
  contentType: string;
  key: string;
  publicUrl: string;
  sizeBytes: number;
  sourceUrl: string;
}

function contentTypeBase(contentType: string | null) {
  return contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function extensionForContentType(contentType: string) {
  switch (contentType) {
    case "image/gif":
      return "gif";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "img";
  }
}

function filenameFromUrl(url: URL, contentType: string) {
  const rawName = url.pathname.split("/").filter(Boolean).pop() ?? "";
  let decodedName = rawName;
  try {
    decodedName = decodeURIComponent(rawName);
  } catch {
    decodedName = rawName;
  }
  const pathnameName = decodedName.replace(/[?#].*$/, "").trim();
  if (/\.[a-z0-9]{2,5}$/i.test(pathnameName)) return pathnameName;
  return `remote-image.${extensionForContentType(contentType)}`;
}

function isBlockedHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower === "0.0.0.0" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  );
}

function validationHostname(hostname: string) {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

function isPrivateIp(address: string) {
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) {
    const [a = 0, b = 0, c = 0] = address
      .split(".")
      .map((part) => Number(part));
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }
  if (ipVersion === 6) {
    const lower = address.toLowerCase();
    if (lower.startsWith("::ffff:")) {
      return isPrivateIp(lower.slice("::ffff:".length));
    }
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("2001:db8") ||
      lower.startsWith("2001:0db8") ||
      /^fe[89ab]/.test(lower) ||
      lower.startsWith("ff")
    );
  }
  return false;
}

interface PublicImageTarget {
  address: string;
  family?: number;
  hostHeader: string;
  servername?: string;
}

async function assertPublicImageUrl(url: URL): Promise<PublicImageTarget> {
  const hostname = validationHostname(url.hostname);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Image URL must use http or https.");
  }
  if (url.username || url.password) {
    throw new Error("Image URL must not include credentials.");
  }
  if (isBlockedHostname(hostname)) {
    throw new Error("Image URL host is not allowed.");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Image URL host is not allowed.");
    }
    return {
      address: hostname,
      family: net.isIP(hostname),
      hostHeader: url.host,
    };
  }

  const addresses = await lookup(hostname, { all: true });
  if (
    addresses.length === 0 ||
    addresses.some((item) => isPrivateIp(item.address))
  ) {
    throw new Error("Image URL host is not allowed.");
  }
  const target = addresses[0];
  return {
    address: target.address,
    family: target.family,
    hostHeader: url.host,
    servername: hostname,
  };
}

function headerValue(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

function requestPinnedUrl(
  url: URL,
  target: PublicImageTarget,
): Promise<IncomingMessage> {
  const isHttps = url.protocol === "https:";
  const commonOptions: http.RequestOptions = {
    family: target.family,
    headers: {
      Accept: "image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8",
      Host: target.hostHeader,
      "User-Agent": "Optimitron image importer",
    },
    hostname: target.address,
    method: "GET",
    path: `${url.pathname}${url.search}`,
    port: url.port ? Number(url.port) : isHttps ? 443 : 80,
    protocol: url.protocol,
  };

  return new Promise((resolve, reject) => {
    const request = isHttps
      ? https.request(
          { ...commonOptions, servername: target.servername },
          resolve,
        )
      : http.request(commonOptions, resolve);
    request.setTimeout(FETCH_TIMEOUT_MS, () => {
      request.destroy(new Error("Image URL request timed out."));
    });
    request.on("error", reject);
    request.end();
  });
}

async function fetchWithRedirects(startUrl: URL): Promise<{
  response: IncomingMessage;
  sourceUrl: URL;
}> {
  let currentUrl = startUrl;
  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const target = await assertPublicImageUrl(currentUrl);
    const response = await requestPinnedUrl(currentUrl, target);
    const status = response.statusCode ?? 0;
    const location = headerValue(response.headers, "location");

    if (status >= 300 && status < 400 && location) {
      response.resume();
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return { response, sourceUrl: currentUrl };
  }

  throw new Error("Image URL redirected too many times.");
}

async function readResponseBuffer(
  response: IncomingMessage,
  maxBytes: number,
) {
  const contentLength = Number(
    headerValue(response.headers, "content-length") ?? 0,
  );
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(
      `Image must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`,
    );
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let sizeError: Error | null = null;
    const timeout = setTimeout(() => {
      response.destroy(new Error("Image URL response timed out."));
    }, FETCH_TIMEOUT_MS);

    response.on("data", (value: Buffer | string) => {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        sizeError = new Error(
          `Image must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`,
        );
        response.destroy(sizeError);
        return;
      }
      chunks.push(chunk);
    });
    response.on("end", () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks));
    });
    response.on("error", (error) => {
      clearTimeout(timeout);
      reject(sizeError ?? error);
    });
  });
}

export async function uploadImageFromUrl({
  filename,
  kind,
  url,
}: UploadImageFromUrlInput): Promise<UploadImageFromUrlResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Image URL is invalid.");
  }

  const { response, sourceUrl } = await fetchWithRedirects(parsedUrl);
  const status = response.statusCode ?? 0;
  if (status < 200 || status >= 300) {
    response.resume();
    throw new Error(`Image URL returned HTTP ${status}.`);
  }

  const remoteContentType = contentTypeBase(
    headerValue(response.headers, "content-type"),
  );
  if (!ALLOWED_REMOTE_IMAGE_TYPES.has(remoteContentType)) {
    response.resume();
    throw new Error("Remote URL must return a supported image type.");
  }

  const maxBytes = getImageUploadMaxInputBytes(kind);
  const source = await readResponseBuffer(response, maxBytes);
  const sourceFile = new File(
    [source],
    filename?.trim() || filenameFromUrl(sourceUrl, remoteContentType),
    { type: remoteContentType },
  );
  const normalized = await normalizeImageUpload(sourceFile, { kind });
  const key = buildImageUploadKey({ filename: normalized.filename, kind });
  const uploaded = await uploadObject({
    body: normalized.buffer,
    contentLength: normalized.buffer.byteLength,
    contentType: normalized.contentType,
    key,
  });

  return {
    contentType: normalized.contentType,
    key,
    publicUrl: uploaded.publicUrl,
    sizeBytes: normalized.buffer.byteLength,
    sourceUrl: sourceUrl.toString(),
  };
}
