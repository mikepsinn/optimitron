"use client";

import type { SiteKey } from "@/lib/site";
import { SITE_VARIANT_OVERRIDE_QUERY_PARAM } from "@/lib/site";

interface DevSiteVariantSwitcherProps {
  currentSiteKey: SiteKey;
  sites: Array<{
    key: SiteKey;
    label: string;
  }>;
}

function navigateWithSiteOverride(siteKey: SiteKey | "reset") {
  const url = new URL(window.location.href);
  url.searchParams.set(SITE_VARIANT_OVERRIDE_QUERY_PARAM, siteKey);
  window.location.assign(url.toString());
}

export function DevSiteVariantSwitcher({
  currentSiteKey,
  sites,
}: DevSiteVariantSwitcherProps) {
  const currentSite = sites.find((site) => site.key === currentSiteKey);

  return (
    <details className="fixed bottom-3 left-3 z-[100] print:hidden">
      <summary className="cursor-pointer border border-foreground bg-background px-3 py-2 text-xs font-bold text-foreground shadow-sm">
        Site: {currentSite?.label ?? currentSiteKey}
      </summary>
      <div className="mt-2 w-64 border border-foreground bg-background p-3 text-foreground shadow-lg">
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
          htmlFor="dev-site-variant"
        >
          Local site
        </label>
        <select
          id="dev-site-variant"
          className="w-full border border-foreground bg-background px-2 py-2 text-sm font-bold text-foreground"
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            navigateWithSiteOverride(
              nextValue ? (nextValue as SiteKey) : "reset",
            );
          }}
          value={currentSiteKey}
        >
          <option value="">Host default</option>
          {sites.map((site) => (
            <option key={site.key} value={site.key}>
              {site.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="mt-2 w-full border border-foreground bg-foreground px-2 py-2 text-xs font-bold uppercase tracking-wide text-background"
          onClick={() => navigateWithSiteOverride("reset")}
        >
          Reset to host
        </button>
      </div>
    </details>
  );
}
