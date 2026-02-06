/** Message types for the chat UI */

export type ChatMessage =
  | { type: 'text'; role: 'user' | 'assistant'; content: string }
  | { type: 'mood'; id: string }
  | { type: 'treatment'; id: string; name: string; dose: string }
  | { type: 'symptom'; id: string; name: string; valence: 'positive' | 'negative' }
  | { type: 'pairwise'; id: string; itemA: string; itemB: string }
  | { type: 'food'; id: string }
  | { type: 'insight'; title: string; body: string }
  | { type: 'apiKey' };

export type TreatmentAction = 'done' | 'skip' | 'snooze';

export interface MoodCardProps {
  onRate: (value: number) => void;
}

export interface TreatmentCardProps {
  name: string;
  dose: string;
  onAction: (action: TreatmentAction, snoozeMinutes?: number) => void;
}

export interface SymptomCardProps {
  name: string;
  valence: 'positive' | 'negative';
  onRate: (value: number) => void;
}

export interface PairwiseCardProps {
  itemA: string;
  itemB: string;
  onCompare: (allocationA: number) => void;
}

export interface FoodCardProps {
  recentFoods?: string[];
  onLog: (description: string) => void;
}

export interface InsightCardProps {
  title: string;
  body: string;
  icon?: '💡' | '📊';
  showChart?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ApiKeyCardProps {
  onSave: (provider: string, key: string) => void;
}

export interface ChatContainerProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onMoodRate?: (id: string, value: number) => void;
  onTreatmentAction?: (id: string, action: TreatmentAction, snoozeMinutes?: number) => void;
  onSymptomRate?: (id: string, value: number) => void;
  onPairwiseCompare?: (id: string, allocationA: number) => void;
  onFoodLog?: (id: string, description: string) => void;
  onInsightAction?: (title: string) => void;
  onApiKeySave?: (provider: string, key: string) => void;
  recentFoods?: string[];
}
