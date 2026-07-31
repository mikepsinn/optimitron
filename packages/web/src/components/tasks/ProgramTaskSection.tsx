"use client";

import Link from "next/link";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { LiveCounter } from "@/components/tasks/live-counter";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import type { TaskCardTask } from "@/components/tasks/task-card";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import {
  DAILY_DISEASE_COST_USD,
  DAILY_DISEASE_DEATHS,
  getTreatyLevelCostOfDelay,
} from "@/lib/tasks/delay-attribution";
import { isTreatyParentTaskKey } from "@/lib/tasks/task-keys";
import { getTaskPath } from "@/lib/routes";
import { useHydratedNow } from "@/lib/use-hydrated-now";

function formatTotalEffort(hours: number | null | undefined): string | null {
  if (hours == null || hours <= 0) return null;
  const seconds = hours * 3600;
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)} hours`;
  return `${Math.round(hours / 24)} days`;
}

function getTaskDateMs(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const dateMs = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(dateMs) ? dateMs : null;
}

export function ProgramCard({ task }: { task: TaskCardTask }) {
  const now = useHydratedNow();
  const delayStats = now ? getTaskDelayStats(task, now) : null;
  const overdueLabel =
    delayStats?.isOverdue && delayStats.currentDelayDays > 0
      ? formatDelayDuration(delayStats.currentDelayDays)
      : null;
  const costOfDelay = delayStats
    ? getTreatyLevelCostOfDelay(delayStats.currentDelayDays)
    : null;
  const dueMs = getTaskDateMs(task.dueAt);
  const canTick = dueMs != null && now != null && dueMs < now.getTime();
  const isTreatyParent = isTreatyParentTaskKey(task.taskKey);
  const totalEffortLabel = formatTotalEffort(task.estimatedEffortHours);

  return (
    <div className="border-4 border-foreground bg-background shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Header row: title + overdue chip */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-b-4 border-foreground bg-foreground px-4 py-3 text-background">
        <Link
          href={getTaskPath(task.id)}
          className="text-2xl font-black uppercase leading-tight hover:underline sm:text-3xl"
        >
          {task.title}
        </Link>
        <div className="flex flex-col items-end gap-1">
          {overdueLabel ? (
            <span className="border-2 border-background bg-brutal-red px-2 py-0.5 text-xs font-black uppercase tracking-wide text-brutal-red-foreground">
              {overdueLabel} overdue
            </span>
          ) : null}
          {isTreatyParent ? (
            <span className="border-2 border-background bg-background px-2 py-0.5 text-xs font-black uppercase tracking-wide text-foreground">
              Time Required: {totalEffortLabel ?? "1.6 Hours"} Combined
            </span>
          ) : null}
        </div>
      </div>

      {/* Explainer paragraph — plain English for a high schooler */}
      {isTreatyParent ? (
        <div className="border-b-2 border-foreground px-4 py-4 text-base font-bold leading-relaxed sm:text-lg">
          <p>
            <ParameterValue
              param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
              display="integer"
              className="font-black text-foreground"
            />{" "}
            diseases have 0 FDA-approved treatments. At current clinical trial
            capacity, it could take{" "}
            <ParameterValue
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              display="integer"
              className="font-black"
            />{" "}
            years to cure them all.
          </p>
          <p className="mt-3">
            Humanity maintains enough nuclear weapons to trigger a
            civilization-ending nuclear winter{" "}
            <ParameterValue
              param={NUCLEAR_WINTER_OVERKILL_FACTOR}
              display="integer"
              className="font-black text-foreground"
            />{" "}
            times over. This treaty asks us to settle for enough weapons to do
            it{" "}
            <span className="font-black text-foreground">
              {(NUCLEAR_WINTER_OVERKILL_FACTOR.value * 0.99).toFixed(1)}
            </span>{" "}
            times in exchange for{" "}
            <ParameterValue
              param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
              className="font-black text-foreground"
            />
            × more clinical trial capacity to cure disease.
          </p>
          <p className="mt-3 text-xl font-black sm:text-2xl">
            This could compress that{" "}
            <ParameterValue
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              display="integer"
              className="font-black"
            />{" "}
            years into{" "}
            <ParameterValue
              param={DFDA_QUEUE_CLEARANCE_YEARS}
              display="integer"
              className="font-black text-foreground"
            />
            , avoiding{" "}
            <ParameterValue
              param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
              className="font-black text-foreground"
            />{" "}
            deaths,{" "}
            <ParameterValue
              param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS}
              className="font-black text-foreground"
            />{" "}
            hours of suffering, and{" "}
            <ParameterValue
              param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE}
              display="withUnit"
              className="font-black text-foreground"
            />{" "}
            wasted by delayed disease eradication.
          </p>
        </div>
      ) : null}

      {/* Cost of delay — boxed "every day they delay" row */}
      {costOfDelay ? (
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="border-b-2 border-foreground bg-brutal-red px-4 py-3 text-brutal-red-foreground sm:border-b-0 sm:border-r-2">
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              💀 Dead already from the delay
            </p>
            <p className="mt-1 text-2xl font-black leading-none sm:text-3xl">
              {canTick && dueMs != null ? (
                <LiveCounter
                  ratePerSecond={DAILY_DISEASE_DEATHS / 86400}
                  startMs={dueMs}
                  mode="integer"
                />
              ) : (
                formatCompactCount(costOfDelay.deathsFromDelay)
              )}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase opacity-90">
              rate:{" "}
              <ParameterValue
                param={GLOBAL_DISEASE_DEATHS_DAILY}
                display="withUnit"
              />{" "}
              ×{" "}
              <span data-volatile="days-overdue">
                {delayStats?.currentDelayDays.toLocaleString() ?? "0"}{" "}
                {delayStats?.currentDelayDays === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
          <div className="bg-brutal-red px-4 py-3 text-brutal-red-foreground">
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              💸 Wasted on disease while they delay
            </p>
            <p className="mt-1 text-2xl font-black leading-none sm:text-3xl">
              {canTick && dueMs != null ? (
                <LiveCounter
                  ratePerSecond={DAILY_DISEASE_COST_USD / 86400}
                  startMs={dueMs}
                  mode="currency"
                />
              ) : (
                formatCompactCurrency(costOfDelay.wastedUsd)
              )}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase opacity-90">
              rate:{" "}
              <ParameterValue
                param={GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL}
                display="withUnit"
              />{" "}
              + productivity losses ÷ 365 × delay days
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProgramTaskSection({
  pageSize = 10,
  subtasks,
  subtasksTitle,
  task,
}: {
  pageSize?: number;
  subtasks: TaskCardTask[];
  subtasksTitle?: string;
  task: TaskCardTask;
}) {
  return (
    <div className="space-y-4">
      <ProgramCard task={task} />
      {subtasks.length > 0 ? (
        <div className="ml-1 space-y-3 sm:ml-3">
          {subtasksTitle ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black tracking-tight sm:text-2xl">
                {subtasksTitle}
              </h2>
              <p className="text-sm font-black uppercase text-foreground">
                👉 Click the Remind button to do your job
              </p>
            </div>
          ) : null}
          <SortableTaskList
            tasks={subtasks}
            defaultSortKey="assigneeBudget"
            defaultSortDir="desc"
            variant="signer"
            pageSize={pageSize}
          />
        </div>
      ) : null}
    </div>
  );
}
