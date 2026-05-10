import { describe, expect, it } from "vitest";
import {
  normalizePrimaryTaskCommunicationEndpoint,
  normalizeTaskCommunicationEndpointUrl,
} from "./task-communication-endpoints.server";

describe("task communication endpoint URL normalization", () => {
  it("allows http, https, mailto, and internal task paths", () => {
    expect(normalizeTaskCommunicationEndpointUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(normalizeTaskCommunicationEndpointUrl("http://example.com/path")).toBe(
      "http://example.com/path",
    );
    expect(
      normalizeTaskCommunicationEndpointUrl("mailto:leader@example.com"),
    ).toBe("mailto:leader@example.com");
    expect(normalizeTaskCommunicationEndpointUrl("/vote")).toBe("/vote");
  });

  it("rejects executable and protocol-relative endpoint URLs", () => {
    expect(normalizeTaskCommunicationEndpointUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeTaskCommunicationEndpointUrl("data:text/html,hi")).toBeNull();
    expect(normalizeTaskCommunicationEndpointUrl("//evil.example/path")).toBeNull();
  });

  it("drops unsafe URLs before storing normalized endpoint data", () => {
    expect(
      normalizePrimaryTaskCommunicationEndpoint({
        label: "Run script",
        url: "javascript:alert(1)",
      }),
    ).toEqual({
      email: null,
      instructions: null,
      kind: "MANUAL",
      label: "Run script",
      sourceUrl: null,
      url: null,
    });
  });
});
