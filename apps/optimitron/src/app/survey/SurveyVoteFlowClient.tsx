"use client";

import dynamic from "next/dynamic";
import type { TreatyVoteFlowProps } from "@/components/landing/TreatyVoteFlow";
import { ROUTES } from "@/lib/routes";

const ClientOnlyTreatyVoteFlow = dynamic<TreatyVoteFlowProps>(
  () =>
    import("./SurveyVoteFlowContent").then((mod) => mod.SurveyVoteFlowContent),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[320px] items-center justify-center px-4 text-center text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink-muted)]"
        data-visual-state="animating"
      >
        Loading survey
      </div>
    ),
  },
);

export function SurveyVoteFlowClient(props: TreatyVoteFlowProps) {
  return (
    <div className="relative min-h-screen pb-10">
      <ClientOnlyTreatyVoteFlow {...props} />
      <nav
        aria-label="Survey legal links"
        className="fixed inset-x-0 bottom-2 z-20 flex justify-center px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--treaty-ink-muted)]"
      >
        <div className="bg-[var(--treaty-paper)]/95 px-2 py-1">
          <span>IC2EWD survey</span>
          <span aria-hidden="true"> · </span>
          <a
            className="text-[var(--treaty-ink)] underline underline-offset-2"
            href={ROUTES.privacy}
            rel="noreferrer"
            target="_blank"
          >
            Privacy
          </a>
          <span aria-hidden="true"> · </span>
          <a
            className="text-[var(--treaty-ink)] underline underline-offset-2"
            href={ROUTES.terms}
            rel="noreferrer"
            target="_blank"
          >
            Terms
          </a>
        </div>
      </nav>
    </div>
  );
}
