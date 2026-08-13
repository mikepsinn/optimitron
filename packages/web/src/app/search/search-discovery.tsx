"use client";

import Link from "next/link";
import { LoaderCircle, Search } from "lucide-react";
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
  initialQuery: string;
  popularDocuments: StaticSiteSearchDocument[];
  scope: "content" | "manual" | "pages" | "tasks" | null;
  siteName: string;
};

function SearchDestination({
  document,
}: {
  document: StaticSiteSearchDocument;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="w-7 shrink-0 text-xl leading-7">
        {document.emoji ?? "📄"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-black text-foreground">
            {document.title}
          </h2>
          <span className="shrink-0 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            {document.section}
          </span>
        </div>
        <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
          {document.description}
        </p>
      </div>
    </div>
  );
  const className =
    "block border-b border-foreground/25 py-4 transition-colors last:border-b-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

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
  initialQuery,
  popularDocuments,
  scope,
  siteName,
}: SearchDiscoveryProps) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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
      <section className="space-y-3">
        <form
          action={ROUTES.search}
          aria-busy={isSearching}
          className="flex items-center gap-2"
          onSubmit={() => setIsSearching(true)}
        >
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
              onChange={(event) => {
                setInputValue(event.target.value);
                setIsSearching(false);
              }}
              placeholder="Search tasks, people, treatments, or organizations..."
              type="search"
              value={inputValue}
            />
          </div>
          {scope ? <input type="hidden" name="scope" value={scope} /> : null}
          <button
            type="submit"
            aria-live="polite"
            disabled={isSearching}
            className="inline-flex h-14 shrink-0 items-center justify-center border-2 border-foreground bg-foreground px-5 text-sm font-black uppercase tracking-[0.14em] text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-foreground disabled:hover:text-background"
          >
            {isSearching ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                Searching…
              </>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {!trimmedInput ? (
          <p className="text-sm font-bold text-muted-foreground">
            Find tasks, people, organizations, treatments, and the Earth Repair
            Manual.
          </p>
        ) : null}

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
        <section className="max-w-4xl" data-search-popular>
          <h2 className="mb-1 text-sm font-black uppercase tracking-[0.14em] text-foreground">
            Popular pages
          </h2>
          <nav aria-label="Popular pages">
            {popularDocuments.map((document) => (
              <SearchDestination document={document} key={document.href} />
            ))}
          </nav>
        </section>
      ) : null}

      {initialQuery && !isEditingSubmittedQuery ? children : null}
    </>
  );
}
