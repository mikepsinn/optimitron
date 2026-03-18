import { describe, it, expect } from "vitest";
import {
  ConversationContext,
  parseWithRegex,
  type ChatMessage,
  type ParsedMeasurement,
} from "@optimitron/chat-ui";

describe("chat-ui integration", () => {
  describe("NLP re-exports resolve from web package", () => {
    it("parseWithRegex parses a treatment", () => {
      const results: ParsedMeasurement[] = parseWithRegex(
        "took 500mg magnesium"
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.variableName.toLowerCase()).toContain("magnesium");
      expect(results[0]!.value).toBe(500);
    });

    it("parseWithRegex parses mood", () => {
      const results = parseWithRegex("mood 4/5");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.value).toBe(4);
    });

    it("ConversationContext can be instantiated", () => {
      const ctx = new ConversationContext();
      expect(ctx.getMessages()).toHaveLength(0);
      expect(ctx.getAllMeasurements()).toHaveLength(0);
    });

    it("ConversationContext.parseWithContext works without API key (regex fallback)", async () => {
      const ctx = new ConversationContext();
      const result = await ctx.parseWithContext({
        text: "took 200mg ibuprofen",
      });
      expect(result.measurements.length).toBeGreaterThan(0);
      expect(
        result.measurements[0]!.variableName.toLowerCase()
      ).toContain("ibuprofen");
      // Message was added to context
      expect(ctx.getMessages()).toHaveLength(1);
      expect(ctx.getMessages()[0]!.role).toBe("user");
    });
  });

  describe("ChatMessage type compatibility", () => {
    it("text message shape is valid", () => {
      const msg: ChatMessage = {
        type: "text",
        role: "user",
        content: "hello",
      };
      expect(msg.type).toBe("text");
    });

    it("apiKey message shape is valid", () => {
      const msg: ChatMessage = { type: "apiKey" };
      expect(msg.type).toBe("apiKey");
    });

    it("mood message shape is valid", () => {
      const msg: ChatMessage = { type: "mood", id: "m1" };
      expect(msg.type).toBe("mood");
    });
  });
});
