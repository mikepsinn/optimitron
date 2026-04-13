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

const SORT_OPTIONS: { key: TaskSortKey; label: string }[] = [
  { key: "assigneeBudget", label: "Budget Controlled" },
  { key: "deathsLockedIn", label: "Deaths From Delay" },
  { key: "cost", label: "Wasted By Delay" },
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
  initialLimit,
}: {
  tasks: TaskCardTask[];
  defaultSortKey?: TaskSortKey;
  defaultSortDir?: "asc" | "desc";
  variant?: TaskListVariant;
  /** Cap visible rows until the user clicks "Show all". Disabled if absent. */
  initialLimit?: number;
}) {
  const [sortKey, setSortKey] = useState<TaskSortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    const filtered = tasks.filter((t) => matchesFilter(t, filter));
    return filtered.sort((a, b) => {
      const valA = getTaskSortValue(a, sortKey);
      const valB = getTaskSortValue(b, sortKey);
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDir === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
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
          <label htmlFor="task-sort" className="text-xs font-bold uppercase text-muted-foreground">
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
            {SORT_OPTIONS.map((opt) => (
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
      />
      <div className="divide-y divide-foreground/10">
        {sorted.length > 0 ? (
          (initialLimit != null && !expanded && !filter
            ? sorted.slice(0, initialLimit)
            : sorted
          ).map((task) => (
            <TaskRow key={task.id} task={task} variant={variant} />
          ))
        ) : (
          <div className="px-4 py-6 text-center text-xs font-bold text-muted-foreground">
            No tasks match &quot;{filter}&quot;.
          </div>
        )}
      </div>
      {initialLimit != null && !filter && sorted.length > initialLimit ? (
        <button
          type="button"
          className="block w-full border-t-2 border-foreground bg-brutal-yellow px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-brutal-yellow-foreground transition-colors hover:bg-brutal-pink hover:text-brutal-pink-foreground"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded
            ? `↑ Show top ${initialLimit}`
            : `↓ Show all ${sorted.length} employees`}
        </button>
      ) : null}
    </div>
  );
}
