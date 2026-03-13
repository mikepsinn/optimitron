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
  getAllData,
} from "../lib/storage.js";
import { exportJSON, exportCSV, downloadFile } from "../lib/export.js";
import { generateId } from "../lib/utils.js";
import { generateAnalysisPairs, calculateDataSpanDays } from "../lib/analysis.js";
import type { Treatment, Settings } from "../types/schema.js";
import { PRESET_SYMPTOMS } from "../types/schema.js";
import type { WorkerProgress, WorkerResult, AnalysisRelationshipResult } from "../workers/analysis.worker.js";

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
// Analysis
// ============================================================

const WEB_APP_URL = "http://localhost:3001"; // TODO: change to production URL

let analysisResults: AnalysisRelationshipResult[] = [];
let sortField: string = "pis";
let sortAscending = false;

async function getOrCreateContributorId(): Promise<string> {
  const result = await chrome.storage.local.get("contributorId");
  if (result["contributorId"]) return result["contributorId"] as string;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ contributorId: id });
  return id;
}

function setupAnalysis(): void {
  const runBtn = document.getElementById("run-analysis-btn");
  runBtn?.addEventListener("click", () => void runAnalysis());

  const shareBtn = document.getElementById("share-results-btn");
  shareBtn?.addEventListener("click", () => void shareResults());

  const selectAll = document.getElementById("select-all-results") as HTMLInputElement | null;
  selectAll?.addEventListener("change", () => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(".result-checkbox");
    for (const cb of checkboxes) {
      cb.checked = selectAll.checked;
    }
  });

  // Sort headers
  const headers = document.querySelectorAll<HTMLElement>(".sortable");
  for (const header of headers) {
    header.addEventListener("click", () => {
      const field = header.dataset["sort"];
      if (!field) return;
      if (sortField === field) {
        sortAscending = !sortAscending;
      } else {
        sortField = field;
        sortAscending = false;
      }
      renderAnalysisTable();
    });
  }

  // Set verify personhood link
  const verifyLink = document.getElementById("verify-personhood-link") as HTMLAnchorElement | null;
  if (verifyLink) {
    verifyLink.href = `${WEB_APP_URL}/personhood`;
  }
}

async function runAnalysis(): Promise<void> {
  const progressDiv = document.getElementById("analysis-progress");
  const progressBar = document.getElementById("analysis-progress-bar");
  const progressText = document.getElementById("analysis-progress-text");
  const resultsDiv = document.getElementById("analysis-results");
  const runBtn = document.getElementById("run-analysis-btn") as HTMLButtonElement | null;

  if (!progressDiv || !progressBar || !progressText || !resultsDiv || !runBtn) return;

  runBtn.disabled = true;
  progressDiv.style.display = "block";
  resultsDiv.style.display = "none";

  const data = await getAllData();
  const pairs = generateAnalysisPairs(data);

  if (pairs.length === 0) {
    progressText.textContent = "No predictor-outcome pairs found. Log treatments/food and symptoms first.";
    runBtn.disabled = false;
    return;
  }

  progressText.textContent = `Analyzing ${pairs.length} pairs...`;

  const worker = new Worker(chrome.runtime.getURL("workers/analysis.worker.js"));

  worker.onmessage = (event: MessageEvent<WorkerProgress | WorkerResult>) => {
    const msg = event.data;
    if (msg.type === "progress") {
      const pct = Math.round((msg.completed / msg.total) * 100);
      progressBar.style.width = `${pct}%`;
      progressText.textContent = `(${msg.completed}/${msg.total}) ${msg.currentPair}`;
    } else if (msg.type === "result") {
      analysisResults = msg.relationships;
      progressBar.style.width = "100%";
      progressText.textContent = `Done! ${msg.relationships.length} relationships found, ${msg.errors.length} errors.`;
      renderAnalysisTable();
      renderAnalysisErrors(msg.errors);
      resultsDiv.style.display = "block";
      runBtn.disabled = false;
      worker.terminate();
    }
  };

  worker.onerror = (err) => {
    progressText.textContent = `Worker error: ${err.message}`;
    runBtn.disabled = false;
    worker.terminate();
  };

  worker.postMessage({ type: "run-analysis", pairs });
}

