/**
 * Typed wrappers around chrome.storage.local.
 * All data stays on-device — nothing is ever sent to any server.
 */

import type {
  Treatment,
  TreatmentLog,
  SymptomDefinition,
  SymptomRating,
  FoodLog,
  Settings,
  StorageSchema,
} from "../types/schema.js";
import { DEFAULT_SETTINGS, PRESET_SYMPTOMS } from "../types/schema.js";

// ---------- helpers ----------

async function get<K extends keyof StorageSchema>(
  key: K,
): Promise<StorageSchema[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as StorageSchema[K] | undefined;
}

async function set<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ---------- Treatments ----------

export async function getTreatments(): Promise<Treatment[]> {
  return (await get("treatments")) ?? [];
}

export async function saveTreatment(t: Treatment): Promise<void> {
  const list = await getTreatments();
  const idx = list.findIndex((x) => x.id === t.id);
  if (idx >= 0) {
    list[idx] = t;
  } else {
    list.push(t);
  }
  await set("treatments", list);
}

export async function removeTreatment(id: string): Promise<void> {
  const list = await getTreatments();
  await set(
    "treatments",
    list.filter((t) => t.id !== id),
  );
}

// ---------- Treatment Logs ----------

export async function getTreatmentLogs(): Promise<TreatmentLog[]> {
  return (await get("treatmentLogs")) ?? [];
}

export async function addTreatmentLog(log: TreatmentLog): Promise<void> {
  const logs = await getTreatmentLogs();
  logs.push(log);
  await set("treatmentLogs", logs);
}

export async function getTodaysTreatmentLogs(): Promise<TreatmentLog[]> {
  const logs = await getTreatmentLogs();
  const today = new Date().toISOString().slice(0, 10);
  return logs.filter((l) => l.timestamp.startsWith(today));
}

// ---------- Symptom Definitions ----------

export async function getSymptomDefinitions(): Promise<SymptomDefinition[]> {
  const stored = await get("symptomDefinitions");
  if (stored) return stored;
  // Initialize with presets on first use
  await set("symptomDefinitions", PRESET_SYMPTOMS);
  return PRESET_SYMPTOMS;
}

export async function addCustomSymptom(name: string): Promise<SymptomDefinition> {
  const defs = await getSymptomDefinitions();
  const sym: SymptomDefinition = {
    id: `custom-${Date.now()}`,
    name,
    isCustom: true,
  };
  defs.push(sym);
  await set("symptomDefinitions", defs);
  return sym;
}

export async function removeSymptom(id: string): Promise<void> {
  const defs = await getSymptomDefinitions();
  await set(
    "symptomDefinitions",
    defs.filter((s) => s.id !== id),
  );
}

// ---------- Symptom Ratings ----------

export async function getSymptomRatings(): Promise<SymptomRating[]> {
  return (await get("symptomRatings")) ?? [];
}

export async function addSymptomRating(rating: SymptomRating): Promise<void> {
  const ratings = await getSymptomRatings();
  ratings.push(rating);
  await set("symptomRatings", ratings);
}

export async function getTodaysSymptomRatings(): Promise<SymptomRating[]> {
  const ratings = await getSymptomRatings();
  const today = new Date().toISOString().slice(0, 10);
  return ratings.filter((r) => r.timestamp.startsWith(today));
}

// ---------- Food Logs ----------

export async function getFoodLogs(): Promise<FoodLog[]> {
  return (await get("foodLogs")) ?? [];
}

export async function addFoodLog(entry: FoodLog): Promise<void> {
  const logs = await getFoodLogs();
  logs.push(entry);
  await set("foodLogs", logs);
}

export async function getTodaysFoodLogs(): Promise<FoodLog[]> {
  const logs = await getFoodLogs();
  const today = new Date().toISOString().slice(0, 10);
  return logs.filter((l) => l.timestamp.startsWith(today));
}

export async function getRecentFoods(limit = 10): Promise<string[]> {
  const logs = await getFoodLogs();
  // Unique recent food descriptions (most recent first)
  const seen = new Set<string>();
  const result: string[] = [];
  for (let i = logs.length - 1; i >= 0 && result.length < limit; i--) {
    const desc = logs[i]?.description.toLowerCase().trim();
    if (desc && !seen.has(desc)) {
      seen.add(desc);
      result.push(logs[i]!.description);
    }
  }
  return result;
}

// ---------- Settings ----------

export async function getSettings(): Promise<Settings> {
  return (await get("settings")) ?? { ...DEFAULT_SETTINGS };
}

export async function saveSettings(s: Settings): Promise<void> {
  await set("settings", s);
}

// ---------- Bulk export ----------

export async function getAllData(): Promise<StorageSchema> {
  const result = await chrome.storage.local.get(null);
  return {
    treatments: (result["treatments"] as Treatment[] | undefined) ?? [],
    treatmentLogs: (result["treatmentLogs"] as TreatmentLog[] | undefined) ?? [],
    symptomDefinitions:
      (result["symptomDefinitions"] as SymptomDefinition[] | undefined) ?? PRESET_SYMPTOMS,
    symptomRatings: (result["symptomRatings"] as SymptomRating[] | undefined) ?? [],
    foodLogs: (result["foodLogs"] as FoodLog[] | undefined) ?? [],
    settings: (result["settings"] as Settings | undefined) ?? { ...DEFAULT_SETTINGS },
  };
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
}
