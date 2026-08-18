import { useState, useCallback } from "react";
import type { ClassifiedBill } from "@/app/api/civic/bills/route";
import { BillCard } from "./BillCard";
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";

interface BillListCardProps {
  bills: ClassifiedBill[];
  onVote?: (bill: ClassifiedBill) => void;
  onAnalysis?: (bill: ClassifiedBill) => void;
  onFilter?: (category: WishocraticItemId | null, query: string | null) => void;
}

const categoryEntries = Object.entries(WISHOCRATIC_ITEMS) as Array<
  [WishocraticItemId, (typeof WISHOCRATIC_ITEMS)[WishocraticItemId]]
>;

export function BillListCard({ bills, onVote, onAnalysis, onFilter }: BillListCardProps) {
  const [filterCategory, setFilterCategory] = useState<WishocraticItemId | "">("");
  const [filterQuery, setFilterQuery] = useState("");

  const handleFilter = useCallback(() => {
    onFilter?.(
      filterCategory || null,
      filterQuery.trim() || null,
    );
  }, [onFilter, filterCategory, filterQuery]);

  return (
    <div className="opto-card opto-bill-list">
      <div className="opto-bill-list__header">Recent Bills</div>
      {onFilter && (
        <div className="opto-bill-list__filters">
          <select
            className="opto-bill-list__select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as WishocraticItemId | "")}
          >
            <option value="">All categories</option>
            {categoryEntries.map(([id, cat]) => (
              <option key={id} value={id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="opto-bill-list__search"
            placeholder="Search bills..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          />
          <button
            type="button"
            className="opto-bill-list__filter-btn"
            onClick={handleFilter}
          >
            Filter
          </button>
        </div>
      )}
      <div className="opto-bill-list__items">
        {bills.length === 0 ? (
          <p className="opto-bill-list__empty">No matching bills found.</p>
        ) : (
          bills.map((bill) => (
            <BillCard
              key={bill.billId}
              bill={bill}
              onVote={onVote}
              onAnalysis={onAnalysis}
            />
          ))
        )}
      </div>
    </div>
  );
}
