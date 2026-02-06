/** All data stored in chrome.storage.local. Never leaves the device. */

export interface Treatment {
  id: string;
  name: string;
  dose: string;
  unit: string;
  frequency: "daily" | "twice-daily" | "weekly" | "as-needed";
  reminders: boolean;
}

export interface TreatmentLog {
  timestamp: string; // ISO 8601
  treatmentId: string;
  action: "done" | "skip" | "snooze";
}

export interface SymptomDefinition {
  id: string;
  name: string;
  isCustom: boolean;
}

export interface SymptomRating {
  timestamp: string; // ISO 8601
  symptomId: string;
  value: 1 | 2 | 3 | 4 | 5;
}

export interface FoodLog {
  timestamp: string; // ISO 8601
  description: string;
}

export interface Settings {
  reminderFrequencyMinutes: number;
  quietHoursStart: string; // "HH:MM"
  quietHoursEnd: string; // "HH:MM"
  activeSymptomIds: string[];
}

export interface StorageSchema {
  treatments: Treatment[];
  treatmentLogs: TreatmentLog[];
  symptomDefinitions: SymptomDefinition[];
  symptomRatings: SymptomRating[];
  foodLogs: FoodLog[];
  settings: Settings;
}

/** Preset symptoms users can toggle on/off. */
export const PRESET_SYMPTOMS: SymptomDefinition[] = [
  { id: "energy", name: "Energy", isCustom: false },
  { id: "pain", name: "Pain", isCustom: false },
  { id: "sleep-quality", name: "Sleep Quality", isCustom: false },
  { id: "anxiety", name: "Anxiety", isCustom: false },
  { id: "focus", name: "Focus", isCustom: false },
  { id: "digestion", name: "Digestion", isCustom: false },
  { id: "mood", name: "Mood", isCustom: false },
  { id: "headache", name: "Headache", isCustom: false },
  { id: "joint-stiffness", name: "Joint Stiffness", isCustom: false },
  { id: "brain-fog", name: "Brain Fog", isCustom: false },
];

export const DEFAULT_SETTINGS: Settings = {
  reminderFrequencyMinutes: 120,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  activeSymptomIds: ["energy", "pain", "sleep-quality", "mood"],
};
