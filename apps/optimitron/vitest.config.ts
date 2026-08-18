import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    env: {
      // HARDCODED. DO NOT read from process.env. Local dev often has the
      // production DATABASE_URL set in the shell environment; honoring it here
      // would let `pnpm test` write to prod. Tests must always use a
      // throwaway local DB. The test-funding test setup also calls
      // assertSafeLocalTestDatabaseUrl as a belt-and-suspenders guard.
      // CI's postgres service is configured to match these credentials
      // exactly (see .github/workflows/ci.yml services.postgres).
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      NEXTAUTH_SECRET: "test-secret-minimum-32-characters-long-for-validation",
    },
    server: {
      deps: {
        // @optimitron/data is ESM ("type": "module") — inline it so vitest
        // can transform the source imports without CJS/ESM mismatch errors.
        inline: ["@optimitron/data"],
      },
    },
  },
});
