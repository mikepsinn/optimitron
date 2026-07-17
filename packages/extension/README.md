# @optimitron/extension - Digital Twin Safe

Chrome MV3 client for private local health data, an authenticated Optimitron agenda, explicit browser capture, reviewed task ingestion, and exact outbound approvals.

Feature maturity is tracked in `docs/FEATURES.md` under OPT-EXT-01 and OPT-EXT-02. The health tracker and OAuth agenda ship today. Capture, local extraction, review, and approvals are the approved next phase and must not be described as shipped until their tests pass.

## Boundary

- Health logs and causal analysis stay in `chrome.storage.local` and the analysis worker.
- Agenda requests use OAuth and scoped Optimitron APIs. They do not upload health records.
- Raw browser or file content may be captured only by an explicit user action and processed in memory by a configured localhost companion.
- The server may receive only reviewed candidates and safe provenance: channel, anchors, timestamps, participant aliases, hashes, approved excerpts, and model metadata.
- The extension is not a browser-control agent, persistent scraper, ambient history reader, password store, or whole-account message importer. Codex and Claude Code own general browser and connector interaction.

## Current Features

- Treatment scheduling, alarms, done/skip/snooze logs, and quiet hours.
- Symptom, mood, and food logging.
- JSON and optimizer-compatible CSV export.
- On-device `@optimitron/optimizer` causal analysis in a Web Worker.
- OAuth sign-in and server-backed agenda actions for the user's task queue.
- Vitest coverage for agenda selection, authentication logic, and quiet hours.

## Approved Next Features

- `Capture`: selected visible text or a selected export file, using temporary `activeTab` and `scripting` permissions only.
- `Review`: local extraction into actions, decisions, blockers, commitments, follow-ups, confidence, and source anchors. Every grounded action is selected by default; nothing is applied before human review.
- `Approvals`: exact immutable operation, destination, and payload. Editing creates a new request and hash.
- Local companion under `src/companion/`: accepts native messages/files, calls a configured localhost OpenAI-compatible endpoint, and returns structured candidates. Phase 1 keeps raw text in memory only.

## Install

```bash
pnpm install
pnpm --filter @optimitron/extension build
```

Then open `chrome://extensions`, enable Developer mode, choose Load unpacked, and select `packages/extension/dist/`.

## Architecture

```text
src/
|-- types/schema.ts             local storage and DTO types
|-- lib/storage.ts              typed chrome.storage.local access
|-- lib/auth.ts                 OAuth flow
|-- lib/api.ts                  scoped Optimitron agenda API
|-- lib/agenda-logic.ts         pure agenda selection logic
|-- lib/export.ts               local JSON/CSV export
|-- background/service-worker.ts alarms, notifications, and OAuth callbacks
|-- popup/agenda.ts             authenticated task agenda
|-- popup/treatments.ts         treatment actions
|-- popup/symptoms.ts           ratings
|-- popup/food.ts               food entry
|-- options/index.ts            settings and export
`-- workers/analysis.worker.ts  on-device causal analysis
```

The approved capture implementation adds `companion/`, capture/review/approval libraries, and Agenda/Capture/Review/Approvals tabs without introducing a second task or document system.

## Local Storage

- `treatments[]`: configured treatment schedules.
- `treatmentLogs[]`: timestamped done, skip, and snooze events.
- `symptomRatings[]`: timestamped 1-5 ratings.
- `foodLogs[]`: timestamped descriptions.
- `settings`: reminder, quiet-hours, and local endpoint configuration.
- OAuth tokens and agenda cache: scoped server credentials/state, never health data.

Raw captured source text is not a durable storage record in Phase 1. Reviewed safe candidates may be cached only long enough to complete or discard the review.

## Checks

```bash
pnpm --filter @optimitron/extension test
pnpm --filter @optimitron/extension exec tsc --noEmit
pnpm --filter @optimitron/extension build
```

Before shipping capture, add a Chrome integration test proving raw selected text is sent only to the configured localhost companion and no unreviewed candidate reaches Optimitron.
