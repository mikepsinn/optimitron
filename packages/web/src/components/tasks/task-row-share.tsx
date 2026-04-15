"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildTaskUrl } from "@/lib/url";

export function TaskRowShare({
  baseUrl,
  shareText,
  taskId,
}: {
  baseUrl?: string;
  shareText: string;
  taskId: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const requestOrigin = useRequestSiteOrigin();
  const referralId = getUsernameOrReferralCode(session?.user);
  const taskUrl = useMemo(
    () => buildTaskUrl(taskId, baseUrl ?? requestOrigin, referralId),
    [baseUrl, requestOrigin, taskId, referralId],
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
    <div ref={ref} className={open ? "relative z-[120]" : "relative"}>
      <button
        type="button"
        className="inline-flex items-center justify-center border-2 border-foreground bg-brutal-pink px-3 py-1 text-xs font-black uppercase tracking-wide text-brutal-pink-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        onClick={() => setOpen((v) => !v)}
      >
        Remind
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-[130] mt-1 border-2 border-foreground bg-background p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ShareLinkButtons
            shareText={shareText}
            url={taskUrl}
            variant="icon"
            verb="remind"
          />
        </div>
      ) : null}
    </div>
  );
}
