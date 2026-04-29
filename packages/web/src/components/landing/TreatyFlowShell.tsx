import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ink = "var(--treaty-ink)";
const mutedInk = "var(--treaty-ink-muted)";
const paper = "var(--treaty-paper)";
const paperRule = "#d8c7a4";

export const treatyPrimaryButtonClass =
  "min-h-12 justify-center gap-3 border border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#fffaf0] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#3a2a19] active:translate-x-0 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

export const treatySecondaryButtonClass =
  "min-h-12 justify-center gap-3 border border-[var(--treaty-ink)] bg-transparent px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf] active:translate-x-0 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

export const treatyInputClass =
  "border border-[var(--treaty-ink)] bg-[#fffdf8] text-[var(--treaty-ink)] shadow-none [font-family:var(--v0-font-libre-baskerville)] placeholder:text-[var(--treaty-ink-muted)]/55 focus-visible:outline-[var(--treaty-ink)]";

export const treatyTextareaClass =
  "border border-[var(--treaty-ink)] bg-[#fffdf8] text-[var(--treaty-ink)] shadow-none focus-visible:outline-[var(--treaty-ink)]";

interface TreatyFlowShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  "data-screen"?: string;
  "data-testid"?: string;
}

export function TreatyFlowShell({
  children,
  className,
  contentClassName,
  "data-screen": dataScreen,
  "data-testid": dataTestId,
}: TreatyFlowShellProps) {
  return (
    <section
      data-screen={dataScreen}
      data-testid={dataTestId}
      className={cn(
        "relative isolate z-[60] mx-auto flex min-h-screen min-h-[100dvh] w-full overflow-hidden bg-[var(--treaty-paper)] px-4 py-6 text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:px-8 sm:py-10",
        className,
      )}
      style={{ color: ink, backgroundColor: paper }}
    >
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center space-y-10 py-10 sm:py-12",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function TreatyFlowParagraph({
  children,
  className,
  dropCap = false,
  center = false,
}: {
  children: ReactNode;
  className?: string;
  dropCap?: boolean;
  center?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-xl font-bold leading-9 text-[var(--treaty-ink-soft)] sm:text-2xl sm:leading-10",
        center ? "text-center" : "text-center sm:text-left",
        dropCap && !center ? "sm:drop-cap-deep" : "",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function TreatyFlowButtonRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 [&>*:only-child]:sm:col-span-2">
      {children}
    </div>
  );
}

export function TreatyFlowEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-xs font-black uppercase tracking-[0.32em] text-[var(--treaty-ink-muted)]">
      {children}
    </p>
  );
}

export function TreatyFlowDivider() {
  return <div className="mx-auto h-px w-24 bg-[var(--treaty-ink)]/30" />;
}

export const treatyMutedTextClass = "text-[var(--treaty-ink-muted)]";
export const treatyInk = ink;
export const treatyMutedInk = mutedInk;
export const treatyPaperRule = paperRule;
