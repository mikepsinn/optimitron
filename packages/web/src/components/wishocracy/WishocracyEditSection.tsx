"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Save, AlertTriangle } from "lucide-react"
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data"
import { motion, AnimatePresence } from "framer-motion"

interface WishocracyEditSectionProps {
  comparisons: Array<{
    itemAId: string
    itemBId: string
    allocationA: number
    allocationB: number
  }>
  selectedCategories: Set<BudgetCategoryId>
  onSave: (
    updatedComparisons: Array<{
      itemAId: string
      itemBId: string
      allocationA: number
      allocationB: number
    }>,
    updatedCategories: Set<BudgetCategoryId>,
    deletedCategories: Set<BudgetCategoryId>
  ) => Promise<void>
}

export function WishocracyEditSection({
  comparisons,
  selectedCategories,
  onSave,
}: WishocracyEditSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedComparisons, setEditedComparisons] = useState(comparisons)
  const [editedCategories, setEditedCategories] = useState(selectedCategories)
  const [showWarning, setShowWarning] = useState(false)
  const [categoriesToDelete, setCategoriesToDelete] = useState<Set<BudgetCategoryId>>(new Set())

  const allCategories = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[]

  const handleCategoryToggle = (categoryId: BudgetCategoryId, selected: boolean) => {
    const newCategories = new Set(editedCategories)

    if (selected) {
      newCategories.add(categoryId)
      // Remove from delete list if re-adding
      const newToDelete = new Set(categoriesToDelete)
      newToDelete.delete(categoryId)
      setCategoriesToDelete(newToDelete)

      // Generate missing pairs involving this newly enabled category
      const otherSelectedCategories = Array.from(newCategories).filter(cat => cat !== categoryId)

      const newPairs: Array<{
        itemAId: string
        itemBId: string
        allocationA: number
        allocationB: number
      }> = []

      // Create pairs between the newly enabled category and all other selected categories
      for (const otherCat of otherSelectedCategories) {
        // Check if this pair already exists in either direction
        const pairExists = editedComparisons.some(comp =>
          (comp.itemAId === categoryId && comp.itemBId === otherCat) ||
          (comp.itemAId === otherCat && comp.itemBId === categoryId)
        )

        if (!pairExists) {
          // Add new pair at 50/50
          newPairs.push({
            itemAId: categoryId,
            itemBId: otherCat,
            allocationA: 50,
            allocationB: 50
          })
        }
      }

      // Add new pairs to comparisons
      if (newPairs.length > 0) {
        setEditedComparisons(prev => [...prev, ...newPairs])
      }
    } else {
      newCategories.delete(categoryId)
      // Mark for deletion
      const newToDelete = new Set(categoriesToDelete)
      newToDelete.add(categoryId)
      setCategoriesToDelete(newToDelete)
      setShowWarning(true)
    }

    setEditedCategories(newCategories)
  }

  const handleAllocationChange = (
    itemAId: string,
    itemBId: string,
    value: number
  ) => {
    setEditedComparisons(prev =>
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
      await onSave(editedComparisons, editedCategories, categoriesToDelete)
      setShowWarning(false)
      setCategoriesToDelete(new Set())
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to save changes:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges =
    JSON.stringify(editedComparisons) !== JSON.stringify(comparisons) ||
    JSON.stringify(Array.from(editedCategories).sort()) !== JSON.stringify(Array.from(selectedCategories).sort())

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
            <span className="px-2 py-1 bg-brutal-pink text-xs font-bold uppercase rounded">
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
              {showWarning && categoriesToDelete.size > 0 && (
                <div className="mb-6 p-4 bg-brutal-yellow border-4 border-primary rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-foreground mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Warning: Category Deselection</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deselecting a category will permanently delete all comparisons involving that category.
                        You'll need to re-do those comparisons if you change your mind.
                      </p>
                      <p className="text-xs font-bold text-foreground mt-2">
                        Categories to be removed: {Array.from(categoriesToDelete).map(id => BUDGET_CATEGORIES[id].name).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Toggles */}
              <div className="mb-8">
                <h4 className="text-lg font-black uppercase mb-4 pt-4">Selected Categories</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allCategories.map(categoryId => {
                    const category = BUDGET_CATEGORIES[categoryId]
                    const isSelected = editedCategories.has(categoryId)
                    const willBeDeleted = categoriesToDelete.has(categoryId)

                    return (
                      <div
                        key={categoryId}
                        className={`p-3 border-2 rounded flex items-center justify-between ${
                          isSelected && !willBeDeleted
                            ? "border-brutal-cyan bg-brutal-cyan"
                            : willBeDeleted
                            ? "border-brutal-red bg-brutal-red"
                            : "border-primary bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <p className="font-bold text-sm">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {editedComparisons.filter(c => c.itemAId === categoryId || c.itemBId === categoryId).length} allocations
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-block w-12 h-6 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected && !willBeDeleted}
                            onChange={(e) => handleCategoryToggle(categoryId, e.target.checked)}
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
                  Your Allocations ({editedComparisons.filter(comp =>
                    !categoriesToDelete.has(comp.itemAId as BudgetCategoryId) &&
                    !categoriesToDelete.has(comp.itemBId as BudgetCategoryId)
                  ).length})
                </h4>
                <div className="space-y-4">
                  {editedComparisons
                    .filter(comp =>
                      !categoriesToDelete.has(comp.itemAId as BudgetCategoryId) &&
                      !categoriesToDelete.has(comp.itemBId as BudgetCategoryId)
                    )
                    .map((comp) => {
                      const catA = BUDGET_CATEGORIES[comp.itemAId as BudgetCategoryId]
                      const catB = BUDGET_CATEGORIES[comp.itemBId as BudgetCategoryId]

                      return (
                        <div
                          key={`${comp.itemAId}-${comp.itemBId}`}
                          className="p-4 border-4 border-primary rounded bg-background"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{catA.icon}</span>
                              <span className="font-bold text-sm">{catA.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">vs</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{catB.icon}</span>
                              <span className="font-bold text-sm">{catB.name}</span>
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
                {categoriesToDelete.size > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {comparisons.filter(c =>
                      categoriesToDelete.has(c.itemAId as BudgetCategoryId) ||
                      categoriesToDelete.has(c.itemBId as BudgetCategoryId)
                    ).length} allocations will be deleted when you save.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex-1 h-12 font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    setEditedComparisons(comparisons)
                    setEditedCategories(selectedCategories)
                    setCategoriesToDelete(new Set())
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
