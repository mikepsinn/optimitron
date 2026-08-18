import { ContentAccessLevel } from "@optimitron/db/enums";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import {
  listContentAccessGrants,
  resolveContentGrantee,
  revokeContentAccessGrant,
  setContentAccessGrant,
} from "@/lib/content-access.server";
import { contentErrorResponse, noStoreJson } from "@/lib/content-http.server";
import { McpScope } from "@/lib/mcp-scopes";

export const runtime = "nodejs";

const CONTENT_SCOPES = [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN];

const resourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("document"), id: z.string().min(1) }),
  z.object({ type: z.literal("collection"), id: z.string().min(1) }),
]);

const granteeSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("user"),
      id: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }),
    z.object({ type: z.literal("organization"), id: z.string().min(1) }),
  ])
  .superRefine((value, context) => {
    if (value.type === "user" && Boolean(value.id) === Boolean(value.email)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Specify one user ID or email address.",
      });
    }
  });

const writeSchema = z.object({
  accessLevel: z.nativeEnum(ContentAccessLevel).optional(),
  grantee: granteeSchema,
  resource: resourceSchema,
});

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth(request, CONTENT_SCOPES);
    const url = new URL(request.url);
    const resource = resourceSchema.parse({
      type: url.searchParams.get("resourceType"),
      id: url.searchParams.get("resourceId"),
    });
    const grants = await listContentAccessGrants({
      actorUserId: currentUser.userId,
      resource,
    });
    return noStoreJson({ grants });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[CONTENT] Failed to list access grants:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to list access." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth(request, CONTENT_SCOPES);
    const input = writeSchema
      .extend({
        accessLevel: z.nativeEnum(ContentAccessLevel),
      })
      .parse(await request.json());
    const grant = await setContentAccessGrant({
      actorUserId: currentUser.userId,
      accessLevel: input.accessLevel,
      grantee: await resolveContentGrantee({
        actorUserId: currentUser.userId,
        grantee: input.grantee,
        resource: input.resource,
      }),
      resource: input.resource,
    });
    return noStoreJson({ grant });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[CONTENT] Failed to update access grant:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to update access." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await requireAuth(request, CONTENT_SCOPES);
    const input = writeSchema.parse(await request.json());
    await revokeContentAccessGrant({
      actorUserId: currentUser.userId,
      grantee: await resolveContentGrantee({
        actorUserId: currentUser.userId,
        grantee: input.grantee,
        resource: input.resource,
      }),
      resource: input.resource,
    });
    return noStoreJson({ revoked: true });
  } catch (error) {
    const response = contentErrorResponse(error);
    if (response) return response;
    console.error("[CONTENT] Failed to revoke access grant:", error);
    return noStoreJson(
      { code: "INTERNAL_ERROR", error: "Failed to revoke access." },
      { status: 500 },
    );
  }
}
