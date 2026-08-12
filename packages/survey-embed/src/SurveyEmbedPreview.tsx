export type SurveyQuestionPreviewProps = {
  actionLabel?: string;
  actionHref?: string;
};

export function SurveyQuestionPreview({
  actionLabel = "Submit",
  actionHref,
}: SurveyQuestionPreviewProps = {}) {
  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-10 text-center text-4xl font-black uppercase sm:text-6xl">
        THE <span className="text-brutal-pink">QUESTION</span>
      </h2>
      <div className="mx-auto max-w-3xl border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:p-12">
        <p className="mb-8 text-center text-lg font-bold leading-snug sm:text-2xl">
          Adjust slider to show how you&apos;d split your country&apos;s finite
          resources between the{" "}
          <span className="text-brutal-pink">weapons and military</span> vs{" "}
          <span className="text-brutal-pink underline decoration-dotted underline-offset-2">
            pragmatic clinical trials
          </span>{" "}
          to cure diseases.
        </p>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex-1 text-center">
            <div className="mb-2 text-4xl font-black text-brutal-pink sm:text-5xl">
              50%
            </div>
            <div className="text-sm font-bold uppercase sm:text-base">
              Military &amp; Weapons
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow px-3 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:text-base">
            VS
          </div>
          <div className="flex-1 text-center">
            <div className="mb-2 text-4xl font-black text-brutal-cyan sm:text-5xl">
              50%
            </div>
            <div className="text-sm font-bold uppercase sm:text-base">
              Clinical Trials
            </div>
          </div>
        </div>
        <div className="relative mb-16 h-4 border-4 border-primary bg-[linear-gradient(to_right,#FF6B9D_0%,#FF6B9D_49%,#FFE66D_49%,#FFE66D_51%,#00D9FF_51%,#00D9FF_100%)]">
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 border-4 border-primary bg-foreground" />
        </div>
        {actionHref ? (
          <a
            href={actionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-16 items-center justify-center border-4 border-primary bg-brutal-cyan text-xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            {actionLabel}
          </a>
        ) : (
          <div className="flex h-16 items-center justify-center border-4 border-primary bg-brutal-cyan text-xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {actionLabel}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Deterministic first-state preview for full-page visual capture.
 * Chromium omits cross-origin iframe pixels from some full-page screenshots.
 */
export function SurveyEmbedPreview() {
  return (
    <section
      id="vote"
      className="border-y-4 border-primary bg-brutal-yellow px-4 py-16 sm:px-8"
    >
      <SurveyQuestionPreview />
    </section>
  );
}
