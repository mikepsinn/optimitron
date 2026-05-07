"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { SquarePhotoCropper } from "@/components/people/SquarePhotoCropper";
import { uploadImageViaBackend } from "@/lib/image-upload.client";

interface OrganizationProfile {
  contactEmail: string | null;
  description: string | null;
  donationUrl: string | null;
  id: string;
  name: string;
  squareLogoUrl: string | null;
  type: string;
  website: string | null;
  wordmarkLogoUrl: string | null;
}

interface OrganizationProfileEditorProps {
  organization: OrganizationProfile;
}

export function OrganizationProfileEditor({
  organization,
}: OrganizationProfileEditorProps) {
  const router = useRouter();
  const squareLogoInputRef = useRef<HTMLInputElement>(null);
  const wordmarkLogoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    contactEmail: organization.contactEmail ?? "",
    description: organization.description ?? "",
    donationUrl: organization.donationUrl ?? "",
    name: organization.name,
    squareLogoUrl: organization.squareLogoUrl ?? "",
    website: organization.website ?? "",
    wordmarkLogoUrl: organization.wordmarkLogoUrl ?? "",
  });
  const [squareLogoCropFile, setSquareLogoCropFile] = useState<File | null>(
    null,
  );
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandUploading, setBrandUploading] = useState<
    "square" | "wordmark" | null
  >(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const disabled = saveState === "saving" || brandUploading !== null;
  const initials = form.name.trim().slice(0, 2).toUpperCase() || "ORG";

  async function uploadSquareLogo(file: File) {
    setBrandUploading("square");
    setBrandError(null);
    try {
      const { publicUrl } = await uploadImageViaBackend({
        file,
        kind: "organization-square-logo",
      });
      setForm((current) => ({ ...current, squareLogoUrl: publicUrl }));
      setSquareLogoCropFile(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload square logo.";
      setBrandError(message);
      throw new Error(message);
    } finally {
      setBrandUploading(null);
    }
  }

  async function uploadWordmarkLogo(file: File) {
    setBrandUploading("wordmark");
    setBrandError(null);
    try {
      const { publicUrl } = await uploadImageViaBackend({
        file,
        kind: "organization-wordmark-logo",
      });
      setForm((current) => ({ ...current, wordmarkLogoUrl: publicUrl }));
    } catch (error) {
      setBrandError(
        error instanceof Error ? error.message : "Failed to upload wordmark.",
      );
    } finally {
      setBrandUploading(null);
    }
  }

  async function saveOrganization() {
    setSaveState("saving");
    setSaveError(null);
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail: form.contactEmail.trim() || null,
          description: form.description.trim() || null,
          donationUrl: form.donationUrl.trim() || null,
          name: form.name.trim(),
          squareLogoUrl: form.squareLogoUrl || null,
          website: form.website.trim() || null,
          wordmarkLogoUrl: form.wordmarkLogoUrl || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Failed to update organization.");
      }

      setSaveState("saved");
      router.refresh();
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      setSaveState("idle");
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to update organization.",
      );
    }
  }

  return (
    <div className="space-y-4 border border-foreground bg-background p-4">
      {squareLogoCropFile ? (
        <SquarePhotoCropper
          file={squareLogoCropFile}
          onCancel={() => setSquareLogoCropFile(null)}
          onCrop={uploadSquareLogo}
          outputType="image/webp"
          title="Crop square logo"
          transparentBackground
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
        <div>
          <Label className="text-xs font-black uppercase">Square logo</Label>
          <div className="mt-2 flex h-24 w-24 items-center justify-center overflow-hidden border border-foreground bg-background text-xl font-black uppercase">
            {form.squareLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-full w-full object-cover"
                src={form.squareLogoUrl}
              />
            ) : (
              initials
            )}
          </div>
        </div>

        <div className="space-y-3">
          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setSquareLogoCropFile(file);
              if (squareLogoInputRef.current) {
                squareLogoInputRef.current.value = "";
              }
            }}
            ref={squareLogoInputRef}
            type="file"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              className="border border-foreground bg-background"
              disabled={disabled}
              onClick={() => squareLogoInputRef.current?.click()}
              type="button"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              {brandUploading === "square"
                ? "Uploading..."
                : "Upload square logo"}
            </Button>
            {form.squareLogoUrl ? (
              <Button
                className="border border-foreground bg-background"
                disabled={disabled}
                onClick={() =>
                  setForm((current) => ({ ...current, squareLogoUrl: "" }))
                }
                type="button"
                variant="outline"
              >
                Remove square logo
              </Button>
            ) : null}
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            Square mark for compact UI. Transparent PNG or WebP is ideal.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label className="text-xs font-black uppercase">
          Horizontal wordmark
        </Label>
        <div className="flex min-h-20 items-center justify-center border border-foreground bg-background p-3">
          {form.wordmarkLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="max-h-24 max-w-full object-contain"
              src={form.wordmarkLogoUrl}
            />
          ) : (
            <span className="text-sm font-black uppercase text-muted-foreground">
              No wordmark uploaded
            </span>
          )}
        </div>
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadWordmarkLogo(file);
            if (wordmarkLogoInputRef.current) {
              wordmarkLogoInputRef.current.value = "";
            }
          }}
          ref={wordmarkLogoInputRef}
          type="file"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            className="border border-foreground bg-background"
            disabled={disabled}
            onClick={() => wordmarkLogoInputRef.current?.click()}
            type="button"
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            {brandUploading === "wordmark" ? "Uploading..." : "Upload wordmark"}
          </Button>
          {form.wordmarkLogoUrl ? (
            <Button
              className="border border-foreground bg-background"
              disabled={disabled}
              onClick={() =>
                setForm((current) => ({ ...current, wordmarkLogoUrl: "" }))
              }
              type="button"
              variant="outline"
            >
              Remove wordmark
            </Button>
          ) : null}
        </div>
        <p className="text-xs font-bold text-muted-foreground">
          Wide logo for public partner displays. Transparent PNG or WebP is
          ideal.
        </p>
        {brandError ? (
          <p className="text-xs font-black text-destructive">{brandError}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase">Name</span>
          <Input
            className="border-border bg-background font-bold"
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            value={form.name}
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase">Type</span>
          <Input
            className="border-border bg-background font-bold"
            disabled
            value={organization.type}
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase">Website</span>
          <Input
            className="border-border bg-background font-bold"
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                website: event.target.value,
              }))
            }
            placeholder="https://example.org"
            type="url"
            value={form.website}
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase">
            Contact email
          </span>
          <Input
            className="border-border bg-background font-bold"
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contactEmail: event.target.value,
              }))
            }
            placeholder="hello@example.org"
            type="email"
            value={form.contactEmail}
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase">
            Donation URL
          </span>
          <Input
            className="border-border bg-background font-bold"
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                donationUrl: event.target.value,
              }))
            }
            placeholder="https://example.org/donate"
            type="url"
            value={form.donationUrl}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="block text-xs font-black uppercase">Description</span>
        <Textarea
          className="min-h-28 border-border bg-background font-bold"
          disabled={disabled}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          value={form.description}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background"
          disabled={disabled || !form.name.trim()}
          onClick={() => void saveOrganization()}
          type="button"
        >
          {saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved"
              : "Save organization"}
        </Button>
        {saveError ? (
          <p className="text-sm font-black text-destructive">{saveError}</p>
        ) : null}
      </div>
    </div>
  );
}
