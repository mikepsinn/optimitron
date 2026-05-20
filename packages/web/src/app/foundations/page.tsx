import { NUCLEAR_WINTER_OVERKILL_FACTOR } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { getRouteMetadata } from "@/lib/metadata";
import { foundationsLink } from "@/lib/routes";

export const metadata = getRouteMetadata(foundationsLink);

export default function FoundationsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="border-2 border-foreground bg-background p-5 sm:p-8">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
            BUY THE T-SHIRT THAT ENDED WAR AND DISEASE.
          </h1>
          <p className="mt-6 text-lg font-bold leading-8 sm:text-xl sm:leading-9">
            If 1 billion humans wear this shirt on the same day — Earth
            Optimization Day, August 6 — humanity is forced to discuss the fact
            that it currently maintains sufficient mass-murder capacity to cause{" "}
            <ParameterValue
              className="font-black"
              param={NUCLEAR_WINTER_OVERKILL_FACTOR}
            />{" "}
            apocalypses, and that it has the option to sacrifice one of these
            apocalypses for disease eradication within our lifetime.
          </p>
        </section>

        <section className="mt-8 border-2 border-foreground bg-background p-5 sm:p-8">
          <h2 className="text-2xl font-black uppercase leading-tight sm:text-3xl">
            THE FULL CASE IS IN PROGRESS.
          </h2>
          <p className="mt-4 text-base font-bold leading-7 sm:text-lg sm:leading-8">
            Coming on this page: the formal cost-benefit proof, the comparative
            table versus alternative uses, the assurance-contract mechanism for
            foundations that want to commit without first-mover risk, and the
            response to the obvious objection that this sounds insane.
          </p>
        </section>
      </div>
    </main>
  );
}
