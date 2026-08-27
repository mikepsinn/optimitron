import assert from "node:assert/strict";
import test from "node:test";

import {
  getVercelPreviewUrlsFromComment,
  mergeVercelPreviewUrls,
} from "./vercel-preview-comment.mjs";

test("reads queued app preview aliases from the Vercel comment", () => {
  const body = `
| Name | Status | Preview |
| --- | --- | --- |
| [warondisease](https://vercel.com/example/warondisease) | Building | [Preview](https://warondisease-git-feature-example.vercel.app) |
| [dfda](https://vercel.com/example/dfda) | Queued | [Visit Preview](https://dfda-git-feature-example.vercel.app) |
| [unrelated](https://vercel.com/example/unrelated) | Ready | [Preview](https://unrelated-git-feature-example.vercel.app) |
`;

  assert.deepEqual(
    getVercelPreviewUrlsFromComment(body, ["warondisease", "dfda"]),
    {
      warondisease: "https://warondisease-git-feature-example.vercel.app",
      dfda: "https://dfda-git-feature-example.vercel.app",
    },
  );
});

test("keeps successful deployment URLs and fills missing app URLs", () => {
  const successfulPreviewUrls = {
    warondisease: "https://warondisease-ready.vercel.app",
  };
  const comments = [
    "| [warondisease](https://vercel.com/example/warondisease) | Ready | [Preview](https://warondisease-alias.vercel.app) |\n| [curedao](https://vercel.com/example/curedao) | Queued | [Preview](https://curedao-alias.vercel.app) |",
  ];

  assert.deepEqual(
    mergeVercelPreviewUrls(successfulPreviewUrls, comments, [
      "warondisease",
      "curedao",
    ]),
    {
      warondisease: "https://warondisease-ready.vercel.app",
      curedao: "https://curedao-alias.vercel.app",
    },
  );
});

test("ignores terminal rows without preview links", () => {
  const body = `
| [acceleratedmedicine](https://vercel.com/example/acceleratedmedicine) | Canceled | |
| [curedao](https://vercel.com/example/curedao) | Error | [Inspect](https://vercel.com/example/curedao/deployment) |
| [dfda](https://vercel.com/example/dfda) | Ready | [Preview](https://example.com/not-vercel) |
`;

  assert.deepEqual(
    getVercelPreviewUrlsFromComment(body, [
      "acceleratedmedicine",
      "curedao",
      "dfda",
    ]),
    {},
  );
});
