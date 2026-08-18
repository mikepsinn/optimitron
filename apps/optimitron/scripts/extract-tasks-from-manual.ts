import "./load-env";
import { createHash } from "crypto";
import { z } from "zod";
import {
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
} from "@optimitron/db";
import {
  type ManualSearchEntry,
  getManualSearchIndex,
} from "../src/lib/manual-search.server";
import { findOrCreatePerson } from "../src/lib/person.server";
import { prisma } from "../src/lib/prisma";
import { getWishoniaUserId } from "../src/lib/wishonia.server";

const MIN_SECTION_TEXT_LENGTH = 300;
const GEMINI_MODEL =
  process.env.GEMINI_PRO_MODEL ??
  process.env.GOOGLE_TASK_EXTRACTION_MODEL ??
  "gemini-2.5-flash";

const ExtractedTaskSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(20).max(3000),
  category: z.nativeEnum(TaskCategory),
  estimatedEffortHours: z.number().min(0).max(200).nullable().optional(),
  skillTags: z.array(z.string().min(1).max(64)).max(8).default([]),
  interestTags: z.array(z.string().min(1).max(64)).max(8).default([]),
  claimPolicy: z.nativeEnum(TaskClaimPolicy).default(TaskClaimPolicy.OPEN_SINGLE),
  assigneePersonName: z.string().min(2).max(160).nullable().optional(),
  roleTitle: z.string().min(2).max(160).nullable().optional(),
  currentAffiliation: z.string().min(2).max(160).nullable().optional(),
});

const ExtractedSectionSchema = z.object({
  parentTask: ExtractedTaskSchema,
  atomicTasks: z.array(ExtractedTaskSchema).min(1).max(10),
});

interface CliOptions {
  dryRun: boolean;
  heuristicOnly: boolean;
  limit: number | null;
  reextract: boolean;
  section: string | null;
}

function parseArgs(argv: string[]): CliOptions {
  const getValue = (prefix: string) =>
    argv.find((arg) => arg.startsWith(`${prefix}=`))?.split("=")[1] ?? null;

  return {
    dryRun: argv.includes("--dry-run"),
    heuristicOnly: argv.includes("--heuristic-only"),
    limit: getValue("--limit") ? Number(getValue("--limit")) : null,
    reextract: argv.includes("--reextract"),
    section: getValue("--section"),
  };
}

function getEntryText(entry: ManualSearchEntry) {
  return [entry.title, entry.section, entry.description, entry.text]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n\n");
}

function getSourceRef(entry: ManualSearchEntry) {
  return entry.path ?? entry.url ?? entry.title ?? "manual-section";
}

