"use client"

import { useState } from "react"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { ChevronDown, ChevronUp, Save, AlertTriangle } from "lucide-react"
import { WISHOCRATIC_ITEMS, WishocraticItemId } from "@/lib/wishocracy-data"
import { motion, AnimatePresence } from "framer-motion"

interface WishocracyEditSectionProps {
  allocations: Array<{
    itemAId: string
    itemBId: string
    allocationA: number
    allocationB: number
  }>
  selectedItemIds: Set<WishocraticItemId>
  onSave: (
    updatedAllocations: Array<{
      itemAId: string
      itemBId: string
      allocationA: number
      allocationB: number
    }>,
    updatedItemIds: Set<WishocraticItemId>,
    deletedItemIds: Set<WishocraticItemId>
  ) => Promise<void>
}

export function WishocracyEditSection({
  allocations,
  selectedItemIds,
  onSave,
}: WishocracyEditSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedAllocations, setEditedAllocations] = useState(allocations)
  const [editedItemIds, setEditedItemIds] = useState(selectedItemIds)
  const [showWarning, setShowWarning] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<Set<WishocraticItemId>>(new Set())

  const allItemIds = Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[]

  const handleItemToggle = (itemId: WishocraticItemId, selected: boolean) => {
    const newItemIds = new Set(editedItemIds)

    if (selected) {
      newItemIds.add(itemId)
      // Remove from delete list if re-adding
      const newToDelete = new Set(itemsToDelete)
      newToDelete.delete(itemId)
      setItemsToDelete(newToDelete)

      // Generate missing pairs involving this newly enabled item
      const otherIncludedItems = Array.from(newItemIds).filter(id => id !== itemId)

      const newPairs: Array<{
        itemAId: string
        itemBId: string
        allocationA: number
        allocationB: number
      }> = []

      // Create pairs between the newly enabled item and all other included items
      for (const otherId of otherIncludedItems) {
        const pairExists = editedAllocations.some(comp =>
          (comp.itemAId === itemId && comp.itemBId === otherId) ||
          (comp.itemAId === otherId && comp.itemBId === itemId)
        )

        if (!pairExists) {
          // Add new pair at 50/50
          newPairs.push({
            itemAId: itemId,
            itemBId: otherId,
            allocationA: 50,
            allocationB: 50
          })
        }
      }

      // Add new pairs to comparisons
      if (newPairs.length > 0) {
        setEditedAllocations(prev => [...prev, ...newPairs])
      }
    } else {
      newItemIds.delete(itemId)
      // Mark for deletion
      const newToDelete = new Set(itemsToDelete)
      newToDelete.add(itemId)
      setItemsToDelete(newToDelete)
      setShowWarning(true)
    }

    setEditedItemIds(newItemIds)
  }

  const handleAllocationChange = (
    itemAId: string,
    itemBId: string,
    value: number
  ) => {
    setEditedAllocations(prev =>
      prev.map(comp =>
        comp.itemAId === itemAId && comp.itemBId === itemBId
          ? { ...comp, allocationA: value, allocationB: 100 - value }
          : comp
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedAllocations, editedItemIds, itemsToDelete)
      setShowWarning(false)
      setItemsToDelete(new Set())
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to save changes:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges =
    JSON.stringify(editedAllocations) !== JSON.stringify(allocations) ||
    JSON.stringify(Array.from(editedItemIds).sort()) !== JSON.stringify(Array.from(selectedItemIds).sort())

  return (
    <div className="max-w-3xl mx-auto mt-8" data-edit-allocations>
      <Card className="bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-6 pb-0 pt-0 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black uppercase">Review & Edit Your Choices</h3>
          {hasChanges && !isOpen && (
            <span className="px-2 py-1 bg-brutal-pink text-xs font-bold uppercase rounded text-brutal-pink-foreground">
              Unsaved Changes
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t-4 border-primary">
              {/* Warning Banner */}
              {showWarning && itemsToDelete.size > 0 && (
                <div className="mb-6 p-4 bg-brutal-yellow border-4 border-primary rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-brutal-yellow-foreground mt-0.5" />
                    <div>
                      <p className="font-bold text-brutal-yellow-foreground">Warning: Item Removal</p>
                      <p className="text-sm text-brutal-yellow-foreground mt-1">
                        Removing an item will permanently delete all allocations involving that item.
                        You'll need to redo those allocations if you change your mind.
                      </p>
                      <p className="text-xs font-bold text-brutal-yellow-foreground mt-2">
                        Categories to be removed: {Array.from(itemsToDelete).map(id => WISHOCRATIC_ITEMS[id].name).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Item Toggles */}
              <div className="mb-8">
                <h4 className="text-lg font-black uppercase mb-4 pt-4">Included Items</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allItemIds.map(itemId => {
                    const item = WISHOCRATIC_ITEMS[itemId]
                    const isSelected = editedItemIds.has(itemId)
                    const willBeDeleted = itemsToDelete.has(itemId)

                    return (
                      <div
                        key={itemId}
                        className={`p-3 border-2 rounded flex items-center justify-between ${
                          isSelected && !willBeDeleted
                            ? "border-brutal-cyan bg-brutal-cyan"
                            : willBeDeleted
                            ? "border-brutal-red bg-brutal-red"
                            : "border-primary bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <p className={`font-bold text-sm ${isSelected && !willBeDeleted ? "text-brutal-cyan-foreground" : willBeDeleted ? "text-brutal-red-foreground" : ""}`}>{item.name}</p>
                            <p className={`text-xs ${isSelected && !willBeDeleted ? "text-brutal-cyan-foreground" : willBeDeleted ? "text-brutal-red-foreground" : "text-muted-foreground"}`}>
                              {editedAllocations.filter(c => c.itemAId === itemId || c.itemBId === itemId).length} allocations
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-block w-12 h-6 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected && !willBeDeleted}
                            onChange={(e) => handleItemToggle(itemId, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-full h-full bg-muted border-4 border-primary peer-checked:bg-brutal-cyan transition-colors" />
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-foreground border-4 border-primary transition-transform peer-checked:translate-x-6" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pair Allocations */}
              <div className="mb-6">
                <h4 className="text-lg font-black uppercase mb-4">
                  Your Allocations ({editedAllocations.filter(comp =>
                    !itemsToDelete.has(comp.itemAId as WishocraticItemId) &&
                    !itemsToDelete.has(comp.itemBId as WishocraticItemId)
                  ).length})
                </h4>
                <div className="space-y-4">
                  {editedAllocations
                    .filter(comp =>
                      !itemsToDelete.has(comp.itemAId as WishocraticItemId) &&
                      !itemsToDelete.has(comp.itemBId as WishocraticItemId)
                    )
                    .map((comp) => {
                      const itemA = WISHOCRATIC_ITEMS[comp.itemAId as WishocraticItemId]
                      const itemB = WISHOCRATIC_ITEMS[comp.itemBId as WishocraticItemId]

                      return (
                        <div
                          key={`${comp.itemAId}-${comp.itemBId}`}
                          className="p-4 border-4 border-primary rounded bg-background"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{itemA.icon}</span>
                              <span className="font-bold text-sm">{itemA.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">vs</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{itemB.icon}</span>
                              <span className="font-bold text-sm">{itemB.name}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={comp.allocationA}
                              onChange={(e) =>
                                handleAllocationChange(comp.itemAId, comp.itemBId, Number(e.target.value))
                              }
                              className="w-full h-3 bg-background border-4 border-primary rounded-none appearance-none cursor-pointer slider-brutal"
                              style={{
                                background: `linear-gradient(to right, #FF6B9D ${comp.allocationA}%, #00D9FF ${comp.allocationA}%)`,
                              }}
                            />
                            <div className="flex justify-between text-sm font-bold">
                              <span className="text-brutal-pink">{comp.allocationA}%</span>
                              <span className="text-brutal-cyan">{comp.allocationB}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
                {itemsToDelete.size > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {allocations.filter(c =>
                      itemsToDelete.has(c.itemAId as WishocraticItemId) ||
                      itemsToDelete.has(c.itemBId as WishocraticItemId)
                    ).length} allocations will be deleted when you save.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex-1 h-12 font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-brutal-cyan-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    setEditedAllocations(allocations)
                    setEditedItemIds(selectedItemIds)
                    setItemsToDelete(new Set())
                    setShowWarning(false)
                  }}
                  disabled={!hasChanges || isSaving}
                  variant="outline"
                  className="h-12 font-black uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slider styles */}
      <style jsx>{`
        .slider-brutal::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: black;
          border: 2px solid black;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
        }

        .slider-brutal::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: black;
          border: 2px solid black;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
          border-radius: 0;
        }
      `}</style>
      </Card>
    </div>
  )
}
