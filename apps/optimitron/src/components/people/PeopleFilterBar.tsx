"use client";

import { PersonDeathCauseCategory } from "@optimitron/db/enums";
import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { defaultButtonClassName } from "@/components/ui/default-button";
import type { RepresentedPeopleSortKey } from "@/lib/represented-people.server";

interface ConflictOption {
  id: string;
  name: string;
}

interface JurisdictionOption {
  code: string | null;
  id: string;
  name: string;
}

interface ConditionOption {
  id: string;
  name: string;
}

const SORT_OPTIONS: Array<{ value: RepresentedPeopleSortKey; label: string }> =
  [
    { value: "recent", label: "Most recent" },
    { value: "oldest", label: "Oldest" },
    { value: "alphabetical", label: "Alphabetical" },
    {
      value: "died-closest-to-cure",
      label: "Died closest to when the cure was approved",
    },
  ];

const CAUSE_OPTIONS: Array<{ value: PersonDeathCauseCategory; label: string }> =
  [
    { value: PersonDeathCauseCategory.DISEASE, label: "Disease" },
    { value: PersonDeathCauseCategory.ARMED_CONFLICT, label: "Armed conflict" },
    { value: PersonDeathCauseCategory.STATE_VIOLENCE, label: "State violence" },
    { value: PersonDeathCauseCategory.TERRORISM, label: "Terrorism" },
    {
      value: PersonDeathCauseCategory.OTHER_PREVENTABLE,
      label: "Other preventable",
    },
  ];

export function PeopleFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const selectedSort =
    (searchParams.get("sort") as RepresentedPeopleSortKey | null) ?? "recent";
  const selectedCause = searchParams.get("cause") ?? "";
  const selectedCondition = searchParams.get("conditionId") ?? "";
  const selectedConflict = searchParams.get("conflictId") ?? "";
  const selectedCountry = searchParams.get("country") ?? "";
  const efficacyOnly = searchParams.get("efficacyLag") === "1";
  const hasFilter =
    Boolean(
      selectedCause ||
      selectedCondition ||
      selectedConflict ||
      selectedCountry ||
      efficacyOnly,
    ) || selectedSort !== "recent";
  const [isOpen, setIsOpen] = useState(hasFilter);

  const [conditionOptions, setConditionOptions] = useState<ConditionOption[]>(
    [],
  );
  const [conflictOptions, setConflictOptions] = useState<ConflictOption[]>([]);
  const [jurisdictionOptions, setJurisdictionOptions] = useState<
    JurisdictionOption[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [conditions, conflicts, jurisdictions] = await Promise.all([
          fetch("/api/conditions/search?limit=200", { cache: "no-store" }),
          fetch("/api/conflicts/search?limit=50", { cache: "no-store" }),
          fetch("/api/jurisdictions/search?limit=200&type=COUNTRY", {
            cache: "no-store",
          }),
        ]);
        if (cancelled) return;
        if (conditions.ok) {
          const data = (await conditions.json()) as {
            results: ConditionOption[];
          };
          setConditionOptions(data.results);
        }
        if (conflicts.ok) {
          const data = (await conflicts.json()) as {
            results: ConflictOption[];
          };
          setConflictOptions(data.results);
        }
        if (jurisdictions.ok) {
          const data = (await jurisdictions.json()) as {
            results: JurisdictionOption[];
          };
          setJurisdictionOptions(data.results.filter((j) => j.code !== null));
        }
      } catch {
        // Filter bar still works with whatever loaded.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasFilter) {
      setIsOpen(true);
    }
  }, [hasFilter]);

  function applyFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: false });
    });
  }

  function clearAll() {
    startTransition(() => {
      router.push("?", { scroll: false });
    });
  }

  return (
    <section className="flex justify-end text-card-foreground">
      <details
        className="group relative w-full sm:w-auto"
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
        open={isOpen}
      >
        <summary className="ml-auto inline-flex min-h-10 cursor-pointer list-none items-center gap-2 border border-border bg-background px-3 text-xs font-black uppercase tracking-[0.14em] text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>Filter</span>
          {hasFilter ? (
            <span className="text-muted-foreground">Active</span>
          ) : null}
        </summary>

        <div className="mt-3 space-y-4 border border-border bg-card p-4 sm:absolute sm:right-0 sm:z-20 sm:w-[min(44rem,calc(100vw-2rem))]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Find a human
            </p>
            {hasFilter ? (
              <Button
                className={`${defaultButtonClassName} min-h-9 px-3 text-xs`}
                onClick={clearAll}
                type="button"
              >
                Clear
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label
                className="text-xs font-black uppercase"
                htmlFor="people-filter-sort"
              >
                Sort
              </Label>
              <select
                className="min-h-11 w-full border border-border bg-background px-3 font-bold text-foreground"
                id="people-filter-sort"
                onChange={(event) => applyFilter("sort", event.target.value)}
                value={selectedSort}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label
                className="text-xs font-black uppercase"
                htmlFor="people-filter-cause"
              >
                Cause
              </Label>
              <select
                className="min-h-11 w-full border border-border bg-background px-3 font-bold text-foreground"
                id="people-filter-cause"
                onChange={(event) => applyFilter("cause", event.target.value)}
                value={selectedCause}
              >
                <option value="">All causes</option>
                {CAUSE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label
                className="text-xs font-black uppercase"
                htmlFor="people-filter-condition"
              >
                Condition
              </Label>
              <select
                className="min-h-11 w-full border border-border bg-background px-3 font-bold text-foreground"
                id="people-filter-condition"
                onChange={(event) =>
                  applyFilter("conditionId", event.target.value)
                }
                value={selectedCondition}
              >
                <option value="">All conditions</option>
                {conditionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label
                className="text-xs font-black uppercase"
                htmlFor="people-filter-conflict"
              >
                Conflict
              </Label>
              <select
                className="min-h-11 w-full border border-border bg-background px-3 font-bold text-foreground"
                id="people-filter-conflict"
                onChange={(event) =>
                  applyFilter("conflictId", event.target.value)
                }
                value={selectedConflict}
              >
                <option value="">All conflicts</option>
                {conflictOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label
                className="text-xs font-black uppercase"
                htmlFor="people-filter-country"
              >
                Country of death
              </Label>
              <select
                className="min-h-11 w-full border border-border bg-background px-3 font-bold text-foreground"
                id="people-filter-country"
                onChange={(event) => applyFilter("country", event.target.value)}
                value={selectedCountry}
              >
                <option value="">All countries</option>
                {jurisdictionOptions.map((option) => (
                  <option key={option.id} value={option.code ?? ""}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-bold">
                <Input
                  checked={efficacyOnly}
                  className="h-4 w-4"
                  onChange={(event) =>
                    applyFilter("efficacyLag", event.target.checked ? "1" : "")
                  }
                  type="checkbox"
                />
                Only show efficacy-lag evidence
              </label>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
