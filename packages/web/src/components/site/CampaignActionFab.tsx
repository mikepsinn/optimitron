"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Clipboard, Plus, Share2, X } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { buildUserReferralUrl } from "@/lib/url";

const HIDDEN_PATH_PREFIXES = [
  "/api",
  "/auth",
  "/dashboard",
  "/survey",
  "/vote",
] as const;

function shouldHideForPath(pathname: string | null) {
  if (!pathname) return true;
  return HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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

export function CampaignActionFab() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const referralUrl = useMemo(
    () => buildUserReferralUrl(session?.user),
    [session?.user],
  );

  if (status !== "authenticated" || shouldHideForPath(pathname)) {
    return null;
  }

  async function copyShareLink() {
    await copyToClipboard(referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const actionButtonClass =
    "group min-h-10 justify-start gap-2 rounded-full bg-background/95 py-1.5 pl-1.5 pr-3 text-xs font-black uppercase tracking-[0.08em] text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-foreground/10 hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-foreground";
  const actionIconClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background group-hover:bg-background group-hover:text-foreground";

  return (
    <>
      {!taskOpen ? (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          {open ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => void copyShareLink()}
                className={actionButtonClass}
              >
                <span className={actionIconClass}>
                  {copied ? (
                    <Check className="h-4 w-4 stroke-[2.5px]" />
                  ) : (
                    <Share2 className="h-4 w-4 stroke-[2.5px]" />
                  )}
                </span>
                {copied ? "Copied" : "Copy share link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTaskOpen(true);
                  setOpen(false);
                }}
                className={actionButtonClass}
              >
                <span className={actionIconClass}>
                  <Clipboard className="h-4 w-4 stroke-[2.5px]" />
                </span>
                Create task
              </Button>
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            aria-expanded={open}
            aria-label={
              open ? "Close campaign actions" : "Open campaign actions"
            }
            onClick={() => setOpen((value) => !value)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground p-0 text-background shadow-[0_10px_28px_rgba(0,0,0,0.22)] ring-1 ring-background/80 hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
          >
            {open ? (
              <X className="h-6 w-6 stroke-[2.5px]" />
            ) : (
              <Plus className="h-6 w-6 stroke-[2.5px]" />
            )}
          </Button>
        </div>
      ) : null}

      <CreateTaskDialog
        currentPersonId={session.user.personId}
        open={taskOpen}
        onOpenChange={setTaskOpen}
      />
    </>
  );
}
