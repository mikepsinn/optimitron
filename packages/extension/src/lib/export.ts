/**
 * Export data as JSON or CSV.
 * CSV format is compatible with @optimitron/optimizer TimeSeries:
 *   { timestamp, variableId, value, unit?, source? }
 */

import { getAllData } from "./storage.js";
import type { StorageSchema } from "../types/schema.js";

// ---------- JSON export ----------

export async function exportJSON(): Promise<string> {
  const data = await getAllData();
  return JSON.stringify(data, null, 2);
}

// ---------- CSV export ----------

interface TimeSeriesRow {
  timestamp: string;
  variableId: string;
  value: string;
  unit: string;
  source: string;
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function toCSV(rows: TimeSeriesRow[]): string {
  const header = "timestamp,variableId,value,unit,source";
  const lines = rows.map(
    (r) =>
      `${escapeCSV(r.timestamp)},${escapeCSV(r.variableId)},${escapeCSV(r.value)},${escapeCSV(r.unit)},${escapeCSV(r.source)}`,
  );
  return [header, ...lines].join("\n");
}

function dataToTimeSeries(data: StorageSchema): TimeSeriesRow[] {
  const rows: TimeSeriesRow[] = [];

  // Treatment logs → action as value
  for (const log of data.treatmentLogs) {
    const treatment = data.treatments.find((t) => t.id === log.treatmentId);
    const name = treatment ? `${treatment.name} ${treatment.dose}${treatment.unit}` : log.treatmentId;
    rows.push({
      timestamp: log.timestamp,
      variableId: `treatment:${name}`,
      value: log.action === "done" ? "1" : "0",
      unit: treatment?.unit ?? "",
      source: "digital-twin-safe",
    });
  }

  // Symptom ratings
  for (const rating of data.symptomRatings) {
    const sym = data.symptomDefinitions.find((s) => s.id === rating.symptomId);
    const name = sym?.name ?? rating.symptomId;
    rows.push({
      timestamp: rating.timestamp,
      variableId: `symptom:${name}`,
      value: String(rating.value),
      unit: "/5",
      source: "digital-twin-safe",
    });
  }

  // Food logs
  for (const food of data.foodLogs) {
    rows.push({
      timestamp: food.timestamp,
      variableId: `food:${food.description}`,
      value: "1",
      unit: "serving",
      source: "digital-twin-safe",
    });
  }

  // Sort by timestamp
  rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return rows;
}

export async function exportCSV(): Promise<string> {
  const data = await getAllData();
  const rows = dataToTimeSeries(data);
  return toCSV(rows);
}

// ---------- Download trigger ----------

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
