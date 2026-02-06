"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import confetti from "canvas-confetti"
import { BudgetCategoryId, BUDGET_CATEGORIES } from "@/lib/wishocracy-data"
import {
  generateAllPairsFromCategories,
  generateRandomPairs,
  filterRejectedPairs,
  filterValidComparisons,
  filterCompletedPairs,
  filterValidPairs,
  calculateTotalPairs,
  shufflePairs
} from "@/lib/wishocracy-utils"

// localStorage key for persisting state
const STORAGE_KEY = "wishocracy_pending"

// Pending allocation type for localStorage
type PendingAllocation = {
  categoryA: string
  categoryB: string
  allocationA: number
  allocationB: number
  timestamp?: string
}

interface PendingWishocracyData {
  comparisons: PendingAllocation[]
  currentPairIndex: number
  shuffledPairs: Array<[string, string]>
  selectedCategories?: string[]
  startedAt?: string
}

function getStoredData(): PendingWishocracyData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredData(data: PendingWishocracyData): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error("Failed to save wishocracy data:", e)
  }
}

function removeStoredData(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function useWishocracyState() {
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [comparisons, setComparisons] = useState<PendingAllocation[]>([])
  const [shuffledPairs, setShuffledPairs] = useState<Array<[BudgetCategoryId, BudgetCategoryId]>>([])
  const [showIntro, setShowIntro] = useState(false)
  const [showCategorySelection, setShowCategorySelection] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<Set<BudgetCategoryId>>(new Set())
  const [rejectedCategories, setRejectedCategories] = useState<Set<BudgetCategoryId>>(new Set())
  const [initialized, setInitialized] = useState(false)

  // Calculate total possible unique pairs (accounting for selected categories)
  const totalPossiblePairs = useMemo(() => {
    const activeCategories = selectedCategories.size > 0
      ? selectedCategories.size
      : Object.keys(BUDGET_CATEGORIES).length
    return calculateTotalPairs(activeCategories)
  }, [selectedCategories])

  // Initialize pairs on mount
  const initializedRef = useRef(false)
  useEffect(() => {
    if (initialized || initializedRef.current) return
    initializedRef.current = true

    const pending = getStoredData()
    if (pending && ((pending.shuffledPairs?.length ?? 0) > 0 || (pending.selectedCategories?.length ?? 0) > 0)) {
      try {
        if (pending.selectedCategories && pending.selectedCategories.length > 0) {
          const selectedCategoryIds = new Set<BudgetCategoryId>(
            pending.selectedCategories as BudgetCategoryId[]
          )
          setSelectedCategories(selectedCategoryIds)

          const validComparisons = filterValidComparisons<PendingAllocation>(
            (pending.comparisons || []),
            selectedCategoryIds
          )

          if (!pending.shuffledPairs || pending.shuffledPairs.length === 0) {
            const allPossiblePairs = generateAllPairsFromCategories(selectedCategoryIds)
            const uncompletedPairs = filterCompletedPairs(allPossiblePairs, validComparisons)
            setComparisons(validComparisons)
            setShuffledPairs(uncompletedPairs)
            setCurrentPairIndex(0)
            setShowIntro(false)
          } else {
            const validPairs = filterValidPairs(pending.shuffledPairs)
            setComparisons(validComparisons)
            setCurrentPairIndex(Math.min(pending.currentPairIndex || 0, validPairs.length))
            setShuffledPairs(validPairs)
            setShowIntro(false)
          }
        } else {
          const validComparisons = filterValidComparisons<PendingAllocation>(
            (pending.comparisons || [])
          )
          const validPairs = filterValidPairs(pending.shuffledPairs)
          setComparisons(validComparisons)
          setCurrentPairIndex(Math.min(pending.currentPairIndex || 0, validPairs.length))
          setShuffledPairs(validPairs)
          setShowIntro(false)
        }
      } catch {
        removeStoredData()
        const randomPairs = generateRandomPairs(25)
        setShuffledPairs(randomPairs)
        setShowIntro(true)
      }
    } else {
      const randomPairs = generateRandomPairs(25)
      setShuffledPairs(randomPairs)
      setShowIntro(true)
    }

    setIsLoading(false)
    setInitialized(true)
  }, [initialized])

  const triggerConfetti = () => {
    const colors = ["#FF6B9D", "#00D9FF", "#FFE66D"]
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      colors: colors,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }

  const handlePairSubmit = async (allocationA: number, allocationB: number) => {
    if (!shuffledPairs[currentPairIndex]) return

    const currentPair = shuffledPairs[currentPairIndex]
    const newComparison: PendingAllocation = {
      categoryA: currentPair[0],
      categoryB: currentPair[1],
      allocationA,
      allocationB,
      timestamp: new Date().toISOString(),
    }

    const newComparisons = [...comparisons, newComparison]
    let newIndex = currentPairIndex + 1

    // If both allocations are 0, mark both categories as rejected
    let updatedRejectedCategories = rejectedCategories
    if (allocationA === 0 && allocationB === 0) {
      updatedRejectedCategories = new Set(rejectedCategories)
      updatedRejectedCategories.add(currentPair[0])
      updatedRejectedCategories.add(currentPair[1])
      setRejectedCategories(updatedRejectedCategories)
    }

    // Filter out remaining pairs that include rejected categories
    const filteredPairs = filterRejectedPairs(
      shuffledPairs.slice(newIndex),
      updatedRejectedCategories
    )

    // Save to localStorage
    setStoredData({
      comparisons: newComparisons,
      currentPairIndex: 0,
      shuffledPairs: filteredPairs,
      selectedCategories: selectedCategories.size > 0 ? Array.from(selectedCategories) : undefined,
      startedAt: comparisons.length === 0 ? new Date().toISOString() : undefined,
    })

    setComparisons(newComparisons)

    // Update shuffled pairs to filtered list and reset index
    if (filteredPairs.length > 0) {
      setShuffledPairs(filteredPairs)
      setCurrentPairIndex(0)
    } else {
      if (selectedCategories.size > 0) {
        setShuffledPairs([])
        setCurrentPairIndex(0)
      } else {
        const newRandomPairs = filterRejectedPairs(
          generateRandomPairs(25),
          updatedRejectedCategories
        )
        setShuffledPairs(newRandomPairs)
        setCurrentPairIndex(0)
      }
    }
  }

  const handleReset = async () => {
    removeStoredData()

    setComparisons([])
    setRejectedCategories(new Set())
    setSelectedCategories(new Set())
    setCurrentPairIndex(0)
    setShowIntro(true)
    setShowCategorySelection(false)
    setInitialized(false)

    const randomPairs = generateRandomPairs(25)
    setShuffledPairs(randomPairs)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategorySelectionComplete = async (selected: Set<BudgetCategoryId>) => {
    setSelectedCategories(selected)
    setComparisons([])

    const pairs = generateAllPairsFromCategories(selected)
    const shuffled = shufflePairs(pairs)
    setShuffledPairs(shuffled)
    setCurrentPairIndex(0)
    setShowCategorySelection(false)

    setStoredData({
      comparisons: [],
      currentPairIndex: 0,
      shuffledPairs: shuffled,
      selectedCategories: Array.from(selected),
      startedAt: new Date().toISOString()
    })
  }

  const handleEditSave = async (
    updatedComparisons: Array<{
      categoryA: string
      categoryB: string
      allocationA: number
      allocationB: number
    }>,
    updatedCategories: Set<BudgetCategoryId>,
    deletedCategories: Set<BudgetCategoryId>
  ) => {
    setComparisons(updatedComparisons as PendingAllocation[])
    setSelectedCategories(updatedCategories)

    if (updatedCategories.size > 0) {
      const allPossiblePairs = generateAllPairsFromCategories(updatedCategories)
      const uncompletedPairs = filterCompletedPairs(allPossiblePairs, updatedComparisons)
      setShuffledPairs(uncompletedPairs)
      setCurrentPairIndex(0)
    }

    // Persist to localStorage
    setStoredData({
      comparisons: updatedComparisons as PendingAllocation[],
      currentPairIndex: 0,
      shuffledPairs: [],
      selectedCategories: Array.from(updatedCategories),
    })
  }

  return {
    state: {
      currentPairIndex,
      comparisons,
      shuffledPairs,
      showIntro,
      showCategorySelection,
      showAuthPrompt: false, // Auth disabled
      isLoading,
      selectedCategories,
      rejectedCategories,
      totalPossiblePairs,
      session: null, // No auth
      status: "unauthenticated" as const,
      searchParams: null,
      authCardRef: useRef<HTMLDivElement>(null),
    },
    handlers: {
      handlePairSubmit,
      handleReset,
      handleCategorySelectionComplete,
      handleEditSave,
      setShowIntro,
      setShowCategorySelection,
      setShowAuthPrompt: (_v: boolean) => {}, // No-op: auth disabled
    },
  }
}
