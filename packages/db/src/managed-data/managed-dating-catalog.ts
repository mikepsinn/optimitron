import {
  DatingQuestionStatus,
  type Prisma,
  type PrismaClient,
} from "../generated/prisma/client.js";

export const MANAGED_DATING_PROMPTS = [
  {
    key: "first-mission-date",
    text: "A useful first date would be",
  },
  {
    key: "after-vote",
    text: "After we vote to end war and disease, we should",
  },
  {
    key: "awkward-date-upside",
    text: "Even if the date is bad, it was worth it if",
  },
] as const;

export const MANAGED_DATING_QUESTIONS = [
  {
    key: "campaign-dates",
    text: "Would you go on a date that also does something useful for the campaign?",
    category: "mission",
    answerOptions: ["Yes", "Only if it is normal first", "No"],
    allowMultiple: false,
  },
  {
    key: "flyer-comfort",
    text: "Which campaign date sounds least embarrassing?",
    category: "mission",
    answerOptions: [
      "Coffee plus QR flyers",
      "Museum plus posters nearby",
      "Walk plus inviting friends to vote",
      "Anything that does not involve yelling in public",
    ],
    allowMultiple: true,
  },
  {
    key: "war-disease-priority",
    text: "How much should a partner care about ending war and disease?",
    category: "values",
    answerOptions: [
      "A lot",
      "Some",
      "They can think I am strange as long as they vote",
    ],
    allowMultiple: false,
  },
] as const;

export interface SyncManagedDatingCatalogOptions {
  apply: boolean;
}

export interface SyncManagedDatingCatalogResult {
  dryRun: boolean;
  prompts: number;
  questions: number;
}

function promptId(key: string) {
  return `dating-prompt-${key}`;
}

function questionId(key: string) {
  return `dating-question-${key}`;
}

export async function syncManagedDatingCatalog(
  prisma: PrismaClient,
  options: SyncManagedDatingCatalogOptions,
): Promise<SyncManagedDatingCatalogResult> {
  const result = {
    dryRun: !options.apply,
    prompts: MANAGED_DATING_PROMPTS.length,
    questions: MANAGED_DATING_QUESTIONS.length,
  };

  if (!options.apply) return result;

  for (const [index, prompt] of MANAGED_DATING_PROMPTS.entries()) {
    await prisma.datingPrompt.upsert({
      where: { key: prompt.key },
      update: {
        active: true,
        managed: true,
        sortOrder: index,
        text: prompt.text,
      },
      create: {
        id: promptId(prompt.key),
        key: prompt.key,
        active: true,
        managed: true,
        sortOrder: index,
        text: prompt.text,
      },
    });
  }

  for (const [index, question] of MANAGED_DATING_QUESTIONS.entries()) {
    await prisma.datingQuestion.upsert({
      where: { key: question.key },
      update: {
        allowMultiple: question.allowMultiple,
        answerOptions: [...question.answerOptions] satisfies Prisma.InputJsonValue,
        category: question.category,
        managed: true,
        sortOrder: index,
        status: DatingQuestionStatus.ACTIVE,
        text: question.text,
      },
      create: {
        id: questionId(question.key),
        key: question.key,
        allowMultiple: question.allowMultiple,
        answerOptions: [...question.answerOptions] satisfies Prisma.InputJsonValue,
        category: question.category,
        managed: true,
        sortOrder: index,
        status: DatingQuestionStatus.ACTIVE,
        text: question.text,
      },
    });
  }

  return result;
}

export function formatManagedDatingCatalogResult(
  result: SyncManagedDatingCatalogResult,
) {
  const prefix = result.dryRun ? "would sync" : "synced";
  return `Dating catalog: ${prefix} ${result.prompts} prompts, ${result.questions} questions`;
}
