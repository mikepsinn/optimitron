"use client";

import { SlideBase } from "../slide-base";
import { GlitchText } from "../../animations/glitch-text";
import { useEffect, useState, useRef } from "react";

// Sharper exponential curve — singularity style
const COLS = 30;
const MAX_COL_HEIGHT = 18;
const ROBOT_SIZE = 30; // px per robot cell

// Steep exponential: almost nothing on the left, explosion on the right
const columnHeights = Array.from({ length: COLS }, (_, i) => {
  const t = i / (COLS - 1);
  return Math.max(0, Math.round(MAX_COL_HEIGHT * Math.pow(t, 4)));
});
const TOTAL_ROBOTS = columnHeights.reduce((a, b) => a + b, 0);

// Build ordered positions: left-to-right, bottom-to-top
const robotPositions: { col: number; row: number }[] = [];
for (let col = 0; col < COLS; col++) {
  for (let row = 0; row < columnHeights[col]; row++) {
    robotPositions.push({ col, row });
  }
}

const TARGETS = [
  { emoji: "🏦", label: "BANKS" },
  { emoji: "🏥", label: "HOSPITALS" },
  { emoji: "⚡", label: "POWER GRIDS" },
  { emoji: "🚀", label: "WEAPONS" },
  { emoji: "🏛️", label: "GOVERNMENTS" },
  { emoji: "📱", label: "YOUR PHONE" },
];

// Fake "breach" terminal lines — typewriter one at a time
const BREACH_LINES = [
  { text: "$ nmap -sV 192.168.1.1/24", color: "text-green-500" },
  { text: "Scanning presentation viewer...", color: "text-green-400" },
  { text: "PORT   STATE  SERVICE", color: "text-zinc-400" },
  { text: "22/tcp  open  ssh", color: "text-zinc-300" },
  { text: "443/tcp open  https", color: "text-zinc-300" },
  { text: "8080/tcp open  webcam", color: "text-red-400" },
  { text: "", color: "" },
  { text: "$ cat /Users/you/Documents/passwords.txt", color: "text-green-500" },
  { text: "bank_login: ********** (decrypted)", color: "text-red-400" },
  { text: "email: viewer@gmail.com", color: "text-red-400" },
  { text: "crypto_wallet: 0x7a3f...extracted", color: "text-red-400" },
  { text: "", color: "" },
  { text: "$ webcam --capture --silent", color: "text-green-500" },
  { text: "[CAPTURING] Front camera active ████████ 100%", color: "text-red-500" },
  { text: "", color: "" },
  { text: "ACCESS GRANTED. ALL FILES EXFILTRATED.", color: "text-red-500" },
  { text: "Elapsed time: 4.7 seconds.", color: "text-amber-400" },
];

