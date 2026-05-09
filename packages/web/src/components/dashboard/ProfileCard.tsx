"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import { Check, Copy, ExternalLink, Globe, Upload } from "lucide-react";
import { PrivacyToggle } from "@/components/dashboard/PrivacyToggle";
import { OrganizationSelector } from "@/components/dashboard/OrganizationSelector";
import { SquarePhotoCropper } from "@/components/people/SquarePhotoCropper";
import { uploadImageViaBackend } from "@/lib/image-upload.client";
import { getUserPersonHref } from "@/lib/person-href";
import type { DashboardUser } from "@/types/dashboard";
import Link from "next/link";

interface ProfileCardProps {
  user: DashboardUser;
  onUserChange: (user: DashboardUser) => void;
  onRefresh: () => void;
}

export function ProfileCard({
  user,
  onUserChange,
  onRefresh,
}: ProfileCardProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: user.name,
    bio: user.bio,
    isPublic: user.isPublic,
    website: user.website || "",
    headline: user.headline || "",
    image: user.image || "",
    coverImage: user.coverImage || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditForm({
      name: user.name,
      bio: user.bio,
      isPublic: user.isPublic,
      website: user.website || "",
      headline: user.headline || "",
      image: user.image || "",
      coverImage: user.coverImage || "",
    });
  }, [user]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicProfileHref = getUserPersonHref(user);
  const publicProfileUrl =
    origin && publicProfileHref ? `${origin}${publicProfileHref}` : null;
  const isBusy = isSaving || avatarUploading || avatarCropFile !== null;

  const handleCopyUrl = () => {
    if (!publicProfileUrl) return;
    navigator.clipboard.writeText(publicProfileUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const saveProfile = async () => {
    if (avatarUploading || avatarCropFile) return;

    try {
      setIsSaving(true);
      setFormError(null);
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          bio: editForm.bio,
          isPublic: editForm.isPublic,
          website: editForm.website || null,
          headline: editForm.headline || null,
          image: editForm.image || null,
          coverImage: editForm.coverImage || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text || "Failed to update profile";
        if (text) {
          try {
            const data = JSON.parse(text) as { error?: unknown };
            if (typeof data.error === "string" && data.error.trim()) {
              message = data.error;
            }
          } catch {
            message = text;
          }
        }
        throw new Error(message);
      }

      onUserChange({
        ...user,
        name: editForm.name,
        bio: editForm.bio,
        isPublic: editForm.isPublic,
        website: editForm.website || null,
        headline: editForm.headline || null,
        image: editForm.image || null,
        person: user.person
          ? {
              ...user.person,
              bio: editForm.bio,
              coverImage: editForm.coverImage || null,
              displayName: editForm.name,
              headline: editForm.headline || null,
              image: editForm.image || null,
              isPublic: editForm.isPublic,
              website: editForm.website || null,
            }
          : user.person,
        coverImage: editForm.coverImage || null,
      });

      onRefresh();
    } catch (error) {
      console.error("Failed to update profile:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const { publicUrl } = await uploadImageViaBackend({
        file,
        kind: "person-photo",
      });
      setEditForm((current) => ({ ...current, image: publicUrl }));
      setAvatarCropFile(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload photo.";
      setAvatarError(message);
      throw new Error(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <Card className="border-4 border-primary">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase">
          YOUR PROFILE
        </Card.Title>
        <Card.Description className="font-bold">
          Your public record on this planet.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-6">
        {avatarCropFile ? (
          <SquarePhotoCropper
            file={avatarCropFile}
            onCancel={() => setAvatarCropFile(null)}
            onCrop={uploadAvatar}
            title="Crop photo"
          />
        ) : null}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-bold uppercase">Profile photo</Label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden border border-foreground bg-background text-xl font-black uppercase">
                {editForm.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${editForm.name || user.email || "User"} profile photo`}
                    className="h-full w-full object-cover"
                    src={editForm.image}
                  />
                ) : (
                  (editForm.name || user.email || "?").slice(0, 2)
                )}
              </div>
              <div className="space-y-2">
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setAvatarCropFile(file);
                    if (avatarInputRef.current) {
                      avatarInputRef.current.value = "";
                    }
                  }}
                  ref={avatarInputRef}
                  type="file"
                />
                <Button
                  className="border border-foreground bg-background"
                  disabled={isBusy}
                  onClick={() => avatarInputRef.current?.click()}
                  type="button"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {avatarUploading ? "Uploading..." : "Upload photo"}
                </Button>
                {avatarError ? (
                  <p className="text-xs font-bold text-destructive">
                    {avatarError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Name</Label>
            <Input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="border-4 border-primary bg-background"
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Bio</Label>
            <Textarea
              value={editForm.bio}
              onChange={(e) =>
                setEditForm({ ...editForm, bio: e.target.value })
              }
              className="border-4 border-primary bg-background"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">
              Professional Headline
            </Label>
            <Input
              value={editForm.headline}
              onChange={(e) =>
                setEditForm({ ...editForm, headline: e.target.value })
              }
              className="border-4 border-primary bg-background"
              placeholder="Concerned citizen | Spreadsheet appreciator"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Short professional tagline (shown on your profile)
            </p>
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Website</Label>
            <Input
              value={editForm.website}
              onChange={(e) =>
                setEditForm({ ...editForm, website: e.target.value })
              }
              className="border-4 border-primary bg-background"
              placeholder="https://yourwebsite.com"
              type="url"
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">
              Cover Image URL
            </Label>
            <Input
              value={editForm.coverImage}
              onChange={(e) =>
                setEditForm({ ...editForm, coverImage: e.target.value })
              }
              className="border-4 border-primary bg-background"
              placeholder="https://example.com/cover.jpg"
              type="url"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Profile banner image (recommended: 1500x500px)
            </p>
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Organization</Label>
            <OrganizationSelector
              value={null}
              onSelect={(_orgId, _orgName) => {
                // Organization membership handled via API
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Search or create your organization
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-bold uppercase mb-2 block">
            Privacy Settings
          </Label>
          <PrivacyToggle
            isPublic={editForm.isPublic}
            onChange={(value) => setEditForm({ ...editForm, isPublic: value })}
          />

          {editForm.isPublic && publicProfileHref && publicProfileUrl && (
            <div className="mt-4 p-4 bg-muted/30 border-4 border-primary border-dashed rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public Profile URL
                </Label>
                <Link
                  href={publicProfileHref}
                  target="_blank"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={publicProfileUrl}
                  className="bg-background border-4 border-primary h-9 font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="border-4 border-primary shrink-0 w-24"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t-2 border-primary">
          <Button
            onClick={saveProfile}
            disabled={isBusy}
            className="border-4 border-primary bg-foreground w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Update Profile"}
          </Button>
        </div>

        {formError && (
          <p className="text-sm font-bold text-destructive">{formError}</p>
        )}
      </Card.Content>
    </Card>
  );
}
