/**
 * Symptom & Mood Rating — popup tab.
 * Single-click recording for minimum friction.
 */

import {
  getSettings,
  getSymptomDefinitions,
  addSymptomRating,
  getTodaysSymptomRatings,
} from "../lib/storage.js";
import type { SymptomRating } from "../types/schema.js";
import { formatTime, showToast } from "../lib/utils.js";

const SCALE_LABELS: Record<number, string> = {
  1: "1 — Terrible",
  2: "2 — Bad",
  3: "3 — Okay",
  4: "4 — Good",
  5: "5 — Great",
};

function renderSymptomItem(
  symptomId: string,
  symptomName: string,
  container: HTMLElement,
): void {
  const item = document.createElement("div");
  item.className = "symptom-item";
  item.innerHTML = `
    <div class="symptom-name">${symptomName}</div>
    <div class="symptom-scale">
      ${[1, 2, 3, 4, 5]
        .map(
          (v) =>
            `<button class="scale-btn" data-symptom="${symptomId}" data-value="${v}" title="${SCALE_LABELS[v] ?? ""}">${v}</button>`,
        )
        .join("")}
    </div>
  `;

  item.querySelectorAll<HTMLButtonElement>(".scale-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = Number(btn.dataset["value"]) as 1 | 2 | 3 | 4 | 5;
      await addSymptomRating({
        timestamp: new Date().toISOString(),
        symptomId,
        value,
      });

      // Visual feedback: highlight selected
      item.querySelectorAll(".scale-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");

      showToast(`${symptomName}: ${value}/5 recorded`);
      await renderSymptomLog();
    });
  });

  container.appendChild(item);
}

async function renderSymptomLog(): Promise<void> {
  const container = document.getElementById("symptom-log");
  if (!container) return;
  container.innerHTML = "";

  const todayRatings = await getTodaysSymptomRatings();
  if (todayRatings.length === 0) return;

  const defs = await getSymptomDefinitions();

  const header = document.createElement("h3");
  header.textContent = "Today's Ratings";
  container.appendChild(header);

  // Show most recent first
  const sorted = [...todayRatings].reverse();
  for (const r of sorted) {
    const sym = defs.find((s) => s.id === r.symptomId);
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = `
      <span class="log-time">${formatTime(r.timestamp)}</span>
      <span class="log-text">${sym?.name ?? r.symptomId}: ${r.value}/5</span>
    `;
    container.appendChild(div);
  }
}

export async function renderSymptoms(): Promise<void> {
  const settings = await getSettings();
  const allDefs = await getSymptomDefinitions();
  const todayRatings = await getTodaysSymptomRatings();

  // Mood buttons
  setupMoodButtons(todayRatings);

  // Symptom items (only active ones)
  const container = document.getElementById("symptom-list");
  if (!container) return;
  container.innerHTML = "";

  const activeSymptoms = allDefs.filter(
    (s) => settings.activeSymptomIds.includes(s.id) && s.id !== "mood",
  );

  if (activeSymptoms.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📊</div>
        No symptoms selected.<br>
        <a href="#" id="open-symptoms-settings">Configure in Settings</a>
      </div>
    `;
    const link = document.getElementById("open-symptoms-settings");
    link?.addEventListener("click", (e) => {
      e.preventDefault();
      void chrome.runtime.openOptionsPage();
    });
    return;
  }

  for (const sym of activeSymptoms) {
    renderSymptomItem(sym.id, sym.name, container);
  }

  // Highlight already-rated symptoms from today
  highlightTodaysRatings(todayRatings);

  await renderSymptomLog();
}

function setupMoodButtons(todayRatings: SymptomRating[]): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".mood-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = Number(btn.dataset["value"]) as 1 | 2 | 3 | 4 | 5;
      await addSymptomRating({
        timestamp: new Date().toISOString(),
        symptomId: "mood",
        value,
      });
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      showToast(`Mood: ${["", "😢", "😐", "🙂", "😊", "😄"][value]} recorded`);
      await renderSymptomLog();
    });
  });

  // Highlight most recent mood from today
  const todayMoods = todayRatings.filter((r) => r.symptomId === "mood");
  if (todayMoods.length > 0) {
    const lastMood = todayMoods[todayMoods.length - 1];
    if (lastMood) {
      const btn = document.querySelector<HTMLButtonElement>(
        `.mood-btn[data-value="${lastMood.value}"]`,
      );
      btn?.classList.add("selected");
    }
  }
}

function highlightTodaysRatings(todayRatings: SymptomRating[]): void {
  // For each symptom, highlight the last rating
  const lastRatings = new Map<string, number>();
  for (const r of todayRatings) {
    lastRatings.set(r.symptomId, r.value);
  }
  for (const [symptomId, value] of lastRatings) {
    const btn = document.querySelector<HTMLButtonElement>(
      `.scale-btn[data-symptom="${symptomId}"][data-value="${value}"]`,
    );
    btn?.classList.add("selected");
  }
}
