/**
 * Treatment Scheduler & Tracker — popup tab.
 * Shows configured treatments with Done/Skip/Snooze buttons.
 * Displays today's treatment log.
 */

import {
  getTreatments,
  addTreatmentLog,
  getTodaysTreatmentLogs,
} from "../lib/storage.js";
import type { Treatment, TreatmentLog } from "../types/schema.js";
import { formatTime, actionIcon, showToast } from "../lib/utils.js";

function renderTreatmentCard(
  treatment: Treatment,
  todayLogs: TreatmentLog[],
  container: HTMLElement,
): void {
  const logsForThis = todayLogs.filter((l) => l.treatmentId === treatment.id);
  const lastAction = logsForThis.length > 0 ? logsForThis[logsForThis.length - 1]?.action : null;

  const card = document.createElement("div");
  card.className = "treatment-card";

  const doneClass = lastAction === "done" ? ' style="opacity:0.5"' : "";
  card.innerHTML = `
    <div${doneClass}>
      <div class="name">${treatment.name}</div>
      <div class="dose">${treatment.dose} ${treatment.unit} · ${treatment.frequency}</div>
    </div>
    <div class="treatment-actions">
      <button class="btn btn-success btn-small action-btn" data-action="done">✅ Done</button>
      <button class="btn btn-secondary btn-small action-btn" data-action="skip">⏭️ Skip</button>
      <div class="snooze-dropdown">
        <button class="btn btn-warning btn-small snooze-trigger">⏰ Snooze</button>
        <div class="snooze-options">
          <button class="snooze-option" data-minutes="15">15 minutes</button>
          <button class="snooze-option" data-minutes="30">30 minutes</button>
          <button class="snooze-option" data-minutes="60">1 hour</button>
        </div>
      </div>
    </div>
  `;

  // Action buttons
  card.querySelectorAll<HTMLButtonElement>(".action-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset["action"] as "done" | "skip";
      await addTreatmentLog({
        timestamp: new Date().toISOString(),
        treatmentId: treatment.id,
        action,
      });
      showToast(`${treatment.name}: ${action === "done" ? "Recorded ✅" : "Skipped ⏭️"}`);
      await renderTreatments();
    });
  });

  // Snooze toggle
  const snoozeTrigger = card.querySelector<HTMLButtonElement>(".snooze-trigger");
  const snoozeOptions = card.querySelector<HTMLElement>(".snooze-options");
  snoozeTrigger?.addEventListener("click", () => {
    snoozeOptions?.classList.toggle("show");
  });

  // Snooze options
  card.querySelectorAll<HTMLButtonElement>(".snooze-option").forEach((opt) => {
    opt.addEventListener("click", async () => {
      const minutes = Number(opt.dataset["minutes"]);
      // Create alarm for snooze
      await chrome.alarms.create(`snooze-${treatment.id}`, {
        delayInMinutes: minutes,
      });
      await addTreatmentLog({
        timestamp: new Date().toISOString(),
        treatmentId: treatment.id,
        action: "snooze",
      });
      showToast(`${treatment.name}: Snoozed for ${minutes} min ⏰`);
      snoozeOptions?.classList.remove("show");
      await renderTreatments();
    });
  });

  container.appendChild(card);
}

function renderLog(todayLogs: TreatmentLog[], treatments: Treatment[], container: HTMLElement): void {
  container.innerHTML = "";
  if (todayLogs.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">📋</div>No entries yet today</div>`;
    return;
  }

  // Reverse to show most recent first
  const sorted = [...todayLogs].reverse();
  for (const log of sorted) {
    const t = treatments.find((x) => x.id === log.treatmentId);
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = `
      <span class="log-time">${formatTime(log.timestamp)}</span>
      <span class="log-action">${actionIcon(log.action)}</span>
      <span class="log-text">${t?.name ?? log.treatmentId} ${t ? `${t.dose} ${t.unit}` : ""}</span>
    `;
    container.appendChild(div);
  }
}

export async function renderTreatments(): Promise<void> {
  const treatments = await getTreatments();
  const todayLogs = await getTodaysTreatmentLogs();

  const remindersContainer = document.getElementById("treatment-reminders");
  const logContainer = document.getElementById("treatment-log");
  if (!remindersContainer || !logContainer) return;

  remindersContainer.innerHTML = "";
  if (treatments.length === 0) {
    remindersContainer.innerHTML = `
      <div class="empty-state">
        <div class="emoji">💊</div>
        No treatments configured.<br>
        <a href="#" id="open-settings-link">Add treatments in Settings</a>
      </div>
    `;
    const link = document.getElementById("open-settings-link");
    link?.addEventListener("click", (e) => {
      e.preventDefault();
      void chrome.runtime.openOptionsPage();
    });
  } else {
    for (const t of treatments) {
      renderTreatmentCard(t, todayLogs, remindersContainer);
    }
  }

  renderLog(todayLogs, treatments, logContainer);
}
