"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/retroui/Input";
import { ROUTES } from "@/lib/routes";
import {
  searchSiteDocuments,
  type StaticSiteSearchDocument,
} from "@/lib/site-search-ranking";

type SearchDiscoveryProps = {
  children?: ReactNode;
  documents: StaticSiteSearchDocument[];
  featuredDocuments: StaticSiteSearchDocument[];
  initialQuery: string;
  scope: "content" | "manual" | "pages" | "tasks" | null;
  siteName: string;
};

function SearchDestination({
  document,
}: {
  document: StaticSiteSearchDocument;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-foreground">{document.title}</h2>
        <span className="shrink-0 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
          {document.section}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
        {document.description}
      </p>
    </>
  );
  const className =
    "block border-b border-foreground/25 py-4 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

  return document.external ? (
    <a
      className={className}
      href={document.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {content}
    </a>
  ) : (
    <Link className={className} href={document.href}>
      {content}
    </Link>
  );
}

export function SearchDiscovery({
  children,
  documents,
  featuredDocuments,
  initialQuery,
  scope,
  siteName,
}: SearchDiscoveryProps) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  const trimmedInput = inputValue.trim();
  const isEditingSubmittedQuery = trimmedInput !== initialQuery.trim();
  const suggestions = useMemo(
    () => searchSiteDocuments(trimmedInput, documents, 6),
    [documents, trimmedInput],
  );
  const showSuggestions = Boolean(trimmedInput && isEditingSubmittedQuery);
  const suggestionsId = "search-page-suggestions";
  const serverSearchLabel =
    scope === "content"
      ? "documents and records"
      : scope === "manual"
        ? "the Earth Repair Manual"
        : scope === "pages"
          ? "pages"
          : scope === "tasks"
            ? "tasks"
            : "tasks, documents, and the Earth Repair Manual";

  return (
    <>
      <section className="space-y-4 border-b border-foreground/30 pb-4">
        <form action={ROUTES.search} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-controls={showSuggestions ? suggestionsId : undefined}
              aria-label="Search the site"
              autoComplete="off"
              autoFocus
              className="h-14 rounded-none border-2 border-foreground bg-background pl-12 text-base font-bold md:max-w-3xl"
              data-search-ready={isInteractive ? "true" : undefined}
              name="q"
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search pages, tasks, treaty docs, policy analysis..."
              type="search"
              value={inputValue}
            />
          </div>
          {scope ? <input type="hidden" name="scope" value={scope} /> : null}
          <button
            type="submit"
            className="inline-flex h-14 shrink-0 items-center justify-center border-2 border-foreground bg-foreground px-5 text-sm font-black uppercase tracking-[0.14em] text-background transition-colors hover:bg-background hover:text-foreground"
          >
            Search
          </button>
        </form>

        {showSuggestions ? (
          <section
            aria-label="Page suggestions"
            aria-live="polite"
            data-search-suggestions
            id={suggestionsId}
            className="max-w-3xl"
          >
            <h2 className="sr-only">Suggested pages</h2>
            {suggestions.length > 0 ? (
              <div className="mt-1">
                {suggestions.map((document) => (
                  <SearchDestination document={document} key={document.href} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                No page matches yet. Press Enter to search {serverSearchLabel}.
              </p>
            )}
          </section>
        ) : null}
      </section>

      <h1 className="sr-only">Search {siteName}</h1>

      {!trimmedInput ? (
        <section className="max-w-4xl space-y-5">
          <div className="space-y-2">
            <p
              aria-hidden="true"
              className="text-4xl font-black tracking-tight text-foreground md:text-5xl"
            >
              Search {siteName}
            </p>
            <p className="text-base font-bold leading-7 text-muted-foreground">
              Vote now, read the treaty, fund outreach, or open the manual.
              Search for anything else.
            </p>
          </div>
          <nav aria-label="Featured destinations">
            {featuredDocuments.map((document) => (
              <SearchDestination document={document} key={document.href} />
            ))}
          </nav>
        </section>
      ) : null}

      {initialQuery && !isEditingSubmittedQuery ? children : null}
    </>
  );
}
