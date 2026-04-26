"use client";

import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { ALL_SCOPES, McpScope, scopeToWire, scopesToWire } from "@/lib/mcp-scopes";

const SCOPE_LABELS: Record<McpScope, { title: string; detail: string }> = {
  [McpScope.TASKS_READ]: {
    title: "View public tasks and funding",
    detail: "Read-only access to the public task graph, blockers, and funding stats.",
  },
  [McpScope.TASKS_WRITE]: {
    title: "Create and update tasks",
    detail: "Draft new tasks, update existing ones, propose bundles, set impact estimates.",
  },
  [McpScope.TASKS_PERSONAL]: {
    title: "Manage your claims and comments",
    detail: "Claim tasks as you, complete claims, post and vote on comments.",
  },
  [McpScope.AGENT_RUN]: {
    title: "Run agents and acquire leases",
    detail: "Lock active work so concurrent agents don't collide. Log runs, costs, and contact actions.",
  },
  [McpScope.SEARCH]: {
    title: "Search the manual",
    detail: "Query the strategy manual and ask Wishonia questions over the documentation.",
  },
};

export function McpConsentForm({
  clientId,
  redirectUri,
  state,
  requestedScopes,
  codeChallenge,
}: {
  clientId: string;
  redirectUri: string;
  state: string | null;
  requestedScopes: McpScope[];
  codeChallenge: string;
}) {
  const [selected, setSelected] = useState<Set<McpScope>>(
    () => new Set(requestedScopes.filter((s) => ALL_SCOPES.includes(s))),
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
        {ALL_SCOPES.map((scope) => {
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