function hashEntry(entry: ManualSearchEntry) {
  return createHash("sha256").update(getEntryText(entry)).digest("hex");
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function heuristicExtract(entry: ManualSearchEntry) {
  const label = entry.title ?? entry.section ?? "manual section";
  const sectionText = getEntryText(entry);

  return {
    atomicTasks: [
      {
        category: TaskCategory.RESEARCH,
        claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
        description: `Read this section and produce a concise evidence-backed summary of the core claim, numbers, and operational bottlenecks.\n\nAcceptance criteria: one short memo or thread draft that cites the source URL directly.`,
        estimatedEffortHours: 1,
        interestTags: ["manual"],
        skillTags: ["research", "writing"],
        title: `Summarize ${label}`,
      },
      {
        category: TaskCategory.COMMUNICATION,
        claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
        description: `Convert the section into one public-facing explainer for a normal reader.\n\nAcceptance criteria: one short explainer, post draft, or talking-points document that can be shared without extra editing.`,
        estimatedEffortHours: 2,
        interestTags: ["manual", "public-education"],
        skillTags: ["writing", "editing"],
        title: `Draft a public explainer for ${label}`,
      },
      {
        category: TaskCategory.OUTREACH,
        claimPolicy: TaskClaimPolicy.OPEN_MANY,
        description: `Find one person or institution that should see this section and send them a short evidence-backed note.\n\nAcceptance criteria: one real outreach message with a link to the source section.`,
        estimatedEffortHours: 1,
        interestTags: ["manual", "outreach"],
        skillTags: ["outreach", "writing"],
        title: `Send ${label} to one relevant decision-maker`,
      },
    ],
    parentTask: {
      category: TaskCategory.OTHER,
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      currentAffiliation: null,
      description: truncate(sectionText, 1200),
      estimatedEffortHours: 4,
      interestTags: entry.tags ?? ["manual"],
      roleTitle: null,
      skillTags: ["coordination"],
      title: `Advance ${label}`,
    },
  };
}

async function callGeminiForExtraction(entry: ManualSearchEntry, apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: [
                  "Extract one parent task and a short list of atomic tasks from this manual section.",
                  "Rules:",
                  "- Use TaskCategory and TaskClaimPolicy enum values exactly.",
                  "- Only use ASSIGNED_ONLY when the text clearly implies a current officeholder or named person has to do the action.",
                  "- Atomic tasks should be claimable by ordinary participants whenever possible.",
                  "- Keep titles imperative and concrete.",
                  "- Prefer one-person tasks with clear deliverables.",
                  "- Return strict JSON matching the schema.",
                  "",
                  `Title: ${entry.title ?? "Untitled"}`,
                  `Section: ${entry.section ?? ""}`,
                  `URL: ${entry.url ?? entry.path ?? ""}`,
                  "",
                  getEntryText(entry),
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 3000,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini extraction failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini extraction returned no text.");
  }

  return ExtractedSectionSchema.parse(JSON.parse(text));
}

async function extractSectionTasks(entry: ManualSearchEntry, options: CliOptions) {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY ?? null;

  if (!options.heuristicOnly && apiKey) {
    return callGeminiForExtraction(entry, apiKey);
  }

  return heuristicExtract(entry);
}

async function upsertSectionTasks(
  entry: ManualSearchEntry,
  extracted: z.infer<typeof ExtractedSectionSchema>,
) {
  const createdByUserId = await getWishoniaUserId();
  const sourceRef = getSourceRef(entry);
  const sourceHash = hashEntry(entry);
  const sourceUrl = entry.url ?? entry.path ?? null;
  const sourceArtifact = await prisma.sourceArtifact.upsert({
    where: {
      sourceKey: `manual:${sourceRef}:section`,
    },
    create: {
      artifactType: SourceArtifactType.MANUAL_SECTION,
      contentHash: sourceHash,
      payloadJson: {
        description: entry.description ?? null,
        path: entry.path ?? null,
        section: entry.section ?? null,
        tags: entry.tags ?? [],
        textLength: getEntryText(entry).length,
        title: entry.title ?? null,
        url: entry.url ?? null,
      },
      sourceKey: `manual:${sourceRef}:section`,
      sourceRef,
      sourceSystem: SourceSystem.MANUAL,
      sourceUrl,
      title: entry.title ?? entry.section ?? sourceRef,
      versionKey: sourceHash,
    },
    update: {
      artifactType: SourceArtifactType.MANUAL_SECTION,
      contentHash: sourceHash,
      payloadJson: {
        description: entry.description ?? null,
        path: entry.path ?? null,
        section: entry.section ?? null,
        tags: entry.tags ?? [],
        textLength: getEntryText(entry).length,
        title: entry.title ?? null,
        url: entry.url ?? null,
      },
      sourceRef,
      sourceSystem: SourceSystem.MANUAL,
      sourceUrl,
      title: entry.title ?? entry.section ?? sourceRef,
      versionKey: sourceHash,
    },
  });
  const currentTaskKeys = new Set<string>();

  const parentAssignee =
    extracted.parentTask.assigneePersonName != null
      ? await findOrCreatePerson({
          currentAffiliation: extracted.parentTask.currentAffiliation ?? null,
          displayName: extracted.parentTask.assigneePersonName,
          isPublicFigure:
            extracted.parentTask.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY,
          sourceUrl,
          roleTitle: extracted.parentTask.roleTitle ?? null,
        })
      : null;
  const parentTaskKey = `manual:${sourceRef}:parent`;
  currentTaskKeys.add(parentTaskKey);

  const parentTask = await prisma.task.upsert({
    where: {
      taskKey: parentTaskKey,
    },
    create: {
      assigneePersonId: parentAssignee?.id ?? null,
      assigneeAffiliationSnapshot: extracted.parentTask.currentAffiliation ?? null,
      category: extracted.parentTask.category,
      claimPolicy: extracted.parentTask.claimPolicy,
      createdByUserId,
      contextJson: {
        sourceRef,
        sourceSystem: "manual",
      },
      description: extracted.parentTask.description,
      estimatedEffortHours: extracted.parentTask.estimatedEffortHours ?? null,
      interestTags: extracted.parentTask.interestTags,
      roleTitle: extracted.parentTask.roleTitle ?? null,
      skillTags: extracted.parentTask.skillTags,
      status: TaskStatus.ACTIVE,
      taskKey: parentTaskKey,
      title: extracted.parentTask.title,
    },
    update: {
      assigneePersonId: parentAssignee?.id ?? null,
      assigneeAffiliationSnapshot: extracted.parentTask.currentAffiliation ?? null,
      category: extracted.parentTask.category,
      claimPolicy: extracted.parentTask.claimPolicy,
      contextJson: {
        sourceRef,
        sourceSystem: "manual",
      },
      description: extracted.parentTask.description,
      estimatedEffortHours: extracted.parentTask.estimatedEffortHours ?? null,
      interestTags: extracted.parentTask.interestTags,
      roleTitle: extracted.parentTask.roleTitle ?? null,
      skillTags: extracted.parentTask.skillTags,
      status: TaskStatus.ACTIVE,
      title: extracted.parentTask.title,
    },
  });
  await prisma.taskSourceArtifact.upsert({
    where: {
      taskId_sourceArtifactId: {
        sourceArtifactId: sourceArtifact.id,
        taskId: parentTask.id,
      },
    },
    create: {
      isPrimary: true,
      sourceArtifactId: sourceArtifact.id,
      taskId: parentTask.id,
    },
    update: {
      deletedAt: null,
      isPrimary: true,
    },
  });

  for (const [index, atomicTask] of extracted.atomicTasks.entries()) {
    const taskAssignee =
      atomicTask.assigneePersonName != null
        ? await findOrCreatePerson({
            currentAffiliation: atomicTask.currentAffiliation ?? null,
            displayName: atomicTask.assigneePersonName,
            isPublicFigure: atomicTask.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY,
            roleTitle: atomicTask.roleTitle ?? null,
            sourceUrl,
          })
      : null;
    const atomicTaskKey = `manual:${sourceRef}:atomic:${index}`;
    currentTaskKeys.add(atomicTaskKey);

    const upsertedTask = await prisma.task.upsert({
      where: {
        taskKey: atomicTaskKey,
      },
      create: {
        assigneePersonId: taskAssignee?.id ?? null,
        assigneeAffiliationSnapshot: atomicTask.currentAffiliation ?? null,
        category: atomicTask.category,
        claimPolicy: atomicTask.claimPolicy,
        createdByUserId,
        contextJson: {
          sourceRef,
          sourceSystem: "manual",
        },
        description: atomicTask.description,
        estimatedEffortHours: atomicTask.estimatedEffortHours ?? null,
        interestTags: atomicTask.interestTags,
        roleTitle: atomicTask.roleTitle ?? null,
        parentTaskId: parentTask.id,
        skillTags: atomicTask.skillTags,
        sortOrder: index,
        status: TaskStatus.ACTIVE,
        taskKey: atomicTaskKey,
        title: atomicTask.title,
      },
      update: {
        assigneePersonId: taskAssignee?.id ?? null,
        assigneeAffiliationSnapshot: atomicTask.currentAffiliation ?? null,
        category: atomicTask.category,
        claimPolicy: atomicTask.claimPolicy,
        contextJson: {
          sourceRef,
          sourceSystem: "manual",
        },
        description: atomicTask.description,
        estimatedEffortHours: atomicTask.estimatedEffortHours ?? null,
        interestTags: atomicTask.interestTags,
        roleTitle: atomicTask.roleTitle ?? null,
        parentTaskId: parentTask.id,
        skillTags: atomicTask.skillTags,
        sortOrder: index,
        status: TaskStatus.ACTIVE,
        title: atomicTask.title,
      },
    });
    await prisma.taskSourceArtifact.upsert({
      where: {
        taskId_sourceArtifactId: {
          sourceArtifactId: sourceArtifact.id,
          taskId: upsertedTask.id,
        },
      },
      create: {
        isPrimary: true,
        sourceArtifactId: sourceArtifact.id,
        taskId: upsertedTask.id,
      },
      update: {
        deletedAt: null,
        isPrimary: true,
      },
    });
  }

  await prisma.task.updateMany({
    where: {
      deletedAt: null,
      taskKey: {
        startsWith: `manual:${sourceRef}:`,
        notIn: Array.from(currentTaskKeys),
      },
    },
    data: {
      status: TaskStatus.STALE,
    },
  });

  return parentTask.id;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const entries = await getManualSearchIndex({ forceRefresh: true });
  const filteredEntries = entries
    .filter((entry) => getEntryText(entry).length >= MIN_SECTION_TEXT_LENGTH)
    .filter((entry) => {
      if (!options.section) {
        return true;
      }

      const needle = options.section.toLowerCase();
      return [entry.path, entry.title, entry.section, entry.url]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(needle));
    })
    .slice(0, options.limit ?? undefined);

  let createdOrUpdated = 0;
  let skipped = 0;

  for (const entry of filteredEntries) {
    const sourceRef = getSourceRef(entry);
    const sourceHash = hashEntry(entry);

    if (!options.reextract) {
      const [existingArtifact, existingCount] = await Promise.all([
        prisma.sourceArtifact.findUnique({
          where: {
            sourceKey: `manual:${sourceRef}:section`,
          },
          select: {
            contentHash: true,
          },
        }),
        prisma.task.count({
          where: {
            deletedAt: null,
            taskKey: {
              startsWith: `manual:${sourceRef}:`,
            },
          },
        }),
      ]);

      if (existingCount > 0 && existingArtifact?.contentHash === sourceHash) {
        skipped += 1;
        console.log(`skip ${sourceRef} (${existingCount} tasks already current)`);
        continue;
      }
    }

    const extracted = await extractSectionTasks(entry, options);

    if (options.dryRun) {
      console.log(`\n# ${sourceRef}`);
      console.log(JSON.stringify(extracted, null, 2));
      createdOrUpdated += 1;
      continue;
    }

    await upsertSectionTasks(entry, extracted);
    createdOrUpdated += 1;
    console.log(`upsert ${sourceRef}`);
  }

  console.log(
    `\nDone. processed=${filteredEntries.length} updated=${createdOrUpdated} skipped=${skipped}`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
