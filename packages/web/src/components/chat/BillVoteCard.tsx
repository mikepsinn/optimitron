import { useState, useCallback } from "react";
import { API_ROUTES } from "@/lib/api-routes";
import type { ClassifiedBill } from "@/app/api/civic/bills/route";
import type { BillCBA } from "@/lib/civic-cba";
import { BillCBACard } from "./BillCBACard";

interface BillVoteCardProps {
  bill: ClassifiedBill;
  cba?: BillCBA;
  onSave?: (vote: { billId: string; position: string; reasoning: string; cbaSnapshot: string }) => void;
}

export function BillVoteCard({ bill, cba, onSave }: BillVoteCardProps) {
  const [position, setPosition] = useState<"YES" | "NO" | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!position) return;
    setSaving(true);
    try {
      const cbaSnapshot = cba ? JSON.stringify(cba) : "";
      const res = await fetch(API_ROUTES.civic.votes, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.billId,
          billTitle: bill.title,
          position,
          reasoning: reasoning.trim() || undefined,
          cbaSnapshot: cbaSnapshot || undefined,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { shareIdentifier?: string };
        setSaved(true);
        onSave?.({
          billId: bill.billId,
          position,
          reasoning,
          cbaSnapshot: cbaSnapshot || "",
          ...data,
        });
      }
    } finally {
      setSaving(false);
    }
  }, [position, reasoning, bill, cba, onSave]);

  if (saved) {
    return (
      <div className="opto-card opto-bill-vote opto-bill-vote--confirmed">
        <div className="opto-bill-vote__header">Vote Recorded</div>
        <div className="opto-bill-vote__confirmed-position">
          You voted <strong>{position}</strong> on {bill.type.toUpperCase()} {bill.number}
        </div>
        {reasoning && (
          <div className="opto-bill-vote__confirmed-reasoning">
            &ldquo;{reasoning}&rdquo;
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="opto-card opto-bill-vote">
      <div className="opto-bill-vote__header">
        Vote: {bill.type.toUpperCase()} {bill.number}
      </div>
      <div className="opto-bill-vote__title">{bill.title}</div>

      {cba && <BillCBACard cba={cba} />}

      <div className="opto-bill-vote__buttons">
        <button
          type="button"
          className={`opto-bill-vote__btn opto-bill-vote__btn--yes ${position === "YES" ? "opto-bill-vote__btn--selected" : ""}`}
          onClick={() => setPosition("YES")}
        >
          YES
        </button>
        <button
          type="button"
          className={`opto-bill-vote__btn opto-bill-vote__btn--no ${position === "NO" ? "opto-bill-vote__btn--selected" : ""}`}
          onClick={() => setPosition("NO")}
        >
          NO
        </button>
      </div>

      <textarea
        className="opto-bill-vote__reasoning"
        placeholder="Optional: explain your reasoning..."
        value={reasoning}
        onChange={(e) => setReasoning(e.target.value)}
        rows={3}
      />

      <button
        type="button"
        className="opto-bill-vote__save"
        disabled={!position || saving}
        onClick={handleSave}
      >
        {saving ? "Saving..." : "Save vote"}
      </button>
    </div>
  );
}
