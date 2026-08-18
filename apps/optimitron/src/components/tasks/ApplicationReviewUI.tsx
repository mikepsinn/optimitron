"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  TaskApplicationStatus,
  type TaskApplicationStatus as TaskApplicationStatusValue,
} from "@optimitron/db/enums";
import { Badge } from "@/components/retroui/Badge";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";
import type {
  ApplicationReviewRow,
  DimensionScore,
  ScreeningAnswers,
  TaskApplicationAnswersJson,
} from "@/lib/task-applications.types";

type AppStatus = TaskApplicationStatusValue;
export type ApplicationRow = ApplicationReviewRow;

// ─── Stage definitions ────────────────────────────────────────────────────────

const PIPELINE_STAGES: { label: string; statuses: AppStatus[] }[] = [
  {
    label: "Applied",
    statuses: [TaskApplicationStatus.APPLIED, TaskApplicationStatus.INVITED],
  },
  { label: "Screened", statuses: [TaskApplicationStatus.UNDER_REVIEW] },
  { label: "Shortlisted", statuses: [TaskApplicationStatus.SHORTLISTED] },
  { label: "Interviewing", statuses: [TaskApplicationStatus.INTERVIEWING] },
  {
    label: "Offer",
    statuses: [TaskApplicationStatus.OFFERED, TaskApplicationStatus.ACCEPTED],
  },
  {
    label: "Rejected",
    statuses: [
      TaskApplicationStatus.REJECTED,
      TaskApplicationStatus.WITHDRAWN,
      TaskApplicationStatus.ARCHIVED,
    ],
  },
];

const STATUS_LABELS: Record<AppStatus, string> = {
  APPLIED: "Applied",
  INVITED: "Invited",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEWING: "Interviewing",
  OFFERED: "Offered",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ARCHIVED: "Archived",
};

const SCORE_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Excellent",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApplicantName(app: ApplicationRow): string {
  return (
    app.applicantNameSnapshot ??
    app.applicantPerson?.displayName ??
    app.applicantUser?.person?.displayName ??
    app.applicantUser?.email ??
    "Unknown applicant"
  );
}

function getApplicantEmail(app: ApplicationRow): string | null {
  return (
    app.applicantEmailSnapshot ??
    app.applicantUser?.email ??
    app.applicantPerson?.email ??
    null
  );
}

