import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

const appRoot = __dirname

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
      { find: "next", replacement: path.resolve(appRoot, "node_modules/next") },
      { find: "@", replacement: appRoot },
      {
        find: "server-only",
        replacement: path.resolve(appRoot, "./tests/utils/server-only-shim.ts"),
      },
    ],
  },
})
