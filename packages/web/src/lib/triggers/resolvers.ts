import type { Prisma } from "@optimitron/db";
import type { PrismaClient } from "@optimitron/db";
import { findOrCreatePerson } from "@/lib/person.server";

/**
 * Resolver registry. A `TaskSpawnSpec` references resolvers by string key;
 * this file maps each key to the runtime function that produces the value.
 *
 * Adding a new resolver kind is purely additive — register the key here,
 * authoring tools (createTaskTrigger MCP) validate against this list.
 */

export type ResolverDb = Pick<Prisma.TransactionClient, "person" | "task" | "user">;

export interface ResolveContext {
  db: ResolverDb;
  /// Arbitrary event context provided to fireTaskTrigger.
  context: unknown;
  /// User who fired the trigger (when applicable).
  actorUserId: string | null;
  /// Cached actor user (loaded once if needed).
  actor?: { id: string; personId: string | null } | null;
}

// ---- ownerResolver ---------------------------------------------------------

const OWNER_RESOLVERS = new Set(["actor", "system"]);

export async function resolveOwnerUserId(
  resolver: string,
  ctx: ResolveContext,
): Promise<string | null> {
  if (resolver === "system") return null;
  if (resolver === "actor") return ctx.actorUserId;
  if (resolver.startsWith("context.")) {
    const value = lookup(ctx.context, resolver.slice("context.".length));
    return typeof value === "string" ? value : null;
  }
  throw new Error(`Unknown ownerResolver: ${resolver}`);
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
      (await ctx.db.user.findUnique({
        where: { id: ctx.actorUserId },
        select: { personId: true },
      }))?.personId ??
      null;
    return personId;
  }
  if (resolver === "context.recipient" || resolver === "context.recipientPersonId") {
    const id = lookup(ctx.context, "recipient.personId") ?? lookup(ctx.context, "recipientPersonId");
    return typeof id === "string" ? id : null;
  }
  if (resolver === "lookup.byEmail") {
    const email = lookup(ctx.context, "recipient.email");
    const displayName = lookup(ctx.context, "recipient.displayName") ?? lookup(ctx.context, "recipient.name");
    if (typeof email !== "string" || !email) return null;
    const person = await findOrCreatePerson(
      {
        displayName: typeof displayName === "string" && displayName ? displayName : email,
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

const ASSIGNEE_ORG_RESOLVERS = new Set(["context.organization", "context.organizationId", "none"]);

export async function resolveAssigneeOrganizationId(
  resolver: string,
  ctx: ResolveContext,
): Promise<string | null> {
  if (resolver === "none") return null;
  if (resolver === "context.organization" || resolver === "context.organizationId") {
    const id = lookup(ctx.context, "organization.id") ?? lookup(ctx.context, "organizationId");
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
  "OWNER",
  "WATCHERS",
  "context.recipientUserIds",
]);

export interface AudienceResolution {
  recipientUserIds: string[];
}

export async function resolveAudience(
  resolver: string,
  ctx: ResolveContext & { task?: { id: string; ownerUserId: string | null; assigneeUserId?: string | null } | null },
): Promise<AudienceResolution> {
  if (resolver === "ASSIGNEE") {
    const userId = ctx.task?.assigneeUserId ?? null;
    return { recipientUserIds: userId ? [userId] : [] };
  }
  if (resolver === "OWNER") {
    const userId = ctx.task?.ownerUserId ?? null;
    return { recipientUserIds: userId ? [userId] : [] };
  }
  if (resolver === "WATCHERS") {
    return { recipientUserIds: [] };
  }
  if (resolver === "context.recipientUserIds") {
    const ids = lookup(ctx.context, "recipientUserIds");
    return { recipientUserIds: Array.isArray(ids) ? ids.filter((v): v is string => typeof v === "string") : [] };
  }
  throw new Error(`Unknown audienceResolver: ${resolver}`);
}

// ---- registry validation (used by createTaskTrigger MCP) ------------------

export function validateOwnerResolver(key: string): boolean {
  return OWNER_RESOLVERS.has(key) || key.startsWith("context.");
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
