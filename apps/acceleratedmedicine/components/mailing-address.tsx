"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { copyTextToClipboard } from "@optimitron/site-kit/lib/clipboard";
import { NONPROFIT, formatNonprofitAddress } from "@optimitron/site-kit/lib/nonprofit-identity";

export function MailingAddress({ showRecipient = true }: { showRecipient?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const address = formatNonprofitAddress();

  async function copy() {
    try {
      await copyTextToClipboard(`${NONPROFIT.legalName}\n${address}`);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <address className="space-y-1 font-bold not-italic">
        {showRecipient && <p>{NONPROFIT.legalName}</p>}
        <p>{address}</p>
      </address>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={copy}>
        {status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {status === "copied" ? "Copied" : "Copy address"}
      </Button>
      {status === "error" && <p role="status" className="mt-2 text-sm">Could not copy. Select the address instead.</p>}
    </div>
  );
}
