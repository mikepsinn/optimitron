import type { Prisma } from "@optimitron/db";
import type { PrismaClient } from "@optimitron/db";
import { findOrCreatePerson } from "@/lib/person.server";
import { getWishoniaUserId } from "@/lib/wishonia.server";

/**
 * Resolver registry. A `TaskSpawnSpec` references resolvers by string key;
 * this file maps each key to the runtime function that produces the value.
 *
 * Adding a new resolver kind is purely additive — register the key here,
 * authoring tools (createTaskTrigger MCP) validate against this list.
 */

export type ResolverDb = Pick<
  Prisma.TransactionClient,
  "person" | "task" | "user"
>;

export interface ResolveContext {
  db: ResolverDb;
  /// Arbitrary event context provided to fireTaskTrigger.
  context: unknown;
  /// User who fired the trigger (when applicable).
  actorUserId: string | null;
  /// Cached actor user (loaded once if needed).
  actor?: { id: string; personId: string | null } | null;
}

// ---- creatorResolver ---------------------------------------------------------

const CREATOR_RESOLVERS = new Set(["actor", "system"]);

export async function resolveTaskCreatorUserId(
  resolver: string,
  ctx: ResolveContext,
): Promise<string> {
  if (resolver === "system") return getWishoniaUserId();
  if (resolver === "actor") {
    if (ctx.actorUserId) return ctx.actorUserId;
    const contextUserId = lookup(ctx.context, "user.id");
    return validateUserId(contextUserId, ctx);
  }
  if (resolver.startsWith("context.")) {
    const value = lookup(ctx.context, resolver.slice("context.".length));
    return validateUserId(value, ctx);
  }
  return getWishoniaUserId();
}

async function validateUserId(
  value: unknown,
  ctx: ResolveContext,
): Promise<string> {
  if (typeof value !== "string" || !value) return getWishoniaUserId();
  const user = await ctx.db.user.findUnique({
    where: { id: value },
    select: { id: true },
  });
  return user?.id ?? getWishoniaUserId();
}

// ---- assigneePersonResolver -----------------------------------------------

const ASSIGNEE_PERSON_RESOLVERS = new Set([
  "actor",
  "context.recipient",
  "context.recipientPersonId",
  "lookup.byEmail",
  "lookup.byHandle",
  "none",
]);

export async function resolveAssigneePersonId(
  resolver: string,
  ctx: ResolveContext,
): Promise<string | null> {
  if (resolver === "none") return null;
  if (resolver === "actor") {
    if (!ctx.actorUserId) return null;
    const personId =
      ctx.actor?.personId ??
      (
        await ctx.db.user.findUnique({
          where: { id: ctx.actorUserId },
          select: { personId: true },
        })
      )?.personId ??
      null;
    return personId;
  }
  if (
    resolver === "context.recipient" ||
    resolver === "context.recipientPersonId"
  ) {
    const id =
      lookup(ctx.context, "recipient.personId") ??
      lookup(ctx.context, "recipientPersonId");
    return typeof id === "string" ? id : null;
  }
  if (resolver === "lookup.byEmail") {
    const email = lookup(ctx.context, "recipient.email");
    const displayName =
      lookup(ctx.context, "recipient.displayName") ??
      lookup(ctx.context, "recipient.name");
    if (typeof email !== "string" || !email) return null;
    const person = await findOrCreatePerson(
      {
        displayName:
          typeof displayName === "string" && displayName ? displayName : email,
        email,
      },
      ctx.db as PrismaClient,
    );
    return person.id;
  }
  if (resolver === "lookup.byHandle") {
    const handle = lookup(ctx.context, "recipient.handle");
    if (typeof handle !== "string" || !handle) return null;
    const person = await ctx.db.person.findFirst({
      where: { handle, deletedAt: null },
      select: { id: true },
    });
    return person?.id ?? null;
  }
  if (resolver.startsWith("context.")) {
    const value = lookup(ctx.context, resolver.slice("context.".length));
    return typeof value === "string" ? value : null;
  }
  throw new Error(`Unknown assigneePersonResolver: ${resolver}`);
}

// ---- assigneeOrganizationResolver -----------------------------------------

const ASSIGNEE_ORG_RESOLVERS = new Set([
  "context.organization",
  "context.organizationId",
  "none",
]);

