/**
 * Source link pills extracted from "Read more:" section of AI responses.
 * Matches transmit's extractSourceLinksData() + source pill rendering.
 */

"use client";

const MANUAL_BASE = "https://manual.warondisease.org";

interface SourceLink {
  title: string;
  url: string;
}

/**
 * Extract "Read more: [title](url)" links from the response text.
 * Returns the links and the text with "Read more:" section stripped.
 */
export function extractSourceLinks(text: string): { links: SourceLink[]; cleanText: string } {
  const links: SourceLink[] = [];

  // Find "Read more:" section (usually at the end)
  const readMoreMatch = text.match(/Read more:[\s\S]*$/i);
  if (!readMoreMatch) return { links: [], cleanText: text };

  const readMoreSection = readMoreMatch[0];
  const cleanText = text.slice(0, readMoreMatch.index).trim();

  // Extract markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(readMoreSection)) !== null) {
    let url = match[2]!;
    // Normalize relative URLs
    if (url.startsWith("/")) url = `${MANUAL_BASE}${url}`;
    links.push({ title: match[1]!, url });
  }

  return { links, cleanText };
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
