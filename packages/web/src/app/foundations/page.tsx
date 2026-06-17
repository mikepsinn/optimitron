import Link from "next/link";
import type { ReactNode } from "react";
import {
  BED_NETS_COST_PER_DALY,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_VS_BED_NETS_MULTIPLIER,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TaskFundingPledgeForm } from "@/components/task-funding/TaskFundingPledgeForm";
import { TaskFundingProgress } from "@/components/task-funding/TaskFundingProgress";
import { getCurrentUser } from "@/lib/auth-utils";
import { getRouteMetadata } from "@/lib/metadata";
import { getManageableOrganizationsForUser } from "@/lib/organization.server";
import { foundationsLink, getSignInPath, ROUTES } from "@/lib/routes";
import { listTasks } from "@/lib/tasks.server";
import { END_WAR_AND_DISEASE_TASK_ID } from "@/lib/tasks/task-keys";
import { getTaskFundingStatus } from "@/lib/task-funding/status.server";
import type { TaskFundingStatus } from "@/lib/task-funding/status.server";

export const metadata = getRouteMetadata(foundationsLink);

const usdCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const multiple = (value: number) =>
  `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)}×`;

const percent = (value: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value * 100,
  )}%`;

type MechanismRow = {
  id: string;
  title: string;
  blurb: string;
  href: string;
  funding: TaskFundingStatus | null;
  expectedValueUsd: number | null;
  successProbability: number | null;
  costUsd: number | null;
  valuePerDollar: number | null;
};

function firstLine(description: string | null | undefined): string {
  if (!description) return "";
  const line = description.split("\n").find((l) => l.trim().length > 0) ?? "";
  return line.trim();
}

function getTaskHref(task: Awaited<ReturnType<typeof listTasks>>[number]) {
  const endpoint =
    task.communicationEndpoints.find((entry) => entry.isPrimary) ??
    task.communicationEndpoints[0] ??
    null;

  return (
    endpoint?.url ??
    (endpoint?.email ? `mailto:${endpoint.email}` : `/tasks/${task.id}`)
  );
}

async function loadMechanismRows(): Promise<MechanismRow[]> {
  const tasks = await listTasks({ visibility: "public" });
  const mechanisms = tasks.filter(
    (task) => task.parentTaskId === END_WAR_AND_DISEASE_TASK_ID,
  );

  const rows = await Promise.all(
    mechanisms.map(async (task): Promise<MechanismRow> => {
      let funding: TaskFundingStatus | null = null;
      try {
        funding = await getTaskFundingStatus(task.id);
      } catch {
        // No funding target — mechanism is shown but not yet open for pledges.
        funding = null;
      }
      const frame = task.impact.selectedFrame;
      const expectedValueUsd = frame?.expectedEconomicValueUsdBase ?? null;
      const successProbability = frame?.successProbabilityBase ?? null;
      const costUsd = funding ? Number(funding.targetUsdCents) / 100 : null;
      const valuePerDollar =
        expectedValueUsd != null && costUsd != null && costUsd > 0
          ? expectedValueUsd / costUsd
          : null;
      return {
        id: task.id,
        title: task.title,
        blurb: firstLine(task.description),
        href: getTaskHref(task),
        funding,
        expectedValueUsd,
        successProbability,
        costUsd,
        valuePerDollar,
      };
    }),
  );

  // Highest expected value per donated dollar first. Mechanisms without a
  // funding target (the Earth Optimization Prize is a refundable assurance
  // contract, so it has no net cost) sort to the bottom of the ranked list.
  return rows.sort(
    (a, b) =>
      (b.valuePerDollar ?? -Infinity) - (a.valuePerDollar ?? -Infinity),
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-black uppercase leading-tight sm:text-3xl">
      {children}
    </h2>
  );
}

function Cell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`border-r-2 border-foreground px-3 py-4 align-top ${className}`}
    >
      {children}
    </td>
  );
}

export default async function FoundationsPage() {
  const [rows, user] = await Promise.all([loadMechanismRows(), getCurrentUser()]);
  const manageableOrganizations = user
    ? await getManageableOrganizationsForUser(user.id)
    : [];
  const [pledgeOrganization = null] = manageableOrganizations;
  const fundable = rows.filter(
    (row): row is MechanismRow & { funding: TaskFundingStatus } =>
      row.funding != null,
  );

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="border-2 border-foreground bg-background p-5 sm:p-8">
          <h1 className="text-3xl font-black uppercase leading-none sm:text-6xl">
            The most cost-effective philanthropy on Earth.
          </h1>
          <p className="mt-6 text-lg font-bold leading-8 sm:text-xl sm:leading-9">
            Ending war and disease costs about{" "}
            <ParameterValue
              className="font-black"
              param={TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG}
              display="withUnit"
            />{" "}
            through the leading mechanism — roughly{" "}
            <ParameterValue
              className="font-black"
              param={TREATY_VS_BED_NETS_MULTIPLIER}
              valueOverride={`${new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 0,
              }).format(
                Math.round(TREATY_VS_BED_NETS_MULTIPLIER.value / 100) * 100,
              )}×`}
            />{" "}
            a bed net. Below is every way to fund it, ranked by expected value
            per dollar. Pick one, or fund the whole portfolio.
          </p>
        </section>

        <section className="mt-8 border-2 border-foreground bg-background p-5 sm:p-8">
          <SectionHeading>Every mechanism, ranked by value per dollar</SectionHeading>
          <p className="mt-3 text-base font-bold leading-7 sm:text-lg">
            Expected value is the annual peace dividend if the mechanism works,
            weighted by the odds it works. Cost is what a funder would put in.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm font-bold leading-6">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="border-r-2 border-foreground px-3 py-3 align-bottom text-xs font-black uppercase">
                    Mechanism
                  </th>
                  <th className="border-r-2 border-foreground px-3 py-3 align-bottom text-xs font-black uppercase">
                    Expected value / year
                  </th>
                  <th className="border-r-2 border-foreground px-3 py-3 align-bottom text-xs font-black uppercase">
                    Odds it works
                  </th>
                  <th className="border-r-2 border-foreground px-3 py-3 align-bottom text-xs font-black uppercase">
                    Cost to fund
                  </th>
                  <th className="px-3 py-3 align-bottom text-xs font-black uppercase">
                    Value per $
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b-2 border-foreground">
                    <Cell>
                      <Link
                        href={row.href}
                        className="font-black uppercase underline decoration-dotted underline-offset-4"
                      >
                        {row.title}
                      </Link>
                      {row.blurb ? (
                        <span className="mt-1 block text-xs font-bold text-muted-foreground">
                          {row.blurb}
                        </span>
                      ) : null}
                    </Cell>
                    <Cell className="font-black">
                      {row.expectedValueUsd != null
                        ? usdCompact(row.expectedValueUsd)
                        : "—"}
                    </Cell>
                    <Cell>
                      {row.successProbability != null
                        ? percent(row.successProbability)
                        : "—"}
                    </Cell>
                    <Cell>
                      {row.costUsd != null
                        ? usdCompact(row.costUsd)
                        : "Refundable (assurance contract)"}
                    </Cell>
                    <td className="px-3 py-4 align-top font-black">
                      {row.valuePerDollar != null
                        ? multiple(row.valuePerDollar)
                        : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="border-b-2 border-foreground bg-muted">
                  <Cell>
                    GiveWell top charities (bed nets) — the standard
                    global-health benchmark
                  </Cell>
                  <Cell>—</Cell>
                  <Cell>—</Cell>
                  <Cell>
                    <ParameterValue
                      className="font-black"
                      param={BED_NETS_COST_PER_DALY}
                      display="withUnit"
                    />{" "}
                    per DALY
                  </Cell>
                  <td className="px-3 py-4 align-top font-black">1× (baseline)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm font-bold leading-6 text-muted-foreground">
            The Earth Optimization Prize is a dominant assurance contract:
            depositors are refunded with yield if the treaty does not pass, so
            its net cost to a funder is near zero. It is listed for its expected
            value, not ranked by cost.
          </p>
        </section>

        <section className="mt-8 border-2 border-foreground bg-background p-5 sm:p-8">
          <SectionHeading>Fund a mechanism</SectionHeading>
          <p className="mt-3 text-base font-bold leading-7 sm:text-lg">
            Pledges are conditional. Your money only moves if the mechanism hits
            its funding threshold; otherwise nothing happens. No foundation has
            to be the reckless first mover.
          </p>

          {!pledgeOrganization ? (
            <div className="mt-6 border-2 border-foreground bg-background p-5">
              <Link
                className="inline-flex border-2 border-foreground bg-foreground px-4 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
                href={getSignInPath(ROUTES.foundations)}
              >
                Sign in as your organization to pledge
              </Link>
            </div>
          ) : null}

          <div className="mt-6 space-y-8">
            {fundable.map((row) => (
              <div key={row.id} className="border-2 border-foreground p-4 sm:p-5">
                <h3 className="text-lg font-black uppercase">{row.title}</h3>
                <div className="mt-3">
                  <TaskFundingProgress status={row.funding} taskId={row.id} />
                </div>
                {pledgeOrganization ? (
                  <div className="mt-4">
                    <TaskFundingPledgeForm
                      initialPublicDisplay
                      labels={{
                        amountLabel: "Pledge amount (USD)",
                        publicDisplayLabel:
                          "Show our organization name publicly when the threshold is met.",
                        submitButtonLabel: "Pledge conditionally",
                      }}
                      organizationId={pledgeOrganization.id}
                      pledgerKind="ORGANIZATION"
                      taskId={row.id}
                      unitConfig={{
                        suggestedAmountCents: 100_000_000n,
                        unitKind: "USD",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
