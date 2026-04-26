import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ink = "#23180d";
const mutedInk = "#5e513f";
const paper = "#fbf7ee";
const paperRule = "#d8c7a4";

export const treatyPrimaryButtonClass =
  "min-h-12 justify-center gap-3 border border-[#23180d] bg-[#23180d] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#fffaf0] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#3a2a19] active:translate-x-0 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

export const treatySecondaryButtonClass =
  "min-h-12 justify-center gap-3 border border-[#23180d] bg-transparent px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#23180d] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf] active:translate-x-0 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

export const treatyInputClass =
  "border border-[#23180d] bg-[#fffdf8] text-[#23180d] shadow-none [font-family:var(--v0-font-libre-baskerville)] placeholder:text-[#5e513f]/55 focus-visible:outline-[#23180d]";

export const treatyTextareaClass =
  "border border-[#23180d] bg-[#fffdf8] text-[#23180d] shadow-none focus-visible:outline-[#23180d]";

interface TreatyFlowShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  "data-testid"?: string;
}

export function TreatyFlowShell({
  children,
  className,
  contentClassName,
  "data-testid": dataTestId,
}: TreatyFlowShellProps) {
  return (
    <section
      data-testid={dataTestId}
      className={cn(
        "relative isolate z-[60] mx-auto flex min-h-screen min-h-[100dvh] w-full overflow-hidden bg-[#fbf7ee] px-4 py-6 text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:px-8 sm:py-10",
        className,
      )}
      style={{ color: ink, backgroundColor: paper }}
    >
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center space-y-8 py-10 sm:py-12",
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
        "text-lg font-bold leading-8 text-[#2f2417] sm:text-xl sm:leading-9",
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
    <p className="text-center text-xs font-black uppercase tracking-[0.32em] text-[#5e513f]">
      {children}
    </p>
  );
}

export function TreatyFlowDivider() {
  return <div className="mx-auto h-px w-24 bg-[#23180d]/30" />;
}

export const treatyMutedTextClass = "text-[#5e513f]";
export const treatyInk = ink;
export const treatyMutedInk = mutedInk;
export const treatyPaperRule = paperRule;
