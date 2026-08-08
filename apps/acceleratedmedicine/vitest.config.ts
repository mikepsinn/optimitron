import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
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
      "@": path.resolve(__dirname, "./"),
      // `server-only` is a Next.js marker module that throws when imported from
      // a client bundle. In Node-based tests we don't care — shim to empty.
      "server-only": path.resolve(__dirname, "./tests/utils/server-only-shim.ts"),
    },
  },
})
