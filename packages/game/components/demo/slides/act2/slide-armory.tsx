"use client";

import { SlideBase } from "../slide-base";
import { useDemoStore } from "@/lib/demo/store";
import { useEffect, useState } from "react";

interface TechItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const technologies: TechItem[] = [
  {
    id: "dfda",
    name: "Decentralized FDA",
    icon: "🧬",
    description: "Real-time Outcome Labels & Treatment Rankings",
    color: "#22c55e",
  },
  {
    id: "opg",
    name: "Optimal Policy Generator",
    icon: "📋",
    description: "Grade every policy A–F by what actually happened",
    color: "#06b6d4",
  },
  {
    id: "obg",
    name: "Optimal Budget Generator",
    icon: "💰",
    description: "Find the cheapest high performer per category",
    color: "#eab308",
  },
  {
    id: "wishocracy",
    name: "Wishocracy",
    icon: "🗳️",
    description: "Pairwise budget allocation — 8 billion preferences, one optimal budget",
    color: "#a855f7",
  },
  {
    id: "iabs",
    name: "Incentive Alignment Bonds",
    icon: "📊",
    description: "Align senator incentives with outcomes",
    color: "#3b82f6",
  },
  {
    id: "dfed",
    name: "Decentralized Fed",
    icon: "🏦",
    description: "0% inflation anchored to productivity — new money via UBI, not banks",
    color: "#f43f5e",
  },
  {
    id: "dirs",
    name: "Decentralized IRS",
    icon: "🧾",
    description: "0.5% transaction tax — four lines of Solidity replace 74,000 pages",
    color: "#f97316",
  },
  {
    id: "dwelfare",
    name: "Decentralized Welfare",
    icon: "🤝",
    description: "UBI replaces $675B in welfare bureaucracy",
    color: "#10b981",
  },
];

export function SlideArmory() {
  const addInventoryItem = useDemoStore((s) => s.addInventoryItem);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<TechItem | null>(null);

  useEffect(() => {
    // Reveal items one by one
    technologies.forEach((tech, i) => {
      setTimeout(() => {
        setVisibleItems((prev) => new Set([...prev, tech.id]));
      }, 300 * (i + 1));
    });

    // Add tech item to inventory
    setTimeout(() => {
      addInventoryItem({ id: "tech", name: "Tech Stack", icon: "🔧" } as unknown as Parameters<typeof addInventoryItem>[0]);
    }, 2500);
  }, [addInventoryItem]);

  return (
    <SlideBase act={2} className="text-purple-400">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="font-pixel text-3xl md:text-5xl text-purple-400">
          THE ARMORY
        </h1>
        <div className="font-terminal text-2xl md:text-3xl text-zinc-200 mt-3">
          The tools to help you win the Earth Optimization Game
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Tech grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {technologies.map((tech) => {
            const isVisible = visibleItems.has(tech.id);
            const isSelected = selectedItem?.id === tech.id;

            return (
              <button
                key={tech.id}
                className={`relative p-4 border rounded transition-all duration-300 text-left ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                } ${
                  isSelected
                    ? "border-2 scale-105"
                    : "border-zinc-700 hover:border-opacity-60"
                }`}
                style={{
                  borderColor: isSelected ? tech.color : undefined,
                  backgroundColor: isSelected ? `${tech.color}20` : "rgba(0,0,0,0.4)",
                }}
                onClick={() => setSelectedItem(isSelected ? null : tech)}
              >
                {/* Icon */}
                <div className="text-3xl mb-2">{tech.icon}</div>

                {/* Name */}
                <div
                  className="font-pixel text-xl mb-1"
                  style={{ color: tech.color }}
                >
                  {tech.name}
                </div>

                {/* Brief description */}
                <div className="font-terminal text-2xl text-zinc-200 line-clamp-2">
                  {tech.description}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: tech.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected item details */}
        {selectedItem && (
          <div
            className="animate-fade-in p-4 border rounded"
            style={{
              borderColor: `${selectedItem.color}50`,
              backgroundColor: `${selectedItem.color}10`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{selectedItem.icon}</span>
              <div>
                <div
                  className="font-pixel text-xl"
                  style={{ color: selectedItem.color }}
                >
                  {selectedItem.name}
                </div>
                <div className="font-terminal text-xl text-zinc-200">
                  {selectedItem.description}
                </div>
              </div>
            </div>

            {/* Detailed info based on selection */}
            <div className="font-terminal text-xs text-zinc-200 space-y-1">
              {selectedItem.id === "dfda" && (
                <>
                  <p>9,500 compounds proven safe — 99.7% of uses never tested</p>
                  <p>44× cheaper, 12× more capacity than current FDA</p>
                  <p>Real-time outcome labels and treatment rankings</p>
                </>
              )}
              {selectedItem.id === "opg" && (
                <>
                  <p>Causal inference on hundreds of years of data across dozens of countries</p>
                  <p>Grades every policy A–F by what actually happened</p>
                  <p>War on Drugs: $51B/yr, overdoses up 1,700%. Portugal: decriminalised, overdoses down 80%</p>
                </>
              )}
              {selectedItem.id === "obg" && (
                <>
                  <p>Finds the cheapest high performer per budget category</p>
                  <p>Singapore: $3K/person on healthcare, lives to 84</p>
                  <p>America: $12K/person, lives to 78</p>
                </>
              )}
              {selectedItem.id === "wishocracy" && (
                <>
                  <p>Pairwise comparisons: clinical trials vs military spending</p>
                  <p>Ten choices, two minutes, eight billion preferences</p>
                  <p>Eigenvector aggregation produces one optimal budget</p>
                </>
              )}
              {selectedItem.id === "iabs" && (
                <>
                  <p>Treaty revenue splits 80/10/10 by smart contract</p>
                  <p>80% clinical trials, 10% bondholders, 10% aligned politicians</p>
                  <p>Self-reinforcing: diseases cured → GDP rises → everyone lobbies for expansion</p>
                </>
              )}
              {selectedItem.id === "dfed" && (
                <>
                  <p>Replaces 12 unelected humans who meet 8× a year</p>
                  <p>0% inflation anchored to productivity growth</p>
                  <p>New money distributed equally to every human via UBI</p>
                </>
              )}
              {selectedItem.id === "dirs" && (
                <>
                  <p>0.5% transaction tax replaces 74,000-page tax code</p>
                  <p>Saves $546B/yr in compliance costs</p>
                  <p>No filing, no accountants, no loopholes</p>
                </>
              )}
              {selectedItem.id === "dwelfare" && (
                <>
                  <p>$13.5T/yr already spent to prevent starvation</p>
                  <p>Up to $675B is pure administrative waste</p>
                  <p>UBI does the same job for $675B less bureaucracy</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom message */}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
