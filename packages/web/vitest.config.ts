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
    include: ["src/**/*.test.ts"],
    env: {
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
