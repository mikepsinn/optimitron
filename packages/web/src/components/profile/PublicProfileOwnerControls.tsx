"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { PrivacyToggle } from "@/components/dashboard/PrivacyToggle";
import { defaultButtonClassName } from "@/components/ui/default-button";
import { ROUTES } from "@/lib/routes";

interface PublicProfileOwnerControlsProps {
  initialIsPublic: boolean;
  publicProfileHref: string;
  publicProfileUrl: string;
}

export function PublicProfileOwnerControls({
  initialIsPublic,
  publicProfileHref,
  publicProfileUrl,
}: PublicProfileOwnerControlsProps) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isSaving || isPending;

  async function updateVisibility(nextIsPublic: boolean) {
    setError(null);
    setIsSaving(true);

    let response: Response;
    try {
      response = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
    } catch {
      setIsSaving(false);
      setError("Profile visibility did not update. Try again.");
      return;
    }

    if (!response.ok) {
      setIsSaving(false);
      setError("Profile visibility did not update. Try again.");
      return;
    }

    setIsPublic(nextIsPublic);
    setIsSaving(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="mb-6 border-2 border-foreground bg-background p-4 text-foreground sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.8fr)] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Your public to-do list
          </p>
          <p className="mt-2 text-base font-black text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:text-lg">
            This is how other humans help you figure out the most valuable action you can take to maximize humanity's median income and healthy life expectancy. Make it public to get help from your network and the world, or keep it private if you prefer. You can change this anytime.
          </p>

          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              Public Profile URL
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <p className="min-h-12 break-all border border-foreground bg-background px-3 py-3 text-sm font-bold">
                {publicProfileUrl}
              </p>
              <CopyLinkButton
                className="min-h-12 justify-center rounded-none border border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-foreground hover:text-background hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none"
                copiedLabel="Copied"
                idleLabel="Copy"
                url={publicProfileUrl}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className={`${defaultButtonClassName} min-h-10 px-4 py-2 text-xs`}
              href={publicProfileHref}
            >
              View Profile
            </Link>
            <Link
              className={`${defaultButtonClassName} min-h-10 px-4 py-2 text-xs`}
              href={ROUTES.profile}
            >
              Edit Profile
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Privacy Settings
          </p>
          <PrivacyToggle
            disabled={isBusy}
            isPublic={isPublic}
            onChange={(value) => void updateVisibility(value)}
          />
          {error ? (
            <p className="mt-2 text-sm font-bold text-red-700">{error}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
