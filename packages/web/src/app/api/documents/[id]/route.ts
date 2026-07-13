/**
 * GET  /api/documents/[id] — read one document version + version list.
 * POST /api/documents/[id] — append a new version (creator only).
 *
 * Private documents return 404 for everyone but their creator (and admins on
 * GET) — indistinguishable from missing ones.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import {
  DOCUMENT_EMPTY_PATCH_MESSAGE,
  DOCUMENT_NOT_FOUND_MESSAGE,
  DOCUMENT_PRIVATE_TASK_MESSAGE,
  getDocumentForViewer,
  toDocumentDto,
  updateDocument,
} from "@/lib/documents.server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const currentUser = await getCurrentUser(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);

    const result = await getDocumentForViewer(id, currentUser?.id ?? null);
    if (!result) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({
      document: toDocumentDto(result.document),
      versions: result.versions,
      viewerCanEdit: result.viewerCanEdit,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DOCUMENTS] Failed to fetch document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      title?: unknown;
      body?: unknown;
      visibility?: unknown;
    } | null;

    const title = typeof body?.title === "string" ? body.title : null;
    const markdown = typeof body?.body === "string" ? body.body : null;
    const visibility =
      body?.visibility === "PUBLIC" || body?.visibility === "PRIVATE"
        ? body.visibility
        : null;

    const updated = await updateDocument({
      documentId: id,
      editorUserId: currentUser.id,
      title,
      body: markdown,
      visibility,
    });

    return NextResponse.json({ document: toDocumentDto(updated) });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      error.message === DOCUMENT_NOT_FOUND_MESSAGE
    ) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    if (
      error instanceof Error &&
      (error.message.includes("cannot be empty") ||
        error.message.includes("character limit") ||
        error.message === DOCUMENT_EMPTY_PATCH_MESSAGE ||
        error.message === DOCUMENT_PRIVATE_TASK_MESSAGE)
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[DOCUMENTS] Failed to update document:", error);
    return NextResponse.json(
      { error: "Failed to update document." },
      { status: 500 },
    );
  }
}
