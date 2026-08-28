import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"
import fs from "fs"

const appRoot = __dirname
const siteKitLib = path.resolve(appRoot, "../../packages/site-kit/src/lib")
const localLib = path.resolve(appRoot, "lib")
const siteKitComponents = path.resolve(
  appRoot,
  "../../packages/site-kit/src/components",
)
const localComponents = path.resolve(appRoot, "components")
const neobrutalistCn = path.resolve(
  appRoot,
  "../../packages/neobrutalist-ui/src/cn.ts",
)

function resolveAppOrSiteKitLib(subpath: string): string {
  // tsconfig maps `@/lib/utils` to the neobrutalist-ui cn helper.
  if (subpath === "utils") return neobrutalistCn
  const withoutExt = subpath.replace(/\.(ts|tsx|js|jsx)$/, "")
  for (const candidate of [
    path.join(localLib, `${withoutExt}.ts`),
    path.join(localLib, `${withoutExt}.tsx`),
    path.join(localLib, withoutExt, "index.ts"),
    path.join(siteKitLib, `${withoutExt}.ts`),
    path.join(siteKitLib, `${withoutExt}.tsx`),
    path.join(siteKitLib, withoutExt, "index.ts"),
  ]) {
    if (fs.existsSync(candidate)) return candidate
  }
  return path.join(siteKitLib, withoutExt)
}

/**
 * Prefer app-local `components/*`, then fall back to site-kit components
 * (matches the tsconfig fallthrough paths).
 */
function resolveAppOrSiteKitComponent(subpath: string): string {
  const withoutExt = subpath.replace(/\.(ts|tsx|js|jsx)$/, "")
  for (const candidate of [
    path.join(localComponents, `${withoutExt}.tsx`),
    path.join(localComponents, `${withoutExt}.ts`),
    path.join(localComponents, withoutExt, "index.tsx"),
    path.join(localComponents, withoutExt, "index.ts"),
    path.join(siteKitComponents, `${withoutExt}.tsx`),
    path.join(siteKitComponents, `${withoutExt}.ts`),
    path.join(siteKitComponents, withoutExt, "index.tsx"),
    path.join(siteKitComponents, withoutExt, "index.ts"),
  ]) {
    if (fs.existsSync(candidate)) return candidate
  }
  return path.join(siteKitComponents, withoutExt)
}

export default defineConfig({
  plugins: [react()],
  test: {
    passWithNoTests: true,
    globals: true,
    environment: "happy-dom",
    setupFiles: [],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e/**", "tests/integration/**"],
    hookTimeout: 120_000,
  },
  resolve: {
    alias: [
      {
        find: /^@\/lib\/(.*)$/,
        replacement: "$1",
        customResolver(id) {
          return resolveAppOrSiteKitLib(id)
        },
      },
      {
        find: /^@\/components\/(.*)$/,
        replacement: "$1",
        customResolver(id) {
          return resolveAppOrSiteKitComponent(id)
        },
      },
      {
        find: "@",
        replacement: appRoot,
      },
    ],
  },
})
