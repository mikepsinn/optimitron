"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Two-part visualization:
 * 1. Fund flow bar showing the 10/10/80 split
 * 2. Circular feedback loop showing why everyone lobbies for expansion
 */

const loopSteps = [
  { label: "Treaty Funding", detail: "$27B+ military reallocation" },
  { label: "10% Bondholders", detail: "Returns attract more capital" },
  { label: "10% Politicians", detail: "Aligned reps get rewarded" },
  { label: "80% Pragmatic Trials", detail: "Highest net social value" },
  { label: "Outcomes Improve", detail: "Health + income metrics rise" },
  { label: "GDP Increases", detail: "Everyone gets richer" },
  { label: "Lobby for More", detail: "All parties want expansion" },
  { label: "Treaty Grows", detail: "1% → 2% → 5% → more" },
];

export function IncentiveFeedbackLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  const cx = 200;
  const cy = 210;
  const r = 155;
  const arrowR = 115;

  return (
    <div ref={ref}>
      {/* Fund flow split visualization */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase text-black/50 text-center mb-3">
          Where Treaty Funding Goes
        </p>
        <div className="flex h-12 border-2 border-black overflow-hidden">
          <motion.div
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="w-[10%] bg-brutal-yellow border-r-2 border-black flex items-center justify-center"
          >
            <span className="text-[10px] sm:text-xs font-black text-black whitespace-nowrap">
              10% Bonds
            </span>
          </motion.div>
          <motion.div
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="w-[10%] bg-brutal-pink border-r-2 border-black flex items-center justify-center"
          >
            <span className="text-[10px] sm:text-xs font-black text-white whitespace-nowrap">
              10% Pols
            </span>
          </motion.div>
          <motion.div
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="w-[80%] bg-brutal-cyan flex items-center justify-center"
          >
            <span className="text-xs sm:text-sm font-black text-black">
              80% Pragmatic Trials (Highest Net Social Value)
            </span>
          </motion.div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <p className="text-[10px] text-black/40 font-medium text-center">
            Bondholders earn returns → buy more bonds
          </p>
          <p className="text-[10px] text-black/40 font-medium text-center">
            Politicians rewarded for alignment → lobby for treaty expansion
          </p>
          <p className="text-[10px] text-black/40 font-medium text-center">
            Cures discovered → GDP rises → everyone gets richer
          </p>
        </div>
      </div>

      {/* Circular feedback loop */}
      <div className="relative max-w-md mx-auto" style={{ paddingBottom: "105%" }}>
        <svg
          viewBox="0 0 400 430"
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="Incentive feedback loop showing how treaty funding creates self-reinforcing growth"
        >
          {/* Circular arrow path */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={arrowR}
            fill="none"
            stroke="#00c8c8"
            strokeWidth="3"
            strokeDasharray="8 6"
            initial={reduced ? {} : { pathLength: 0, opacity: 0 }}
            animate={isInView ? { pathLength: 1, opacity: 0.4 } : {}}
            transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
          />

          {/* Animated rotating dot */}
          {!reduced && (
            <motion.circle
              r="5"
              fill="#00c8c8"
              initial={{ opacity: 0 }}
              animate={
                isInView
                  ? {
                      opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                      cx: loopSteps.map((_, i) => {
                        const a = ((-i * 360) / loopSteps.length + 90) * (Math.PI / 180);
                        return cx + arrowR * Math.cos(a);
                      }),
                      cy: loopSteps.map((_, i) => {
                        const a = ((-i * 360) / loopSteps.length + 90) * (Math.PI / 180);
                        return cy - arrowR * Math.sin(a);
                      }),
                    }
                  : {}
              }
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
                delay: 3,
              }}
            />
          )}

          {/* Step nodes */}
          {loopSteps.map((step, i) => {
            const angle = ((-i * 360) / loopSteps.length + 90) * (Math.PI / 180);
            const lx = cx + r * Math.cos(angle);
            const ly = cy - r * Math.sin(angle);

            // Color coding
            let fillColor = "white";
            let strokeColor = "black";
            if (i === 0 || i === 7) { fillColor = "#fbbf24"; } // treaty/growth = yellow
            else if (i === 1) { fillColor = "#fde68a"; } // bondholders = light yellow
            else if (i === 2) { fillColor = "#f9a8d4"; } // politicians = pink
            else if (i === 3) { fillColor = "#67e8f9"; } // trials = cyan
            else if (i === 4 || i === 5) { fillColor = "#a7f3d0"; } // outcomes = green
            else if (i === 6) { fillColor = "#fde68a"; strokeColor = "#b45309"; } // lobby = amber

            return (
              <motion.g
                key={step.label}
                initial={reduced ? {} : { opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1 + i * 0.12 }}
              >
                <circle
                  cx={lx}
                  cy={ly}
                  r="34"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="2"
                />
                <text
                  x={lx}
                  y={ly - 6}
                  textAnchor="middle"
                  className="text-[7px] font-black fill-black"
                >
                  {step.label.split(" ").length <= 2
                    ? step.label
                    : step.label.split(" ").slice(0, 2).join(" ")}
                </text>
                {step.label.split(" ").length > 2 && (
                  <text
                    x={lx}
                    y={ly + 3}
                    textAnchor="middle"
                    className="text-[7px] font-black fill-black"
                  >
                    {step.label.split(" ").slice(2).join(" ")}
                  </text>
                )}
                <text
                  x={lx}
                  y={ly + 14}
                  textAnchor="middle"
                  className="text-[5px] fill-black/40 font-bold"
                >
                  {step.detail.length > 25
                    ? step.detail.substring(0, 25) + "..."
                    : step.detail}
                </text>
              </motion.g>
            );
          })}

          {/* Center label */}
          <motion.g
            initial={reduced ? {} : { opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 2.5 }}
          >
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              className="text-[9px] font-black fill-black"
            >
              EVERYONE PROFITS
            </text>
            <text
              x={cx}
              y={cy + 2}
              textAnchor="middle"
              className="text-[9px] font-black fill-[#00c8c8]"
            >
              FROM EXPANSION
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              className="text-[6px] fill-black/40 font-bold"
            >
              Bondholders, politicians, citizens
            </text>
            <text
              x={cx}
              y={cy + 25}
              textAnchor="middle"
              className="text-[6px] fill-black/40 font-bold"
            >
              all incentivized to grow the treaty
            </text>
          </motion.g>

          {/* Directional arrows between nodes */}
          {loopSteps.map((_, i) => {
            const a1 = ((-i * 360) / loopSteps.length + 90) * (Math.PI / 180);
            const a2 = ((-(i + 1) * 360) / loopSteps.length + 90) * (Math.PI / 180);
            const midA = (a1 + a2) / 2;
            const ax = cx + (arrowR + 2) * Math.cos(midA);
            const ay = cy - (arrowR + 2) * Math.sin(midA);
            // Arrow pointing in direction of travel (clockwise = decreasing angle)
            const dir = midA + Math.PI / 2; // perpendicular, pointing clockwise
            const sz = 5;
            return (
              <motion.polygon
                key={`arrow-${i}`}
                points={`
                  ${ax + sz * Math.cos(dir)},${ay - sz * Math.sin(dir)}
                  ${ax + sz * 1.2 * Math.cos(dir + 2.4)},${ay - sz * 1.2 * Math.sin(dir + 2.4)}
                  ${ax + sz * 1.2 * Math.cos(dir - 2.4)},${ay - sz * 1.2 * Math.sin(dir - 2.4)}
                `}
                fill="#00c8c8"
                opacity="0.5"
                initial={reduced ? {} : { opacity: 0 }}
                animate={isInView ? { opacity: 0.5 } : {}}
                transition={{ duration: 0.3, delay: 1.5 + i * 0.1 }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