function renderAnalysisTable(): void {
  const tbody = document.getElementById("analysis-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const sorted = [...analysisResults].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;
    switch (sortField) {
      case "predictor": aVal = a.predictorName; bVal = b.predictorName; break;
      case "outcome": aVal = a.outcomeName; bVal = b.outcomeName; break;
      case "pis": aVal = a.pisScore ?? 0; bVal = b.pisScore ?? 0; break;
      case "grade": aVal = a.evidenceGrade ?? "F"; bVal = b.evidenceGrade ?? "F"; break;
      case "effect": aVal = a.effectSize; bVal = b.effectSize; break;
      case "pairs": aVal = a.numberOfPairs; bVal = b.numberOfPairs; break;
    }
    const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return sortAscending ? cmp : -cmp;
  });

  for (const r of sorted) {
    const tr = document.createElement("tr");
    const gradeClass = r.evidenceGrade ? `grade-${r.evidenceGrade.toLowerCase()}` : "";
    tr.innerHTML = `
      <td><input type="checkbox" class="result-checkbox" data-predictor="${r.predictorVariableId}" data-outcome="${r.outcomeVariableId}" checked></td>
      <td>${r.predictorName}</td>
      <td>${r.outcomeName}</td>
      <td>${(r.pisScore ?? 0).toFixed(3)}</td>
      <td class="${gradeClass}">${r.evidenceGrade ?? "-"}</td>
      <td>${r.effectSize.toFixed(1)}%</td>
      <td>${r.numberOfPairs}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderAnalysisErrors(errors: string[]): void {
  const errDiv = document.getElementById("analysis-errors");
  if (!errDiv) return;
  if (errors.length === 0) {
    errDiv.style.display = "none";
    return;
  }
  errDiv.style.display = "block";
  errDiv.innerHTML = `<strong>${errors.length} pair(s) failed:</strong><br>${errors.map((e) => `• ${e}`).join("<br>")}`;
}

async function shareResults(): Promise<void> {
  const statusEl = document.getElementById("share-status");
  if (!statusEl) return;

  const checkboxes = document.querySelectorAll<HTMLInputElement>(".result-checkbox:checked");
  const selectedKeys = new Set(
    Array.from(checkboxes).map((cb) => `${cb.dataset["predictor"]}|${cb.dataset["outcome"]}`),
  );

  const selected = analysisResults.filter(
    (r) => selectedKeys.has(`${r.predictorVariableId}|${r.outcomeVariableId}`),
  );

  if (selected.length === 0) {
    statusEl.style.display = "block";
    statusEl.textContent = "No results selected.";
    return;
  }

  statusEl.style.display = "block";
  statusEl.textContent = "Sharing...";

  try {
    const contributorId = await getOrCreateContributorId();
    const data = await getAllData();
    const dataSpanDays = calculateDataSpanDays(data);

    const response = await fetch(`${WEB_APP_URL}/api/health-analysis/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contributorId,
        relationships: selected.map((r) => ({
          predictorVariableId: r.predictorVariableId,
          outcomeVariableId: r.outcomeVariableId,
          forwardPearson: r.forwardPearson,
          reversePearson: r.reversePearson,
          predictivePearson: r.predictivePearson,
          effectSize: r.effectSize,
          statisticalSignificance: r.statisticalSignificance,
          numberOfPairs: r.numberOfPairs,
          valuePredictingHighOutcome: r.valuePredictingHighOutcome,
          valuePredictingLowOutcome: r.valuePredictingLowOutcome,
          optimalDailyValue: r.optimalDailyValue,
          outcomeFollowUpPercentChangeFromBaseline: r.outcomeFollowUpPercentChangeFromBaseline,
          evidenceGrade: r.evidenceGrade,
          pisScore: r.pisScore,
        })),
        dataSpanDays,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      statusEl.textContent = `Failed: ${err.error ?? response.statusText}`;
      return;
    }

    const result = await response.json();
    statusEl.textContent = `Shared ${selected.length} results. CID: ${result.cid ?? "saved"}`;
  } catch (err) {
    statusEl.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ============================================================
// Init
// ============================================================

async function init(): Promise<void> {
  setupAddTreatment();
  setupAddCustomSymptom();
  setupExport();
  setupAnalysis();

  await Promise.all([
    renderTreatmentList(),
    renderPresetSymptoms(),
    renderCustomSymptoms(),
    renderReminderSettings(),
  ]);
}

void init();
