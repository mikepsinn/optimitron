"use client";

import { SlideBase } from "../slide-base";
import { useDemoStore } from "@/lib/demo/store";
import { INVENTORY_ITEMS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

const categories = [
  { id: "cancer", label: "Cancer Research", icon: "🎗️", color: "#ec4899" },
  { id: "heart", label: "Heart Disease", icon: "❤️", color: "#ef4444" },
  { id: "neuro", label: "Neurological", icon: "🧠", color: "#a855f7" },
  { id: "rare", label: "Rare Diseases", icon: "🧬", color: "#06b6d4" },
  { id: "aging", label: "Aging Research", icon: "⏳", color: "#f59e0b" },
  { id: "mental", label: "Mental Health", icon: "🧘", color: "#22c55e" },
];

export function SlideLevelAllocate() {
  const addInventoryItem = useDemoStore((s) => s.addInventoryItem);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [showComplete, setShowComplete] = useState(false);

  // Animate allocations appearing
  useEffect(() => {
    categories.forEach((cat, i) => {
      setTimeout(() => {
        setAllocations((prev) => ({
          ...prev,
          [cat.id]: Math.floor(10 + Math.random() * 25),
        }));
      }, 500 + i * 200);
    });

    // Show completion after allocations
    setTimeout(() => {
      setShowComplete(true);
      addInventoryItem(INVENTORY_ITEMS[1]); // slot 2: ALLOCATION
    }, 2500);
  }, [addInventoryItem]);

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);

  return (
    <SlideBase act={2} className="text-emerald-400">
      {/* Level header */}
      <div className="text-center mb-6">
        <div className="font-pixel text-xs text-emerald-300/60 mb-1">LEVEL 1</div>
        <h1 className="font-pixel text-xl md:text-2xl text-emerald-400">
          ALLOCATE
        </h1>
        <div className="font-terminal text-sm text-zinc-400 mt-2">
          Direct funding to research priorities
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Allocation interface */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const allocation = allocations[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="bg-black/40 border border-zinc-700 p-3 rounded transition-all duration-300"
                style={{
                  borderColor: allocation > 0 ? cat.color : undefined,
                  opacity: allocation > 0 ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-pixel text-sm text-zinc-300 truncate">
                    {cat.label}
                  </span>
                </div>
                
                {/* Allocation bar */}
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${allocation}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
                
                {/* Percentage */}
                <div className="font-pixel text-xs text-right mt-1" style={{ color: cat.color }}>
                  {allocation}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Total allocated */}
        <div className="text-center">
          <div className="inline-block bg-black/60 border border-emerald-500/30 px-6 py-3 rounded">
            <div className="font-pixel text-xs text-emerald-300/60 mb-1">TOTAL ALLOCATED</div>
            <div className="font-pixel text-2xl text-emerald-400">
              {totalAllocated}%
            </div>
          </div>
        </div>

        {/* Completion message */}
        {showComplete && (
          <div className="text-center space-y-3 animate-fade-in">
            <div className="font-pixel text-sm text-cyan-400">
              ALLOCATION COMPLETE
            </div>
            <div className="flex justify-center gap-2">
              <span className="font-pixel text-xs text-zinc-500">ITEM ACQUIRED:</span>
              <span className="font-pixel text-xs text-amber-400">Budget Allocation</span>
              <span>📊</span>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-black/30 border border-zinc-800 p-4 rounded">
          <div className="font-pixel text-xs text-zinc-400 mb-2">HOW IT WORKS:</div>
          <ul className="font-terminal text-xs text-zinc-500 space-y-1">
            <li>• You decide where treaty funds go</li>
            <li>• Allocations aggregated across all players</li>
            <li>• Most popular categories receive more funding</li>
            <li>• Your voice shapes global health research</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
