"use client";

import { Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Select } from "@/components/retroui/Select";
import { API_ROUTES } from "@/lib/api-routes";

type AccessLevel = "EDIT" | "EDIT_CONTENT" | "FULL_ACCESS" | "VIEW";
type ContentResource =
  | { id: string; type: "collection" }
  | { id: string; type: "document" };

interface AccessGrant {
  accessLevel: AccessLevel | "COMMENT";
  id: string;
  organization: { id: string; name: string } | null;
  organizationId: string | null;
  user: {
    email: string | null;
    id: string;
    person: { displayName: string } | null;
  } | null;
  userId: string | null;
}

const ACCESS_LABELS: Record<AccessLevel | "COMMENT", string> = {
  COMMENT: "Can comment",
  EDIT: "Can edit and organize",
  EDIT_CONTENT: "Can edit content",
  FULL_ACCESS: "Full access",
  VIEW: "Can view",
};

function accessUrl(resource: ContentResource) {
  const query = new URLSearchParams({
    resourceId: resource.id,
    resourceType: resource.type,
  });
  return `${API_ROUTES.content.access}?${query}`;
}

async function readError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? fallback;
}

export function ContentSharePanel({
  initialGrants,
  resource,
}: {
  initialGrants: AccessGrant[];
  resource: ContentResource;
}) {
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("VIEW");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [granteeType, setGranteeType] = useState<"organization" | "user">(
    "user",
  );
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [grants, setGrants] = useState(initialGrants);
  const [isSharing, setIsSharing] = useState(false);

  async function refresh() {
    const response = await fetch(accessUrl(resource), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await readError(response, "Could not refresh sharing."));
    }
    const body = (await response.json()) as { grants: AccessGrant[] };
    setGrants(body.grants);
  }

  async function share() {
    if (!identifier.trim() || isSharing) return;
    setError(null);
    setIsSharing(true);
    try {
      const response = await fetch(API_ROUTES.content.access, {
        body: JSON.stringify({
          accessLevel,
          grantee:
            granteeType === "user"
              ? { email: identifier.trim(), type: "user" }
              : { id: identifier.trim(), type: "organization" },
          resource,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not share this item."),
        );
      }
      setIdentifier("");
      await refresh();
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : "Could not share this item.",
      );
    } finally {
      setIsSharing(false);
    }
  }

  async function revoke(grant: AccessGrant) {
    const grantee = grant.userId
      ? { id: grant.userId, type: "user" as const }
      : grant.organizationId
        ? { id: grant.organizationId, type: "organization" as const }
        : null;
    if (!grantee) return;
    setBusyId(grant.id);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.content.access, {
        body: JSON.stringify({ grantee, resource }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Could not remove access."));
      }
      await refresh();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Could not remove access.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <details className="border-b border-foreground py-5">
      <summary className="cursor-pointer font-bold">Share</summary>
      <div className="mt-4 space-y-4">
        <div className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_13rem_auto]">
          <Select
            value={granteeType}
            onValueChange={(value) => {
              setGranteeType(value as "organization" | "user");
              setIdentifier("");
            }}
          >
            <Select.Trigger className="w-full rounded-none shadow-none">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="user">Person</Select.Item>
              <Select.Item value="organization">Organization</Select.Item>
            </Select.Content>
          </Select>
          <Input
            aria-label={
              granteeType === "user" ? "Collaborator email" : "Organization ID"
            }
            className="shadow-none"
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={
              granteeType === "user" ? "name@example.org" : "Organization ID"
            }
            type={granteeType === "user" ? "email" : "text"}
            value={identifier}
          />
          <Select
            value={accessLevel}
            onValueChange={(value) => setAccessLevel(value as AccessLevel)}
          >
            <Select.Trigger className="w-full rounded-none shadow-none">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="VIEW">Can view</Select.Item>
              <Select.Item value="EDIT_CONTENT">Can edit content</Select.Item>
              <Select.Item value="EDIT">Can edit and organize</Select.Item>
              <Select.Item value="FULL_ACCESS">Full access</Select.Item>
            </Select.Content>
          </Select>
          <Button
            className="gap-2 shadow-none"
            disabled={!identifier.trim() || isSharing}
            onClick={() => void share()}
            type="button"
          >
            <UserPlus className="h-4 w-4" />
            Share
          </Button>
        </div>
        {grants.length ? (
          <ul className="divide-y divide-border border-y border-border">
            {grants.map((grant) => {
              const label =
                grant.user?.person?.displayName ||
                grant.user?.email ||
                grant.organization?.name ||
                "Collaborator";
              return (
                <li
                  className="flex min-h-11 items-center justify-between gap-3 py-2"
                  key={grant.id}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {ACCESS_LABELS[grant.accessLevel]}
                    </span>
                  </span>
                  <button
                    aria-label={`Remove ${label}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground hover:bg-foreground hover:text-background disabled:opacity-50"
                    disabled={busyId === grant.id}
                    onClick={() => void revoke(grant)}
                    title="Remove access"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only you can access this item.
          </p>
        )}
        {error ? <p className="text-sm font-medium">{error}</p> : null}
      </div>
    </details>
  );
}
