/**
 * Food/Intake Logging — popup tab.
 * Quick text entry + recent foods for one-tap re-logging.
 */

import { addFoodLog, getTodaysFoodLogs, getRecentFoods } from "../lib/storage.js";
import { formatTime, showToast } from "../lib/utils.js";

async function logFood(description: string): Promise<void> {
  const trimmed = description.trim();
  if (!trimmed) return;

  await addFoodLog({
    timestamp: new Date().toISOString(),
    description: trimmed,
  });

  showToast(`🍽️ "${trimmed}" logged`);
  await renderFood();
}

async function renderRecentFoods(container: HTMLElement): Promise<void> {
  container.innerHTML = "";
  const recent = await getRecentFoods(12);

  if (recent.length === 0) {
    container.innerHTML = `<span style="color:#94a3b8;font-size:12px">No recent foods yet</span>`;
    return;
  }

  for (const food of recent) {
    const chip = document.createElement("button");
    chip.className = "food-chip";
    chip.textContent = food;
    chip.addEventListener("click", () => void logFood(food));
    container.appendChild(chip);
  }
}

async function renderFoodLog(container: HTMLElement): Promise<void> {
  container.innerHTML = "";
  const todayLogs = await getTodaysFoodLogs();

  if (todayLogs.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">🍽️</div>No food logged today</div>`;
    return;
  }

  const sorted = [...todayLogs].reverse();
  for (const log of sorted) {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = `
      <span class="log-time">${formatTime(log.timestamp)}</span>
      <span class="log-text">${log.description}</span>
    `;
    container.appendChild(div);
  }
}

export async function renderFood(): Promise<void> {
  const recentContainer = document.getElementById("recent-foods");
  const logContainer = document.getElementById("food-log");
  if (recentContainer) await renderRecentFoods(recentContainer);
  if (logContainer) await renderFoodLog(logContainer);
}

export function setupFoodInput(): void {
  const input = document.getElementById("food-input") as HTMLInputElement | null;
  const addBtn = document.getElementById("food-add-btn");

  if (!input || !addBtn) return;

  const submit = (): void => {
    void logFood(input.value);
    input.value = "";
    input.focus();
  };

  addBtn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}
