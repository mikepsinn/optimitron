import Link from "next/link";
import { OptimalBudgetGenerator } from "@/components/budget/OptimalBudgetGenerator";
import { getOptimalBudgetReport } from "@/lib/optimal-budget-generator";
import { getRouteMetadata } from "@/lib/metadata";
import { obgLink, optimalBudgetGeneratorPaperLink, ROUTES } from "@/lib/routes";

const report = getOptimalBudgetReport();
const title = "The Optimal Budget Generator";
const description = `We've compared ${report.period.length} years of healthcare data from ${report.healthcare.countries.length} countries and other public spending from ${report.countryCount} countries to build a budget with one goal: maximize median health and wealth.`;

export const metadata = getRouteMetadata({ ...obgLink, label: title, description });

export default function BudgetPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">{description}</p>
      </header>
      <OptimalBudgetGenerator report={report} />
      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold" aria-label="Related analysis">
        <Link href={ROUTES.opg} className="underline underline-offset-4">Optimal policies</Link>
        <a href={optimalBudgetGeneratorPaperLink.href} className="underline underline-offset-4">Read the OBG research protocol ↗</a>
      </nav>
    </div>
  );
}
