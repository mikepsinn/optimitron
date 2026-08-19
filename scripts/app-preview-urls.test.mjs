import assert from "node:assert/strict";
import test from "node:test";
import {
  getAppPreviewRouteUrl,
  parseAppPreviewUrls,
} from "./app-preview-urls.mjs";

test("normalizes app preview URLs and keeps the legacy Optimitron fallback", () => {
  assert.deepEqual(
    parseAppPreviewUrls(
      JSON.stringify({
        warondisease: "https://war.example.vercel.app/",
        dfda: "not a URL",
      }),
      "https://optimitron.example.vercel.app/",
    ),
    {
      optimitron: "https://optimitron.example.vercel.app",
      warondisease: "https://war.example.vercel.app",
    },
  );
});

test("builds app-specific route URLs with the requested auth state", () => {
  const previews = {
    warondisease: "https://war.example.vercel.app",
  };
  assert.equal(
    getAppPreviewRouteUrl(
      previews,
      "warondisease",
      "/dashboard?tab=impact",
      "demo-logged-in",
    ),
    "https://war.example.vercel.app/dashboard?tab=impact&login=demo",
  );
  assert.equal(
    getAppPreviewRouteUrl(previews, "dfda", "/", "logged-out"),
    null,
  );
});
