export const TASK_COMMENT_ATTACHMENT_MAX_COUNT = 5;
export const TASK_COMMENT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
export const TASK_COMMENT_ATTACHMENT_MAX_PENDING_COUNT = 10;
export const TASK_COMMENT_ATTACHMENT_MAX_PENDING_BYTES = 100 * 1024 * 1024;
export const TASK_COMMENT_ATTACHMENT_PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export const INLINE_TASK_COMMENT_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const ALLOWED_TASK_COMMENT_ATTACHMENT_TYPES = new Set([
  ...INLINE_TASK_COMMENT_IMAGE_TYPES,
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/json",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-zip-compressed",
  "application/zip",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "text/csv",
  "text/markdown",
  "text/plain",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  json: "application/json",
  m4a: "audio/mp4",
  md: "text/markdown",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  odp: "application/vnd.oasis.opendocument.presentation",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odt: "application/vnd.oasis.opendocument.text",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  wav: "audio/wav",
  webm: "video/webm",
  webp: "image/webp",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

export function normalizeTaskCommentAttachmentContentType(
  fileName: string,
  _contentType: string,
): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? "";
}

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function isZip(bytes: Uint8Array) {
  return (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  );
}

function isIsoBaseMedia(bytes: Uint8Array) {
  return bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp";
}

function isText(bytes: Uint8Array) {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export function taskCommentAttachmentBytesMatchContentType(
  contentType: string,
  bytes: Uint8Array,
): boolean {
  switch (contentType) {
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(
        bytes,
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      );
    case "image/gif":
      return ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a";
    case "image/webp":
      return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
    case "image/avif":
      return (
        isIsoBaseMedia(bytes) && ["avif", "avis"].includes(ascii(bytes, 8, 4))
      );
    case "image/heic":
    case "image/heif":
      return (
        isIsoBaseMedia(bytes) &&
        ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(
          ascii(bytes, 8, 4),
        )
      );
    case "application/pdf":
      return ascii(bytes, 0, 5) === "%PDF-";
    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.ms-powerpoint":
      return startsWith(
        bytes,
        [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
      );
    case "application/vnd.oasis.opendocument.presentation":
    case "application/vnd.oasis.opendocument.spreadsheet":
    case "application/vnd.oasis.opendocument.text":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/x-zip-compressed":
    case "application/zip":
      return isZip(bytes);
    case "audio/mpeg":
      return (
        ascii(bytes, 0, 3) === "ID3" ||
        (bytes[0] === 0xff && (bytes[1] ?? 0) >= 0xe0)
      );
    case "audio/ogg":
      return ascii(bytes, 0, 4) === "OggS";
    case "audio/wav":
    case "audio/x-wav":
      return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE";
    case "audio/mp4":
    case "video/mp4":
    case "video/quicktime":
      return isIsoBaseMedia(bytes);
    case "video/webm":
      return startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
    case "application/json":
    case "text/csv":
    case "text/markdown":
    case "text/plain":
      return isText(bytes);
    default:
      return false;
  }
}

export function sanitizeTaskCommentAttachmentFileName(
  fileName: string,
): string {
  const sanitized = fileName
    .replace(/[\u0000-\u001f\u007f]/gu, "")
    .replace(/[\\/]/gu, "_")
    .trim()
    .slice(0, 255);
  return sanitized || "attachment";
}

export function isInlineTaskCommentImage(contentType: string): boolean {
  return INLINE_TASK_COMMENT_IMAGE_TYPES.has(contentType.toLowerCase());
}

export function buildAttachmentContentDisposition(
  fileName: string,
  inline: boolean,
): string {
  const safeFileName = sanitizeTaskCommentAttachmentFileName(fileName);
  const asciiFileName = safeFileName
    .replace(/[^\x20-\x7e]/gu, "_")
    .replace(/["\\]/gu, "_");
  const encodedFileName = encodeURIComponent(safeFileName).replace(
    /['()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${inline ? "inline" : "attachment"}; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`;
}
