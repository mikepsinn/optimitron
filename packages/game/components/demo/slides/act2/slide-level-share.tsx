"use client";

import { SlideBase } from "../slide-base";
import { useDemoStore } from "@/lib/demo/store";
import { INVENTORY_ITEMS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

interface NetworkNode {
  id: number;
  x: number;
  y: number;
  active: boolean;
  generation: number;
}

export function SlideLevelShare() {
  const addInventoryItem = useDemoStore((s) => s.addInventoryItem);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<[number, number][]>([]);

  useEffect(() => {
    // Start with center node
    const centerNode: NetworkNode = {
      id: 0,
      x: 50,
      y: 50,
      active: true,
      generation: 0,
    };
    setNodes([centerNode]);

    // Expand network over time
    let currentId = 1;
    let currentGen = 0;
    
    const interval = setInterval(() => {
      setNodes((prev) => {
        if (prev.length >= 50) {
          clearInterval(interval);
          return prev;
        }

        // Find nodes from current generation to spawn from
        const parentNodes = prev.filter((n) => n.generation === currentGen && n.active);
        if (parentNodes.length === 0) {
          currentGen++;
          return prev;
        }

        const newNodes: NetworkNode[] = [];
        const newConnections: [number, number][] = [];

        parentNodes.forEach((parent) => {
          // Spawn 2-4 children
          const numChildren = Math.floor(Math.random() * 3) + 2;
          for (let i = 0; i < numChildren; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 8 + Math.random() * 12;
            const newNode: NetworkNode = {
              id: currentId++,
              x: Math.max(5, Math.min(95, parent.x + Math.cos(angle) * distance)),
              y: Math.max(10, Math.min(90, parent.y + Math.sin(angle) * distance)),
              active: true,
              generation: currentGen + 1,
            };
            newNodes.push(newNode);
            newConnections.push([parent.id, newNode.id]);
          }
        });

        setConnections((prevConn) => [...prevConn, ...newConnections]);
        currentGen++;
        return [...prev, ...newNodes];
      });
    }, 400);

    // Add inventory item
    setTimeout(() => {
      addInventoryItem(INVENTORY_ITEMS[3]); // slot 4: REFERRAL LINK
    }, 3000);

    return () => clearInterval(interval);
  }, [addInventoryItem]);

  return (
    <SlideBase act={2} className="text-purple-400">
      {/* Level header */}
      <div className="text-center mb-4">
        <div className="font-pixel text-xs text-purple-300/60 mb-1">LEVEL 3</div>
        <h1 className="font-pixel text-xl md:text-2xl text-purple-400">
          SHARE
        </h1>
        <div className="font-terminal text-sm text-zinc-400 mt-2">
          Spread the word, expand the network
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto space-y-6 overflow-hidden">
        {/* Network visualization */}
        <div className="relative w-full aspect-video bg-black/40 border border-purple-500/30 rounded overflow-hidden">
          <svg className="absolute inset-0 w-full h-full">
            {/* Connections */}
            {connections.map(([fromId, toId], i) => {
              const fromNode = nodes.find((n) => n.id === fromId);
              const toNode = nodes.find((n) => n.id === toId);
              if (!fromNode || !toNode) return null;

              return (
                <line
                  key={i}
                  x1={`${fromNode.x}%`}
                  y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`}
                  y2={`${toNode.y}%`}
                  stroke="rgba(168, 85, 247, 0.3)"
                  strokeWidth="1"
                  className="animate-draw-line"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <g key={node.id}>
                {/* Pulse effect */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={node.id === 0 ? "12" : "6"}
                  fill="none"
                  stroke="rgba(168, 85, 247, 0.5)"
                  className="animate-pulse"
                />
                {/* Node */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={node.id === 0 ? "8" : "4"}
                  fill={node.id === 0 ? "#a855f7" : "#c084fc"}
                />
              </g>
            ))}
          </svg>

          {/* Stats overlay */}
          <div className="absolute top-3 left-3 font-pixel text-xs">
            <div className="text-purple-400">
              NETWORK: {nodes.length} nodes
            </div>
            <div className="text-purple-300/60">
              Connections: {connections.length}
            </div>
          </div>

          {/* Center label */}
          <div
            className="absolute font-pixel text-sm text-purple-400 text-center"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -150%)" }}
          >
            YOU
          </div>
        </div>

        {/* Share methods */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "📱", label: "Text", multiplier: "2x" },
            { icon: "📧", label: "Email", multiplier: "3x" },
            { icon: "🐦", label: "Social", multiplier: "10x" },
            { icon: "🎙️", label: "Podcast", multiplier: "100x" },
          ].map((method) => (
            <div
              key={method.label}
              className="bg-black/40 border border-purple-500/30 p-3 rounded text-center hover:border-purple-500/60 transition-colors"
            >
              <div className="text-2xl mb-1">{method.icon}</div>
              <div className="font-pixel text-xs text-purple-300">{method.label}</div>
              <div className="font-pixel text-sm text-purple-400">{method.multiplier}</div>
            </div>
          ))}
        </div>

        {/* Viral equation */}
        <div className="bg-black/30 border border-zinc-800 p-4 rounded text-center">
          <div className="font-pixel text-xs text-zinc-500 mb-2">VIRAL COEFFICIENT</div>
          <div className="font-pixel text-xl text-purple-400">
            1 person → 3 people → 9 people → 27 people
          </div>
          <div className="font-terminal text-xs text-zinc-500 mt-2">
            Each share multiplies impact exponentially
          </div>
        </div>

        {/* Referral bonus */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="font-pixel text-xs text-amber-300/60">REFERRAL BONUS</div>
            <div className="font-pixel text-lg text-amber-400">+10 VOTE points</div>
            <div className="font-pixel text-xs text-zinc-500">per signup</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes draw-line {
          from { stroke-dasharray: 100; stroke-dashoffset: 100; }
          to { stroke-dasharray: 100; stroke-dashoffset: 0; }
        }
        .animate-draw-line {
          animation: draw-line 0.5s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
