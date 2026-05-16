import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 py-16 text-center sm:py-20">
        <div className="w-full border-b border-foreground pb-8">
          <h1 className="text-[7rem] font-black uppercase leading-none tracking-normal sm:text-[10rem] md:text-[14rem]">
            404
          </h1>
        </div>

        <section className="w-full border border-foreground bg-background p-6 text-left sm:p-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <p className="text-xl font-black uppercase sm:text-2xl">
              Page Not Found
            </p>
            <p className="text-lg font-bold leading-relaxed">
              Fascinating. You&apos;ve managed to navigate to a page that
              doesn&apos;t exist. On my planet, our routing infrastructure
              hasn&apos;t lost a page in 4,237 years. You lot can&apos;t even
              keep track of a URL.
            </p>
          </div>
        </section>

        <section className="w-full border border-foreground bg-background p-5 text-left sm:p-6">
          <div className="mx-auto max-w-2xl space-y-3">
            <p className="text-base font-black uppercase">
              Wishonia Diagnostic Report
            </p>
            <ul className="space-y-2 text-base font-bold leading-relaxed">
              <li>
                <span className="font-black">Problem:</span> Page not found
              </li>
              <li>
                <span className="font-black">Severity:</span> Mildly
                embarrassing
              </li>
              <li>
                <span className="font-black">Root cause:</span> Human error
                (probability: 97.3%)
              </li>
              <li>
                <span className="font-black">Recommended action:</span> Click a
                button that actually goes somewhere
              </li>
              <li>
                <span className="font-black">Time to resolve on my planet:</span>{" "}
                0.003 seconds
              </li>
              <li>
                <span className="font-black">Estimated time on yours:</span>{" "}
                Unclear. You still haven&apos;t fixed healthcare.
              </li>
            </ul>
          </div>
        </section>

        <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 flex-1 items-center justify-center border border-foreground bg-foreground px-5 py-2 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
          >
            Return to Earth
          </Link>
          <Link
            href="/scoreboard"
            className="inline-flex min-h-11 flex-1 items-center justify-center border border-foreground bg-background px-5 py-2 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            View Scoreboard
          </Link>
        </div>

        <p className="max-w-lg text-base font-bold leading-relaxed text-muted-foreground">
          &ldquo;It&apos;s almost impressive how a species that put people on
          the moon regularly types URLs wrong.&rdquo;
          <br />
          <span className="text-sm">
            — Wishonia, mildly disappointed (as usual)
          </span>
        </p>
      </div>
    </main>
  );
}
