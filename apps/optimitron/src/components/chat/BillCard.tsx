import type { ClassifiedBill } from "@/app/api/civic/bills/route";
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";

interface BillCardProps {
  bill: ClassifiedBill;
  onVote?: (bill: ClassifiedBill) => void;
  onAnalysis?: (bill: ClassifiedBill) => void;
}

export function BillCard({ bill, onVote, onAnalysis }: BillCardProps) {
  const directionArrow = bill.direction === "increase" ? "\u2191" : "\u2193";
  const directionLabel = bill.direction === "increase" ? "Increase" : "Decrease";

  return (
    <div className="opto-bill-card">
      <div className="opto-bill-card__header">
        <span className="opto-bill-card__type">
          {bill.type.toUpperCase()} {bill.number}
        </span>
        <span className={`opto-bill-card__direction opto-bill-card__direction--${bill.direction}`}>
          {directionArrow} {directionLabel}
        </span>
      </div>
      <div className="opto-bill-card__title">{bill.title}</div>
      {bill.policyArea && (
        <div className="opto-bill-card__policy">{bill.policyArea}</div>
      )}
      <div className="opto-bill-card__categories">
        {bill.categories.map((cat) => {
          const info = WISHOCRATIC_ITEMS[cat.categoryId as WishocraticItemId];
          return (
            <span key={cat.categoryId} className="opto-bill-card__category-chip">
              {info?.icon ?? ""} {info?.name ?? cat.categoryId}
            </span>
          );
        })}
      </div>
      {bill.latestAction && (
        <div className="opto-bill-card__action">
          <span className="opto-bill-card__action-date">{bill.latestAction.date}</span>
          {" "}{bill.latestAction.text}
        </div>
      )}
      <div className="opto-bill-card__buttons">
        {onVote && (
          <button
            type="button"
            className="opto-bill-card__btn opto-bill-card__btn--vote"
            onClick={() => onVote(bill)}
          >
            Vote on this
          </button>
        )}
        {onAnalysis && (
          <button
            type="button"
            className="opto-bill-card__btn opto-bill-card__btn--analysis"
            onClick={() => onAnalysis(bill)}
          >
            See analysis
          </button>
        )}
      </div>
    </div>
  );
}
