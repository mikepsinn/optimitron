import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "fs";

const watch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const shared = {
  bundle: true,
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  target: "chrome120",
  logLevel: "info",
};

// Background service worker (IIFE — service workers can't use ESM)
await esbuild.build({
  ...shared,
  entryPoints: ["src/background/service-worker.ts"],
  outfile: "dist/background/service-worker.js",
  format: "iife",
});

// Popup
await esbuild.build({
  ...shared,
  entryPoints: ["src/popup/index.ts"],
  outfile: "dist/popup/index.js",
  format: "esm",
});

// Options page
await esbuild.build({
  ...shared,
  entryPoints: ["src/options/index.ts"],
  outfile: "dist/options/index.js",
  format: "esm",
});

// Analysis web worker (IIFE — workers can't use ESM)
await esbuild.build({
  ...shared,
  entryPoints: ["src/workers/analysis.worker.ts"],
  outfile: "dist/workers/analysis.worker.js",
  format: "iife",
});

// Copy static assets to dist
mkdirSync("dist", { recursive: true });
cpSync("public/", "dist/", { recursive: true });

console.log("✅ Build complete → dist/");
