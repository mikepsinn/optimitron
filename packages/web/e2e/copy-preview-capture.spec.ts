import { expect, test } from "@playwright/test";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const WEB_ROOT = path.resolve(__dirname, "..");
const localRequire = createRequire(path.join(WEB_ROOT, "package.json"));
const TSX_CLI = localRequire.resolve("tsx/cli");

test("capture rendered copy for the visual review", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "default");
  test.setTimeout(5 * 60_000);

  const exitCode = await runCopyPreview();
  expect(exitCode).toBe(0);
});

function runCopyPreview() {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [TSX_CLI, "scripts/render-pages-to-markdown.ts"],
      {
        cwd: WEB_ROOT,
        env: {
          ...process.env,
          COPY_PREVIEW_OUTPUT_ROOT: "output/playwright/copy-snapshots",
          PREVIEW_BASE_URL:
            process.env.BASE_URL ?? "http://127.0.0.1:3001",
        },
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Copy preview exited from signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}
