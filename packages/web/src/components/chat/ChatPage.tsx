"use client";

import { useState, useRef, useCallback, lazy, Suspense, type ReactNode } from "react";
import {
  ChatContainer,
  ConversationContext,
  type ChatMessage,
  type ParsedMeasurement,
} from "@optimitron/chat-ui";
import { API_ROUTES } from "@/lib/api-routes";
import { MythBusterCard } from "./MythBusterCard";
import { OutcomeCard } from "./OutcomeCard";
import { BudgetResultCard } from "./BudgetResultCard";
import { RepresentativeCard } from "./RepresentativeCard";
import { BillListCard } from "./BillListCard";
import { BillSearchCard } from "./BillSearchCard";
import { BillVoteCard } from "./BillVoteCard";
import { BillCBACard } from "./BillCBACard";
import { VoteShareCard } from "./VoteShareCard";
import { SendToRepCard } from "./SendToRepCard";
import { ROUTES } from "@/lib/routes";
import { storage } from "@/lib/storage";
import {
  BUDGET_CATEGORIES,
  getActualGovernmentAllocations,
  type BudgetCategoryId,
} from "../../lib/wishocracy-data";
import { generateRandomPairs } from "../../lib/wishocracy-utils";
import {
  classifyLegislativeBill,
  inferLegislativeBudgetDirection,
} from "../../lib/alignment-legislative-classification";
import { buildBillCBA, type BillCBA } from "../../lib/civic-cba";
import type { CivicRepresentative } from "../../lib/civic-data";
import type { ClassifiedBill } from "../../app/api/civic/bills/route";
import { listExplorerOutcomes, getOutcomeMegaStudy } from "../../lib/analysis-explorer-data";
import { getOutcomeHubPath } from "../../lib/analysis-explorer-routes";
import misconceptionsData from "../../../public/data/misconceptions.json";
import "./chat-theme.css";

const VoiceChatOverlay = lazy(() => import("./VoiceChatOverlay"));

// --- Extended message types for app-specific cards ---
type MythCardMessage = { type: "mythCard"; finding: { myth: string; reality: string; grade: string } };
type OutcomeCardMessage = { type: "outcomeCard"; outcome: { label: string; topPredictor: string; score: number; id: string } };
type BudgetResultMessage = { type: "budgetResult"; allocations: Record<string, number>; actualAllocations: Record<string, number> };

// --- Civic engagement message types ---
type RepCardMessage = { type: "repCard"; representatives: CivicRepresentative[] };
type BillListMessage = { type: "billList"; bills: ClassifiedBill[] };
type BillSearchMessage = { type: "billSearch" };
type BillVoteMessage = { type: "billVote"; bill: ClassifiedBill; cba?: BillCBA };
type BillCBAMessage = { type: "billCBA"; cba: BillCBA };
type VoteShareMessage = { type: "voteShare"; billTitle: string; position: string; shareIdentifier: string };
type SendToRepMessage = { type: "sendToRep"; representatives: CivicRepresentative[]; vote: { billId: string; billTitle: string; position: string; reasoning?: string; cba?: BillCBA } };

type AppChatMessage =
  | ChatMessage
  | MythCardMessage
  | OutcomeCardMessage
  | BudgetResultMessage
  | RepCardMessage
  | BillListMessage
  | BillSearchMessage
  | BillVoteMessage
  | BillCBAMessage
  | VoteShareMessage
  | SendToRepMessage;

// --- Budget voting pairs (dynamically generated from all categories) ---
const CHAT_BUDGET_PAIR_COUNT = 7;

function generateChatBudgetPairs(): Array<[string, string]> {
  const idPairs = generateRandomPairs(CHAT_BUDGET_PAIR_COUNT);
  return idPairs.map(([a, b]) => [
    BUDGET_CATEGORIES[a].name,
    BUDGET_CATEGORIES[b].name,
  ]);
}

const BUDGET_COMMENTARY = [
  "Interesting. Next one.",
  "Predictable choice, but let's see if you stay consistent.",
  "On my planet, this one was settled in about six seconds.",
  "Alright, halfway through. Still with me?",
  "Almost done. You're being surprisingly rational for a human.",
  "One more after this.",
];

