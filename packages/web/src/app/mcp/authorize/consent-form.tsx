"use client";

import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { McpScope, scopeToWire, scopesToWire } from "@/lib/mcp-scopes";

const SCOPE_LABELS: Record<McpScope, { title: string; detail: string }> = {
  [McpScope.TASKS_ADMIN]: {
    title: "Admin public task management",
    detail: "Create and manage public Optimitron tasks, people, organizations, estimates, dependencies, and milestones.",
  },
  [McpScope.TASKS_PERSONAL]: {
    title: "Manage private tasks",
    detail: "Create, update, delete, prioritize, and comment on your private tasks.",
  },
  [McpScope.TASKS_ORGANIZATION]: {
    title: "Manage organization tasks",
    detail: "Manage private work for organizations where you have permission.",
  },
  [McpScope.ACTIONS_APPROVE]: {
    title: "Approve outbound actions",
    detail: "Approve an exact message or browser action as yourself.",
  },
  [McpScope.EARTHDATA_WRITE]: {
    title: "Add Earth data",
    detail: "Create sourced memorials, evidence, organization signatures, intervention reports, and correction reports.",
  },
  [McpScope.EARTHDATA_ADMIN]: {
    title: "Moderate Earth data",
    detail: "Hide, restore, merge, and resolve public Earth-data records and reports.",
  },
  [McpScope.AGENT_RUN]: {
    title: "Run coordinated agents",
    detail: "Acquire leases and log multi-agent runs for public optimize-earth workflows.",
  },
  [McpScope.GITHUB]: {
    title: "GitHub repo access",
    detail: "Read code from the configured Optimitron repos and call the GitHub API on the server's behalf (issues, PRs, discussions, commit statuses).",
  },
};

export function McpConsentForm({
  clientId,
  redirectUri,
  state,
  requestedScopes,
  availableScopes,
  availableOrganizations,
  codeChallenge,
  initialOrganizationIds,
}: {
  clientId: string;
  redirectUri: string;
  state: string | null;
  requestedScopes: McpScope[];
  availableScopes: readonly McpScope[];
  availableOrganizations: Array<{
    id: string;
    name: string;
    role: string;
    slug: string;
  }>;
  codeChallenge: string;
  initialOrganizationIds: string[];
}) {
  const [selected, setSelected] = useState<Set<McpScope>>(
    () => new Set(requestedScopes.filter((s) => availableScopes.includes(s))),
  );
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<
    Set<string>
  >(
    () =>
      new Set(
        initialOrganizationIds.filter((id) =>
          availableOrganizations.some((organization) => organization.id === id),
        ),
      ),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(scope: McpScope) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  function toggleOrganization(organizationId: string) {
    setSelectedOrganizationIds((previous) => {
      const next = new Set(previous);
      if (next.has(organizationId)) next.delete(organizationId);
      else next.add(organizationId);
      return next;
    });
  }

  async function handleApprove() {
    const organizationSelectionRequired =
      selected.has(McpScope.TASKS_ORGANIZATION) &&
      selectedOrganizationIds.size === 0;
    if (selected.size === 0) {
      setError("Select at least one permission.");
      return;
    }
    if (organizationSelectionRequired) {
      setError("Select at least one organization, or turn off organization access.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mcp/oauth/consent", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          scope: scopesToWire(Array.from(selected)),
          organization_ids: selected.has(McpScope.TASKS_ORGANIZATION)
            ? Array.from(selectedOrganizationIds)
            : [],
          code_challenge: codeChallenge,
          approved: true,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        redirect_url?: string;
        error?: string;
        error_description?: string;
      };
      if (res.status === 401) {
        setError("Your session expired. Sign in again, then authorize.");
        setLoading(false);
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`;
        return;
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      setError(data.error_description ?? data.error ?? "Authorization failed.");
      setLoading(false);
    } catch {
      setError("Authorization failed. Try again.");
      setLoading(false);
    }
  }

  function handleDeny() {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  }

  return (
    <div>
      <h2 className="text-sm font-black uppercase mb-3">Permissions</h2>
      <ul className="space-y-3 mb-6">
        {availableScopes.map((scope) => {
          const labels = SCOPE_LABELS[scope];
          const checked = selected.has(scope);
          const wasRequested = requestedScopes.includes(scope);
          return (
            <li key={scope}>
              <label className="flex gap-3 items-start cursor-pointer border-2 border-primary p-3 hover:bg-muted">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(scope)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-black uppercase text-sm">{labels.title}</span>
                    <code className="text-xs font-bold text-muted-foreground">{scopeToWire(scope)}</code>
                    {!wasRequested ? (
                      <span className="text-[10px] font-black uppercase border-2 border-primary bg-background text-foreground px-1">
                        Not Requested
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground mt-1">{labels.detail}</p>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      {selected.has(McpScope.TASKS_ORGANIZATION) ? (
        <div className="mb-6">
          <h2 className="text-sm font-black uppercase mb-3">Organizations</h2>
          {availableOrganizations.length > 0 ? (
            <ul className="space-y-2">
              {availableOrganizations.map((organization) => (
                <li key={organization.id}>
                  <label className="flex gap-3 items-start cursor-pointer border-2 border-primary p-3 hover:bg-muted">
                    <Checkbox
                      checked={selectedOrganizationIds.has(organization.id)}
                      onCheckedChange={() => toggleOrganization(organization.id)}
                      className="mt-0.5"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-black uppercase break-words">
                        {organization.name}
                      </span>
                      <span className="block text-xs font-bold text-muted-foreground mt-1">
                        {organization.role.toLowerCase()} · {organization.slug}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs font-bold text-muted-foreground">
              You do not belong to an organization. Remove organization access
              to continue.
            </p>
          )}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-bold mb-4">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => {
            void handleApprove();
          }}
          disabled={
            loading ||
            selected.size === 0 ||
            (selected.has(McpScope.TASKS_ORGANIZATION) &&
              selectedOrganizationIds.size === 0)
          }
          className="flex-1"
        >
          {loading ? "Authorizing..." : selected.size === 0 ? "Select Permissions" : "Authorize"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleDeny}
          disabled={loading}
          className="flex-1"
        >
          Deny
        </Button>
      </div>
    </div>
  );
}
