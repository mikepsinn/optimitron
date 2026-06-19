import type { TaskApplicationRow } from "@/lib/task-applications.server";

export type ApplicationReviewRow = TaskApplicationRow;

export type DimensionScore = {
  score: 1 | 2 | 3 | 4;
  note?: string;
};

export type ScreeningAnswers = {
  writingClarity?: DimensionScore;
  relevantExperience?: DimensionScore;
  quantifiedTrackRecord?: DimensionScore;
  redFlags?: DimensionScore;
  recommendation?: "strong_no" | "no" | "yes" | "strong_yes";
  screeningNotes?: string;
};

export type TaskApplicationAnswersJson = {
  aiScreen?: ScreeningAnswers;
  phoneScreen?: ScreeningAnswers & { callNotes?: string };
  testProject?: {
    score?: number;
    notes?: string;
    contactInfoFound?: boolean;
  };
  references?: { name?: string; role?: string; notes?: string }[];
};
