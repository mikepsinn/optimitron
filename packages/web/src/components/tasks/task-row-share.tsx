"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FaShareNodes } from "react-icons/fa6";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { buildTaskUrl, getBaseUrl } from "@/lib/url";

export function TaskRowShare({
  shareText,
  taskId,
}: {
  shareText: string;
  taskId: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const referralId = getUsernameOrReferralCode(session?.user);
  const taskUrl = useMemo(
    () => buildTaskUrl(taskId, getBaseUrl(), referralId),
    [taskId, referralId],
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Share"
        className="inline-flex h-7 w-7 items-center justify-center border-2 border-foreground bg-background text-foreground transition-transform hover:translate-y-[-1px] hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
      >
        <FaShareNodes className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 border-2 border-foreground bg-background p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ShareLinkButtons
            shareText={shareText}
            url={taskUrl}
            variant="icon"
          />
        </div>
      ) : null}
    </div>
  );
}
