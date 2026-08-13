import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"
import fs from "fs"

const appRoot = __dirname
const siteKitLib = path.resolve(appRoot, "../../packages/site-kit/src/lib")
const localLib = path.resolve(appRoot, "lib")

/**
 * Prefer app-local `lib/*`, then fall back to `@optimitron/site-kit` (matches tsconfig paths).
 */
function resolveAppOrSiteKitLib(subpath: string): string {
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

export default defineConfig({
  plugins: [react()],
  test: {
    passWithNoTests: true,
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
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
        find: "@",
        replacement: appRoot,
      },
      {
        find: "server-only",
        replacement: path.resolve(appRoot, "./tests/utils/server-only-shim.ts"),
      },
    ],
  },
})
