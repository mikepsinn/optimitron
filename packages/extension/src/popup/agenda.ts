/**
 * Today view — the user's daily schedule from optimitron.com.
 * Next action pinned on top, then overdue / today / later / unscheduled,
 * each row with Done, Snooze (10m / 1h / tonight), Skip, Delete.
 */

import {
  formatDueLabel,
  formatEv,
  isOverdue,
  partitionAgenda,
  snoozeUntil,
  type AgendaTask,
  type SnoozeOption,
} from "../lib/agenda-logic.js";
import {
  completeTask,
  deleteTask,
  getAgenda,
  NotSignedInError,
  skipTask,
  snoozeTask,
} from "../lib/api.js";
import { isSignedIn, signIn } from "../lib/auth.js";
import { showToast } from "../lib/utils.js";

function root(): HTMLElement | null {
  return document.getElementById("agenda-root");
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------------------------------------------------------------------------
// Sign-in state
// ---------------------------------------------------------------------------

function renderSignIn(container: HTMLElement, message?: string): void {
  container.innerHTML = "";
  const card = el("div", "agenda-signin");
  card.appendChild(el("div", "emoji", "🗓️"));
  card.appendChild(
    el("p", "signin-text", message ?? "Sign in to see your day."),
  );
  const button = el("button", "btn btn-primary", "Sign in to Optimitron") as HTMLButtonElement;
  button.addEventListener("click", () => {
    button.disabled = true;
    button.textContent = "Opening sign-in…";
    void signIn()
      .then(() => renderAgenda())
      .catch((error: unknown) => {
        button.disabled = false;
        button.textContent = "Sign in to Optimitron";
        showToast(
          error instanceof Error ? error.message : "Sign-in failed",
          3000,
        );
      });
  });
  card.appendChild(button);
  container.appendChild(card);
}

function renderError(container: HTMLElement, message: string): void {
  container.innerHTML = "";
  const card = el("div", "agenda-signin");
  card.appendChild(el("div", "emoji", "⚠️"));
  card.appendChild(el("p", "signin-text", message));
  const retry = el("button", "btn btn-secondary", "Retry");
  retry.addEventListener("click", () => void renderAgenda());
  card.appendChild(retry);
  container.appendChild(card);
}

// ---------------------------------------------------------------------------
// Task rows
// ---------------------------------------------------------------------------

type RowAction = "done" | "skip" | "delete" | SnoozeOption;

async function runAction(task: AgendaTask, action: RowAction): Promise<void> {
  switch (action) {
    case "done":
      await completeTask(task.id);
      showToast("Done ✓");
      break;
    case "skip":
      await skipTask(task.id);
      showToast("Skipped");
      break;
    case "delete":
      await deleteTask(task.id);
      showToast("Deleted");
      break;
    default:
      await snoozeTask(task.id, snoozeUntil(action, new Date()).toISOString());
      showToast("Snoozed");
      break;
  }
}

function actionButton(
  label: string,
  title: string,
  onClick: () => void,
  className = "btn btn-secondary btn-small",
): HTMLButtonElement {
  const button = el("button", className, label) as HTMLButtonElement;
  button.title = title;
  button.addEventListener("click", onClick);
  return button;
}

function renderTaskRow(task: AgendaTask, now: Date, pinned = false): HTMLElement {
  const overdue = isOverdue(task, now);
  const row = el(
    "div",
    `agenda-task${overdue ? " overdue" : ""}${pinned ? " next-action" : ""}`,
  );

  if (pinned) row.appendChild(el("div", "next-action-label", "▶ NEXT ACTION"));

  const header = el("div", "agenda-task-header");
  header.appendChild(el("div", "agenda-task-title", task.title));
  const meta = el("div", "agenda-task-meta");
  const due = el("span", `due-label${overdue ? " overdue-label" : ""}`);
  due.textContent = formatDueLabel(task, now);
  meta.appendChild(due);
  const ev = formatEv(task.ev);
  if (ev) meta.appendChild(el("span", "ev-badge", `EV ${ev}`));
  if (task.estimatedEffortHours != null) {
    meta.appendChild(
      el("span", "effort-label", `${task.estimatedEffortHours}h`),
    );
  }
  header.appendChild(meta);
  row.appendChild(header);

  const actions = el("div", "agenda-actions");
  const act = (action: RowAction) => () => {
    void runAction(task, action)
      .then(() => renderAgenda())
      .catch((error: unknown) =>
        showToast(error instanceof Error ? error.message : "Failed", 3000),
      );
  };

  actions.appendChild(
    actionButton("✅ Done", "Mark done", act("done"), "btn btn-success btn-small"),
  );

  // Snooze dropdown
  const snoozeWrap = el("div", "snooze-dropdown");
  const snoozeBtn = actionButton("⏰ Snooze", "Snooze", () => {
    options.classList.toggle("show");
  }, "btn btn-warning btn-small snooze-btn");
  const options = el("div", "snooze-options");
  for (const [option, label] of [
    ["10m", "10 minutes"],
    ["1h", "1 hour"],
    ["tonight", "Tonight"],
  ] as const) {
    const optionBtn = el("button", "snooze-option", label);
    optionBtn.addEventListener("click", act(option));
    options.appendChild(optionBtn);
  }
  snoozeWrap.appendChild(snoozeBtn);
  snoozeWrap.appendChild(options);
  actions.appendChild(snoozeWrap);

  actions.appendChild(actionButton("⏭️ Skip", "Skip (recorded)", act("skip")));
  actions.appendChild(actionButton("🗑️", "Delete task", act("delete")));
  row.appendChild(actions);

  return row;
}

function renderSection(
  container: HTMLElement,
  label: string,
  tasks: AgendaTask[],
  now: Date,
  skipTaskId?: string,
): void {
  const visible = tasks.filter((t) => t.id !== skipTaskId);
  if (visible.length === 0) return;
  container.appendChild(el("h3", undefined, label));
  for (const task of visible) container.appendChild(renderTaskRow(task, now));
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------

export async function renderAgenda(): Promise<void> {
  const container = root();
  if (!container) return;

  if (!(await isSignedIn())) {
    renderSignIn(container);
    return;
  }

  try {
    const agenda = await getAgenda();
    const now = new Date();
    container.innerHTML = "";

    if (agenda.tasks.length === 0) {
      const empty = el("div", "empty-state");
      empty.appendChild(el("div", "emoji", "🎉"));
      empty.appendChild(
        el("div", undefined, "Nothing scheduled. Your day is optimized."),
      );
      container.appendChild(empty);
      return;
    }

    const nextAction = agenda.nextAction;
    if (nextAction) {
      container.appendChild(renderTaskRow(nextAction, now, true));
    }

    const partition = partitionAgenda(agenda.tasks, now);
    renderSection(container, "Overdue", partition.overdue, now, nextAction?.id);
    renderSection(container, "Today", partition.today, now, nextAction?.id);
    renderSection(container, "Later", partition.later, now, nextAction?.id);
    renderSection(
      container,
      "Unscheduled",
      partition.unscheduled,
      now,
      nextAction?.id,
    );
  } catch (error) {
    if (error instanceof NotSignedInError) {
      renderSignIn(container, "Your session expired. Sign in again.");
      return;
    }
    renderError(
      container,
      error instanceof Error ? error.message : "Could not load your day.",
    );
  }
}
