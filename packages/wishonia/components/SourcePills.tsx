/**
 * Source link pills extracted from "Read more:" section of AI responses.
 * Matches transmit's extractSourceLinksData() + source pill rendering.
 */

"use client";

import { type SourceLink, extractReadMoreLinks } from "@/lib/source-links";

export function extractSourceLinks(text: string): { links: SourceLink[]; cleanText: string } {
  return extractReadMoreLinks(text);
}

export function SourcePills({ links }: { links: SourceLink[] }) {
  if (links.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener"
          style={{
            fontSize: 12, padding: "4px 10px",
            background: "rgba(209,0,177,0.1)", border: "1px solid rgba(209,0,177,0.3)",
            borderRadius: 12, color: "#C6CBF5", textDecoration: "none",
          }}
        >
          {link.title}
        </a>
      ))}
    </div>
  );
}
