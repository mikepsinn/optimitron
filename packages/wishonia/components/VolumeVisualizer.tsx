/**
 * Volume visualizer — 5 animated bars driven by microphone amplitude.
 * Matches transmit's .chat-volume-bars.
 */

"use client";

export function VolumeVisualizer({ volume }: { volume: number }) {
  // Generate 5 bar heights from the volume level with slight variation
  const bars = [0.3, 0.6, 1.0, 0.7, 0.4].map((weight) =>
    Math.max(4, volume * weight * 28)
  );

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 28 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 4, height: h, borderRadius: 2,
            background: "#d100b1",
            transition: "height 0.1s ease-out",
          }}
        />
      ))}
    </div>
  );
}