export async function resolveAssigneeOrganizationId(
  resolver: string,
  ctx: ResolveContext,
): Promise<string | null> {
  if (resolver === "none") return null;
  if (
    resolver === "context.organization" ||
    resolver === "context.organizationId"
  ) {
    const id =
      lookup(ctx.context, "organization.id") ??
      lookup(ctx.context, "organizationId");
    return typeof id === "string" ? id : null;
  }
  if (resolver.startsWith("context.")) {
    const value = lookup(ctx.context, resolver.slice("context.".length));
    return typeof value === "string" ? value : null;
  }
  throw new Error(`Unknown assigneeOrganizationResolver: ${resolver}`);
}

// ---- parentResolver --------------------------------------------------------

export interface ParentResolution {
  /// Resolved parent task id, or null for none.
  parentTaskId: string | null;
}

export async function resolveParentTaskId(
  resolver: string,
  ctx: ResolveContext & { parentSpecTaskId?: string | null },
): Promise<ParentResolution> {
  if (resolver === "none") return { parentTaskId: null };
  if (resolver === "trigger.parentSpec") {
    return { parentTaskId: ctx.parentSpecTaskId ?? null };
  }
  if (resolver === "context.parentTaskId") {
    const id = lookup(ctx.context, "parentTaskId");
    return { parentTaskId: typeof id === "string" ? id : null };
  }
  if (resolver.startsWith("fixed:")) {
    const taskKey = resolver.slice("fixed:".length);
    const task = await ctx.db.task.findFirst({
      where: { taskKey, deletedAt: null },
      select: { id: true },
    });
    return { parentTaskId: task?.id ?? null };
  }
  if (resolver.startsWith("context.")) {
    const value = lookup(ctx.context, resolver.slice("context.".length));
    return { parentTaskId: typeof value === "string" ? value : null };
  }
  throw new Error(`Unknown parentResolver: ${resolver}`);
}

// ---- audienceResolver (communication path) --------------------------------

const AUDIENCE_RESOLVERS = new Set([
  "ASSIGNEE",
  "CREATOR",
  "WATCHERS",
  "context.recipientUserIds",
]);

export interface AudienceResolution {
  recipientUserIds: string[];
}

export async function resolveAudience(
  resolver: string,
  ctx: ResolveContext & {
    task?: {
      id: string;
      createdByUserId: string | null;
      assigneeUserId?: string | null;
    } | null;
  },
): Promise<AudienceResolution> {
  if (resolver === "ASSIGNEE") {
    const userId = ctx.task?.assigneeUserId ?? null;
    return { recipientUserIds: userId ? [userId] : [] };
  }
  if (resolver === "CREATOR") {
    const userId = ctx.task?.createdByUserId ?? null;
    return { recipientUserIds: userId ? [userId] : [] };
  }
  if (resolver === "WATCHERS") {
    return { recipientUserIds: [] };
  }
  if (resolver === "context.recipientUserIds") {
    const ids = lookup(ctx.context, "recipientUserIds");
    return {
      recipientUserIds: Array.isArray(ids)
        ? ids.filter((v): v is string => typeof v === "string")
        : [],
    };
  }
  throw new Error(`Unknown audienceResolver: ${resolver}`);
}

// ---- registry validation (used by createTaskTrigger MCP) ------------------

export function validateCreatorResolver(key: string): boolean {
  return CREATOR_RESOLVERS.has(key) || key.startsWith("context.");
}
export function validateAssigneePersonResolver(key: string): boolean {
  return ASSIGNEE_PERSON_RESOLVERS.has(key) || key.startsWith("context.");
}
export function validateAssigneeOrganizationResolver(key: string): boolean {
  return ASSIGNEE_ORG_RESOLVERS.has(key) || key.startsWith("context.");
}
export function validateParentResolver(key: string): boolean {
  return (
    key === "trigger.parentSpec" ||
    key === "context.parentTaskId" ||
    key === "none" ||
    key.startsWith("fixed:") ||
    key.startsWith("context.")
  );
}
export function validateAudienceResolver(key: string): boolean {
  return AUDIENCE_RESOLVERS.has(key) || key.startsWith("context.");
}

// ---- internal --------------------------------------------------------------

function lookup(root: unknown, path: string): unknown {
  if (root == null) return undefined;
  let cur: unknown = root;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}
