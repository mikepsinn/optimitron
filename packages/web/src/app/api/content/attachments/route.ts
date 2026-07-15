import { z } from "zod";
import { getCurrentUser, requireAuth } from "@/lib/auth-utils";
import {
  ContentAttachmentInputError,
  createPendingContentAttachment,
  listContentAttachments,
} from "@/lib/content-attachments.server";
import {
  contentErrorResponse,
  noStoreJson,
} from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";
import { PrivateObjectStorageNotConfiguredError } from "@/lib/object-storage.server";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const uploadSchema = z.object({
  checksumSha256: z.string().regex(/^[A-Za-z0-9+/]{43}=$/u),
  collectionRecordId: z.string().nullable().optional(),
  contentType: z.string().max(160).default(""),
  documentId: z.string().nullable().optional(),
  fileName: z.string().min(1).max(512),
  sizeBytes: z.number().int().positive(),
});

function attachmentError(error: unknown) {
  if (error instanceof ContentAttachmentInputError) {
    return noStoreJson(
      { code: "INVALID_ATTACHMENT", error: error.message },
      { status: error.status },
    );
  }
  const contentResponse = contentErrorResponse(error);
  if (contentResponse) return contentResponse;
  if (error instanceof PrivateObjectStorageNotConfiguredError) {
    return noStoreJson(
      { code: "STORAGE_NOT_CONFIGURED", error: "Private files are not configured." },
      { status: 503 },
    );
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request, CONTENT_SCOPES);
    const url = new URL(request.url);
    const attachments = await listContentAttachments({
      collectionRecordId: url.searchParams.get("collectionRecordId"),
      documentId: url.searchParams.get("documentId"),
      userId: currentUser?.id ?? null,
    });
    return noStoreJson({ attachments });
  } catch (error) {
    const response = attachmentError(error);
    if (response) return response;
    console.error("[CONTENT] Failed to list private attachments:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to list files." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth(request, CONTENT_SCOPES);
    const input = uploadSchema.parse(await request.json());
    const attachment = await createPendingContentAttachment({
      ...input,
      userId: currentUser.userId,
    });
    return noStoreJson(attachment, { status: 201 });
  } catch (error) {
    const response = attachmentError(error);
    if (response) return response;
    console.error("[CONTENT] Failed to prepare private attachment:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to prepare file upload." },
      { status: 500 },
    );
  }
}
