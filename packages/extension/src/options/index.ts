/**
 * Settings/Options page — manage treatments, symptoms, reminders, and export data.
 */

import {
  getTreatments,
  saveTreatment,
  removeTreatment,
  getSymptomDefinitions,
  addCustomSymptom,
  removeSymptom,
  getSettings,
  saveSettings,
  clearAllData,
} from "../lib/storage.js";
import { exportJSON, exportCSV, downloadFile } from "../lib/export.js";
import { generateId } from "../lib/utils.js";
import type { Treatment, Settings } from "../types/schema.js";
import { PRESET_SYMPTOMS } from "../types/schema.js";

// ============================================================
// Treatments
// ============================================================

async function renderTreatmentList(): Promise<void> {
  const container = document.getElementById("treatment-list");
  if (!container) return;
  container.innerHTML = "";

  const treatments = await getTreatments();
  if (treatments.length === 0) {
    container.innerHTML = `<p style="color:#94a3b8;font-size:13px">No treatments added yet.</p>`;
    return;
  }

  for (const t of treatments) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="item-info">
        <div class="item-name">${t.name}</div>
        <div class="item-detail">${t.dose} ${t.unit} · ${t.frequency} · Reminders: ${t.reminders ? "On" : "Off"}</div>
      </div>
      <label style="font-size:12px;margin-right:8px;cursor:pointer">
        <input type="checkbox" class="reminder-toggle" data-id="${t.id}" ${t.reminders ? "checked" : ""}> 🔔
      </label>
      <button class="remove-btn" data-id="${t.id}" title="Remove">✕</button>
    `;

    // Toggle reminders
    item.querySelector<HTMLInputElement>(".reminder-toggle")?.addEventListener("change", async (e) => {
      const cb = e.target as HTMLInputElement;
      await saveTreatment({ ...t, reminders: cb.checked });
    });

    // Remove
    item.querySelector<HTMLButtonElement>(".remove-btn")?.addEventListener("click", async () => {
      await removeTreatment(t.id);
      await renderTreatmentList();
    });

    container.appendChild(item);
  }
}

function setupAddTreatment(): void {
  const addBtn = document.getElementById("add-treatment-btn");
  addBtn?.addEventListener("click", async () => {
    const name = (document.getElementById("treatment-name") as HTMLInputElement).value.trim();
    const dose = (document.getElementById("treatment-dose") as HTMLInputElement).value.trim();
    const unit = (document.getElementById("treatment-unit") as HTMLSelectElement).value;
    const frequency = (document.getElementById("treatment-frequency") as HTMLSelectElement)
      .value as Treatment["frequency"];

    if (!name) return;

    await saveTreatment({
      id: generateId(),
      name,
      dose,
      unit,
      frequency,
      reminders: true,
    });

    // Clear inputs
    (document.getElementById("treatment-name") as HTMLInputElement).value = "";
    (document.getElementById("treatment-dose") as HTMLInputElement).value = "";

    await renderTreatmentList();
  });
}

// ============================================================
// Symptoms
// ============================================================

async function renderPresetSymptoms(): Promise<void> {
  const container = document.getElementById("preset-symptoms");
  if (!container) return;
  container.innerHTML = "";

  const settings = await getSettings();

  for (const preset of PRESET_SYMPTOMS) {
    const isActive = settings.activeSymptomIds.includes(preset.id);
    const toggle = document.createElement("label");
    toggle.className = `symptom-toggle ${isActive ? "active" : ""}`;
    toggle.innerHTML = `
      <input type="checkbox" data-id="${preset.id}" ${isActive ? "checked" : ""}>
      ${preset.name}
    `;

    toggle.querySelector<HTMLInputElement>("input")?.addEventListener("change", async (e) => {
      const cb = e.target as HTMLInputElement;
      const s = await getSettings();
      if (cb.checked) {
        s.activeSymptomIds.push(preset.id);
      } else {
        s.activeSymptomIds = s.activeSymptomIds.filter((id) => id !== preset.id);
      }
      await saveSettings(s);
      toggle.classList.toggle("active", cb.checked);
    });

    container.appendChild(toggle);
  }
}

async function renderCustomSymptoms(): Promise<void> {
  const container = document.getElementById("custom-symptom-list");
  if (!container) return;
  container.innerHTML = "";

  const defs = await getSymptomDefinitions();
  const customs = defs.filter((s) => s.isCustom);

  for (const sym of customs) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="item-info"><div class="item-name">${sym.name}</div></div>
      <button class="remove-btn" data-id="${sym.id}" title="Remove">✕</button>
    `;

    item.querySelector<HTMLButtonElement>(".remove-btn")?.addEventListener("click", async () => {
      await removeSymptom(sym.id);
      // Also remove from active symptoms
      const s = await getSettings();
      s.activeSymptomIds = s.activeSymptomIds.filter((id) => id !== sym.id);
      await saveSettings(s);
      await renderCustomSymptoms();
    });

    container.appendChild(item);
  }
}

function setupAddCustomSymptom(): void {
  const addBtn = document.getElementById("add-custom-symptom-btn");
  addBtn?.addEventListener("click", async () => {
    const input = document.getElementById("custom-symptom-name") as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;

    const sym = await addCustomSymptom(name);

    // Auto-enable it
    const s = await getSettings();
    s.activeSymptomIds.push(sym.id);
    await saveSettings(s);

    input.value = "";
    await renderCustomSymptoms();
  });
}

// ============================================================
// Reminder settings
// ============================================================

async function renderReminderSettings(): Promise<void> {
  const settings = await getSettings();

  const freqSelect = document.getElementById("reminder-frequency") as HTMLSelectElement | null;
  const quietStart = document.getElementById("quiet-start") as HTMLInputElement | null;
  const quietEnd = document.getElementById("quiet-end") as HTMLInputElement | null;

  if (freqSelect) freqSelect.value = String(settings.reminderFrequencyMinutes);
  if (quietStart) quietStart.value = settings.quietHoursStart;
  if (quietEnd) quietEnd.value = settings.quietHoursEnd;

  // Save on change
  const saveReminders = async (): Promise<void> => {
    const s = await getSettings();
    if (freqSelect) s.reminderFrequencyMinutes = Number(freqSelect.value);
    if (quietStart) s.quietHoursStart = quietStart.value;
    if (quietEnd) s.quietHoursEnd = quietEnd.value;
    await saveSettings(s);
  };

  freqSelect?.addEventListener("change", () => void saveReminders());
  quietStart?.addEventListener("change", () => void saveReminders());
  quietEnd?.addEventListener("change", () => void saveReminders());
}

// ============================================================
// Data export
// ============================================================

function setupExport(): void {
  document.getElementById("export-json-btn")?.addEventListener("click", async () => {
    const json = await exportJSON();
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(json, `digital-twin-safe-${date}.json`, "application/json");
  });

  document.getElementById("export-csv-btn")?.addEventListener("click", async () => {
    const csv = await exportCSV();
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `digital-twin-safe-${date}.csv`, "text/csv");
  });

  document.getElementById("clear-data-btn")?.addEventListener("click", async () => {
    if (confirm("⚠️ This will permanently delete ALL your data. Are you sure?")) {
      if (confirm("Really? This cannot be undone.")) {
        await clearAllData();
        window.location.reload();
      }
    }
  });
}

// ============================================================
// Init
// ============================================================

async function init(): Promise<void> {
  setupAddTreatment();
  setupAddCustomSymptom();
  setupExport();

  await Promise.all([
    renderTreatmentList(),
    renderPresetSymptoms(),
    renderCustomSymptoms(),
    renderReminderSettings(),
  ]);
}

void init();
