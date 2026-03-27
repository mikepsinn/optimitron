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
    name: "dFDA",
    icon: "🧬",
    description: "Decentralized FDA - Global trial coordination",
    color: "#22c55e",
  },
  {
    id: "iabs",
    name: "IABs",
    icon: "📊",
    description: "Incentive Alignment Bonds - Outcome-based funding",
    color: "#3b82f6",
  },
  {
    id: "storacha",
    name: "Storacha",
    icon: "📦",
    description: "IPFS storage - Immutable research data",
    color: "#f97316",
  },
  {
    id: "hypercerts",
    name: "Hypercerts",
    icon: "🏆",
    description: "Impact certificates - Credit for contributions",
    color: "#a855f7",
  },
  {
    id: "wish",
    name: "$WISH",
    icon: "⭐",
    description: "Governance token - Stake in outcomes",
    color: "#eab308",
  },
  {
    id: "optimizer",
    name: "Optimizer",
    icon: "🤖",
    description: "AI policy engine - Evidence-based decisions",
    color: "#06b6d4",
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
        <div className="font-pixel text-xs text-purple-400 mb-1">PART 5: THE ARMORY</div>
        <h1 className="font-pixel text-xl md:text-2xl text-purple-400">
          TECHNOLOGY STACK
        </h1>
        <div className="font-terminal text-xl text-zinc-200 mt-2">
          The tools powering the health optimization game
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Tech grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <div className="font-terminal text-xl text-zinc-200 line-clamp-2">
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
                  <p>Coordinates clinical trials across 147+ countries</p>
                  <p>Reduces approval time from 10 years to less than 1</p>
                  <p>Open-source protocol for transparent research</p>
                </>
              )}
              {selectedItem.id === "iabs" && (
                <>
                  <p>Investors funded only if health outcomes improve</p>
                  <p>Aligns financial incentives with patient outcomes</p>
                  <p>De-risks research funding for governments</p>
                </>
              )}
              {selectedItem.id === "storacha" && (
                <>
                  <p>IPFS-based storage for research data</p>
                  <p>Immutable, censorship-resistant records</p>
                  <p>Ensures data integrity and reproducibility</p>
                </>
              )}
              {selectedItem.id === "hypercerts" && (
                <>
                  <p>NFT-based impact attribution</p>
                  <p>Track and reward contributions to health outcomes</p>
                  <p>Enables retroactive public goods funding</p>
                </>
              )}
              {selectedItem.id === "wish" && (
                <>
                  <p>Governance token for the Wishonia ecosystem</p>
                  <p>Stake tokens to vote on research priorities</p>
                  <p>Earn rewards for successful health outcomes</p>
                </>
              )}
              {selectedItem.id === "optimizer" && (
                <>
                  <p>AI-powered policy recommendation engine</p>
                  <p>Analyzes health data to suggest optimal interventions</p>
                  <p>Simulates policy outcomes before implementation</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom message */}
        <div className="text-center font-pixel text-xs text-zinc-200">
          Tap any technology to learn more
        </div>
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
