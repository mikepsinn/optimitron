"use client";

import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import {
  postOrganizationEndorsementDraft,
  syncPendingOrganizationEndorsements,
  type SyncedOrganizationEndorsement,
} from "@/lib/organization-endorsement-sync";
import { getOrganizationPath, ROUTES } from "@/lib/routes";
import {
  storage,
  type PendingOrganizationEndorsementDraft,
} from "@/lib/storage";
import { defaultButtonClassName } from "@optimitron/site-kit/components/ui/default-button";

interface ManageableOrg {
  id: string;
  name: string;
  slug: string | null;
  status: string;
}

interface Props {
  referendumSlug: string;
  manageableOrgs: ManageableOrg[];
}

type FormMode = "idle" | "auth" | "saving" | "saved" | "syncing" | "error";

interface SavedOrganization {
  name: string;
  organizationId?: string;
  /**
   * The organization's slug, which is what `/organizations/[slug]` resolves
   * on. The id is a cuid and that route looks up by slug, so linking with the
   * id lands on nothing.
   */
  organizationSlug?: string | null;
  taskId?: string | null;
}

type OrganizationEndorsementDraft = PendingOrganizationEndorsementDraft & {
  donationUrl?: string;
};

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `organization-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function savedOrganizationFromSync(
  organization: SyncedOrganizationEndorsement,
): SavedOrganization {
  return {
    name: organization.organizationName,
    organizationId: organization.organizationId,
    organizationSlug: organization.organizationSlug ?? null,
    taskId: organization.taskId ?? null,
  };
}

function getSingleJoinedOrganizationHref(
  organizations: SavedOrganization[],
): string | null {
  if (organizations.length !== 1) return null;
  const organizationSlug = organizations[0]?.organizationSlug;
  return organizationSlug
    ? `${getOrganizationPath(organizationSlug)}?joined=1`
    : null;
}

export function EndorseForm({ referendumSlug, manageableOrgs }: Props) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const hasExisting = manageableOrgs.length > 0;
  const [entryMode, setEntryMode] = useState<"existing" | "new">(
    hasExisting ? "existing" : "new",
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    manageableOrgs[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [donationUrl, setDonationUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("idle");
  const [savedOrganizations, setSavedOrganizations] = useState<
    SavedOrganization[]
  >([]);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const currentDraftIdRef = useRef<string | null>(null);
  const syncStartedRef = useRef(false);

  const isAuthenticated =
    sessionStatus === "authenticated" && Boolean(session?.user);
  const pendingCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return storage.getPendingOrganizationEndorsements().length;
  }, [formMode, syncAttempt]);

  useEffect(() => {
    if (sessionStatus !== "unauthenticated" || formMode !== "idle") return;
    const drafts = storage.getPendingOrganizationEndorsements();
    if (drafts.length === 0) return;
    const first = drafts[0]!;
    setSavedOrganizations([{ name: first.organizationName }]);
    setFormMode("auth");
  }, [formMode, sessionStatus]);

  useEffect(() => {
    if (!isAuthenticated || syncStartedRef.current) return;
    const drafts = storage.getPendingOrganizationEndorsements();
    if (drafts.length === 0) return;

    syncStartedRef.current = true;
    setFormMode("syncing");
    setError(null);

    void syncPendingOrganizationEndorsements()
      .then((result) => {
        if (result.skippedBecauseLocked) {
          window.setTimeout(() => {
            syncStartedRef.current = false;
            setFormMode("idle");
            setSyncAttempt((current) => current + 1);
          }, 1_000);
          return;
        }

        const syncedOrganizations = result.syncedOrganizations.map(
          savedOrganizationFromSync,
        );

        if (syncedOrganizations.length > 0) {
          setSavedOrganizations(syncedOrganizations);
        }

        if (result.failedDrafts.length > 0) {
          const first = result.failedDrafts[0]!;
          currentDraftIdRef.current = first.clientDraftId;
          setEntryMode("new");
          setName(first.organizationName);
          setWebsite(first.website ?? "");
          setDonationUrl(
            (first as OrganizationEndorsementDraft).donationUrl ?? "",
          );
          setError(
            "I could not finish adding that organization yet. The draft is still here.",
          );
          setFormMode("error");
          return;
        }

        const joinedHref = getSingleJoinedOrganizationHref(syncedOrganizations);
        if (joinedHref) {
          router.push(joinedHref);
          return;
        }

        if (result.syncedDrafts.length > 0) {
          router.refresh();
        }

        setFormMode(result.syncedDrafts.length > 0 ? "saved" : "idle");
      })
      .catch(() => {
        setError(
          "I could not finish adding that organization yet. The draft is still here.",
        );
        setFormMode("error");
      })
      .finally(() => {
        syncStartedRef.current = false;
      });
  }, [isAuthenticated, router, syncAttempt]);

  function resetNewOrganizationFields() {
    setName("");
    setWebsite("");
    setDonationUrl("");
    currentDraftIdRef.current = null;
  }

  function buildDraft(): OrganizationEndorsementDraft {
    currentDraftIdRef.current ??= createDraftId();
    return {
      clientDraftId: currentDraftIdRef.current,
      donationUrl: donationUrl.trim() || undefined,
      organizationName: name.trim(),
      originUrl:
        typeof window !== "undefined" ? window.location.href : undefined,
      referendumSlug,
      timestamp: new Date().toISOString(),
      version: 1,
      website: website.trim() || undefined,
    };
  }

  async function postExistingOrganization(): Promise<SavedOrganization> {
    const res = await fetch(
      `/api/referendums/${encodeURIComponent(referendumSlug)}/organization-position`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          position: "YES",
          statement: null,
        }),
      },
    );
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      organizationId?: string;
      organizationSlug?: string | null;
      taskId?: string | null;
    } | null;
    if (!res.ok) {
      throw new Error(data?.error ?? "Failed to add organization");
    }
    const selected = manageableOrgs.find(
      (organization) => organization.id === selectedOrgId,
    );
    return {
      organizationId: data?.organizationId ?? selectedOrgId,
      organizationSlug: data?.organizationSlug ?? selected?.slug ?? null,
      name: selected?.name ?? "your organization",
      taskId: data?.taskId ?? null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (entryMode === "existing") {
      if (!selectedOrgId) {
        setError("Select an organization.");
        setSubmitting(false);
        return;
      }
    } else if (!name.trim()) {
      setError("Organization name is required.");
      setSubmitting(false);
      return;
    }

    const draft = entryMode === "new" ? buildDraft() : null;

    if (!isAuthenticated) {
      if (!draft) {
        setError("Sign in to use an organization already connected to you.");
        setSubmitting(false);
        return;
      }
      storage.addPendingOrganizationEndorsement(draft);
      setSavedOrganizations([{ name: draft.organizationName }]);
      setFormMode("auth");
      resetNewOrganizationFields();
      setSubmitting(false);
      return;
    }

    try {
      setFormMode("saving");
      let savedOrganization: SavedOrganization;
      if (entryMode === "existing") {
        savedOrganization = await postExistingOrganization();
      } else {
        if (!draft) {
          throw new Error("Organization name is required.");
        }
        const organization = await postOrganizationEndorsementDraft(draft);
        if (!organization) {
          throw new Error("Failed to add organization");
        }
        savedOrganization = savedOrganizationFromSync(organization);
        resetNewOrganizationFields();
      }

      const saved = [savedOrganization];
      setSavedOrganizations(saved);
      const joinedHref = getSingleJoinedOrganizationHref(saved);
      if (joinedHref) {
        router.push(joinedHref);
        return;
      }

      router.refresh();
      setFormMode("saved");
    } catch (err) {
      if (draft) {
        currentDraftIdRef.current = draft.clientDraftId;
        storage.addPendingOrganizationEndorsement(draft);
      }
      setError(
        err instanceof Error ? err.message : "Failed to add organization",
      );
      setFormMode("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (formMode === "auth") {
    return (
      <section
        className="border-2 border-foreground bg-background p-6"
        data-testid="organization-endorsement-auth"
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Organization saved
            </p>
            <h2 className="text-3xl font-black uppercase leading-tight text-foreground">
              Verify your organization.
            </h2>
            <p className="font-bold leading-7 text-muted-foreground">
              We saved {savedOrganizations[0]?.name ?? "your organization"} in
              this browser. Sign in once so nobody joins the campaign in your
              organization&apos;s name.
            </p>
            {pendingCount > 1 ? (
              <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
                {pendingCount} organizations waiting.
              </p>
            ) : null}
          </div>
          <AuthForm
            callbackUrl={ROUTES.join}
            compact
            emailButtonLabel="Verify by email"
            emailLoadingLabel="Sending verification link..."
          />
        </div>
      </section>
    );
  }

  if (formMode === "syncing") {
    return (
      <section
        className="border-2 border-foreground bg-background p-6"
        data-testid="organization-endorsement-syncing"
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Joining
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-foreground">
          Adding your organization now.
        </h2>
      </section>
    );
  }

  if (formMode === "saved") {
    const first = savedOrganizations[0];
    const names = savedOrganizations
      .map((organization) => organization.name)
      .join(", ");
    const organizationHref = first?.organizationSlug
      ? getOrganizationPath(first.organizationSlug)
      : ROUTES.organizations;
    const taskHref = first?.taskId
      ? `${ROUTES.tasks}/${encodeURIComponent(first.taskId)}`
      : null;

    return (
      <div
        className="border-2 border-foreground bg-background p-8 text-center"
        data-testid="organization-endorsement-saved"
      >
        <p className="text-xl font-black uppercase text-foreground">
          Organization joined.
        </p>
        <p className="mt-2 text-2xl font-black uppercase text-foreground">
          {names || "Your organization"}
        </p>
        <p className="mt-3 text-sm font-bold text-muted-foreground">
          Next: copy the member link, website button, iframe, or email starter.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={organizationHref} className={defaultButtonClassName}>
            Open Organization Page
          </Link>
          {taskHref ? (
            <Link
              href={taskHref}
              className="inline-block border-2 border-foreground bg-background px-5 py-3 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background"
            >
              Open Survey Task
            </Link>
          ) : null}
        </div>
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
              checked={entryMode === "existing"}
              onChange={() => setEntryMode("existing")}
            />
            Use an organization I manage
          </label>
          {entryMode === "existing" ? (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            >
              {manageableOrgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.status !== "APPROVED"
                    ? ` (${o.status.toLowerCase()})`
                    : ""}
                </option>
              ))}
            </select>
          ) : null}
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <input
              type="radio"
              name="mode"
              value="new"
              checked={entryMode === "new"}
              onChange={() => setEntryMode("new")}
            />
            Add a new organization
          </label>
        </fieldset>
      ) : null}

      {entryMode === "new" ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="organization-name"
              className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Organization name *
            </label>
            <input
              id="organization-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            />
          </div>
          <div>
            <label
              htmlFor="organization-website"
              className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Website
            </label>
            <input
              id="organization-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.org"
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            />
          </div>
          <div>
            <label
              htmlFor="organization-donation-url"
              className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Donation URL
            </label>
            <input
              id="organization-donation-url"
              type="url"
              value={donationUrl}
              onChange={(e) => setDonationUrl(e.target.value)}
              placeholder="https://example.org/donate"
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground"
            />
            <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
              Optional. Adds a small Donate to{" "}
              {name.trim() || "your organization"} link on your public page.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-center text-sm font-bold text-brutal-red">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || formMode === "saving"}
        className={`${defaultButtonClassName} w-full disabled:opacity-50`}
      >
        {submitting || formMode === "saving"
          ? isAuthenticated
            ? "Joining..."
            : "Saving..."
          : "Join as an Organization"}
      </button>
    </form>
  );
}
