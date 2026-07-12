/**
 * Background service worker — handles alarms, notifications, and scheduling.
 * Uses chrome.alarms API for treatment reminders and symptom check-ins, plus
 * a 5-minute agenda poll against optimitron.com (badge + due notifications).
 */

import type { Treatment, Settings } from "../types/schema.js";
import { DEFAULT_SETTINGS, PRESET_SYMPTOMS } from "../types/schema.js";
import { isOverdue, snoozeUntil } from "../lib/agenda-logic.js";
import { isQuietHours as isAgendaQuietHours } from "../lib/quiet-hours.js";
import { completeTask, getAgenda, snoozeTask } from "../lib/api.js";
import { getValidAccessToken } from "../lib/auth.js";

// ---------- Storage helpers (duplicated to avoid import issues in SW) ----------

async function getStorageValue<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? fallback;
}

async function getTreatments(): Promise<Treatment[]> {
  return getStorageValue<Treatment[]>("treatments", []);
}

async function getSettings(): Promise<Settings> {
  return getStorageValue<Settings>("settings", { ...DEFAULT_SETTINGS });
}

// ---------- Quiet hours check ----------

function isQuietHours(settings: Settings): boolean {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const start = settings.quietHoursStart;
  const end = settings.quietHoursEnd;

  // Handle wrap-around (e.g., 22:00 - 08:00)
  if (start <= end) {
    return hhmm >= start && hhmm < end;
  }
  return hhmm >= start || hhmm < end;
}

// ---------- Alarm names ----------

const TREATMENT_REMINDER_ALARM = "treatment-reminder";
const SYMPTOM_CHECKIN_ALARM = "symptom-checkin";
const AGENDA_POLL_ALARM = "agenda-poll";
const AGENDA_POLL_MINUTES = 5;

// ---------- Agenda poll: badge + due notifications ----------

const AGENDA_NOTIFICATION_PREFIX = "agenda:";
const NOTIFIED_KEY = "agendaNotified";

/** taskId → dueAt ISO we already notified for (re-notify only if dueAt moves). */
async function getNotifiedMap(): Promise<Record<string, string>> {
  return getStorageValue<Record<string, string>>(NOTIFIED_KEY, {});
}

async function setBadge(overdueCount: number): Promise<void> {
  await chrome.action.setBadgeText({
    text: overdueCount > 0 ? String(overdueCount) : "",
  });
  if (overdueCount > 0) {
    await chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  }
}

async function pollAgenda(): Promise<void> {
  const token = await getValidAccessToken();
  if (!token) {
    await setBadge(0);
    return;
  }

  let agenda;
  try {
    agenda = await getAgenda();
  } catch {
    // Network/server failure — keep the last badge, try again next alarm.
    return;
  }

  const now = new Date();
  const due = agenda.tasks.filter(
    (task) => task.dueAt !== null && isOverdue(task, now),
  );
  await setBadge(due.length);

  // Quiet hours 23:30–08:30 America/Chicago: badge only, no notifications.
  if (isAgendaQuietHours(now)) return;

  const notified = await getNotifiedMap();
  const nextNotified: Record<string, string> = {};
  for (const task of due) {
    if (task.dueAt) nextNotified[task.id] = task.dueAt;
  }

  for (const task of due) {
    if (!task.dueAt) continue;
    if (notified[task.id] === task.dueAt) continue; // already notified for this dueAt
    await chrome.notifications.create(
      `${AGENDA_NOTIFICATION_PREFIX}${task.id}`,
      {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "📅 Due now",
        message: task.title,
        priority: 1,
        requireInteraction: true,
        buttons: [{ title: "✅ Done" }, { title: "⏰ Snooze 1h" }],
      },
    );
  }

  await chrome.storage.local.set({ [NOTIFIED_KEY]: nextNotified });
}

async function handleAgendaNotificationButton(
  notificationId: string,
  buttonIndex: number,
): Promise<void> {
  const taskId = notificationId.slice(AGENDA_NOTIFICATION_PREFIX.length);
  try {
    if (buttonIndex === 0) {
      await completeTask(taskId);
    } else {
      await snoozeTask(taskId, snoozeUntil("1h", new Date()).toISOString());
    }
    chrome.notifications.clear(notificationId);
    await pollAgenda();
  } catch {
    // Token expired or network down — leave the notification up.
  }
}

// ---------- Setup alarms ----------

