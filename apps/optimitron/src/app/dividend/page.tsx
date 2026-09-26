import Link from "next/link";
import { getOptimizationDividendSummary } from "@/lib/analysis-products";
import { getRouteMetadata } from "@/lib/metadata";
import { dividendLink, ROUTES } from "@/lib/routes";

export const metadata = getRouteMetadata(dividendLink);

export default function DividendPage() {
  const summary = getOptimizationDividendSummary();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Optimization dividend</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">What would it take to fund a dividend?</h1>
      </header>

      <nav className="grid gap-4 sm:grid-cols-2" aria-label="Explore the evidence">
        <LinkCard href={ROUTES.obg} title="Compare national spending" description="Healthcare, education, research and other spending across countries." />
        <LinkCard href={ROUTES.opg} title="Explore policy proposals" description="Proposed changes to healthcare, education, housing and drug policy." />
      </nav>

      {summary === null && (
        <section className="mt-8 border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black text-foreground">A dividend estimate is not yet available</h2>
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            We have not yet estimated the public savings or costs of specific reforms.
            Country spending differences alone are not a dividend estimate.
          </p>
        </section>
      )}
    </div>
  );
}

function LinkCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-lg font-black text-foreground">{title}</p>
      <p className="mt-2 text-sm font-bold text-muted-foreground">{description}</p>
    </Link>
  );
}
