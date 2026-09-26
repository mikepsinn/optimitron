import Link from "next/link";
import {
  LandingSection,
  landingButtonClass,
  landingLinkClass,
} from "@/components/optimitron-landing/LandingSection";
import {
  ROUTES,
  githubLink,
  optimalBudgetGeneratorPaperLink,
  optimalPolicyGeneratorPaperLink,
  parametersPaperLink,
} from "@/lib/routes";

export function OptimitronLandingPage() {
  return (
    <div className="pb-8">
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-12 sm:px-6 sm:pt-16">
        <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          Compare policies. Put budgets in context.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          Explore policy evidence and compare government spending with health and
          income outcomes. Inspect the sources and assumptions behind each proposal.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <article>
            <h2 className="text-2xl font-black">Optimal Policy Generator</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
              Compare policy proposals, cross-country observations, and the
              evidence available to support them.
            </p>
            <Link className={`${landingButtonClass} mt-5`} href={ROUTES.opg}>
              Compare policies
            </Link>
          </article>
          <article>
            <h2 className="text-2xl font-black">Optimal Budget Generator</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
              Inspect national spending, reported outcomes, and current federal
              allocations.
            </p>
            <Link className={`${landingButtonClass} mt-5`} href={ROUTES.obg}>
              Compare budgets
            </Link>
          </article>
        </div>
      </section>

      <LandingSection id="evidence" title="Evidence you can inspect" className="scroll-mt-28">
        <p className="max-w-3xl leading-7 text-muted-foreground">
          A country spending less while reporting better outcomes gives us a
          comparison to investigate. It does not establish that copying its
          spending will produce the same result. Keep observed differences,
          assumptions, and proposed changes separate.
        </p>
        <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {[
            [optimalPolicyGeneratorPaperLink.href, "Policy research"],
            [optimalBudgetGeneratorPaperLink.href, "Budget research"],
            [parametersPaperLink.href, "Parameters and calculations"],
            [githubLink.href, "Source code and datasets"],
          ].map(([href, label]) => (
            <li key={href}>
              <a className={landingLinkClass} href={href}>{label}</a>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          <Link className={landingLinkClass} href={ROUTES.governments}>Government comparisons</Link>
          <Link className={landingLinkClass} href={ROUTES.legislation}>Legislative proposals</Link>
        </div>
      </LandingSection>
    </div>
  );
}
