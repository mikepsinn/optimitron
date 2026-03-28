import "../globals.css";

/**
 * Minimal transparent layout for iframe embedding.
 * No nav, no chrome — just the character on a transparent canvas.
 */
export default function IframeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "transparent", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