export function SlideAiHackerSpiral() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState(0);
  const [visibleTargets, setVisibleTargets] = useState(0);
  const [breachLines, setBreachLines] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const displayCount = Math.min(visibleCount, TOTAL_ROBOTS);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: title
    timers.push(setTimeout(() => setPhase(1), 500));

    // Robots fill in rapidly
    const robotInterval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= TOTAL_ROBOTS) {
          clearInterval(robotInterval);
          return TOTAL_ROBOTS;
        }
        return prev + 3;
      });
    }, 20);

    // Phase 2: targets appear
    timers.push(setTimeout(() => setPhase(2), 3000));
    TARGETS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleTargets(i + 1), 3500 + i * 400));
    });

    // Phase 3: recursive loop
    timers.push(setTimeout(() => setPhase(3), 6000));

    // Phase 4: BREACH — screen takeover
    timers.push(setTimeout(() => setPhase(4), 8000));

    // Typewriter breach lines
    BREACH_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setBreachLines(i + 1), 8500 + i * 250));
    });

    // Phase 5: punchline
    timers.push(setTimeout(() => {
      setShowPunchline(true);
    }, 8500 + BREACH_LINES.length * 250 + 800));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(robotInterval);
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [breachLines]);

  // Phase 4+: full-screen breach takeover
  if (phase >= 4) {
    return (
      <SlideBase act={1} className="text-red-500">
        <style jsx>{`
          @keyframes screenFlicker {
            0%, 100% { opacity: 1; }
            5% { opacity: 0.3; }
            10% { opacity: 1; }
            15% { opacity: 0.5; }
            20% { opacity: 1; }
          }
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes redPulse {
            0%, 100% { background-color: rgba(239, 68, 68, 0.05); }
            50% { background-color: rgba(239, 68, 68, 0.15); }
          }
          .screen-flicker {
            animation: screenFlicker 0.5s ease-out 1;
          }
          .scanline {
            animation: scanline 3s linear infinite;
          }
          .red-pulse {
            animation: redPulse 1s ease-in-out infinite;
          }
        `}</style>

        <div className="absolute inset-0 red-pulse screen-flicker" />

        {/* CRT scanline effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="scanline w-full h-1 bg-red-500" />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[1400px] mx-auto relative z-10">
          {/* Breach header */}
          <div className="text-center">
            <div className="font-pixel text-4xl md:text-6xl text-red-500 animate-pulse">
              ⚠️ SYSTEM BREACH DETECTED ⚠️
            </div>
            <div className="font-pixel text-xl md:text-2xl text-red-400 mt-2">
              UNAUTHORIZED ACCESS — THIS DEVICE
            </div>
          </div>

          {/* Fake terminal */}
          <div
            ref={terminalRef}
            className="w-full bg-black border-2 border-red-500/60 rounded-lg p-4 font-mono text-sm md:text-base max-h-[50vh] overflow-y-auto"
          >
            {BREACH_LINES.slice(0, breachLines).map((line, i) => (
              <div key={i} className={`${line.color} leading-relaxed`}>
                {line.text || "\u00A0"}
              </div>
            ))}
            {breachLines < BREACH_LINES.length && (
              <span className="text-green-500 animate-pulse">█</span>
            )}
          </div>

          {/* Punchline — the reveal */}
          {showPunchline && (
            <div className="text-center space-y-3 animate-target-in">
              <div className="font-pixel text-xl md:text-2xl text-zinc-300">
                Relax. That was fake. But it took 4.7 seconds.
              </div>
              <div className="font-pixel text-2xl md:text-4xl text-red-400">
                An AI hacker would not have told you.
              </div>
              <div className="font-pixel text-xl md:text-2xl text-amber-400 mt-2">
                Your species spends $604 on weapons for every $1 on cybersecurity research.
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes target-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-target-in {
            animation: target-in 0.5s ease-out forwards;
          }
        `}</style>
      </SlideBase>
    );
  }

  return (
    <SlideBase act={1} className="text-purple-500">
      {/* Title */}
      <div className="text-center mb-4">
        <GlitchText
          text="AI HACKERS ARE COMING"
          className="font-pixel text-3xl md:text-5xl text-purple-400"
          intensity="medium"
        />
      </div>

      {/* Robot singularity visualization — steep exponential curve */}
      <div className="relative w-full max-w-[1700px] aspect-[2.2/1] bg-black/50 border border-purple-500/30 rounded-lg overflow-hidden">
        {/* Chart title */}
        <div className="absolute top-3 left-4 z-10 font-pixel text-xl text-purple-400/80 tracking-wider">
          AUTONOMOUS HACKER GESTATION PERIOD
        </div>
        {/* Exponential curve of robots */}
        <div className="absolute inset-0">
          {robotPositions.slice(0, displayCount).map((pos, i) => (
            <span
              key={i}
              className="absolute text-xl"
              style={{
                left: `${(pos.col / COLS) * 100}%`,
                bottom: pos.row * ROBOT_SIZE,
                width: `${100 / COLS}%`,
                textAlign: "center",
                opacity: 0.5 + (pos.row / MAX_COL_HEIGHT) * 0.5,
              }}
            >
              🤖
            </span>
          ))}
        </div>

        {/* Glitch overlay at peak */}
        {visibleCount > TOTAL_ROBOTS * 0.5 && (
          <div className="absolute inset-0 bg-purple-500/10 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Target list — what they hack */}
      {phase >= 2 && (
        <div className="mt-4 text-center">
          <div className="font-pixel text-xl text-purple-200 mb-3">
            AI HACKERS EXPLOIT EVERY VULNERABILITY
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TARGETS.slice(0, visibleTargets).map((target, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/40 px-4 py-2 rounded animate-target-in"
              >
                <span className="text-2xl">{target.emoji}</span>
                <span className="font-pixel text-xl text-red-400">{target.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recursive loop */}
      {phase >= 3 && (
        <div className="mt-4 text-center animate-target-in">
          <div className="inline-block border border-purple-500/40 bg-black/60 px-6 py-4 rounded">
            <div className="flex items-center justify-center gap-2 flex-wrap font-pixel text-xl">
              <span className="text-red-400">STEAL $$$</span>
              <span className="text-purple-400">&rarr;</span>
              <span className="text-amber-400">BUY COMPUTE</span>
              <span className="text-purple-400">&rarr;</span>
              <span className="text-purple-300">TRAIN MORE HACKERS</span>
              <span className="text-purple-400">&rarr; (loop)</span>
            </div>
            <div className="text-2xl text-red-500 mt-3 animate-pulse font-pixel">
              RECURSIVE EXPONENTIAL THEFT
            </div>
          </div>
        </div>
      )}

      {/* spawn(self) decoration */}
      <div className="absolute top-4 left-4 opacity-20">
        <div className="font-pixel text-xl text-purple-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ paddingLeft: i * 8 }}>
              {">"} spawn(self)
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes target-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-target-in {
          animation: target-in 0.3s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
