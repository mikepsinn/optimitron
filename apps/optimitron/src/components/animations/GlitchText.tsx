"use client";

/**
 * Glitch text effect — RGB split, scan lines, occasional flicker.
 * Used on the Moronia page to create a "corrupted transmission" feel.
 */
export function GlitchText({
  children,
  className = "",
  intensity = "medium",
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}) {
  const speed = intensity === "high" ? "2s" : intensity === "medium" ? "4s" : "8s";

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ "--glitch-speed": speed } as React.CSSProperties}
    >
      {/* Main text */}
      <span className="relative z-10">{children}</span>

      {/* Red channel offset */}
      <span
        className="absolute inset-0 z-0 text-red-500 opacity-70 animate-[glitch-r_var(--glitch-speed)_infinite_steps(2)]"
        aria-hidden
      >
        {children}
      </span>

      {/* Cyan channel offset */}
      <span
        className="absolute inset-0 z-0 text-cyan-400 opacity-70 animate-[glitch-c_var(--glitch-speed)_infinite_steps(2)]"
        aria-hidden
      >
        {children}
      </span>

      <style jsx>{`
        @keyframes glitch-r {
          0%, 90% { clip-path: inset(0); transform: translate(0); }
          92% { clip-path: inset(20% 0 40% 0); transform: translate(-3px, 1px); }
          94% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -1px); }
          96% { clip-path: inset(40% 0 30% 0); transform: translate(-2px, 0); }
          98% { clip-path: inset(10% 0 70% 0); transform: translate(2px, 1px); }
          100% { clip-path: inset(0); transform: translate(0); }
        }
        @keyframes glitch-c {
          0%, 88% { clip-path: inset(0); transform: translate(0); }
          90% { clip-path: inset(50% 0 20% 0); transform: translate(2px, -1px); }
          93% { clip-path: inset(10% 0 60% 0); transform: translate(-3px, 1px); }
          95% { clip-path: inset(70% 0 5% 0); transform: translate(1px, 0); }
          97% { clip-path: inset(30% 0 40% 0); transform: translate(-2px, -1px); }
          100% { clip-path: inset(0); transform: translate(0); }
        }
      `}</style>
    </span>
  );
}

/**
 * Full-screen scan line overlay — adds CRT monitor effect.
 */
export function ScanLines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)",
        backgroundSize: "100% 2px",
      }}
      aria-hidden
    />
  );
}

/**
 * Static burst — random flicker effect on an element.
 */
export function StaticBurst({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 animate-[static-burst_6s_infinite] bg-white mix-blend-overlay"
        aria-hidden
      />
      <style jsx>{`
        @keyframes static-burst {
          0%, 94%, 100% { opacity: 0; }
          95% { opacity: 0.08; }
          96% { opacity: 0; }
          97% { opacity: 0.05; }
          98% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
