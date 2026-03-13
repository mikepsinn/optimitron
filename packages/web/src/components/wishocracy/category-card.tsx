"use client"

import { useState } from "react"
import { BUDGET_CATEGORIES, BudgetCategoryId } from "@/lib/wishocracy-data"

interface CategoryCardProps {
  category: BudgetCategoryId
  allocation: number // 0-100
}

export function CategoryCard({ category, allocation }: CategoryCardProps) {
  const cat = BUDGET_CATEGORIES[category]
  const [expanded, setExpanded] = useState(false)
  const shouldTruncate = cat.description.length > 100

  return (
    <div className="flex flex-col items-center">
      <div className="text-6xl">{cat.icon}</div>
      <div className="text-xl md:text-2xl font-black uppercase text-center mb-2">{cat.name}</div>
      <div className="text-xs md:text-sm text-center text-muted-foreground max-w-[250px]">
        {shouldTruncate && !expanded ? (
          <>
            {cat.description.slice(0, 100)}&hellip;{" "}
            <button
              onClick={() => setExpanded(true)}
              className="text-pink-500 font-bold hover:underline"
            >
              more
            </button>
          </>
        ) : (
          <>
            {cat.description}
            {shouldTruncate && (
              <>
                {" "}
                <button
                  onClick={() => setExpanded(false)}
                  className="text-pink-500 font-bold hover:underline"
                >
                  less
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
