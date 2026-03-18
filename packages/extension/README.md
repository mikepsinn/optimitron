# @optimitron/extension — Digital Twin Safe

Chrome extension for personal health tracking. **Layer 1** of the Optimitron architecture.

All data stays on your device. Nothing is ever sent to any server.

## Features

- **💊 Treatment Scheduler** — Configure treatments/supplements, get reminders, record Done/Skip/Snooze
- **📊 Symptom & Mood Rating** — Rate symptoms 1-5, track mood with emoji scale, single-click recording
- **🍽️ Food Logging** — Quick text entry, recent foods for one-tap re-logging
- **⏰ Smart Reminders** — chrome.alarms-based scheduling with quiet hours
- **📤 Data Export** — JSON backup or CSV (compatible with @optimitron/optimizer TimeSeries format)

## Install (Development)

```bash
# From monorepo root
pnpm install
pnpm --filter @optimitron/extension build
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `packages/extension/dist/`

## Architecture

```
src/
├── types/schema.ts          # Storage schema, preset symptoms, defaults
├── lib/
│   ├── storage.ts           # Typed chrome.storage.local wrappers
│   ├── export.ts            # JSON/CSV export
│   └── utils.ts             # Shared helpers
├── background/
│   └── service-worker.ts    # Alarms, notifications, scheduling
├── popup/
│   ├── index.ts             # Entry point, tab navigation
│   ├── treatments.ts        # Treatment cards with Done/Skip/Snooze
│   ├── symptoms.ts          # Mood emoji + symptom 1-5 ratings
│   └── food.ts              # Food input + recent foods chips
└── options/
    └── index.ts             # Settings: treatments, symptoms, reminders, export
```

## Storage Schema

All data uses `chrome.storage.local` with ISO 8601 timestamps:

- `treatments[]` — {id, name, dose, unit, frequency, reminders}
- `treatmentLogs[]` — {timestamp, treatmentId, action: done|skip|snooze}
- `symptomRatings[]` — {timestamp, symptomId, value: 1-5}
- `foodLogs[]` — {timestamp, description}
- `settings` — {reminderFrequencyMinutes, quietHours, activeSymptomIds}

## Future

- Direct integration with `@optimitron/optimizer` for on-device analysis
- Health data importers (Apple Health, Fitbit, Oura)
- Anonymous submission to Layer 3 (on-chain)
