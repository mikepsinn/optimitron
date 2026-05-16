import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface NextConfigWithTracing {
  outputFileTracingIncludes?: Record<string, string[]>;
}

const require = createRequire(import.meta.url);

describe("next.config legislation tracing", () => {
  it("includes legislation markdown in server traces for the deployed pages", () => {
    const configPath = fileURLToPath(new URL("../../next.config.js", import.meta.url));
    const config = require(configPath) as NextConfigWithTracing;
    const includes = config.outputFileTracingIncludes ?? {};
    const expectedContentGlob = "../../content/legislation/**/*.md";

    expect(includes["/legislation"] ?? []).toContain(expectedContentGlob);
    expect(includes["/legislation/*"] ?? []).toContain(expectedContentGlob);
  });
});
