"use client";

import { useMemo, useState } from "react";
import {
  TaskRow,
  TaskTableHeader,
  getTaskSortValue,
  type TaskListVariant,
  type TaskSortKey,
} from "./task-row";
import type { TaskCardTask } from "./task-card";
import { compareTaskListValues } from "./task-list-sort";
import { useHydratedNow } from "@/lib/use-hydrated-now";

const SORT_OPTIONS: { key: TaskSortKey; label: string }[] = [
  { key: "recommendation", label: "Expected Value / Hour" },
  { key: "deathsLockedIn", label: "Deaths From Delay" },
  { key: "cost", label: "Wasted By Delay" },
  { key: "impactLives", label: "Lives Saved" },
  { key: "impactMoney", label: "$ Saved" },
  { key: "verifiedAt", label: "Completed" },
  { key: "time", label: "Time" },
  { key: "title", label: "Task Name" },
  { key: "assignee", label: "Assignee" },
  { key: "status", label: "Due Date" },
];

const ASC_SORT_KEYS: ReadonlySet<TaskSortKey> = new Set([
  "title",
  "assignee",
  "time",
]);

function matchesFilter(task: TaskCardTask, filter: string): boolean {
  if (!filter) return true;
  const q = filter.toLowerCase();
  const title = task.title.toLowerCase();
  const assignee = (
    task.assigneePerson?.displayName ??
    task.assigneeOrganization?.name ??
    ""
  ).toLowerCase();
  const description = task.description.toLowerCase();
  return title.includes(q) || assignee.includes(q) || description.includes(q);
}

export function SortableTaskList({
  tasks,
  defaultSortKey = "deathsLockedIn",
  defaultSortDir = "desc",
  variant = "default",
  pageSize = 10,
  hideAssignee = false,
}: {
  tasks: TaskCardTask[];
  defaultSortKey?: TaskSortKey;
  defaultSortDir?: "asc" | "desc";
  variant?: TaskListVariant;
  /** Paginate results N rows per page. Defaults to 10. */
  pageSize?: number;
  /** Hide the assignee column — useful on person profiles where every row shares the same assignee. */
  hideAssignee?: boolean;
}) {
  const now = useHydratedNow();
  const [sortKey, setSortKey] = useState<TaskSortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const availableSortOptions = useMemo(
    () =>
      tasks.some((task) => typeof task.recommendationScore === "number")
        ? SORT_OPTIONS
        : SORT_OPTIONS.filter((option) => option.key !== "recommendation"),
    [tasks],
  );

  const sorted = useMemo(() => {
    const filtered = tasks.filter((t) => matchesFilter(t, filter));
    return filtered.sort((a, b) => {
      const valA = getTaskSortValue(a, sortKey);
      const valB = getTaskSortValue(b, sortKey);
      return compareTaskListValues(a, b, valA, valB, sortDir);
    });
  }, [tasks, sortKey, sortDir, filter]);

  function handleHeaderSort(key: TaskSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(ASC_SORT_KEYS.has(key) ? "asc" : "desc");
    }
  }

  if (tasks.length === 0) return null;

  return (
    <div className="overflow-hidden border-2 border-primary bg-background">
      {/* Top controls: filter + mobile sort */}
      <div className="flex flex-wrap items-center gap-2 border-b border-foreground/10 px-4 py-2">
        <input
          type="search"
          placeholder="Filter tasks..."
          className="ml-auto w-full border-2 border-foreground bg-background px-2 py-1 text-xs font-bold placeholder:text-muted-foreground sm:w-48"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="flex items-center gap-2 lg:hidden">
          <label
            htmlFor="task-sort"
            className="text-xs font-bold uppercase text-muted-foreground"
          >
            Sort
          </label>
          <select
            id="task-sort"
            className="border-2 border-foreground bg-background px-2 py-1 text-xs font-bold"
            value={sortKey}
            onChange={(e) => {
              const key = e.target.value as TaskSortKey;
              setSortKey(key);
              setSortDir(ASC_SORT_KEYS.has(key) ? "asc" : "desc");
            }}
          >
            {availableSortOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="border-2 border-foreground bg-background px-2 py-1 text-xs font-bold"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? "\u2191" : "\u2193"}
          </button>
        </div>
      </div>

      <TaskTableHeader
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleHeaderSort}
        variant={variant}
        hideAssignee={hideAssignee}
      />
      <div className="divide-y divide-foreground/10">
        {sorted.length > 0 ? (
          (!filter
            ? sorted.slice(page * pageSize, (page + 1) * pageSize)
            : sorted
          ).map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              variant={variant}
              hideAssignee={hideAssignee}
              now={now}
            />
          ))
        ) : (
          <div className="px-4 py-6 text-center text-xs font-bold text-muted-foreground">
            No tasks match &quot;{filter}&quot;.
          </div>
        )}
      </div>
      {!filter && sorted.length > pageSize ? (
        <PaginationControls
          page={page}
          totalPages={Math.ceil(sorted.length / pageSize)}
          pageSize={pageSize}
          totalRows={sorted.length}
          onPage={setPage}
        />
      ) : null}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  pageSize,
  totalRows,
  onPage,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalRows: number;
  onPage: (p: number) => void;
}) {
  const first = page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, totalRows);
  return (
    <div className="flex items-center justify-between gap-3 border-t-2 border-foreground bg-background px-4 py-3 text-foreground">
      <div className="text-xs font-black uppercase tracking-wide sm:text-sm">
        {first.toLocaleString()}–{last.toLocaleString()} of{" "}
        {totalRows.toLocaleString()}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPage(Math.max(0, page - 1))}
          className="border-2 border-foreground bg-background px-3 py-1 text-xs font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-foreground"
        >
          ← Prev
        </button>
        <span className="text-xs font-black uppercase sm:text-sm">
          Page {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPage(Math.min(totalPages - 1, page + 1))}
          className="border-2 border-foreground bg-background px-3 py-1 text-xs font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-foreground"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
