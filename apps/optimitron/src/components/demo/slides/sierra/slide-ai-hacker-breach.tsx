"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState, useRef } from "react";

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

export function SlideAiHackerBreach() {
  const [breachLines, setBreachLines] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    BREACH_LINES.forEach((_, i) => {
      setTimeout(() => setBreachLines(i + 1), 500 + i * 250);
    });
    setTimeout(() => setShowPunchline(true), 500 + BREACH_LINES.length * 250 + 800);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [breachLines]);

  return (
    <SierraSlideWrapper act={1} className="text-red-500">
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
        @keyframes target-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .screen-flicker { animation: screenFlicker 0.5s ease-out 1; }
        .scanline { animation: scanline 3s linear infinite; }
        .red-pulse { animation: redPulse 1s ease-in-out infinite; }
        .animate-target-in { animation: target-in 0.5s ease-out forwards; }
      `}</style>

      <div className="absolute inset-0 red-pulse screen-flicker" />

      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="scanline w-full h-1 bg-red-500" />
      </div>

      <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[1400px] mx-auto relative z-10">
        <div className="text-center">
          <div className="font-pixel text-4xl md:text-6xl text-red-500 animate-pulse">
            ⚠️ SYSTEM BREACH DETECTED ⚠️
          </div>
          <div className="font-pixel text-2xl md:text-3xl text-red-400 mt-2">
            UNAUTHORIZED ACCESS — THIS DEVICE
          </div>
        </div>

        <div
          ref={terminalRef}
          className="w-full bg-black border-2 border-red-500/60 rounded-lg p-4 font-mono text-lg md:text-xl max-h-[50vh] overflow-y-auto"
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

        {showPunchline && (
          <div className="text-center space-y-3 animate-target-in">
            <div className="font-pixel text-2xl md:text-3xl text-zinc-300">
              Relax. That was fake. But it took 4.7 seconds.
            </div>
            <div className="font-pixel text-3xl md:text-5xl text-red-400">
              An AI hacker would not have told you.
            </div>
            <div className="font-pixel text-2xl md:text-3xl text-amber-400 mt-2">
              Your species spends $604 on weapons for every $1 on cybersecurity research.
            </div>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideAiHackerBreach;
