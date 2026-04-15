"use client";

import { useState } from "react";

interface ManageableOrg {
  id: string;
  name: string;
  status: string;
}

interface Props {
  referendumSlug: string;
  manageableOrgs: ManageableOrg[];
}

export function EndorseForm({ referendumSlug, manageableOrgs }: Props) {
  const hasExisting = manageableOrgs.length > 0;
  const [mode, setMode] = useState<"existing" | "new">(
    hasExisting ? "existing" : "new",
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    manageableOrgs[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [statement, setStatement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      position: "YES",
      statement: statement.trim() || null,
    };

    if (mode === "existing") {
      if (!selectedOrgId) {
        setError("Select an organization.");
        setSubmitting(false);
        return;
      }
      payload.organizationId = selectedOrgId;
    } else {
      if (!name.trim()) {
        setError("Organization name is required.");
        setSubmitting(false);
        return;
      }
      payload.newOrganization = {
        name: name.trim(),
        website: website.trim() || null,
        description: description.trim() || null,
      };
    }

    try {
      const res = await fetch(
        `/api/referendums/${encodeURIComponent(referendumSlug)}/organization-position`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to submit endorsement");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="border-2 border-foreground bg-background p-8 text-center">
        <p className="text-xl font-black uppercase text-foreground">
          Submitted — pending review.
        </p>
        <p className="mt-3 text-sm font-bold text-muted-foreground">
          An administrator will verify your organization and publish the
          endorsement on the supporters page. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 border-2 border-foreground bg-background p-6"
    >
      {hasExisting ? (
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Organization
          </legend>
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <input
              type="radio"
              name="mode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
            />
            Use an organization I manage
          </label>
          {mode === "existing" ? (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            >
              {manageableOrgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.status !== "APPROVED" ? ` (${o.status.toLowerCase()})` : ""}
                </option>
              ))}
            </select>
          ) : null}
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <input
              type="radio"
              name="mode"
              value="new"
              checked={mode === "new"}
              onChange={() => setMode("new")}
            />
            Create a new organization
          </label>
        </fieldset>
      ) : null}

      {mode === "new" ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Organization name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.org"
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              About
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Public statement (optional)
        </label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={3}
          placeholder="A short quote that will appear on the supporters page."
          className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
        />
      </div>

      {error ? (
        <p className="text-center text-sm font-bold text-brutal-red">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit endorsement"}
      </button>
    </form>
  );
}
