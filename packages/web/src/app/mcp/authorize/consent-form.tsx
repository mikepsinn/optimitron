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
  codeChallenge,
}: {
  clientId: string;
  redirectUri: string;
  state: string | null;
  requestedScopes: McpScope[];
  availableScopes: readonly McpScope[];
  codeChallenge: string;
}) {
  const [selected, setSelected] = useState<Set<McpScope>>(
    () => new Set(requestedScopes.filter((s) => availableScopes.includes(s))),
  );
  const [loading, setLoading] = useState(false);

  function toggle(scope: McpScope) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  async function handleApprove() {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/mcp/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          scope: scopesToWire(Array.from(selected)),
          code_challenge: codeChallenge,
          approved: true,
        }),
      });

      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch {
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
                      <span className="text-[10px] font-black uppercase border-2 border-primary bg-brutal-yellow text-brutal-yellow-foreground px-1">
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

      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={loading || selected.size === 0}
          className="flex-1"
        >
          {loading ? "Authorizing..." : selected.size === 0 ? "Select Permissions" : "Authorize"}
        </Button>
        <Button
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
