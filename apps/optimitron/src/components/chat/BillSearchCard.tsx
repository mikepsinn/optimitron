import { useState, useCallback } from "react";
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from "@/lib/wishocracy-data";

interface BillSearchCardProps {
  onSearch: (category: WishocraticItemId | null, query: string | null) => void;
}

const categoryEntries = Object.entries(WISHOCRATIC_ITEMS) as Array<
  [WishocraticItemId, (typeof WISHOCRATIC_ITEMS)[WishocraticItemId]]
>;

export function BillSearchCard({ onSearch }: BillSearchCardProps) {
  const [category, setCategory] = useState<WishocraticItemId | "">("");
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(() => {
    onSearch(
      category || null,
      query.trim() || null,
    );
  }, [onSearch, category, query]);

  return (
    <div className="opto-card opto-bill-search">
      <div className="opto-bill-search__header">Search Bills</div>
      <div className="opto-bill-search__form">
        <select
          className="opto-bill-search__select"
          value={category}
          onChange={(e) => setCategory(e.target.value as WishocraticItemId | "")}
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
          className="opto-bill-search__input"
          placeholder="e.g. clinical trials, cannabis..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          type="button"
          className="opto-bill-search__btn"
          onClick={handleSubmit}
        >
          Search
        </button>
      </div>
    </div>
  );
}
