"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { EXPECTED_VALUE_METHODOLOGY_MARKDOWN } from "@optimitron/data/parameters";
import { Dialog } from "@/components/retroui/Dialog";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { methodologyLink } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * The "why is this number what it is" affordance for expected-value figures,
 * deliberately shaped like {@link ParameterValue}: dotted underline, help
 * cursor, same dialog shell. A reader who has learned that a dotted number
 * opens its provenance gets the same answer here.
 *
 * It renders the same markdown the /methodology page does, so the popup and
 * the page cannot disagree — and both are generated from the parameter
 * catalog, so neither can drift from the numbers they describe.
 */
export function ExpectedValueExplainer({
  children,
  className,
}: {
  /** The label to make clickable. Defaults to a bare "?" pill. */
  children?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="How expected value is calculated"
          className={cn(
            children
              ? "cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-2 inline text-left"
              : "cursor-help inline-flex h-4 w-4 items-center justify-center border border-foreground/40 text-[10px] font-black leading-none text-muted-foreground hover:border-foreground hover:text-foreground",
            className,
          )}
        >
          {children ?? "?"}
        </button>
      </Dialog.Trigger>
      <Dialog.Content
        aria-describedby={undefined}
        size="screen"
        className="!w-[95vw] !max-w-[900px] max-h-[90vh] !grid-cols-[minmax(0,1fr)] overflow-hidden border-2 border-foreground bg-background shadow-none"
      >
        <div className="flex min-w-0 items-start justify-between gap-4 border-b-2 border-foreground bg-foreground px-4 py-3 text-background">
          <h2 className="min-w-0 flex-1 break-words text-base font-black uppercase leading-tight">
            How we put a number on a task
          </h2>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="shrink-0 border-2 border-background p-1 hover:bg-background/10"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>
        <div className="min-w-0 max-h-[calc(90vh-56px)] overflow-auto p-4">
          {/* The markdown opens with its own h1 restating the dialog title. */}
          <RichMarkdown
            markdown={stripLeadingHeading(EXPECTED_VALUE_METHODOLOGY_MARKDOWN)}
          />
          <p className="mt-6 border-t border-foreground pt-4 text-sm">
            <a
              className="font-bold underline underline-offset-4"
              href={methodologyLink.href}
            >
              Open this as a full page
            </a>
          </p>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

function stripLeadingHeading(markdown: string) {
  return markdown.replace(/^#\s.*\n+/, "");
}
