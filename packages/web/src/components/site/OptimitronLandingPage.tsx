import Link from "next/link";
import { Suspense } from "react";
import { TREATY_REDUCTION_PCT } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { getTaskDescriptionSummary } from "@/components/tasks/task-description";
import { Container } from "@/components/ui/container";
import {
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";
import {
  gameLink,
  getTaskPath,
  investLink,
  ROUTES,
  servicesLink,
} from "@/lib/routes";
import { getTaskDetailData } from "@/lib/tasks.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";

const topTaskHref = getTaskPath(TREATY_PARENT_TASK_ID);
const treatyCalculationsHref =
  TREATY_REDUCTION_PCT.manualPageUrl ??
  TREATY_REDUCTION_PCT.calculationsUrl ??
  topTaskHref;

function formatProbability(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(value);
}

function formatHorizonYears(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

async function CurrentPriority() {
  const taskData = await getTaskDetailData(
    TREATY_PARENT_TASK_ID,
    null,
  ).catch((error: unknown) => {
    console.error("Unable to load the current Earth priority", error);
    return null;
  });
  const task = taskData?.task ?? null;
  const impactFrame = task?.impact?.selectedFrame ?? null;
  const expectedHealthyYears = impactFrame?.expectedDalysAvertedBase ?? null;
  const expectedEconomicValue =
    impactFrame?.expectedEconomicValueUsdBase ?? null;
  const successProbability = impactFrame?.successProbabilityBase ?? null;
  const evaluationHorizonYears = impactFrame?.evaluationHorizonYears ?? null;
  const hasTaskEvidence =
    expectedHealthyYears != null ||
    expectedEconomicValue != null ||
    Boolean(task?.impactStatement);
  const primaryEndpoint = task?.communicationEndpoints[0] ?? null;
  const actionHref = primaryEndpoint?.url ?? ROUTES.tasks;
  const actionLabel = primaryEndpoint?.label ?? "Open the task list";

  return (
    <section className="border-y border-foreground bg-background py-14 sm:py-20">
      <Container size="lg">
        <div
          className={
            hasTaskEvidence
              ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)] lg:items-start"
              : "max-w-3xl"
          }
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Current highest-value program
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-5xl">
              {task?.title ?? "Open the live Earth task list"}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {task ? (
                <>
                  Move{" "}
                  <ParameterValue
                    className="text-foreground"
                    param={TREATY_REDUCTION_PCT}
                    valueOverride="1%"
                  />{" "}
                  of military spending into large, low-cost trials testing
                  which medicines work, while reducing the money available for
                  war.
                </>
              ) : (
                "See the public task tree and the evidence behind every ranking."
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={actionHref}
                className="inline-flex min-h-12 items-center justify-center border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-background transition-colors hover:bg-background hover:text-foreground"
              >
                {actionLabel}
              </Link>
              {task ? (
                <Link
                  href={topTaskHref}
                  className="inline-flex min-h-12 items-center justify-center border border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  See the task record
                </Link>
              ) : null}
            </div>
          </div>

          {hasTaskEvidence ? (
            <div className="space-y-7 border-l border-foreground pl-6">
              {expectedHealthyYears != null || expectedEconomicValue != null ? (
                <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                  {expectedHealthyYears != null ? (
                    <div>
                      <dt className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                        Expected healthy years
                      </dt>
                      <dd className="mt-1 text-3xl font-black">
                        {formatCompactCount(expectedHealthyYears)}
                      </dd>
                    </div>
                  ) : null}
                  {expectedEconomicValue != null ? (
                    <div>
                      <dt className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                        Expected economic value
                      </dt>
                      <dd className="mt-1 text-3xl font-black">
                        {formatCompactCurrency(expectedEconomicValue)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {expectedHealthyYears != null || expectedEconomicValue != null ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Probability-weighted model estimate
                  {successProbability != null
                    ? ` using a ${formatProbability(successProbability)} success estimate`
                    : ""}
                  {evaluationHorizonYears != null
                    ? ` over ${formatHorizonYears(evaluationHorizonYears)} years`
                    : ""}
                  .{" "}
                  <Link
                    href={treatyCalculationsHref}
                    className="font-bold text-foreground underline decoration-1 underline-offset-4 hover:no-underline"
                  >
                    See inputs and calculations
                  </Link>
                  .
                </p>
              ) : null}

              {task?.impactStatement ? (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Why it leads today
                  </h3>
                  <p className="mt-2 text-base font-bold leading-7">
                    {getTaskDescriptionSummary(task.impactStatement, 220)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

function CurrentPriorityFallback() {
  return (
    <section className="border-y border-foreground bg-background py-14 sm:py-20">
      <Container size="lg">
        <div
          aria-hidden="true"
          className="min-h-48"
          data-visual-state="animating"
        />
      </Container>
    </section>
  );
}

export async function OptimitronLandingPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="py-20 sm:py-28 lg:py-32">
        <Container size="lg">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
            Optimitron
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            What&apos;s the highest-value thing you can do right now?
          </h1>
          <p className="mt-7 max-w-4xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
            Optimitron ranks laws, budgets, and tasks by how much they improve
            healthy life and real income—then finds the person, organization, AI
            agent, or dollar best placed to get each one done.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={topTaskHref}
              className="inline-flex min-h-12 items-center justify-center border border-foreground bg-foreground px-5 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-background transition-colors hover:bg-background hover:text-foreground"
            >
              See Earth&apos;s top task
            </Link>
            <Link
              href={ROUTES.game}
              className="inline-flex min-h-12 items-center justify-center border border-foreground bg-background px-5 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Play the Earth Optimization Game
            </Link>
          </div>
        </Container>
      </section>

      <Suspense fallback={<CurrentPriorityFallback />}>
        <CurrentPriority />
      </Suspense>

      <nav aria-label="Explore Optimitron" className="py-10">
        <Container size="lg">
          <div className="flex flex-col gap-4 text-sm font-black uppercase tracking-[0.08em] sm:flex-row sm:gap-8">
            {[gameLink, servicesLink, investLink].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="underline decoration-1 underline-offset-4 hover:no-underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Container>
      </nav>
    </main>
  );
}
