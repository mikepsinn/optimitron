import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import path from "path"

export default defineConfig({
  // tsconfigPaths reads tsconfig.json's "@/lib/*", "@/components/ui/*", etc.
  // — several of those resolve into the shared site-kit / neobrutalist-ui
  // packages rather than a local file, which a hand-written `resolve.alias`
  // can't express the same way tsc's fallback lookup does.
  plugins: [tsconfigPaths(), react()],
  test: {
    passWithNoTests: true,
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    // DB migrations can take 30-60s on first run; don't trip the default 10s.
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      // Deliberately no manual "@" alias here: tsconfigPaths() above already
      // resolves "@/*" for app source using tsconfig.json's paths, including
      // its local-file-first-then-site-kit-fallback entries (e.g.
      // "@/lib/*"). A blanket "@" -> "./" alias would shadow that and always
      // resolve to this app's own (often nonexistent) local file first.
      //
      // tsconfig.json excludes "tests" from the TS project, so files under
      // tests/ (like db-test-utils.ts) fall outside what tsconfigPaths()
      // resolves — alias their one shared-package import by hand.
      "@/lib/db-safety": path.resolve(__dirname, "../../packages/site-kit/src/lib/db-safety.ts"),
      // tsconfig.json also excludes "**/*.test.ts", so vi.mock("@/lib/...")
      // specifiers inside colocated route tests would not resolve to the
      // same module id the route under test imports. Alias the two modules
      // the REST v1 tests mock; both resolve to site-kit (no local file
      // shadows them), matching production resolution.
      "@/lib/auth-utils": path.resolve(__dirname, "../../packages/site-kit/src/lib/auth-utils.ts"),
      "@/lib/prisma": path.resolve(__dirname, "../../packages/site-kit/src/lib/prisma.ts"),
      // `server-only` is a Next.js marker module that throws when imported
      // from a client bundle. In Node-based tests we don't care — shim to
      // empty.
      "server-only": path.resolve(__dirname, "./tests/utils/server-only-shim.ts"),
    },
  },
})
