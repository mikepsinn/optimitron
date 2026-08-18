import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./JsonLdScript";

describe("serializeJsonLd", () => {
  it("escapes script-breaking characters without changing valid JSON-LD", () => {
    expect(serializeJsonLd({ name: "<script>" })).toBe(
      '{"name":"\\u003cscript>"}',
    );
  });

  it("serializes undefined JSON-LD input to a valid inert payload", () => {
    expect(serializeJsonLd(undefined)).toBe("null");
  });
});
