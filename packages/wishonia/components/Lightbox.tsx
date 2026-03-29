/**
 * Fullscreen image lightbox overlay.
 */

"use client";

export function Lightbox({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10001,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ""}
        style={{
          maxWidth: "90vw", maxHeight: "90vh",
          borderRadius: 8,
          filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))",
        }}
      />
    </div>
  );
}
