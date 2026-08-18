"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SierraAct =
  | "I"
  | "turn"
  | "II-solution"
  | "II-game"
  | "II-money"
  | "II-accountability"
  | "II-armory"
  | "II-climax"
  | "III";

export interface InventoryItem {
  id: string;
  name: string;
  icon: string; // emoji
}

export interface SierraGameState {
  act: SierraAct;
  score: number;
  maxScore: number;
  inventory: InventoryItem[];
  /** 0-1 progress toward HALE target (63.3 → 69.8) */
  haleProgress: number;
  /** 0-1 progress toward Income target ($18.7K → $149K) */
  incomeProgress: number;
  narrationText: string;
  isNarrating: boolean;
  cursorMode: "look" | "use" | "walk" | "talk";
  /** Whether quest meters are visible (hidden in Act I, shown from The Turn) */
  questVisible: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type SierraAction =
  | { type: "SET_ACT"; act: SierraAct }
  | { type: "ADD_SCORE"; amount: number }
  | { type: "SET_SCORE"; score: number }
  | { type: "ADD_INVENTORY"; item: InventoryItem }
  | { type: "SET_QUEST_PROGRESS"; hale: number; income: number }
  | { type: "SET_QUEST_VISIBLE"; visible: boolean }
  | { type: "SET_NARRATION"; text: string; isNarrating: boolean }
  | { type: "SET_CURSOR"; mode: SierraGameState["cursorMode"] }
  | { type: "GAME_OVER" }
  | { type: "RESTORE" }
  | { type: "RESET" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const MAX_INVENTORY = 8;

function sierraReducer(
  state: SierraGameState,
  action: SierraAction,
): SierraGameState {
  switch (action.type) {
    case "SET_ACT":
      return {
        ...state,
        act: action.act,
        questVisible: action.act !== "I",
      };
    case "ADD_SCORE":
      return {
        ...state,
        score: Math.min(state.score + action.amount, state.maxScore),
      };
    case "SET_SCORE":
      return {
        ...state,
        score: Math.min(action.score, state.maxScore),
      };
    case "ADD_INVENTORY":
      if (state.inventory.length >= MAX_INVENTORY) return state;
      if (state.inventory.some((i) => i.id === action.item.id)) return state;
      return { ...state, inventory: [...state.inventory, action.item] };
    case "SET_QUEST_PROGRESS":
      return {
        ...state,
        haleProgress: Math.min(1, Math.max(0, action.hale)),
        incomeProgress: Math.min(1, Math.max(0, action.income)),
      };
    case "SET_QUEST_VISIBLE":
      return { ...state, questVisible: action.visible };
    case "SET_NARRATION":
      return {
        ...state,
        narrationText: action.text,
        isNarrating: action.isNarrating,
      };
    case "SET_CURSOR":
      return { ...state, cursorMode: action.mode };
    case "GAME_OVER":
      return { ...state, score: 0, act: "turn" };
    case "RESTORE":
      return {
        ...state,
        act: "II-solution",
        inventory: [],
        questVisible: true,
      };
    case "RESET":
      return createInitialState();
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function createInitialState(_unused: null = null): SierraGameState {
  return {
    act: "I",
    score: 0,
    maxScore: 8_000_000_000,
    inventory: [],
    haleProgress: 0,
    incomeProgress: 0,
    narrationText: "",
    isNarrating: false,
    cursorMode: "look",
    questVisible: false,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SierraContextValue {
  state: SierraGameState;
  dispatch: Dispatch<SierraAction>;
}

const SierraGameContext = createContext<SierraContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SierraGameProviderProps {
  children: ReactNode;
}

export function SierraGameProvider({
  children,
}: SierraGameProviderProps) {
  const [state, dispatch] = useReducer(
    sierraReducer,
    null,
    createInitialState,
  );

  return (
    <SierraGameContext.Provider value={{ state, dispatch }}>
      {children}
    </SierraGameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSierraGame(): SierraContextValue {
  const ctx = useContext(SierraGameContext);
  if (!ctx) {
    // Return a no-op context for slides rendered without the demo provider.
    return {
      state: createInitialState(),
      dispatch: () => {},
    };
  }
  return ctx;
}
