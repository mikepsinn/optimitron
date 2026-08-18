import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";

export interface WishocraticAllocationInput {
  itemAId: string;
  itemBId: string;
  allocationA: number;
  allocationB: number;
}

export function isWishocraticItemId(value: string): value is WishocraticItemId {
  return Object.prototype.hasOwnProperty.call(WISHOCRATIC_ITEMS, value);
}

export function isValidAllocationPair(allocationA: number, allocationB: number): boolean {
  const sum = allocationA + allocationB;
  const inRange =
    allocationA >= 0 &&
    allocationA <= 100 &&
    allocationB >= 0 &&
    allocationB <= 100;

  return inRange && (sum === 100 || sum === 0);
}

export function normalizeWishocraticAllocation<T extends WishocraticAllocationInput>(
  allocation: T,
): T {
  if (allocation.itemAId <= allocation.itemBId) {
    return allocation;
  }

  return {
    ...allocation,
    itemAId: allocation.itemBId,
    itemBId: allocation.itemAId,
    allocationA: allocation.allocationB,
    allocationB: allocation.allocationA,
  };
}

export function isValidWishocraticAllocation(
  allocation: WishocraticAllocationInput,
): allocation is WishocraticAllocationInput & {
  itemAId: WishocraticItemId;
  itemBId: WishocraticItemId;
} {
  return (
    allocation.itemAId !== allocation.itemBId &&
    isWishocraticItemId(allocation.itemAId) &&
    isWishocraticItemId(allocation.itemBId) &&
    isValidAllocationPair(allocation.allocationA, allocation.allocationB)
  );
}