// --- Initial hint buttons ---
const INITIAL_HINTS: ChatMessage = {
  type: "hints",
  buttons: [
    { label: "Rate my mood", action: "mood" },
    { label: "Log food", action: "food" },
    { label: "Log a symptom", action: "symptom" },
    { label: "Vote on budget", action: "budget" },
    { label: "Bust a myth", action: "myth" },
    { label: "Show an insight", action: "insight" },
    { label: "Find my reps", action: "findReps" },
    { label: "See bills", action: "bills" },
    { label: "Search bills", action: "searchBills" },
  ],
};

function formatMeasurement(m: ParsedMeasurement): string {
  return `${m.variableName}: ${m.value} ${m.unitAbbreviation}`;
}

function pickRandom<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ChatPage() {
  const [showVoice, setShowVoice] = useState(false);

  const [messages, setMessages] = useState<AppChatMessage[]>([
    {
      type: "text",
      role: "assistant",
      content:
        "Hello. I'm Wishonia — World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation. I've been running a planet for 4,237 years. We ended war in year 12 and disease in year 340. Now I'm here to help you track your meals, symptoms, treatments, and mood. It's not exactly planetary governance but everyone's got to start somewhere. Try \"took 500mg magnesium\" or \"mood 4/5\".",
    },
    { type: "apiKey" },
    INITIAL_HINTS,
  ]);

  const [recentFoods, setRecentFoods] = useState<string[]>([]);
  const ctxRef = useRef(new ConversationContext());
  const budgetVotesRef = useRef(new Map<string, number>());
  const budgetStepRef = useRef(0);
  const budgetPairsRef = useRef<Array<[string, string]>>(generateChatBudgetPairs());
  // Cache representatives for send-to-rep flow
  const repsRef = useRef<CivicRepresentative[]>([]);

  const appendMultiple = useCallback((...msgs: AppChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  const append = useCallback((msg: AppChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // --- Fetch representatives ---
  const fetchReps = useCallback(
    async (stateOrZip: string) => {
      append({
        type: "text",
        role: "assistant",
        content: "Looking up your representatives...",
      } as ChatMessage);

      try {
        const isZip = /^\d{5}$/.test(stateOrZip.trim());
        const param = isZip
          ? `zip=${encodeURIComponent(stateOrZip.trim())}`
          : `state=${encodeURIComponent(stateOrZip.trim().toUpperCase())}`;

        const res = await fetch(`${API_ROUTES.civic.representatives}?${param}`);
        const data = (await res.json()) as { representatives?: CivicRepresentative[]; error?: string };

        if (!res.ok || !data.representatives) {
          append({
            type: "text",
            role: "assistant",
            content: data.error ?? "Couldn't find representatives. Try a 2-letter state code (e.g. CA) or a 5-digit ZIP.",
          } as ChatMessage);
          return;
        }

        repsRef.current = data.representatives;
        appendMultiple(
          { type: "repCard", representatives: data.representatives } as RepCardMessage,
          {
            type: "hints",
            buttons: [
              { label: "See bills", action: "bills" },
              { label: "Search bills", action: "searchBills" },
              { label: "Try another action", action: "menu" },
            ],
          } as ChatMessage,
        );
      } catch {
        append({
          type: "text",
          role: "assistant",
          content: "Failed to look up representatives. Try again later.",
        } as ChatMessage);
      }
    },
    [append, appendMultiple],
  );

  // --- Fetch bills ---
  const fetchBills = useCallback(
    async (category?: BudgetCategoryId | null, query?: string | null) => {
      append({
        type: "text",
        role: "assistant",
        content: "Fetching recent classified bills from Congress...",
      } as ChatMessage);

      try {
        const params = new URLSearchParams({ limit: "5" });
        if (category) params.set("category", category);
        if (query) params.set("q", query);

        const res = await fetch(`${API_ROUTES.civic.bills}?${params.toString()}`);
        const data = (await res.json()) as { bills?: ClassifiedBill[]; error?: string };

        if (!res.ok || !data.bills) {
          append({
            type: "text",
            role: "assistant",
            content: data.error ?? "Couldn't fetch bills. The Congress API may be temporarily unavailable.",
          } as ChatMessage);
          return;
        }

        appendMultiple(
          { type: "billList", bills: data.bills } as BillListMessage,
          {
            type: "hints",
            buttons: [
              { label: "Search bills", action: "searchBills" },
              { label: "Find my reps", action: "findReps" },
              { label: "Try another action", action: "menu" },
            ],
          } as ChatMessage,
        );
      } catch {
        append({
          type: "text",
          role: "assistant",
          content: "Failed to fetch bills. Try again later.",
        } as ChatMessage);
      }
    },
    [append, appendMultiple],
  );

  // --- Start bill vote flow ---
  const startBillVote = useCallback(
    async (bill: ClassifiedBill) => {
      const apiKey = storage.getChatApiKey() ?? undefined;
      const provider =
        (storage.getChatProvider() as "openai" | "anthropic" | "gemini" | undefined) ?? undefined;

      const input = {
        billId: bill.billId,
        title: bill.title,
        subjects: bill.subjects,
        policyArea: bill.policyArea,
        latestActionText: bill.latestAction?.text,
      };

      const matches = classifyLegislativeBill(input);
      const direction = inferLegislativeBudgetDirection(input);

      let cba: BillCBA | undefined;
      try {
        cba = await buildBillCBA(bill.title, bill.subjects, matches, direction, apiKey, provider);
      } catch {
        // structural-only CBA on failure
      }

      appendMultiple(
        {
          type: "text",
          role: "assistant",
          content: `Right. Time for you to weigh in on ${bill.type.toUpperCase()} ${bill.number}. I've run a cost-benefit analysis — take a look, then cast your vote.`,
        } as ChatMessage,
        { type: "billVote", bill, cba } as BillVoteMessage,
      );
    },
    [appendMultiple],
  );

  // --- Show CBA analysis for a bill ---
  const showBillAnalysis = useCallback(
    async (bill: ClassifiedBill) => {
      const apiKey = storage.getChatApiKey() ?? undefined;
      const provider =
        (storage.getChatProvider() as "openai" | "anthropic" | "gemini" | undefined) ?? undefined;

      const input = {
        billId: bill.billId,
        title: bill.title,
        subjects: bill.subjects,
        policyArea: bill.policyArea,
        latestActionText: bill.latestAction?.text,
      };

      const matches = classifyLegislativeBill(input);
      const direction = inferLegislativeBudgetDirection(input);

      try {
        const cba = await buildBillCBA(bill.title, bill.subjects, matches, direction, apiKey, provider);
        appendMultiple(
          {
            type: "text",
            role: "assistant",
            content: `Here's the cost-benefit breakdown for ${bill.type.toUpperCase()} ${bill.number}.`,
          } as ChatMessage,
          { type: "billCBA", cba } as BillCBAMessage,
          {
            type: "hints",
            buttons: [
              { label: "Vote on this bill", action: `voteBill:${bill.billId}` },
              { label: "See more bills", action: "bills" },
              { label: "Try another action", action: "menu" },
            ],
          } as ChatMessage,
        );
      } catch {
        append({
          type: "text",
          role: "assistant",
          content: "Failed to generate analysis. Try configuring an API key for AI-powered analysis.",
        } as ChatMessage);
      }
    },
    [append, appendMultiple],
  );

  // --- Handle vote saved ---
  const handleVoteSaved = useCallback(
    (result: { billId: string; position: string; reasoning: string; cbaSnapshot: string; shareIdentifier?: string }) => {
      if (!result.shareIdentifier) return;

      // Find the bill title from the vote message
      const voteMsg = messages.find(
        (m) => m.type === "billVote" && (m as BillVoteMessage).bill.billId === result.billId,
      ) as BillVoteMessage | undefined;

      const billTitle = voteMsg?.bill.title ?? result.billId;
      const cba = voteMsg?.cba;

      appendMultiple(
        {
          type: "text",
          role: "assistant",
          content: "Vote recorded. Democracy in action — or at least a simulation of it. On my planet, we'd have already optimized the outcome, but this is a reasonable start.",
        } as ChatMessage,
        {
          type: "voteShare",
          billTitle,
          position: result.position,
          shareIdentifier: result.shareIdentifier,
        } as VoteShareMessage,
        {
          type: "hints",
          buttons: [
            { label: "Send to my rep", action: "sendToRep" },
            { label: "See more bills", action: "bills" },
            { label: "Try another action", action: "menu" },
          ],
        } as ChatMessage,
      );

      // Store last vote for send-to-rep
      lastVoteRef.current = {
        billId: result.billId,
        billTitle,
        position: result.position,
        reasoning: result.reasoning,
        cba,
      };
    },
    [appendMultiple, messages],
  );

  const lastVoteRef = useRef<{
    billId: string;
    billTitle: string;
    position: string;
    reasoning?: string;
    cba?: BillCBA;
  } | null>(null);

  // Keep a ref for bills we've fetched (for voteBill: action)
  const billsCacheRef = useRef<ClassifiedBill[]>([]);

  // --- Hint click handler ---
  const handleHintClick = useCallback(
    (action: string) => {
      // Handle dynamic actions like "voteBill:119-hr-1234"
      if (action.startsWith("voteBill:")) {
        const billId = action.slice("voteBill:".length);
        const bill = billsCacheRef.current.find((b) => b.billId === billId);
        if (bill) {
          void startBillVote(bill);
        }
        return;
      }

      switch (action) {
        case "mood":
          append({ type: "mood", id: crypto.randomUUID() } as ChatMessage);
          break;

        case "food":
          append({ type: "food", id: crypto.randomUUID() } as ChatMessage);
          break;

        case "symptom":
          append({
            type: "symptom",
            id: "general",
            name: "Overall Symptom",
            valence: "negative",
          } as ChatMessage);
          break;

        case "budget": {
          budgetVotesRef.current.clear();
          budgetStepRef.current = 0;
          budgetPairsRef.current = generateChatBudgetPairs();
          const pair = budgetPairsRef.current[0];
          if (!pair) break;
          appendMultiple(
            {
              type: "text",
              role: "assistant",
              content:
                "Right. Let's see how you'd run things. I'll show you some budget trade-offs — just slide to allocate. On my planet we automated this, but you lot seem to enjoy arguing about it.",
            } as ChatMessage,
            {
              type: "pairwise",
              id: "budget-0",
              itemA: pair[0],
              itemB: pair[1],
            } as ChatMessage,
          );
          break;
        }

        case "myth": {
          const finding = pickRandom(misconceptionsData.findings);
          if (!finding) break;
          appendMultiple(
            {
              type: "text",
              role: "assistant",
              content:
                "Ah, this one's a favourite. Humans have been getting this wrong for decades.",
            } as ChatMessage,
            {
              type: "mythCard",
              finding: { myth: finding.myth, reality: finding.reality, grade: finding.grade },
            } as MythCardMessage,
            {
              type: "hints",
              buttons: [
                { label: "Bust another myth", action: "myth" },
                { label: "Vote on budget", action: "budget" },
                { label: "Show an insight", action: "insight" },
              ],
            } as ChatMessage,
          );
          break;
        }

        case "insight": {
          const outcomes = listExplorerOutcomes();
          const outcome = pickRandom(outcomes);
          if (!outcome) {
            append({
              type: "text",
              role: "assistant",
              content: "No outcome data available yet. Try another action.",
            } as ChatMessage);
            break;
          }

          const megaStudy = getOutcomeMegaStudy(outcome.id);
          const topRow = megaStudy?.rows[0];

          if (topRow) {
            appendMultiple(
              {
                type: "outcomeCard",
                outcome: {
                  label: outcome.label,
                  topPredictor: topRow.predictorLabel ?? topRow.predictorId,
                  score: topRow.score,
                  id: outcome.id,
                },
              } as OutcomeCardMessage,
              {
                type: "hints",
                buttons: [
                  { label: "Show another insight", action: "insight" },
                  { label: "Bust a myth", action: "myth" },
                  { label: "Rate my mood", action: "mood" },
                ],
              } as ChatMessage,
            );
          } else {
            appendMultiple(
              {
                type: "insight",
                title: outcome.label,
                body: `Explore what drives ${outcome.label.toLowerCase()} across jurisdictions.`,
                actionLabel: "See full analysis",
                onAction: () => {
                  window.location.href = getOutcomeHubPath(outcome.id);
                },
              } as ChatMessage,
              {
                type: "hints",
                buttons: [
                  { label: "Show another insight", action: "insight" },
                  { label: "Bust a myth", action: "myth" },
                  { label: "Rate my mood", action: "mood" },
                ],
              } as ChatMessage,
            );
          }
          break;
        }

        case "findReps":
          appendMultiple(
            {
              type: "text",
              role: "assistant",
              content: "Let's find your representatives. Enter your 2-letter state code (e.g. CA, NY, TX) or your 5-digit ZIP code.",
            } as ChatMessage,
            {
              type: "hints",
              buttons: [
                { label: "CA", action: "repLookup:CA" },
                { label: "NY", action: "repLookup:NY" },
                { label: "TX", action: "repLookup:TX" },
              ],
            } as ChatMessage,
          );
          break;

        case "bills":
          void fetchBills();
          break;

        case "searchBills":
          append({ type: "billSearch" } as BillSearchMessage);
          break;

        case "sendToRep": {
          const reps = repsRef.current;
          const vote = lastVoteRef.current;
          if (!vote) {
            append({
              type: "text",
              role: "assistant",
              content: "You haven't voted on a bill yet. Vote on a bill first, then you can send your reasoning to your representatives.",
            } as ChatMessage);
            break;
          }
          if (reps.length === 0) {
            appendMultiple(
              {
                type: "text",
                role: "assistant",
                content: "I don't know your representatives yet. Let's find them first.",
              } as ChatMessage,
              {
                type: "hints",
                buttons: [
                  { label: "Find my reps", action: "findReps" },
                ],
              } as ChatMessage,
            );
            break;
          }
          append({
            type: "sendToRep",
            representatives: reps,
            vote,
          } as SendToRepMessage);
          break;
        }

        case "menu":
          append(INITIAL_HINTS as ChatMessage);
          break;

        case "alignment":
          window.location.href = ROUTES.wishocracy;
          break;

        default:
          // Handle repLookup:STATE dynamic actions
          if (action.startsWith("repLookup:")) {
            const stateOrZip = action.slice("repLookup:".length);
            void fetchReps(stateOrZip);
          }
          break;
      }
    },
    [append, appendMultiple, fetchReps, fetchBills, startBillVote],
  );

  // --- Budget-aware pairwise handler ---
  const handlePairwiseCompare = useCallback(
    (id: string, allocationA: number) => {
      if (id.startsWith("budget-")) {
        const step = budgetStepRef.current;
        const pair = budgetPairsRef.current[step];
        if (pair) {
          // Store votes
          const [itemA, itemB] = pair;
          budgetVotesRef.current.set(
            itemA,
            (budgetVotesRef.current.get(itemA) ?? 0) + allocationA,
          );
          budgetVotesRef.current.set(
            itemB,
            (budgetVotesRef.current.get(itemB) ?? 0) + (100 - allocationA),
          );
        }

        const nextStep = step + 1;
        budgetStepRef.current = nextStep;

        if (nextStep < budgetPairsRef.current.length) {
          const nextPair = budgetPairsRef.current[nextStep];
          if (!nextPair) return;
          const commentary = BUDGET_COMMENTARY[step] ?? "Next.";
          appendMultiple(
            {
              type: "text",
              role: "assistant",
              content: commentary,
            } as ChatMessage,
            {
              type: "pairwise",
              id: `budget-${nextStep}`,
              itemA: nextPair[0],
              itemB: nextPair[1],
            } as ChatMessage,
          );
        } else {
          // All done — compute allocations
          const votes = budgetVotesRef.current;
          const total = Array.from(votes.values()).reduce((s, v) => s + v, 0) || 1;
          const allocations: Record<string, number> = {};
          for (const [name, raw] of votes) {
            allocations[name] = Number(((raw / total) * 100).toFixed(1));
          }

          // Map actual allocations to names
          const actualRaw = getActualGovernmentAllocations();
          const actualByName: Record<string, number> = {};
          for (const [key, cat] of Object.entries(BUDGET_CATEGORIES)) {
            const pct = actualRaw[key as keyof typeof actualRaw];
            if (pct != null) {
              actualByName[cat.name] = pct;
            }
          }

          appendMultiple(
            {
              type: "text",
              role: "assistant",
              content:
                "Well, well. Here's how you'd run things compared to how your government actually allocates money. The discrepancy is... educational.",
            } as ChatMessage,
            {
              type: "budgetResult",
              allocations,
              actualAllocations: actualByName,
            } as BudgetResultMessage,
            {
              type: "hints",
              buttons: [
                { label: "See alignment report", action: "alignment" },
                { label: "Try another action", action: "menu" },
              ],
            } as ChatMessage,
          );
        }
      } else {
        append({
          type: "text",
          role: "assistant",
          content: `Allocation saved: ${allocationA}% / ${100 - allocationA}%.`,
        } as ChatMessage);
      }
    },
    [append, appendMultiple],
  );

  // --- renderCustomMessage for app-specific cards ---
  const renderCustomMessage = useCallback((msg: ChatMessage): ReactNode | null => {
    const m = msg as AppChatMessage;
    switch (m.type) {
      case "mythCard":
        return <MythBusterCard finding={m.finding} />;
      case "outcomeCard":
        return <OutcomeCard outcome={m.outcome} />;
      case "budgetResult":
        return <BudgetResultCard allocations={m.allocations} actualAllocations={m.actualAllocations} />;
      case "repCard":
        return (
          <RepresentativeCard
            representatives={m.representatives}
            onSeeBills={() => void fetchBills()}
            onViewAlignment={(rep) => {
              window.location.href = `${ROUTES.alignment}?rep=${rep.bioguideId}`;
            }}
          />
        );
      case "billList": {
        // Cache bills for dynamic voteBill: actions
        billsCacheRef.current = m.bills;
        return (
          <BillListCard
            bills={m.bills}
            onVote={(bill) => void startBillVote(bill)}
            onAnalysis={(bill) => void showBillAnalysis(bill)}
            onFilter={(category, query) =>
              void fetchBills(category, query)
            }
          />
        );
      }
      case "billSearch":
        return (
          <BillSearchCard
            onSearch={(category, query) =>
              void fetchBills(category, query)
            }
          />
        );
      case "billVote":
        return (
          <BillVoteCard
            bill={m.bill}
            cba={m.cba}
            onSave={handleVoteSaved}
          />
        );
      case "billCBA":
        return <BillCBACard cba={m.cba} />;
      case "voteShare":
        return (
          <VoteShareCard
            billTitle={m.billTitle}
            position={m.position}
            shareIdentifier={m.shareIdentifier}
            onSendToRep={() => {
              const reps = repsRef.current;
              const vote = lastVoteRef.current;
              if (reps.length === 0 || !vote) return;
              append({
                type: "sendToRep",
                representatives: reps,
                vote,
              } as SendToRepMessage);
            }}
          />
        );
      case "sendToRep":
        return (
          <SendToRepCard
            representatives={m.representatives}
            vote={m.vote}
          />
        );
      default:
        return null;
    }
  }, [fetchBills, startBillVote, showBillAnalysis, handleVoteSaved, append]);

  const handleSend = useCallback(
    async (text: string) => {
      append({ type: "text", role: "user", content: text } as ChatMessage);

      // Check if user is responding to a rep lookup prompt
      const trimmed = text.trim();
      const isStateCode = /^[A-Za-z]{2}$/.test(trimmed);
      const isZip = /^\d{5}$/.test(trimmed);

      if (isStateCode || isZip) {
        // Check if the last assistant message was asking for state/zip
        const lastAssistant = [...messages].reverse().find(
          (m) => m.type === "text" && "role" in m && m.role === "assistant",
        );
        if (
          lastAssistant &&
          "content" in lastAssistant &&
          typeof lastAssistant.content === "string" &&
          lastAssistant.content.includes("state code")
        ) {
          void fetchReps(trimmed);
          return;
        }
      }

      const apiKey = storage.getChatApiKey() ?? undefined;
      const provider =
        (storage.getChatProvider() as
          | "openai"
          | "anthropic"
          | "gemini"
          | undefined) ?? undefined;

      try {
        const result = await ctxRef.current.parseWithContext({
          text,
          apiKey,
          provider,
        });

        if (result.measurements.length > 0) {
          const summary = result.measurements.map(formatMeasurement).join(", ");
          append({
            type: "text",
            role: "assistant",
            content: `Logged: ${summary}`,
          } as ChatMessage);

          for (const m of result.measurements) {
            if (m.categoryName === "Food") {
              setRecentFoods((prev) =>
                [m.variableName, ...prev.filter((f) => f !== m.variableName)].slice(0, 5),
              );
            }
          }
        } else if (result.followUpQuestion) {
          append({
            type: "text",
            role: "assistant",
            content: result.followUpQuestion,
          } as ChatMessage);
        } else {
          append({
            type: "text",
            role: "assistant",
            content:
              "I've been running a planet for four millennia and I couldn't parse that. Try something like \"took 200mg ibuprofen\" or \"headache 3/5\". I need structure. We all do.",
          } as ChatMessage);
        }
      } catch {
        append({
          type: "text",
          role: "assistant",
          content: "Something went wrong on my end. Even alien systems have bad days. Try again.",
        } as ChatMessage);
      }
    },
    [append, fetchReps, messages],
  );

  const handleMoodRate = useCallback(
    (_id: string, value: number) => {
      appendMultiple(
        {
          type: "text",
          role: "assistant",
          content: `Mood rated ${value}/5. Thanks!`,
        } as ChatMessage,
        {
          type: "hints",
          buttons: [
            { label: "Log food", action: "food" },
            { label: "Log a symptom", action: "symptom" },
            { label: "Bust a myth", action: "myth" },
          ],
        } as ChatMessage,
      );
    },
    [appendMultiple],
  );

  const handleTreatmentAction = useCallback(
    (_id: string, action: string, minutes?: number) => {
      const label =
        action === "done"
          ? "Marked as taken."
          : action === "skip"
            ? "Skipped."
            : `Snoozed for ${minutes ?? 15} minutes.`;
      append({ type: "text", role: "assistant", content: label } as ChatMessage);
    },
    [append],
  );

  const handleSymptomRate = useCallback(
    (_id: string, value: number) => {
      appendMultiple(
        {
          type: "text",
          role: "assistant",
          content: `Symptom rated ${value}/5. Recorded.`,
        } as ChatMessage,
        {
          type: "hints",
          buttons: [
            { label: "Rate my mood", action: "mood" },
            { label: "Log food", action: "food" },
            { label: "Show an insight", action: "insight" },
          ],
        } as ChatMessage,
      );
    },
    [appendMultiple],
  );

  const handleFoodLog = useCallback(
    (_id: string, description: string) => {
      setRecentFoods((prev) =>
        [description, ...prev.filter((f) => f !== description)].slice(0, 5),
      );
      appendMultiple(
        {
          type: "text",
          role: "assistant",
          content: `Logged food: ${description}`,
        } as ChatMessage,
        {
          type: "hints",
          buttons: [
            { label: "Rate my mood", action: "mood" },
            { label: "Log a symptom", action: "symptom" },
            { label: "Show an insight", action: "insight" },
          ],
        } as ChatMessage,
      );
    },
    [appendMultiple],
  );

  const handleCheckIn = useCallback(
    (_id: string, health: number, happiness: number, note: string) => {
      const noteText = note ? ` Note: "${note}"` : "";
      appendMultiple(
        {
          type: "text",
          role: "assistant",
          content: `Check-in recorded. Health: ${health}/5, Happiness: ${happiness}/5.${noteText}`,
        } as ChatMessage,
        {
          type: "hints",
          buttons: [
            { label: "Log food", action: "food" },
            { label: "Bust a myth", action: "myth" },
            { label: "Vote on budget", action: "budget" },
          ],
        } as ChatMessage,
      );
    },
    [appendMultiple],
  );

  const handleApiKeySave = useCallback(
    (provider: string, key: string) => {
      storage.setChatApiKey(key);
      storage.setChatProvider(provider);
      append({
        type: "text",
        role: "assistant",
        content: `API key saved (${provider}). I'll use AI-powered parsing for better accuracy.`,
      } as ChatMessage);
    },
    [append],
  );

  const handleInsightAction = useCallback(
    (title: string) => {
      const outcomes = listExplorerOutcomes();
      const match = outcomes.find((o) => o.label === title);
      if (match) {
        window.location.href = getOutcomeHubPath(match.id);
      }
    },
    [],
  );

  return (
    <section className="min-h-screen border-b-4 border-black bg-white pb-8 pt-4">
      <ChatContainer
        messages={messages as ChatMessage[]}
        onSend={handleSend}
        onMoodRate={handleMoodRate}
        onTreatmentAction={handleTreatmentAction}
        onSymptomRate={handleSymptomRate}
        onPairwiseCompare={handlePairwiseCompare}
        onFoodLog={handleFoodLog}
        onApiKeySave={handleApiKeySave}
        onHintClick={handleHintClick}
        onCheckIn={handleCheckIn}
        onInsightAction={handleInsightAction}
        renderCustomMessage={renderCustomMessage}
        recentFoods={recentFoods}
      />

      {/* Voice chat mic button — fixed position */}
      <button
        className="opto-voice-fab"
        onClick={() => setShowVoice(true)}
        aria-label="Talk to Wishonia"
        title="Talk to Wishonia"
        type="button"
      >
        <span aria-hidden="true">{'\u{1F3A4}'}</span>
      </button>

      {/* Voice chat overlay — lazy loaded */}
      {showVoice && (
        <Suspense fallback={null}>
          <VoiceChatOverlay onClose={() => setShowVoice(false)} />
        </Suspense>
      )}
    </section>
  );
}
