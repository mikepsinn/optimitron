"use client"

import { useMemo, useState } from "react"
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
} from "@optimitron/data/parameters"
import { ParameterValue } from "../shared/ParameterValue"
import { Avatar } from "../ui/avatar"
import { getFlagEmoji } from "../../lib/geo"
import { optimitronUrl } from "../../lib/optimitron-links"
import { formatDelayDuration } from "../../lib/tasks/accountability"
import {
  getSignerDelayAttribution,
  getTreatyLevelCostOfDelay,
} from "../../lib/tasks/delay-attribution"
import {
  getAccountabilityReferenceMs,
  type TreatyProgramTask,
  type TreatySignerTask,
} from "../../lib/tasks/treaty-signers"
import { useHydratedNow } from "../../lib/use-hydrated-now"

const DAY_MS = 1000 * 60 * 60 * 24
const DEFAULT_PAGE_SIZE = 10

interface OverdueSignerListProps {
  pageSize?: number
  serverNowMs: number
  signerTasks: TreatySignerTask[]
  treatyProgram: TreatyProgramTask | null
}

function dateMs(value: Date | string | null | undefined) {
  if (value == null) return null
  const parsed =
    value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function delayDays(dueAt: Date | string | null, referenceMs: number) {
  const dueMs = dateMs(dueAt)
  return dueMs == null
    ? 0
    : Math.max(0, Math.floor((referenceMs - dueMs) / DAY_MS))
}

function formatEffort(hours: number | null | undefined) {
  if (hours == null || hours <= 0) return "—"
  const seconds = hours * 3600
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${hours.toFixed(hours < 10 ? 1 : 0)}h`
}

function formatCombinedEffort(hours: number | null | undefined) {
  if (hours == null || hours <= 0) return null
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  return `${hours.toFixed(hours < 10 ? 1 : 0)} hours`
}

function initials(name: string | null) {
  return (name ?? "?")
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function reminderHref(countryCode: string | null) {
  return countryCode
    ? `/employees?country=${encodeURIComponent(countryCode)}#treaty-reminder-composer`
    : "#treaty-reminder-composer"
}

function ProgramCard({
  referenceMs,
  signerTasks,
  treatyProgram,
}: {
  referenceMs: number
  signerTasks: TreatySignerTask[]
  treatyProgram: TreatyProgramTask | null
}) {
  const signerDueDates = signerTasks
    .map((task) => dateMs(task.dueAt))
    .filter((value): value is number => value != null)
  const programDueMs =
    dateMs(treatyProgram?.dueAt) ??
    (signerDueDates.length > 0 ? Math.min(...signerDueDates) : null)
  const currentDelayDays =
    programDueMs == null
      ? 0
      : Math.max(0, Math.floor((referenceMs - programDueMs) / DAY_MS))
  const costOfDelay = getTreatyLevelCostOfDelay(currentDelayDays)
  const combinedEffort =
    treatyProgram?.estimatedEffortHours ??
    signerTasks.reduce((sum, task) => sum + (task.estimatedEffortHours ?? 0), 0)
  const title = treatyProgram?.title ?? "Ratify the 1% Treaty"
  const taskHref = treatyProgram
    ? optimitronUrl(`/tasks/${treatyProgram.id}`)
    : optimitronUrl("/tasks/1-pct-treaty")

  return (
    <article className="border-4 border-foreground bg-background shadow-[6px_6px_0_0_var(--foreground)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-4 border-foreground bg-foreground px-4 py-3 text-background">
        <a
          className="text-2xl font-black uppercase leading-tight underline-offset-4 hover:underline sm:text-3xl"
          href={taskHref}
        >
          {title}
        </a>
        <div className="flex flex-col items-end gap-1">
          {currentDelayDays > 0 ? (
            <span className="border-2 border-background bg-brutal-red px-2 py-0.5 text-xs font-black uppercase tracking-wide text-brutal-red-foreground">
              {formatDelayDuration(currentDelayDays)} overdue
            </span>
          ) : null}
          {formatCombinedEffort(combinedEffort) ? (
            <span className="border-2 border-background bg-background px-2 py-0.5 text-xs font-black uppercase tracking-wide text-foreground">
              Time required: {formatCombinedEffort(combinedEffort)} combined
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 border-b-2 border-foreground px-4 py-4 text-base font-bold leading-relaxed sm:text-lg">
        <p>
          <ParameterValue
            className="font-black"
            display="integer"
            param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
          />{" "}
          diseases have 0 FDA-approved treatments. At current clinical trial
          capacity, it could take{" "}
          <ParameterValue
            className="font-black"
            display="integer"
            param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
          />{" "}
          years to cure them all.
        </p>
        <p>
          Humanity maintains enough nuclear weapons to trigger a
          civilization-ending nuclear winter{" "}
          <ParameterValue
            className="font-black"
            display="integer"
            param={NUCLEAR_WINTER_OVERKILL_FACTOR}
          />{" "}
          times over. This treaty asks us to settle for enough weapons to do it{" "}
          <span className="font-black">
            {(NUCLEAR_WINTER_OVERKILL_FACTOR.value * 0.99).toFixed(1)}
          </span>{" "}
          times in exchange for{" "}
          <ParameterValue
            className="font-black"
            param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
            valueOverride={DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1)}
          />
          × more clinical trial capacity to cure disease.
        </p>
        <p className="text-xl font-black sm:text-2xl">
          This could compress that{" "}
          <ParameterValue
            className="font-black"
            display="integer"
            param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
          />{" "}
          years into{" "}
          <ParameterValue
            className="font-black"
            display="integer"
            param={DFDA_QUEUE_CLEARANCE_YEARS}
          />
          , avoiding{" "}
          <ParameterValue
            className="font-black"
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
          />{" "}
          deaths,{" "}
          <ParameterValue
            className="font-black"
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS}
          />{" "}
          hours of suffering, and{" "}
          <ParameterValue
            className="font-black"
            display="withUnit"
            param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE}
          />{" "}
          wasted by delayed disease eradication.
        </p>
      </div>

      {costOfDelay ? (
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="border-b-2 border-foreground bg-brutal-red px-4 py-3 text-brutal-red-foreground sm:border-b-0 sm:border-r-2">
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              💀 Dead already from the delay
            </p>
            <p
              className="mt-1 text-2xl font-black leading-none sm:text-3xl"
              data-volatile="treaty-deaths-from-delay"
            >
              {Math.floor(costOfDelay.deathsFromDelay).toLocaleString("en-US")}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase opacity-90">
              rate:{" "}
              <ParameterValue
                display="withUnit"
                param={GLOBAL_DISEASE_DEATHS_DAILY}
              />{" "}
              × {currentDelayDays.toLocaleString("en-US")} days
            </p>
          </div>
          <div className="bg-brutal-red px-4 py-3 text-brutal-red-foreground">
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              💸 Wasted on disease while they delay
            </p>
            <p
              className="mt-1 text-2xl font-black leading-none sm:text-3xl"
              data-volatile="treaty-money-wasted"
            >
              ${Math.floor(costOfDelay.wastedUsd).toLocaleString("en-US")}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase opacity-90">
              rate:{" "}
              <ParameterValue
                display="withUnit"
                param={GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL}
              />{" "}
              + productivity losses ÷ 365 × delay days
            </p>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function SignerRow({
  overdueDays,
  task,
}: {
  overdueDays: number
  task: TreatySignerTask
}) {
  const attribution = getSignerDelayAttribution(
    task.militarySpendingAnnualUsd,
    overdueDays,
  )
  const assigneeLabel = task.assigneeName ?? task.title
  const affiliation =
    task.assigneeAffiliation ??
    (task.assigneeCountryCode
      ? `Government of ${task.assigneeCountryCode}`
      : null)
  const personHref = task.assigneeHandle
    ? optimitronUrl(`/people/${task.assigneeHandle}`)
    : null
  const assigneeImage = task.assigneeImage?.startsWith("/")
    ? optimitronUrl(task.assigneeImage)
    : task.assigneeImage ?? undefined

  return (
    <li className="grid gap-3 border-b-2 border-foreground px-3 py-3 last:border-b-0 lg:grid-cols-[minmax(220px,1.4fr)_minmax(150px,0.9fr)_160px_180px_70px_86px] lg:items-center lg:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {personHref ? (
          <a className="shrink-0" href={personHref}>
            <Avatar className="h-12 w-12 border-2 border-foreground bg-muted">
              <Avatar.Image alt={assigneeLabel} src={assigneeImage} />
              <Avatar.Fallback className="bg-foreground text-xs font-black text-background">
                {initials(assigneeLabel)}
              </Avatar.Fallback>
            </Avatar>
          </a>
        ) : (
          <Avatar className="h-12 w-12 shrink-0 border-2 border-foreground bg-muted">
            <Avatar.Image alt={assigneeLabel} src={assigneeImage} />
            <Avatar.Fallback className="bg-foreground text-xs font-black text-background">
              {initials(assigneeLabel)}
            </Avatar.Fallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <a
            className="block truncate text-sm font-black underline-offset-4 hover:underline sm:text-base"
            href={personHref ?? optimitronUrl(`/tasks/${task.id}`)}
          >
            {task.assigneeCountryCode
              ? `${getFlagEmoji(task.assigneeCountryCode)} `
              : ""}
            {assigneeLabel}
          </a>
          {affiliation ? (
            <p className="truncate text-[11px] font-bold text-muted-foreground sm:text-xs">
              {affiliation}
            </p>
          ) : null}
        </div>
      </div>

      <a
        className="text-sm font-black uppercase underline-offset-4 hover:underline"
        href={optimitronUrl(`/tasks/${task.id}`)}
      >
        {task.title}
      </a>

      <div
        className="text-sm font-black text-brutal-red"
        data-volatile="signer-deaths-from-delay"
      >
        <span className="mr-1 lg:hidden">Deaths from delay:</span>
        💀{" "}
        {attribution
          ? Math.floor(attribution.deathsFromDelay).toLocaleString("en-US")
          : "—"}
      </div>
      <div
        className="text-sm font-black text-brutal-red"
        data-volatile="signer-money-wasted"
      >
        <span className="mr-1 lg:hidden">Wasted by delay:</span>
        💸{" "}
        {attribution
          ? `$${Math.floor(attribution.wastedUsd).toLocaleString("en-US")}`
          : "—"}
      </div>
      <div className="text-sm font-black">
        <span className="mr-1 lg:hidden">Time:</span>
        {formatEffort(task.estimatedEffortHours)}
      </div>
      <a
        className="inline-flex min-h-9 items-center justify-center border-2 border-foreground bg-foreground px-3 py-1 text-xs font-black uppercase text-background hover:bg-background hover:text-foreground"
        href={reminderHref(task.assigneeCountryCode)}
      >
        Remind
      </a>
    </li>
  )
}

/** The original president project board, adapted to the War on Disease shell. */
export function OverdueSignerList({
  pageSize = DEFAULT_PAGE_SIZE,
  serverNowMs,
  signerTasks,
  treatyProgram,
}: OverdueSignerListProps) {
  const hydratedNow = useHydratedNow()
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState("")
  const referenceMs = getAccountabilityReferenceMs(
    serverNowMs,
    hydratedNow?.getTime() ?? null,
  )

  const rows = useMemo(
    () =>
      signerTasks.map((task) => ({
        overdueDays: delayDays(task.dueAt, referenceMs),
        task,
      })),
    [referenceMs, signerTasks],
  )
  const overdueCount = rows.filter((row) => row.overdueDays > 0).length
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredRows = normalizedQuery
    ? rows.filter(({ task }) =>
        [task.assigneeName, task.assigneeAffiliation, task.title]
          .filter(Boolean)
          .some((value) =>
            value!.toLocaleLowerCase().includes(normalizedQuery),
          ),
      )
    : rows
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const clampedPage = Math.min(page, pageCount - 1)
  const visible = filteredRows.slice(
    clampedPage * pageSize,
    clampedPage * pageSize + pageSize,
  )
  const firstVisible =
    filteredRows.length === 0 ? 0 : clampedPage * pageSize + 1
  const lastVisible = Math.min(
    (clampedPage + 1) * pageSize,
    filteredRows.length,
  )

  return (
    <section className="space-y-4" data-visual-section="president-task-list">
      <ProgramCard
        referenceMs={referenceMs}
        signerTasks={signerTasks}
        treatyProgram={treatyProgram}
      />

      <div className="space-y-3 sm:ml-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            ↳ <span data-volatile="overdue-employee-count">{overdueCount}</span>{" "}
            employees have overdue tasks
          </h2>
          <p className="text-sm font-black uppercase">
            👉 Click the Remind button to do your job
          </p>
        </div>

        <div className="border-4 border-foreground bg-background">
          <div className="flex justify-end border-b-2 border-foreground p-2">
            <label className="sr-only" htmlFor="president-task-filter">
              Filter tasks
            </label>
            <input
              className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm font-bold outline-none focus:shadow-[3px_3px_0_0_var(--foreground)] sm:max-w-xs"
              id="president-task-filter"
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(0)
              }}
              placeholder="Filter tasks..."
              type="search"
              value={query}
            />
          </div>

          <div className="hidden border-b-2 border-foreground px-4 py-3 text-[11px] font-black uppercase tracking-wide lg:grid lg:grid-cols-[minmax(220px,1.4fr)_minmax(150px,0.9fr)_160px_180px_70px_86px] lg:items-center lg:gap-3">
            <span>Assignee</span>
            <span>Task</span>
            <span>💀 Deaths from delay</span>
            <span>💸 Wasted by delay</span>
            <span>⏱ Time</span>
            <span>Remind</span>
          </div>

          {visible.length > 0 ? (
            <ul>
              {visible.map(({ overdueDays, task }) => (
                <SignerRow
                  key={task.id}
                  overdueDays={overdueDays}
                  task={task}
                />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm font-black uppercase">
              No president tasks match that filter.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground px-3 py-3 text-xs font-black uppercase">
            <span>
              {firstVisible}–{lastVisible} of {filteredRows.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                className="border-2 border-foreground px-3 py-1 disabled:opacity-40"
                disabled={clampedPage === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                type="button"
              >
                ← Prev
              </button>
              <span>
                Page {clampedPage + 1} / {pageCount}
              </span>
              <button
                className="border-2 border-foreground px-3 py-1 disabled:opacity-40"
                disabled={clampedPage >= pageCount - 1}
                onClick={() =>
                  setPage((current) => Math.min(pageCount - 1, current + 1))
                }
                type="button"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
