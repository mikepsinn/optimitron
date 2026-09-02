import { defineConfig } from "vitest/config";

import baseConfig from "./vitest.config";

const database = new URL(process.env.DATABASE_URL || "postgresql://localhost/missing");
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) ||
  !/(^|[_-])test($|[_-])/u.test(database.pathname.slice(1))
) {
  throw new Error("Integration tests require an explicit local test DATABASE_URL.");
}

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    environment: "node",
    passWithNoTests: false,
    setupFiles: [],
    include: ["tests/integration/**/*.test.ts"],
    exclude: [],
    fileParallelism: false,
  },
});
