"use client"

import { useState } from "react"
import { Card } from "@/components/retroui/Card"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data"
import { AnimatePresence, motion } from "framer-motion"
import { calculateTotalPairs } from "@/lib/wishocracy-utils"

interface WishocracyItemManagerProps {
  show: boolean
  selectedItemIds: Set<WishocraticItemId>
  completedCount: number
  totalPairs: number
  onRemoveItem: (itemId: WishocraticItemId) => void
}

export function WishocracyItemManager({
  show,
  selectedItemIds,
  completedCount,
  totalPairs,
  onRemoveItem,
}: WishocracyItemManagerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!show || selectedItemIds.size === 0) return null

  const remaining = totalPairs - completedCount

  return (
    <div className="max-w-2xl mx-auto mb-4">
      <Card className="bg-background border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-black uppercase">
              {selectedItemIds.size} items
            </span>
            <span className="text-xs text-muted-foreground font-bold">
              {remaining} pairs left
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold">
              {isOpen ? "Close" : "Manage"}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t-2 border-primary pt-3">
                <p className="text-xs text-muted-foreground font-bold mb-3">
                  Remove items to reduce the number of comparisons.
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedItemIds).map((itemId) => {
                    const item = WISHOCRATIC_ITEMS[itemId]
                    if (!item) return null
                    const canRemove = selectedItemIds.size > 2
                    return (
                      <button
                        key={itemId}
                        onClick={() => canRemove && onRemoveItem(itemId)}
                        disabled={!canRemove}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5
                          border-2 border-primary text-sm font-bold
                          transition-all
                          ${canRemove
                            ? "bg-background text-foreground hover:bg-brutal-red hover:text-brutal-red-foreground"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                          }
                        `}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        {canRemove && <X className="w-3 h-3 ml-1" />}
                      </button>
                    )
                  })}
                </div>
                {selectedItemIds.size <= 2 && (
                  <p className="text-xs text-muted-foreground font-bold mt-2">
                    Minimum 2 items required.
                  </p>
                )}
                <p className="text-xs text-muted-foreground font-bold mt-3">
                  Removing an item → {selectedItemIds.size - 1} items · {calculateTotalPairs(selectedItemIds.size - 1)} total pairs
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
