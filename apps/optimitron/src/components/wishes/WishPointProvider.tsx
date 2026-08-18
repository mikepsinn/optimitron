"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { WishPointToast } from "./WishPointToast";

interface WishReward {
  id: string;
  amount: number;
  label: string;
}

interface WishPointContextValue {
  /** Show the wish reward animation with sound */
  showWishReward: (amount: number, label: string) => void;
}

const WishPointContext = createContext<WishPointContextValue>({
  showWishReward: () => {},
});

export function useWishPoints() {
  return useContext(WishPointContext);
}

export function WishPointProvider({ children }: { children: ReactNode }) {
  const [rewards, setRewards] = useState<WishReward[]>([]);

  const showWishReward = useCallback((amount: number, label: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setRewards((prev) => [...prev, { id, amount, label }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <WishPointContext.Provider value={{ showWishReward }}>
      {children}
      {rewards.map((reward) => (
        <WishPointToast
          key={reward.id}
          amount={reward.amount}
          label={reward.label}
          onDone={() => dismiss(reward.id)}
        />
      ))}
    </WishPointContext.Provider>
  );
}
