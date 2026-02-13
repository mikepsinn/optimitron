# Decentralized-FDA Repo Audit for Optomitron

> **Date:** 2026-02-06
> **Source:** `/mnt/e/code/decentralized-fda/`
> **Target:** `/mnt/e/code/optomitron/`
> **Purpose:** Identify reusable code, components, and patterns for Optomitron

---

## Table of Contents

- [A. apps/fdai/ — AI Chat Interface](#a-appsfdai--ai-chat-interface)
- [B. apps/web/ — Next.js Web App](#b-appsweb--nextjs-web-app)
- [C. Prisma Schema Comparison](#c-prisma-schema-comparison)
- [D. Global Variables Display/Search](#d-global-variables-displaysearch)
- [E. Health Data Import Flows](#e-health-data-import-flows)
- [F. Dashboard Analytics/Visualizations](#f-dashboard-analyticsvisualizations)
- [G. Mathematical Modeling Package](#g-mathematical-modeling-package)
- [H. AI System Prompt for Health Tracking](#h-ai-system-prompt-for-health-tracking)
- [I. Reusable React Components](#i-reusable-react-components)
- [J. Supabase Setup](#j-supabase-setup)
- [Priority Summary](#priority-summary)

---

## A. apps/fdai/ — AI Chat Interface

The `fdai` app is a standalone Next.js app providing an AI-powered health tracking chat. It uses Supabase for auth/data and the Vercel AI SDK (`ai/react`) with tool calling.

### Architecture

| Component | Path | What It Does |
|---|---|---|
| Chat API route | `apps/fdai/app/api/chat/route.ts` | Streams AI responses via `streamText()`. Supports OpenAI, Google Gemini, and DeepSeek providers. Injects user health context into system prompt. Allows 5 tool-call steps per response. |
| AI Tools | `apps/fdai/ai/tools.ts` | 5 Vercel AI SDK tools: `displayGoalSelector`, `displayConditionSelector`, `displaySymptomTracker`, `displayMealLogger`, `displayMedicationLogger`. Each returns a `componentType` string. |
| Chat Container | `apps/fdai/components/chat/chat-container.tsx` | Main chat UI using `useChat()` hook from `ai/react`. Manages messages, errors, input. Shows initial welcome message with embedded tool call. |
| UI Component Renderer | `apps/fdai/components/chat/ui-component-renderer.tsx` | Switches on `message.toolCall.result.componentType` to render GoalSelector, ConditionSelector, SymptomTracker, MealLogger, or MedicationLogger inline in chat. |
| System Prompt Builder | `apps/fdai/lib/chat/system-prompt.ts` | Dynamically constructs system prompt from `UserHealthContext` — goals, conditions, recent symptoms, medications, meals. |
| User Context Fetcher | `apps/fdai/lib/user-context.ts` | Queries Supabase tables (`user_goals`, `user_conditions`, `symptom_logs`, `medication_logs`, `meals`) for last 7 days of data. |
| Chat Data Saver | `apps/fdai/hooks/use-chat-data-saver.tsx` | Custom hook: saves goals/conditions from chat selections via server actions. |
| Camera Capture | `apps/fdai/components/camera-capture.tsx` | Camera dialog for food/medication photo capture using `getUserMedia`. Returns JPEG blob. |
| Text-to-Speech | `apps/fdai/components/text-to-speech.tsx` | Browser `SpeechSynthesis` API wrapper with auto-play support. |
| Static System Prompt | `apps/fdai/system-prompt.md` | Detailed personality/behavior guide for the AI health assistant (tone, data collection flow, guardrails). |

### Generated UI Components

| Component | Path | Description |
|---|---|---|
| GoalSelector | `components/ui/generated/goal-selector.tsx` | Multi-select for health goals |
| ConditionSelector | `components/ui/generated/condition-selector.tsx` | Multi-select for health conditions |
| SymptomTracker | `components/ui/generated/symptom-tracker.tsx` | Add symptoms with 1-5 severity slider |
| MealLogger | `components/ui/generated/meal-logger.tsx` | Log meals with type (breakfast/lunch/dinner/snack), description, time, photo button |
| MedicationLogger | `components/ui/generated/medication-logger.tsx` | Log medications with name, dosage, time |

### **Should Port? YES — HIGH PRIORITY**

**Target package:** `packages/chat-ui`

The fdai chat architecture is directly relevant to Optomitron's health tracking goals. Key things to port:

1. **AI tool-calling pattern** — The pattern of AI tools returning `componentType` strings that the frontend renders as interactive UI components is elegant and extensible. Port the tool definitions and the `UIComponentRenderer` switch pattern.

2. **System prompt construction** — The `createSystemPrompt()` function that injects user health context (goals, conditions, recent logs) is exactly what Optomitron needs. Port and extend with Optomitron's variable/measurement model.

3. **Health tracking UI components** — SymptomTracker, MealLogger, MedicationLogger are good starting points. They'll need modification to use Optomitron's `GlobalVariable` / `Measurement` schema instead of Supabase-specific tables.

4. **system-prompt.md** — The static system prompt is an excellent behavioral guide. Port and customize for Optomitron (rename FDAi references, adapt data collection flow to our schema).

5. **Camera capture** — Directly reusable for food/supplement photo analysis.

**Modifications needed:**
- Replace Supabase client calls with Prisma/Optomitron DB calls
- Replace `user_goals`/`user_conditions` Supabase tables with Optomitron's `UnitVariable`/`Measurement` model
- Swap AI provider config to match Optomitron's setup
- The chat UI currently uses shadcn/ui — compatible with Optomitron's existing setup

---

## B. apps/web/ — Next.js Web App

The `web` app is a larger Next.js app with NextAuth, Prisma (MySQL), and extensive pages.

### Pages/Features

| Route | What It Does |
|---|---|
| `(auth)/signin`, `(auth)/signup` | Auth pages |
| `dashboard/` | Navigation hub — links to Clinical Research, Health Data, Medical Resources |
| `globalVariables/` | Search for variables (foods, drugs, symptoms) |
| `globalVariables/[variableId]/` | Variable detail page — overview, charts, settings |
| `userVariables/` | User's personal tracked variables |
| `userVariables/[variableId]/` | Per-user variable detail |
| `measurements/add` | Add a measurement |
| `measurements/text2measurements/` | Convert text to structured measurements |
| `measurements/image2measurements/` | Convert photos to structured measurements |
| `import/` | Data source import page (Apple Health, etc.) |
| `conditions/[conditionName]/` | Condition detail with treatment ratings |
| `treatments/[treatmentName]/` | Treatment detail with condition correlations |
| `study/create`, `study/[studyId]/` | Create/view N-of-1 studies |
| `studies/` | Browse all studies |
| `trials/`, `trials/search/` | ClinicalTrials.gov search |
| `predictor-search/` | Search for predictors of an outcome |
| `population-study/` | Population-level studies |
| `researcher/` | AI researcher tools |
| `inbox/` | Tracking reminder notifications |
| `cognition/reaction-test/` | Cognitive performance tests |
| `cba/muscle-mass/` | Cost-benefit analysis tools |
| `articles/` | Health articles CMS |
| `drug-companies/register-drug/` | Drug registration |
| `settings/accounts/` | Connected data sources |
| `variable-categories/` | Browse variable categories |

### Auth Setup

**File:** `apps/web/lib/auth.ts`

Uses **NextAuth** with:
- **PrismaAdapter** (MySQL)
- **JWT sessions**
- **Providers:** Email (magic link), Google OAuth, GitHub OAuth, custom DFDA OAuth provider
- Callbacks handle JWT token enrichment and session management

### **Should Port? SELECTIVELY**

**Target packages:** `packages/web`, `packages/data`

1. **Auth pattern** — Optomitron already has its own auth setup. The DFDA OAuth provider pattern is interesting if we want to federate with other health data platforms.

2. **Page structure** — Good reference architecture for:
   - Variable search/detail pages → port to `packages/web`
   - Measurement add/text2measurements → port to `packages/web` and `packages/chat-ui`
   - Study creation/viewing → maybe later
   - Tracking reminder inbox → useful for engagement

3. **API routes** — `api/text2measurements/`, `api/image2measurements/`, `api/conversation2measurements/` are HIGH VALUE (see section E).

4. **Server actions** — `dfdaActions.ts` exports 30+ server actions wrapping DFDA API calls. Most target the external `safe.dfda.earth` API, but the pattern of centralized server actions is good.

---

## C. Prisma Schema Comparison

### DFDA Legacy Schema (packages/database/prisma/schema.prisma)

- **MySQL-based**, 190 models, 4,759 lines
- Includes WordPress tables (`wp_*`), legacy OAuth tables, social features, WordPress-era models
- Core health models: `measurements`, `variables`, `user_variables`, `correlations`, `aggregate_correlations`, `tracking_reminders`, `tracking_reminder_notifications`
- Uses integer auto-increment IDs, Unix timestamps for `start_time`
- Has `connectors`/`connections`/`connector_imports` for data source integrations

### DFDA Supabase Schema (supabase/migrations/00000000000000_initial_schema.sql)

- **PostgreSQL/Supabase**, organized into schemas: `core`, `reference`, `personal`, `cohort`, `models`, `oauth2`, `finance`, `commerce`, `logistics`, `scheduling`
- Much cleaner than the Prisma schema — proper enums, UUID PKs, timestamps with timezone
- Key tables: `reference.variables`, `reference.variable_categories`, `reference.units_of_measurement`, `reference.unit_categories`, `personal.measurements`, `personal.user_variables`
- Has `core.integration_providers`, `core.integration_connections`, `core.integration_sync_logs` for data source management
- Full OAuth2 server implementation in `oauth2.*`
- Data sharing agreements, user consents, GDPR data exports in `core.*`

### Optomitron Schema (packages/db/prisma/schema.prisma)

- **PostgreSQL/Prisma**, clean two-layer architecture
- Layer 1: Universal Measurement System (GlobalVariable, VariableCategory, Unit, UnitVariable, Measurement, TrackingReminder, UnitVariableRelationship, AggregateVariableRelationship)
- Layer 2: Governance (Jurisdiction, Item, Participant, PairwiseComparison, PreferenceWeight, AggregationRun, Politician, PoliticianVote, AlignmentScore)
- Uses cuid() string IDs

### Schema Gap Analysis — What Optomitron is Missing

| Feature | DFDA Has | Optomitron Missing? | Priority |
|---|---|---|---|
| **Data source integrations** (`connectors`, `connections`, `connector_imports`) | ✅ Legacy Prisma + Supabase `integration_*` tables | ❌ No integration/connector model | **HIGH** — needed for Apple Health, wearable imports |
| **Unit conversions** (`unit_conversions` table) | ✅ `unit_conversions` with formulas | ⚠️ Has `conversionSteps` JSON on Unit but no dedicated table | MEDIUM — JSON approach may suffice |
| **Data quality rules** | ✅ `reference.data_quality_rules` in Supabase | ❌ Missing | MEDIUM |
| **Common tags** / variable aliases | ✅ `common_tags`, `child_parents`, `user_tags` | ⚠️ Has `synonyms` field on GlobalVariable | LOW — synonyms field may suffice |
| **OAuth2 server** | ✅ Full OAuth2 server (`oa_*` / `oauth2.*`) | ❌ Missing | LOW unless we need API access |
| **Studies** / clinical trials | ✅ `studies`, `global_studies`, `user_studies`, `cohort_studies` | ❌ Missing | MEDIUM — future feature |
| **Data sharing agreements** / consent management | ✅ `core.data_sharing_agreements`, `core.user_consents` | ❌ Missing | MEDIUM — needed for compliance |
| **User groups** | ✅ `core.user_groups`, `core.user_group_members` | ❌ Missing | LOW |
| **Tracking reminder notifications** | ✅ `tracking_reminder_notifications` | ❌ Missing (has TrackingReminder but no notification queue) | **HIGH** — needed for engagement |
| **Variable statistics fields** | ✅ Extensive stats on `variables` (kurtosis, skewness, median, percentiles, chart JSON) | ⚠️ Has basic stats on UnitVariable (mean, median, stddev, min, max) | MEDIUM — add more stats fields |
| **Charts JSON on variables** | ✅ `charts` JSONB field on variables | ❌ Missing | MEDIUM — useful for pre-computed charts |
| **Source platform tracking** | ✅ `source_platforms`, `variable_user_sources` | ❌ Missing | **HIGH** — needed for data provenance |
| **Measurement imports** | ✅ `measurement_imports`, `measurement_exports` | ❌ Missing | **HIGH** |
| **Votes / community ratings** | ✅ `votes`, `correlation_causality_votes`, `correlation_usefulness_votes` | ⚠️ Has `numberOfUpVotes`/`numberOfDownVotes` on AggregateVariableRelationship | LOW |

### Recommended Schema Additions for Optomitron

```prisma
// HIGH PRIORITY additions:

model IntegrationProvider {
  id           String @id @default(cuid())
  providerName String @unique  // "apple_health", "fitbit", "oura", etc.
  displayName  String
  description  String?
  logoUrl      String?
  authType     String  // "oauth2" | "api_key" | "file_upload"
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  connections  IntegrationConnection[]
}

model IntegrationConnection {
  id               String @id @default(cuid())
  userId           String
  providerId       String
  provider         IntegrationProvider @relation(fields: [providerId], references: [id])
  connectionStatus String  // "connected" | "disconnected" | "expired"
  lastSyncAt       DateTime?
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  syncLogs         IntegrationSyncLog[]
  @@unique([userId, providerId])
}

model IntegrationSyncLog {
  id                String @id @default(cuid())
  connectionId      String
  connection        IntegrationConnection @relation(fields: [connectionId], references: [id])
  status            String  // "in_progress" | "completed" | "failed"
  recordsProcessed  Int @default(0)
  recordsCreated    Int @default(0)
  errorMessage      String?
  syncStartedAt     DateTime @default(now())
  syncCompletedAt   DateTime?
}

model TrackingReminderNotification {
  id                 String @id @default(cuid())
  userId             String
  trackingReminderId String
  notifyAt           DateTime
  status             String @default("pending")  // "pending" | "tracked" | "skipped" | "snoozed"
  trackedValue       Float?
  actionPerformedAt  DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@index([userId, status])
  @@index([notifyAt])
}
```

---

## D. Global Variables Display/Search

### Files

| File | What It Does |
|---|---|
| `apps/web/app/globalVariables/page.tsx` | Page wrapper — auth check, renders `GlobalVariableSearch` |
| `apps/web/components/globalVariables/global-variable-search.tsx` | Thin wrapper around `GenericVariableSearch` with `includePublic={true}` |
| `apps/web/components/genericVariables/generic-variable-search.tsx` | Generic search component — likely fetches from DFDA API |
| `apps/web/components/globalVariables/global-variable-overview.tsx` | Variable detail page — fetches from `/api/dfda/variables?id=X&includeCharts=1`, then embeds an iframe to `studies.dfda.earth` |
| `apps/web/components/globalVariables/global-variable-charts.tsx` | Renders Highcharts charts: line chart with smoothing, monthly column chart, weekday column chart. Uses chart config stored on the variable object. |
| `apps/web/components/globalVariables/global-variable-edit-form.tsx` | Edit form for variable properties |
| `apps/web/components/globalVariables/global-variable-item.tsx` | List item component for search results |

### **Should Port? YES — MEDIUM PRIORITY**

**Target package:** `packages/web`

1. **Variable search** — The search pattern is useful but currently delegates to the external DFDA API. We'd need to implement our own search endpoint against Optomitron's `GlobalVariable` table.

2. **Variable charts (Highcharts)** — `global-variable-charts.tsx` is a good reference for charting. It uses Highcharts with line, monthly column, and weekday column charts. **However**, Optomitron might want to use a different charting library (Recharts, Chart.js, or Tremor) since Highcharts has licensing costs for commercial use.

3. **Variable overview** — Currently just an iframe to `studies.dfda.earth`. We'd build our own native detail page.

**Modifications needed:**
- Replace DFDA API calls with Optomitron Prisma queries
- Replace or keep Highcharts (licensing consideration)
- Build native variable detail page instead of iframe

---

## E. Health Data Import Flows

### Text → Measurements (HIGH VALUE)

| File | What It Does |
|---|---|
| `apps/web/app/api/text2measurements/route.ts` | API route: accepts text statement → returns structured measurements |
| `apps/web/app/api/text2measurements/measurementSchema.ts` | **GOLD** — TypeScript types defining `Measurement`, `MeasurementSet`, `VariableCategoryNames`, `UnitNames`. Comprehensive schema with detailed JSDoc comments explaining how to convert natural language to measurements. |
| `apps/web/lib/text2measurements.ts` | Core logic: builds a detailed LLM prompt with the measurement schema, variable categories, and unit names. Calls `textCompletion()` and parses JSON response. Handles date/time inference. |
| `apps/web/lib/conversation2measurements.ts` | Multi-turn conversation flow: asks about food, drinks, treatments, symptoms. Returns both the next question and extracted measurements. |
| `apps/web/app/api/conversation2measurements/route.ts` | API route for the conversational flow. Auto-saves measurements if user is authenticated. |

### Image → Measurements

| File | What It Does |
|---|---|
| `apps/web/app/api/image2measurements/route.ts` | Sends food/supplement/medication images to GPT-4 Vision with a detailed prompt. Returns structured JSON with food items (calories, macros, micros), medications (name, dosage, frequency), and supplements (brand, ingredients, amounts). |

### Data Source Import

| File | What It Does |
|---|---|
| `apps/web/app/import/page.tsx` | Import page — auth check, renders DataSourceList |
| `apps/web/app/import/components/DataSourceList.tsx` | Fetches available data sources from DFDA API, renders DataSourceRow for each |
| `apps/web/app/import/components/DataSourceRow.tsx` | Individual data source card with connect/disconnect actions |

### **Should Port? YES — HIGH PRIORITY**

**Target packages:** `packages/data`, `packages/chat-ui`

1. **`measurementSchema.ts`** — Port directly. This is the Rosetta Stone for converting natural language to structured health data. The `VariableCategoryNames` and `UnitNames` arrays should go into `packages/db` or `packages/data` as shared constants.

2. **`text2measurements.ts`** — Port the prompt engineering pattern. The detailed LLM prompt with inline TypeScript type definitions is clever — it teaches the LLM the exact schema. Adapt to use Optomitron's variable/unit model.

3. **`conversation2measurements.ts`** — Port the multi-turn conversational data collection flow. This is perfect for Optomitron's chat-based health tracking.

4. **`image2measurements` route** — Port the GPT-4 Vision prompt for food/supplement/medication image analysis. Update to use Optomitron's variable categories.

5. **Data source import UI** — Lower priority. The current implementation delegates to the DFDA API. We'd need to build our own import infrastructure (Apple Health XML parser, Fitbit OAuth, etc.).

**Modifications needed:**
- Replace DFDA API `textCompletion()` calls with Optomitron's AI provider
- Update `VariableCategoryNames` and `UnitNames` to match Optomitron's schema
- Replace `postMeasurements()` with Optomitron's Prisma-based measurement creation
- Build our own Apple Health parser instead of using DFDA's external API

---

## F. Dashboard Analytics/Visualizations

### Dashboard

**File:** `apps/web/app/dashboard/page.tsx`

The dashboard is a simple navigation hub with three sections:
1. **Clinical Research** — links to trials, studies, researcher tools
2. **Health Data** — links to measurements, user variables, global variables
3. **Medical Resources** — links to conditions, treatments, articles

Plus quick action buttons (New Study, Search Trials, Import Data) and inbox preview.

### Charts/Visualizations

| File | What It Does |
|---|---|
| `components/globalVariables/global-variable-charts.tsx` | Highcharts: line chart with smoothing, monthly column chart, weekday column chart |
| `components/userVariables/user-variable-charts.tsx` | Same pattern for per-user variable data |
| `components/bar-chart-general.tsx` | Generic bar chart component |
| `components/bar-chart-global-problems.tsx` | Bar chart for global problem priorities |
| `components/bar-chart-wishing-wells.tsx` | Bar chart for "wishing well" allocations |
| `components/charts/heatmap.tsx` | Heatmap visualization |
| `components/dfda/DrugImpactSimulator.tsx` | Interactive drug impact simulation |
| `components/dfda/qaly-daly-drug-impact-simulator.tsx` | QALY/DALY drug impact calculator |
| `components/dfda/CognitivePerformanceTest.tsx` | Cognitive test (reaction time) |
| `components/dfda/substances-associated-with-mortality.tsx` | Mortality data visualization |
| `components/NutritionFactsLabel.tsx` | FDA-style nutrition facts label component |

### **Should Port? SELECTIVELY**

**Target package:** `packages/web`

1. **Variable chart pattern** — The Highcharts pattern is good reference but consider using Recharts or Tremor for Optomitron (MIT licensed vs Highcharts commercial license).

2. **NutritionFactsLabel** — Unique and useful component. Port directly.

3. **QALY/DALY simulator** — Relevant for Optomitron's economic modeling. Port to `packages/web` or `packages/data`.

4. **CognitivePerformanceTest** — Nice engagement feature. Low priority but interesting for tracking cognitive outcomes.

5. **Dashboard layout** — The section/card navigation pattern is simple and effective. Good reference for Optomitron's dashboard.

---

## G. Mathematical Modeling Package

**Path:** `packages/mathematical-modeling/`

### Architecture

| File | What It Does |
|---|---|
| `src/models/base/AbstractModelElement.ts` | Base class for all model elements: id, displayName, description, unitName, emoji, metadata |
| `src/models/base/InputParameter.ts` | Parameter class with validation, constraints (min/max/step/allowedValues), display formatting |
| `src/models/base/OutcomeMetric.ts` | Abstract metric class: must implement `calculate()`. Has report generation, parameter dependency tracking |
| `src/models/base/PopulationInterventionModel.ts` | Top-level model class: holds parameters, metrics, metadata (interventionType, populationDescription, timeHorizon, geographicScope). Has `calculateMetrics()` and `generateReport()`. |
| `examples/2lb-fat-mass-reduction/` | Example model for 2lb fat mass reduction intervention |

### Planned Features (from README)

- Economic impact models (healthcare costs, GDP impact, ICER, ROI)
- Health outcome models (QALYs, life years gained, disease progression)
- Productivity models (workforce participation, absenteeism)
- Analysis tools (sensitivity analysis, scenario generation, Monte Carlo simulation)
- Disease-specific models (Alzheimer's, obesity, kidney disease)

### **Should Port? YES — MEDIUM PRIORITY**

**Target package:** `packages/optimizer` or new `packages/modeling`

1. **PopulationInterventionModel** — The abstract model framework is well-designed and directly relevant to Optomitron's policy impact modeling.

2. **InputParameter with validation** — Useful for any model with configurable parameters. The constraints system (min/max/step/allowedValues) is production-ready.

3. **OutcomeMetric with report generation** — The `generateReport()` markdown output is nice for both UI display and AI consumption.

4. **Model metadata** — The `ModelMetadata` type (interventionType, assumptions, limitations, references) is good governance documentation.

**Modifications needed:**
- Integrate with Optomitron's `AggregateVariableRelationship` / `UnitVariableRelationship` for real data-driven modeling
- Add causal inference algorithms (the package is currently just a framework, no actual statistical methods)
- Consider merging with or extending Optomitron's existing `packages/optimizer` package

---

## H. AI System Prompt for Health Tracking

**Files:**
- `apps/fdai/system-prompt.md` — Static behavioral prompt (personality, tone, guardrails)
- `apps/fdai/lib/chat/system-prompt.ts` — Dynamic prompt builder

### Key Design Patterns

1. **Personality first** — The prompt starts with personality traits (empathetic, data-driven, adaptive) before getting to instructions.

2. **Strict data collection flow** — Sequential question flow: symptoms → severity ratings → treatments → meals. No open-ended questions. Direct, specific prompts.

3. **Context injection** — Dynamically injects user's goals, conditions, recent symptoms/meds/meals into the system prompt so the AI can reference prior data.

4. **Guardrails:**
   - Never repeat same request in multiple ways
   - Never say "as an AI"
   - Treat garbled voice input as phonetic hints
   - Infer standard meal times (breakfast=8am, lunch=12pm, dinner=6pm)
   - Don't repeatedly ask for time if not provided

5. **Quantitative priority** — Focuses on collecting numeric time-series data (severity 0-10, dosages, times) with maximum efficiency.

### **Should Port? YES — HIGH PRIORITY**

**Target package:** `packages/chat-ui`

1. **system-prompt.md** — Port verbatim and customize. This is a well-tested prompt that handles edge cases (voice input, multi-item logging, time inference).

2. **Dynamic context injection** — Port the `createSystemPrompt()` pattern. Replace Supabase queries with Optomitron Prisma queries to fetch user's recent measurements, tracked variables, and goals.

3. **Data collection flow** — The sequential symptom→rating→treatment→meal pattern is battle-tested. Adapt to use Optomitron's variable categories.

---

## I. Reusable React Components

### From fdai app (shadcn/ui based)

| Component | Path | Reusability |
|---|---|---|
| Chat container + messages | `apps/fdai/components/chat/` | **HIGH** — core chat UI |
| SymptomTracker (severity slider) | `apps/fdai/components/ui/generated/symptom-tracker.tsx` | **HIGH** — direct port |
| MealLogger (type/description/time/photo) | `apps/fdai/components/ui/generated/meal-logger.tsx` | **HIGH** — direct port |
| MedicationLogger | `apps/fdai/components/ui/generated/medication-logger.tsx` | **HIGH** — direct port |
| GoalSelector | `apps/fdai/components/ui/generated/goal-selector.tsx` | **HIGH** — direct port |
| ConditionSelector | `apps/fdai/components/ui/generated/condition-selector.tsx` | **HIGH** — direct port |
| CameraCapture | `apps/fdai/components/camera-capture.tsx` | **HIGH** — direct port |
| TextToSpeech | `apps/fdai/components/text-to-speech.tsx` | MEDIUM — nice-to-have |
| Auth form | `apps/fdai/components/auth/auth-form.tsx` | LOW — Optomitron has its own |
| Full shadcn/ui library | `apps/fdai/components/ui/*.tsx` | Already using shadcn in Optomitron |

### From web app

| Component | Path | Reusability |
|---|---|---|
| GlobalVariableCharts (Highcharts) | `apps/web/components/globalVariables/global-variable-charts.tsx` | MEDIUM — chart pattern useful, library swap needed |
| GenericVariableSearch | `apps/web/components/genericVariables/generic-variable-search.tsx` | **HIGH** — variable search UI |
| NutritionFactsLabel | `apps/web/components/NutritionFactsLabel.tsx` | **HIGH** — unique, useful |
| DataTable | `apps/web/components/data-table.tsx` | MEDIUM — generic table |
| DateRangePicker | `apps/web/components/date-range-picker.tsx` | MEDIUM — useful utility |
| FileUploader | `apps/web/components/FileUploader.tsx` | **HIGH** — for data import |
| DrugImpactSimulator | `apps/web/components/dfda/DrugImpactSimulator.tsx` | MEDIUM — domain-specific |
| OnboardingSymptoms | `apps/web/components/dfda/onboarding-symptoms.tsx` | **HIGH** — onboarding flow |
| MetaAnalysisProgress | `apps/web/components/MetaAnalysisProgress.tsx` | LOW — specific to meta-analysis |

---

## J. Supabase Setup

### Configuration

**File:** `supabase/config.toml`

- Project ID: `decentralized-fda`
- PostgreSQL 15
- Auth: email signup enabled, JWT 1hr expiry, refresh token rotation
- Rate limits: 2 emails/hr, 30 SMS/hr, 150 token refreshes per 5min
- Studio on port 54323
- Realtime enabled
- Storage: 50MB file size limit

### Auth in fdai app

**File:** `apps/fdai/lib/supabase.ts`

Simple browser client:
```typescript
import { createBrowserClient } from '@supabase/ssr'
const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)
```

The fdai app uses Supabase Auth with email-based sign-in and demo login. The Supabase tables include: `user_goals`, `user_conditions`, `symptom_logs`, `medication_logs`, `meals`, `health_logs`, `goals`, `conditions`, `symptoms`, `medications`, `meal_types`, `user_medications`.

### Auth in web app

**File:** `apps/web/lib/auth.ts`

Uses NextAuth with PrismaAdapter (MySQL). Different auth approach entirely.

### Migration Schema

**File:** `supabase/migrations/00000000000000_initial_schema.sql` (2,295 lines)

Well-organized multi-schema PostgreSQL:
- `core.*` — profiles, addresses, consent, integrations, groups, permissions
- `reference.*` — variables, variable_categories, units, unit_categories, data_quality_rules
- `personal.*` — user_variables, measurements, tracking_reminders
- `cohort.*` — studies, arms, outcomes
- `models.*` — aggregate relationships
- `oauth2.*` — full OAuth2 server
- `finance.*`, `commerce.*`, `logistics.*`, `scheduling.*` — domain extensions

### **Should Port? PARTIALLY**

**Target:** Optomitron's own setup

1. **Supabase config** — Useful reference if Optomitron adopts Supabase. The auth rate limits and session config are well-tuned.

2. **Multi-schema SQL migration** — The `core`/`reference`/`personal`/`cohort` schema organization is excellent. Optomitron's Prisma schema already covers `reference` (GlobalVariable, VariableCategory, Unit) and `personal` (UnitVariable, Measurement) equivalents.

3. **Missing from Optomitron that the Supabase schema has:**
   - `core.integration_providers` / `core.integration_connections` / `core.integration_sync_logs` → **HIGH PRIORITY** to add
   - `core.user_consents` / `core.data_sharing_agreements` → **MEDIUM** for compliance
   - `reference.data_quality_rules` → **MEDIUM** for data validation
   - RLS policies (not examined in detail but Supabase migration likely has them)

---

## Priority Summary

### 🔴 HIGH PRIORITY — Port First

| What | Source | Target | Effort |
|---|---|---|---|
| **Measurement schema types** (`VariableCategoryNames`, `UnitNames`, `Measurement` type) | `apps/web/app/api/text2measurements/measurementSchema.ts` | `packages/db` or `packages/data` | Small |
| **text2measurements prompt + logic** | `apps/web/lib/text2measurements.ts` | `packages/data` | Medium |
| **conversation2measurements** | `apps/web/lib/conversation2measurements.ts` | `packages/chat-ui` or `packages/data` | Medium |
| **image2measurements** | `apps/web/app/api/image2measurements/route.ts` | `packages/data` | Small |
| **AI system prompt** (static + dynamic builder) | `apps/fdai/system-prompt.md` + `apps/fdai/lib/chat/system-prompt.ts` | `packages/chat-ui` | Small |
| **AI tool-calling pattern** (tools + UI renderer) | `apps/fdai/ai/tools.ts` + `apps/fdai/components/chat/ui-component-renderer.tsx` | `packages/chat-ui` | Medium |
| **Health tracking UI components** (SymptomTracker, MealLogger, MedicationLogger) | `apps/fdai/components/ui/generated/` | `packages/chat-ui` | Medium |
| **Integration/connector schema** (IntegrationProvider, IntegrationConnection, SyncLog) | `supabase/migrations/` | `packages/db` (schema addition) | Small |
| **TrackingReminderNotification model** | `supabase/migrations/` + Prisma legacy | `packages/db` (schema addition) | Small |

### 🟡 MEDIUM PRIORITY — Port Next

| What | Source | Target | Effort |
|---|---|---|---|
| Variable search UI pattern | `apps/web/components/genericVariables/` | `packages/web` | Medium |
| Variable charts pattern (swap Highcharts for Recharts) | `apps/web/components/globalVariables/global-variable-charts.tsx` | `packages/web` | Medium |
| PopulationInterventionModel framework | `packages/mathematical-modeling/` | `packages/optimizer` or `packages/modeling` | Medium |
| Camera capture component | `apps/fdai/components/camera-capture.tsx` | `packages/chat-ui` | Small |
| NutritionFactsLabel component | `apps/web/components/NutritionFactsLabel.tsx` | `packages/web` | Small |
| Onboarding flow (symptom selection) | `apps/web/components/dfda/onboarding-symptoms.tsx` | `packages/web` | Medium |
| Data quality rules schema | `supabase/migrations/` | `packages/db` | Small |
| User consent/data sharing schema | `supabase/migrations/` | `packages/db` | Small |
| QALY/DALY drug impact simulator | `apps/web/components/dfda/qaly-daly-drug-impact-simulator.tsx` | `packages/web` | Medium |

### 🟢 LOW PRIORITY — Consider Later

| What | Source | Notes |
|---|---|---|
| OAuth2 server implementation | `supabase/migrations/` (oauth2 schema) | Only if Optomitron needs to be an OAuth provider |
| CognitivePerformanceTest | `apps/web/components/dfda/CognitivePerformanceTest.tsx` | Fun engagement feature |
| TextToSpeech | `apps/fdai/components/text-to-speech.tsx` | Nice-to-have |
| Article CMS pages | `apps/web/app/articles/` | Low relevance |
| Clinical trials search | `apps/web/app/trials/` | Future feature |
| AI researcher agents | `apps/web/lib/agents/` | Interesting but complex |
| Drug registration flow | `apps/web/app/drug-companies/` | Low relevance |
| WordPress legacy models | `packages/database/prisma/schema.prisma` (wp_* models) | Do not port |

---

## Key Architectural Observations

1. **DFDA is split-brain:** The `web` app uses NextAuth + Prisma (MySQL) while `fdai` uses Supabase auth. The Supabase migration schema is the most modern and clean. Optomitron should learn from the Supabase schema's organization but stick with Prisma/PostgreSQL.

2. **The measurement schema types are the most valuable single file** — `measurementSchema.ts` encodes years of domain knowledge about how to categorize and quantify health data from natural language.

3. **The AI tool-calling → UI rendering pattern is elegant** — Having AI tools return component type strings that the frontend renders as interactive widgets is a great pattern for chat-based health tracking.

4. **The DFDA API dependency is a risk** — Much of the web app delegates to `safe.dfda.earth`. Optomitron should build its own backend and only reference DFDA for the data/schema patterns.

5. **190 Prisma models is too many** — The legacy schema has massive WordPress/Laravel cruft. Optomitron's clean 20-model schema is the right approach. Add the missing models (integrations, notifications) surgically.