async function setupAlarms(): Promise<void> {
  const settings = await getSettings();

  // Clear existing periodic alarms
  await chrome.alarms.clear(TREATMENT_REMINDER_ALARM);
  await chrome.alarms.clear(SYMPTOM_CHECKIN_ALARM);

  // Treatment reminder — check every hour
  await chrome.alarms.create(TREATMENT_REMINDER_ALARM, {
    periodInMinutes: 60,
    delayInMinutes: 1,
  });

  // Symptom check-in — based on user frequency setting
  await chrome.alarms.create(SYMPTOM_CHECKIN_ALARM, {
    periodInMinutes: settings.reminderFrequencyMinutes,
    delayInMinutes: settings.reminderFrequencyMinutes,
  });

  // Agenda poll — every 5 minutes while the browser runs
  await chrome.alarms.clear(AGENDA_POLL_ALARM);
  await chrome.alarms.create(AGENDA_POLL_ALARM, {
    periodInMinutes: AGENDA_POLL_MINUTES,
    delayInMinutes: 1,
  });
}

// ---------- Notification handlers ----------

async function showTreatmentReminder(): Promise<void> {
  const settings = await getSettings();
  if (isQuietHours(settings)) return;

  const treatments = await getTreatments();
  const remindable = treatments.filter((t) => t.reminders);
  if (remindable.length === 0) return;

  // Show a single notification summarizing treatments due
  const names = remindable.map((t) => `${t.name} ${t.dose}${t.unit}`).join(", ");
  await chrome.notifications.create(`treatment-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "💊 Treatment Reminder",
    message: `Did you take: ${names}?`,
    priority: 1,
    requireInteraction: true,
    buttons: [{ title: "✅ Open Tracker" }],
  });
}

async function showSymptomCheckin(): Promise<void> {
  const settings = await getSettings();
  if (isQuietHours(settings)) return;

  await chrome.notifications.create(`symptom-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "📊 How are you feeling?",
    message: "Tap to rate your symptoms and mood",
    priority: 0,
    buttons: [{ title: "📊 Rate Now" }],
  });
}

// ---------- Event listeners ----------

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TREATMENT_REMINDER_ALARM) {
    void showTreatmentReminder();
  } else if (alarm.name === SYMPTOM_CHECKIN_ALARM) {
    void showSymptomCheckin();
  } else if (alarm.name === AGENDA_POLL_ALARM) {
    void pollAgenda();
  } else if (alarm.name.startsWith("snooze-")) {
    // Snooze timer fired — show individual treatment reminder
    const treatmentId = alarm.name.replace("snooze-", "");
    void showSnoozedReminder(treatmentId);
  }
});

async function showSnoozedReminder(treatmentId: string): Promise<void> {
  const treatments = await getTreatments();
  const treatment = treatments.find((t) => t.id === treatmentId);
  if (!treatment) return;

  await chrome.notifications.create(`snooze-${treatmentId}-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "⏰ Snoozed Reminder",
    message: `Time to take: ${treatment.name} ${treatment.dose}${treatment.unit}`,
    priority: 2,
    requireInteraction: true,
    buttons: [{ title: "✅ Open Tracker" }],
  });
}

// Notification buttons: agenda notifications act on the task; health
// notifications just open the popup.
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (notifId.startsWith(AGENDA_NOTIFICATION_PREFIX)) {
    void handleAgendaNotificationButton(notifId, btnIdx);
    return;
  }
  // Open the extension popup (can't programmatically open popup, so open options as fallback)
  void chrome.action.openPopup().catch(() => {
    // openPopup not available in all contexts — user can just click the icon
  });
});

// Also open on notification click
chrome.notifications.onClicked.addListener((_notifId) => {
  void chrome.action.openPopup().catch(() => {
    // fallback: do nothing, user clicks extension icon
  });
});

// Initialize on install/update
chrome.runtime.onInstalled.addListener(async () => {
  // Ensure symptom definitions are initialized
  const result = await chrome.storage.local.get("symptomDefinitions");
  if (!result["symptomDefinitions"]) {
    await chrome.storage.local.set({ symptomDefinitions: PRESET_SYMPTOMS });
  }

  // Ensure settings are initialized
  const settingsResult = await chrome.storage.local.get("settings");
  if (!settingsResult["settings"]) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  await setupAlarms();
});

// Re-setup alarms when settings change
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes["settings"]) {
    void setupAlarms();
  }
});

// Setup on startup
void setupAlarms();
void pollAgenda();
