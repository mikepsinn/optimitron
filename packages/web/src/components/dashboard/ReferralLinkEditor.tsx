"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Save } from "lucide-react";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { REFERRAL_SHARE_PROMPT } from "@/lib/messaging";
import { buildReferralUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { DashboardUser } from "@/types/dashboard";

type ReferralLinkEditorVariant = "default" | "treaty";

interface ReferralLinkEditorProps {
  user: DashboardUser;
  baseUrl: string;
  onUserChange: (user: DashboardUser) => void;
  onRefresh?: () => void;
  title?: string | null;
  description?: string;
  variant?: ReferralLinkEditorVariant;
  className?: string;
}

interface ReferralLinkEditorCardProps extends ReferralLinkEditorProps {
  cardClassName?: string;
}

function sanitizeLinkName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function getReferralIdentifier(user: DashboardUser) {
  return user.handle?.trim() || user.referralCode;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/u, "");
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function ReferralLinkEditorCard({
  cardClassName,
  variant = "default",
  ...props
}: ReferralLinkEditorCardProps) {
  const defaultCardClassName =
    "border border-black bg-white p-5 text-black shadow-none sm:p-6";

  return (
    <Card className={cn(defaultCardClassName, cardClassName)}>
      <ReferralLinkEditor variant={variant} {...props} />
    </Card>
  );
}

export function ReferralLinkEditor({
  user,
  baseUrl,
  onUserChange,
  onRefresh,
  title = null,
  description = REFERRAL_SHARE_PROMPT,
  variant = "default",
  className,
}: ReferralLinkEditorProps) {
  const currentIdentifier = getReferralIdentifier(user);
  const [draft, setDraft] = useState(currentIdentifier);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<number | null>(null);
  const base = normalizeBaseUrl(baseUrl);
  const trimmedDraft = draft.trim();
  const dirty = trimmedDraft !== currentIdentifier;
  const displayedIdentifier = trimmedDraft || currentIdentifier;
  const displayedUrl = buildReferralUrl(displayedIdentifier, base);
  const savedUrl = buildReferralUrl(currentIdentifier, base);
  const linkPrefix = `${base}/vote/`;
  const isTreaty = variant === "treaty";
  const hasHeaderCopy = Boolean(title || description);

  useEffect(() => {
    setDraft(currentIdentifier);
    setError(null);
    setCopied(false);
  }, [currentIdentifier]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  function validateDraft() {
    if (trimmedDraft.length < 3 || trimmedDraft.length > 24) {
      return "Use 3-24 characters.";
    }
    if (!/^[a-zA-Z0-9_-]+$/u.test(trimmedDraft)) {
      return "Letters, numbers, hyphens, and underscores only.";
    }
    return null;
  }

  async function markCopied() {
    if (copiedTimeoutRef.current) {
      window.clearTimeout(copiedTimeoutRef.current);
    }
    setCopied(true);
    copiedTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimeoutRef.current = null;
    }, 2000);
  }

  async function saveLinkName(options: { copyAfter?: boolean } = {}) {
    if (!dirty) {
      if (options.copyAfter) {
        await copyToClipboard(savedUrl);
        await markCopied();
      }
      return;
    }

    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: trimmedDraft }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update link");
      }

      const normalizedHandle = trimmedDraft.toLowerCase();
      onUserChange({
        ...user,
        handle: normalizedHandle,
        person: user.person
          ? { ...user.person, handle: normalizedHandle }
          : user.person,
      });
      onRefresh?.();

      if (options.copyAfter) {
        await copyToClipboard(buildReferralUrl(normalizedHandle, base));
        await markCopied();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (dirty) {
      await saveLinkName({ copyAfter: true });
      return;
    }
    await copyToClipboard(displayedUrl);
    await markCopied();
  }

  return (
    <div className={cn("space-y-4", className)}>
      {hasHeaderCopy ? (
        <div className="space-y-1">
          {title ? (
            <h3 className="text-lg font-black uppercase leading-tight">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p
              className={cn(
                "text-sm font-bold leading-6",
                isTreaty ? "text-black" : "text-muted-foreground",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center overflow-hidden bg-background",
            "border border-black",
          )}
        >
          <span
            className={cn(
              "hidden min-w-0 shrink truncate px-3 py-3 text-sm font-black sm:block",
              isTreaty ? "text-black" : "text-muted-foreground",
            )}
          >
            {linkPrefix}
          </span>
          <span
            className={cn(
              "shrink-0 px-3 py-3 text-sm font-black sm:hidden",
              isTreaty ? "text-black" : "text-muted-foreground",
            )}
          >
            /vote/
          </span>
          <Input
            aria-label="Link name"
            aria-invalid={Boolean(error)}
            value={draft}
            onChange={(event) => {
              setDraft(sanitizeLinkName(event.target.value));
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void saveLinkName();
              }
            }}
            className="min-h-12 min-w-[9rem] flex-1 border-0 bg-transparent px-0 font-mono text-base font-black shadow-none focus:shadow-none"
            maxLength={24}
            placeholder="your-name"
          />
        </div>

        {dirty ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => {
              void saveLinkName();
            }}
            className={cn(
              "min-h-12 justify-center gap-2 px-4 text-xs font-black uppercase tracking-[0.12em] shadow-none hover:translate-x-0 hover:translate-y-0 sm:w-auto",
              "border border-black bg-white text-black hover:bg-black hover:text-white",
            )}
          >
            <Save className="h-4 w-4 stroke-[2.5px]" />
            {saving ? "Saving" : "Save"}
          </Button>
        ) : null}

        <Button
          type="button"
          onClick={() => {
            void copyLink();
          }}
          disabled={saving}
          className={cn(
            "min-h-12 justify-center gap-2 px-4 text-xs font-black uppercase tracking-[0.12em] shadow-none hover:translate-x-0 hover:translate-y-0 sm:w-auto",
            "border border-black bg-black text-white hover:bg-white hover:text-black",
          )}
        >
          {copied ? (
            <Check className="h-4 w-4 stroke-[2.5px]" />
          ) : (
            <Copy className="h-4 w-4 stroke-[2.5px]" />
          )}
          {copied ? "Copied" : dirty ? "Save & Copy" : "Copy"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm font-bold text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