function stageFor(status: AppStatus): string {
  for (const stage of PIPELINE_STAGES) {
    if ((stage.statuses as string[]).includes(status)) return stage.label;
  }
  return "Applied";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DimensionRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DimensionScore | undefined;
  onChange: (v: DimensionScore) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ score: n, note: value?.note })}
            className={`flex-1 rounded border py-1 text-xs font-bold transition-colors ${
              value?.score === n
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {n} · {SCORE_LABELS[n]}
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendationRow({
  value,
  onChange,
}: {
  value: ScreeningAnswers["recommendation"] | undefined;
  onChange: (v: ScreeningAnswers["recommendation"]) => void;
}) {
  const options: {
    key: ScreeningAnswers["recommendation"];
    label: string;
    cls: string;
  }[] = [
    { key: "strong_no", label: "Strong No", cls: "border-red-600 text-red-600" },
    { key: "no", label: "No", cls: "border-orange-500 text-orange-500" },
    { key: "yes", label: "Yes", cls: "border-green-600 text-green-600" },
    {
      key: "strong_yes",
      label: "Strong Yes",
      cls: "border-green-800 text-green-800 font-black",
    },
  ];

  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wide">
        Recommendation
      </p>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex-1 rounded border py-1.5 text-xs font-bold transition-colors ${
              value === opt.key
                ? "border-foreground bg-foreground text-background"
                : `${opt.cls} hover:opacity-80`
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScorecardSection({
  title,
  data,
  onChange,
}: {
  title: string;
  data: ScreeningAnswers;
  onChange: (updated: ScreeningAnswers) => void;
}) {
  const dims: {
    key: keyof ScreeningAnswers;
    label: string;
  }[] = [
    { key: "writingClarity", label: "Writing Clarity" },
    { key: "relevantExperience", label: "Relevant Experience" },
    { key: "quantifiedTrackRecord", label: "Quantified Track Record" },
    { key: "redFlags", label: "Red Flags (lower = more flags)" },
  ];

  return (
    <div className="space-y-3 rounded border p-3">
      <p className="text-sm font-black uppercase tracking-wide">{title}</p>
      {dims.map(({ key, label }) => (
        <DimensionRow
          key={key}
          label={label}
          value={data[key] as DimensionScore | undefined}
          onChange={(v) => onChange({ ...data, [key]: v })}
        />
      ))}
      <RecommendationRow
        value={data.recommendation}
        onChange={(v) => onChange({ ...data, recommendation: v })}
      />
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wide">Notes</p>
        <Textarea
          className="text-xs"
          rows={3}
          placeholder="Observations..."
          value={data.screeningNotes ?? ""}
          onChange={(e) =>
            onChange({ ...data, screeningNotes: e.target.value })
          }
        />
      </div>
    </div>
  );
}

// ─── Candidate detail panel ───────────────────────────────────────────────────

function CandidateDetail({
  app,
  taskId,
}: {
  app: ApplicationRow;
  taskId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const raw = (app.answersJson ?? {}) as TaskApplicationAnswersJson;
  const [answers, setAnswers] = useState<TaskApplicationAnswersJson>(raw);
  const [reviewNote, setReviewNote] = useState(app.reviewNote ?? "");

  function patch(body: Record<string, unknown>) {
    setError(null);
    startTransition(() => {
      void fetch(API_ROUTES.tasks.application(taskId, app.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          const payload = (await res
            .json()
            .catch(() => null)) as { error?: string } | null;
          if (!res.ok) throw new Error(payload?.error ?? "Failed to save.");
          router.refresh();
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : "Failed to save.",
          );
        });
    });
  }

  function advanceTo(status: AppStatus) {
    patch({ status });
  }

  function saveScorecard() {
    patch({ answersJson: answers, reviewNote });
  }

  const email = getApplicantEmail(app);
  const name = getApplicantName(app);

  const ADVANCE_OPTIONS: { label: string; status: AppStatus }[] = [
    {
      label: "Mark Under Review",
      status: TaskApplicationStatus.UNDER_REVIEW,
    },
    { label: "Shortlist", status: TaskApplicationStatus.SHORTLISTED },
    {
      label: "Move to Interviewing",
      status: TaskApplicationStatus.INTERVIEWING,
    },
    { label: "Make Offer", status: TaskApplicationStatus.OFFERED },
    { label: "Accept", status: TaskApplicationStatus.ACCEPTED },
  ];

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) =>
    (s.statuses as string[]).includes(app.status),
  );
  const nextStage = ADVANCE_OPTIONS.find((o) => {
    const idx = PIPELINE_STAGES.findIndex((s) =>
      (s.statuses as string[]).includes(o.status),
    );
    return idx > currentStageIndex;
  });

  const showScheduleHelper =
    app.status === TaskApplicationStatus.SHORTLISTED ||
    app.status === TaskApplicationStatus.INTERVIEWING;

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-black">{name}</p>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {email}
              </a>
            ) : null}
          </div>
          <Badge variant="outline" size="sm">
            {STATUS_LABELS[app.status]}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Applied {new Date(app.appliedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Application message */}
        {app.applicationMessage ? (
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide">
              Cover Note
            </p>
            <p className="whitespace-pre-wrap text-sm">
              {app.applicationMessage}
            </p>
          </div>
        ) : null}

        {/* Scorecards */}
        <ScorecardSection
          title="AI Screen"
          data={answers.aiScreen ?? {}}
          onChange={(updated) =>
            setAnswers((prev) => ({ ...prev, aiScreen: updated }))
          }
        />

        <ScorecardSection
          title="Phone Screen"
          data={answers.phoneScreen ?? {}}
          onChange={(updated) =>
            setAnswers((prev) => ({ ...prev, phoneScreen: updated }))
          }
        />

        {/* Test project */}
        <div className="space-y-3 rounded border p-3">
          <p className="text-sm font-black uppercase tracking-wide">
            Test Project
          </p>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide">Notes</p>
            <Textarea
              className="text-xs"
              rows={3}
              placeholder="Did they find real contacts? Are emails readable? Does sequencing show judgment?"
              value={answers.testProject?.notes ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  testProject: { ...prev.testProject, notes: e.target.value },
                }))
              }
            />
          </div>
        </div>

        {/* Reviewer note */}
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide">
            Reviewer Note (internal)
          </p>
          <Textarea
            className="text-xs"
            rows={2}
            placeholder="Private note visible only to reviewers."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </div>

        {error ? (
          <p className="text-xs font-bold uppercase text-red-600">{error}</p>
        ) : null}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={saveScorecard}
            className="font-black uppercase"
          >
            {isPending ? "Saving..." : "Save Scorecard"}
          </Button>
          {nextStage ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => advanceTo(nextStage.status)}
              className="font-black uppercase"
            >
              {nextStage.label} →
            </Button>
          ) : null}
          {app.status !== TaskApplicationStatus.REJECTED ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => advanceTo(TaskApplicationStatus.REJECTED)}
              className="font-black uppercase"
            >
              Reject
            </Button>
          ) : null}
        </div>

        {showScheduleHelper ? (
          <div className="rounded border p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-bold uppercase">Schedule interview</p>
            <p>
              Draft a scheduling email to {name}
              {email ? ` (${email})` : ""} for a 20-minute phone screen. Use
              the site voice: short, direct, no corporate-speak.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ApplicationReviewUI({
  taskId,
  initialApplications,
}: {
  taskId: string;
  initialApplications: ApplicationRow[];
}) {
  const [activeStage, setActiveStage] = useState(PIPELINE_STAGES[0].label);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialApplications[0]?.id ?? null,
  );

  const stageApps = initialApplications.filter(
    (a) => stageFor(a.status) === activeStage,
  );
  const selected =
    initialApplications.find((a) => a.id === selectedId) ?? null;

  const stageCounts = Object.fromEntries(
    PIPELINE_STAGES.map((s) => [
      s.label,
      initialApplications.filter((a) => stageFor(a.status) === s.label).length,
    ]),
  );

  if (initialApplications.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <p className="text-2xl font-black uppercase">No applications yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Set the task applicationPolicy to OPEN and share the link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: stage tabs + candidate list */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex flex-col border-b">
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => {
                setActiveStage(stage.label);
                const first = initialApplications.find(
                  (a) => stageFor(a.status) === stage.label,
                );
                setSelectedId(first?.id ?? null);
              }}
              className={`flex items-center justify-between px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition-colors ${
                activeStage === stage.label
                  ? "bg-foreground text-background"
                  : "hover:bg-muted"
              }`}
            >
              <span>{stage.label}</span>
              {stageCounts[stage.label] > 0 ? (
                <span
                  className={`rounded px-1.5 text-xs font-black ${
                    activeStage === stage.label
                      ? "bg-background text-foreground"
                      : "bg-muted"
                  }`}
                >
                  {stageCounts[stage.label]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {stageApps.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">
              No candidates in this stage.
            </p>
          ) : (
            stageApps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedId(app.id)}
                className={`w-full border-b px-3 py-2 text-left transition-colors ${
                  selectedId === app.id ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <p className="truncate text-sm font-bold">
                  {getApplicantName(app)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(app.appliedAt).toLocaleDateString()}
                  {app.reviewScore != null ? ` · Score ${app.reviewScore}` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Right: candidate detail */}
      <main className="flex-1 overflow-hidden">
        {selected ? (
          <CandidateDetail key={selected.id} app={selected} taskId={taskId} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a candidate to review.</p>
          </div>
        )}
      </main>
    </div>
  );
}
