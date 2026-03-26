"use client";

import { useState } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { INVENTORY_ITEMS, type InventoryItem } from "@/lib/demo/parameters";
import { cn } from "@/lib/utils";

interface InventorySlotProps {
  item?: InventoryItem;
  slotIndex: number;
  onHover?: (item: InventoryItem | null) => void;
  isNew?: boolean;
}

/**
 * Single Inventory Slot
 * Shows item emoji when filled, empty state otherwise
 */
function InventorySlot({ item, slotIndex, onHover, isNew }: InventorySlotProps) {
  return (
    <div
      className={cn(
        "inventory-slot",
        !item && "inventory-slot-empty",
        isNew && "animate-item-pickup"
      )}
      onMouseEnter={() => onHover?.(item || null)}
      onMouseLeave={() => onHover?.(null)}
      aria-label={item ? item.name : `Empty slot ${slotIndex + 1}`}
    >
      {item ? (
        <span className="text-base md:text-xl">{item.emoji}</span>
      ) : (
        <span className="text-xs opacity-30">{slotIndex + 1}</span>
      )}
    </div>
  );
}

/**
 * Inventory Tooltip
 * Shows item name and description on hover
 */
function InventoryTooltip({ item }: { item: InventoryItem }) {
  return (
    <div className={cn(
      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
      "sierra-dialog p-2 min-w-[200px] max-w-[280px]",
      "animate-fade-in z-50"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{item.emoji}</span>
        <span className="font-pixel text-pixel-xs text-[var(--sierra-accent)]">
          {item.name}
        </span>
      </div>
      <p className="font-terminal text-sm text-[var(--sierra-fg)]">
        {item.tooltip}
      </p>
    </div>
  );
}

/**
 * Main Inventory Component
 * 8 slots that fill as player collects items
 */
export function Inventory() {
  const { inventory, palette, isRecordingMode } = useDemoStore();
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [newItems, setNewItems] = useState<Set<number>>(new Set());

  // Track when new items are added
  useDemoStore.subscribe(
    (state) => state.inventory,
    (currentInventory, previousInventory) => {
      const newSlots = currentInventory
        .filter((item) => !previousInventory.find((p) => p.slot === item.slot))
        .map((item) => item.slot);
      
      if (newSlots.length > 0) {
        setNewItems((prev) => new Set([...prev, ...newSlots]));
        
        // Clear "new" status after animation
        setTimeout(() => {
          setNewItems((prev) => {
            const next = new Set(prev);
            newSlots.forEach((slot) => next.delete(slot));
            return next;
          });
        }, 500);
      }
    }
  );

  // Hide in recording mode
  if (isRecordingMode) return null;

  // Create 8 slots
  const slots = Array.from({ length: 8 }, (_, i) => {
    const item = inventory.find((inv) => inv.slot === i + 1);
    return { index: i, item };
  });

  return (
    <div className={cn("relative", `palette-${palette}`)}>
      <div className="inventory-grid">
        {slots.map(({ index, item }) => (
          <InventorySlot
            key={index}
            slotIndex={index}
            item={item}
            onHover={setHoveredItem}
            isNew={item ? newItems.has(item.slot) : false}
          />
        ))}
      </div>
      
      {hoveredItem && <InventoryTooltip item={hoveredItem} />}
    </div>
  );
}

/**
 * Compact Inventory for mobile
 * Shows only filled slots with expand option
 */
export function InventoryCompact() {
  const { inventory, palette } = useDemoStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (inventory.length === 0) return null;

  return (
    <div className={cn("relative", `palette-${palette}`)}>
      <button
        className="flex items-center gap-1 px-2 py-1 bg-black/50 border border-[var(--sierra-border)] rounded"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-pixel-xs text-[var(--sierra-fg)]">
          INV ({inventory.length}/8)
        </span>
        <span className="text-sm">{isExpanded ? "▼" : "▶"}</span>
      </button>
      
      {isExpanded && (
        <div className={cn(
          "absolute bottom-full left-0 mb-2",
          "bg-black/90 border border-[var(--sierra-border)] p-2 rounded",
          "animate-slide-up"
        )}>
          <Inventory />
        </div>
      )}
    </div>
  );
}

export default Inventory;
