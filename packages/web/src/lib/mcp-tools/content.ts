import { ContentAccessLevel } from "@optimitron/db/enums";
import { z } from "zod";
import { stringifyJsonSafe } from "../json-safe";
import { McpScope } from "../mcp-scopes";

type ToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResponse {
  return { content: [{ type: "text", text: stringifyJsonSafe(data, 2) }] };
}

function err(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export const CONTENT_TOOL_SCOPES = {
  exportContent: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  manageContentAccess: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
  manageContentFiles: [McpScope.TASKS_PERSONAL, McpScope.TASKS_ADMIN],
} satisfies Record<string, McpScope[]>;

export type ContentToolName = keyof typeof CONTENT_TOOL_SCOPES;

const RESOURCE_PROPERTIES = {
  resourceId: { type: "string" },
  resourceType: { type: "string", enum: ["document", "collection"] },
} as const;

export const CONTENT_TOOL_DEFINITIONS = [
  {
    name: "manageContentAccess",
    description:
      "List, grant, or revoke access to a document or collection. Grant and revoke require full access. A user may be identified by Optimitron user ID or account email.",
    inputSchema: {
      type: "object" as const,
      properties: {
        action: { type: "string", enum: ["list", "grant", "revoke"] },
        ...RESOURCE_PROPERTIES,
        granteeType: { type: "string", enum: ["user", "organization"] },
        granteeId: { type: "string" },
        granteeEmail: { type: "string" },
        accessLevel: {
          type: "string",
          enum: ["FULL_ACCESS", "EDIT", "EDIT_CONTENT", "COMMENT", "VIEW"],
        },
      },
      required: ["action", "resourceType", "resourceId"],
    },
  },
  {
    name: "manageContentFiles",
    description:
      "List files, prepare or complete an upload, obtain a short-lived authorized download URL, or delete a private document/collection-record file.",
    inputSchema: {
      type: "object" as const,
      properties: {
        action: {
          type: "string",
          enum: ["list", "prepare", "complete", "open", "delete"],
        },
        attachmentId: { type: "string" },
        documentId: { type: "string" },
        collectionRecordId: { type: "string" },
        checksumSha256: { type: "string" },
        contentType: { type: "string" },
        fileName: { type: "string" },
        sizeBytes: { type: "number" },
      },
      required: ["action"],
    },
  },
  {
    name: "exportContent",
    description:
      "Export an authorized document snapshot or one cursor-paginated collection page. Private file metadata is included, but storage keys and unsigned object URLs are never returned.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ...RESOURCE_PROPERTIES,
        cursor: { type: "string" },
        limit: { type: "number" },
      },
      required: ["resourceType", "resourceId"],
    },
  },
] as const;

const CONTENT_TOOL_NAMES = new Set<string>(Object.keys(CONTENT_TOOL_SCOPES));

export function isContentToolName(name: string): name is ContentToolName {
  return CONTENT_TOOL_NAMES.has(name);
}

const resourceSchema = z.object({
  resourceId: z.string().trim().min(1),
  resourceType: z.enum(["document", "collection"]),
});

const granteeSchema = z
  .object({
    granteeEmail: z.string().email().optional(),
    granteeId: z.string().trim().min(1).optional(),
    granteeType: z.enum(["user", "organization"]),
  })
  .superRefine((value, context) => {
    if (value.granteeType === "organization" && !value.granteeId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An organization grantee requires granteeId.",
      });
    }
    if (
      value.granteeType === "user" &&
      Number(Boolean(value.granteeId)) + Number(Boolean(value.granteeEmail)) !==
        1
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A user grantee requires one granteeId or granteeEmail.",
      });
    }
  });

function contentResource(input: z.infer<typeof resourceSchema>) {
  return { type: input.resourceType, id: input.resourceId } as const;
}

function contentGrantee(input: z.infer<typeof granteeSchema>) {
  return input.granteeType === "organization"
    ? ({ type: "organization", id: input.granteeId as string } as const)
    : input.granteeId
      ? ({ type: "user", id: input.granteeId } as const)
      : ({ type: "user", email: input.granteeEmail } as const);
}

export async function handleContentToolCall(input: {
  args: Record<string, unknown>;
  name: ContentToolName;
  userId: string | null | undefined;
}): Promise<ToolResponse> {
  try {
    if (!input.userId) return err(`${input.name} requires an identified user`);
    const userId = input.userId;

    switch (input.name) {
      case "manageContentAccess": {
        const base = resourceSchema
          .extend({ action: z.enum(["list", "grant", "revoke"]) })
          .parse(input.args);
        const access = await import("../content-access.server");
        const resource = contentResource(base);
        if (base.action === "list") {
          return ok({
            grants: await access.listContentAccessGrants({
              actorUserId: userId,
              resource,
            }),
          });
        }
        const parsed = granteeSchema
          .and(
            base.action === "grant"
              ? z.object({ accessLevel: z.nativeEnum(ContentAccessLevel) })
              : z.object({}),
          )
          .parse(input.args);
        const grantee = await access.resolveContentGrantee({
          actorUserId: userId,
          grantee: contentGrantee(parsed),
          resource,
        });
        if (base.action === "grant") {
          return ok({
            grant: await access.setContentAccessGrant({
              accessLevel: (
                parsed as typeof parsed & {
                  accessLevel: ContentAccessLevel;
                }
              ).accessLevel,
              actorUserId: userId,
              grantee,
              resource,
            }),
          });
        }
        await access.revokeContentAccessGrant({
          actorUserId: userId,
          grantee,
          resource,
        });
        return ok({ revoked: true });
      }
      case "manageContentFiles": {
        const action = z
          .enum(["list", "prepare", "complete", "open", "delete"])
          .parse(input.args.action);
        const files = await import("../content-attachments.server");
        if (action === "list") {
          const parsed = z
            .object({
              collectionRecordId: z.string().trim().min(1).optional(),
              documentId: z.string().trim().min(1).optional(),
            })
            .parse(input.args);
          return ok({
            attachments: await files.listContentAttachments({
              ...parsed,
              userId,
            }),
          });
        }
        if (action === "prepare") {
          const parsed = z
            .object({
              checksumSha256: z.string().regex(/^[A-Za-z0-9+/]{43}=$/u),
              collectionRecordId: z.string().trim().min(1).optional(),
              contentType: z.string().max(160),
              documentId: z.string().trim().min(1).optional(),
              fileName: z.string().min(1).max(512),
              sizeBytes: z.number().int().positive(),
            })
            .parse(input.args);
          return ok(
            await files.createPendingContentAttachment({
              ...parsed,
              userId,
            }),
          );
        }
        const attachmentId = z
          .string()
          .trim()
          .min(1)
          .parse(input.args.attachmentId);
        if (action === "complete") {
          return ok(
            await files.completeContentAttachment({ attachmentId, userId }),
          );
        }
        if (action === "open") {
          return ok(
            await files.getContentAttachmentDownload({ attachmentId, userId }),
          );
        }
        await files.deleteContentAttachment({ attachmentId, userId });
        return ok({ deleted: true });
      }
      case "exportContent": {
        const parsed = resourceSchema
          .extend({
            cursor: z.string().trim().min(1).optional(),
            limit: z.number().int().positive().max(500).optional(),
          })
          .parse(input.args);
        const { exportContent } = await import("../content-export.server");
        return ok(
          await exportContent({
            cursor: parsed.cursor,
            limit: parsed.limit,
            resource: contentResource(parsed),
            userId,
          }),
        );
      }
    }
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "Content operation failed",
    );
  }
}
