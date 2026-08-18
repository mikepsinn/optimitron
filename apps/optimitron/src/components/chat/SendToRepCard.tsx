"use client";

import { useState, useCallback } from "react";
import type { CivicRepresentative } from "@/lib/civic-data";
import { buildRepresentativeLetter } from "@/lib/civic-letter";
import type { BillCBA } from "@/lib/civic-cba";

interface SendToRepCardProps {
  representatives: CivicRepresentative[];
  vote: {
    billId: string;
    billTitle: string;
    position: string;
    reasoning?: string;
    cba?: BillCBA;
  };
}

export function SendToRepCard({ representatives, vote }: SendToRepCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (body: string, bioguideId: string) => {
    await navigator.clipboard.writeText(body);
    setCopiedId(bioguideId);
    window.setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (representatives.length === 0) {
    return (
      <div className="opto-card opto-send-rep">
        <div className="opto-send-rep__header">Send to Representative</div>
        <p className="opto-send-rep__empty">
          No representatives found. Use &ldquo;Find my reps&rdquo; first.
        </p>
      </div>
    );
  }

  return (
    <div className="opto-card opto-send-rep">
      <div className="opto-send-rep__header">Send to Your Representatives</div>
      <div className="opto-send-rep__list">
        {representatives.map((rep) => {
          const letter = buildRepresentativeLetter(vote, rep);
          const mailto = `mailto:?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`;
          const isCopied = copiedId === rep.bioguideId;

          return (
            <div key={rep.bioguideId} className="opto-send-rep__item">
              <div className="opto-send-rep__rep-info">
                <span className="opto-send-rep__rep-name">{rep.name}</span>
                <span className="opto-send-rep__rep-detail">
                  {rep.title}
                </span>
              </div>
              <div className="opto-send-rep__actions">
                <a
                  href={mailto}
                  className="opto-send-rep__btn opto-send-rep__btn--email"
                >
                  Email
                </a>
                <button
                  type="button"
                  className="opto-send-rep__btn opto-send-rep__btn--copy"
                  onClick={() => handleCopy(letter.body, rep.bioguideId)}
                >
                  {isCopied ? "Copied!" : "Copy letter"}
                </button>
                <a
                  href={letter.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opto-send-rep__btn opto-send-rep__btn--contact"
                >
                  Contact page
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
