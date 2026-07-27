import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WISHONIA_SIGNATURE_NAME,
  WISHONIA_SIGNATURE_TITLE,
  WISHONIA_TAGLINES,
  appendWishoniaSignature,
  buildSenderSignatureHtml,
  buildSenderSignatureText,
  buildWishoniaSignatureHtml,
  buildWishoniaSignatureText,
  selectWishoniaSignature,
} from "../wishonia-signature";

vi.mock("@/lib/url", () => ({
  getBaseUrl: () => "https://test.example",
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Wishonia signature module", () => {
  describe("source-of-truth arrays", () => {
    it("ships a fixed name and CEO title", () => {
      expect(WISHONIA_SIGNATURE_NAME).toBe("Wishonia Love");
      expect(WISHONIA_SIGNATURE_TITLE).toBe(
        "CEO of Universe Optimization Services",
      );
    });

    it("ships 11 taglines per the collectors'-items joke", () => {
      expect(WISHONIA_TAGLINES).toHaveLength(11);
    });

    it("titles and taglines are non-empty strings", () => {
      for (const t of WISHONIA_TAGLINES) {
        expect(typeof t).toBe("string");
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });

  describe("selectWishoniaSignature", () => {
    it("returns the fixed title and a tagline from the registered array", () => {
      const sel = selectWishoniaSignature();
      expect(sel.title).toBe(WISHONIA_SIGNATURE_TITLE);
      expect(WISHONIA_TAGLINES).toContain(sel.tagline);
    });

    it("samples taglines at random while keeping the title fixed", () => {
      const spy = vi.spyOn(Math, "random");
      spy.mockReturnValueOnce(0);
      const sel1 = selectWishoniaSignature();
      expect(sel1.title).toBe(WISHONIA_SIGNATURE_TITLE);
      expect(sel1.tagline).toBe(WISHONIA_TAGLINES[0]);

      spy.mockReturnValueOnce(0.99);
      const sel2 = selectWishoniaSignature();
      expect(sel2.title).toBe(WISHONIA_SIGNATURE_TITLE);
      expect(sel2.tagline).toBe(WISHONIA_TAGLINES.at(-1));
    });
  });

  describe("buildWishoniaSignatureText", () => {
    it("renders the canonical Love / Wishonia Love / CEO sign-off plus tagline", () => {
      const text = buildWishoniaSignatureText({
        title: WISHONIA_SIGNATURE_TITLE,
        tagline:
          "Maximizing median income and health-adjusted life years since 2026",
      });
      expect(text).toContain("Love,");
      expect(text).toContain("Wishonia Love");
      expect(text).toContain("CEO of Universe Optimization Services");
      expect(text).not.toContain("Earth Optimization Services Inc.");
      expect(text).toContain(
        "Maximizing median income and health-adjusted life years since 2026",
      );
    });

    it("starts with a separator line so it visually disconnects from the body", () => {
      const text = buildWishoniaSignatureText({ title: "X", tagline: "Y" });
      expect(text.startsWith("\n---\n")).toBe(true);
    });
  });

  describe("buildWishoniaSignatureHtml", () => {
    it("includes the absolute avatar URL from the email base", () => {
      const html = buildWishoniaSignatureHtml({ title: "X", tagline: "Y" });
      expect(html).toContain(
        "https://test.example/sprites/wishonia/happy-smile.png",
      );
    });

    it("includes the canonical sign-off and name", () => {
      const html = buildWishoniaSignatureHtml({
        title: WISHONIA_SIGNATURE_TITLE,
        tagline: "Y",
      });
      expect(html).toContain("Love,");
      expect(html).toContain("Wishonia Love");
      expect(html).toContain("CEO of Universe Optimization Services");
      expect(html).not.toContain("Earth Optimization Services Inc.");
    });

    it("escapes HTML in title and tagline (defends against rogue array entries)", () => {
      const html = buildWishoniaSignatureHtml({
        title: "<script>alert(1)</script>",
        tagline: "<img onerror=x>",
      });
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img onerror");
      expect(html).toContain("&lt;script&gt;");
    });

    it("uses inline styles only (no <style> blocks — email clients strip them)", () => {
      const html = buildWishoniaSignatureHtml({ title: "X", tagline: "Y" });
      expect(html).not.toMatch(/<style[\s>]/i);
    });
  });

  describe("appendWishoniaSignature", () => {
    it("returns a NEW object (does not mutate input)", () => {
      const input = { html: "<p>hi</p>", text: "hi", subject: "hi" };
      const out = appendWishoniaSignature(input);
      expect(out).not.toBe(input);
      expect(input.html).toBe("<p>hi</p>");
      expect(input.text).toBe("hi");
    });

    it("preserves non-html/text fields", () => {
      const input = { html: "x", text: "x", subject: "Subj", to: "a@b.c" };
      const out = appendWishoniaSignature(input);
      expect(out.subject).toBe("Subj");
      expect(out.to).toBe("a@b.c");
    });

    it("appends to both html and text, picking ONE selection used for both", () => {
      vi.spyOn(Math, "random").mockReturnValue(0); // first tagline
      const out = appendWishoniaSignature({
        html: "<p>body</p>",
        text: "body",
      });
      expect(out.text).toContain(WISHONIA_SIGNATURE_TITLE);
      expect(out.text).toContain(WISHONIA_TAGLINES[0]!);
      expect(out.html).toContain(WISHONIA_SIGNATURE_TITLE);
      expect(out.html).toContain(WISHONIA_TAGLINES[0]!);
    });

    it("keeps the original body intact at the start", () => {
      const out = appendWishoniaSignature({
        html: "<p>body</p>",
        text: "BODY",
      });
      expect(out.html.startsWith("<p>body</p>")).toBe(true);
      expect(out.text.startsWith("BODY")).toBe(true);
    });
  });

  describe("buildSenderSignatureText", () => {
    it("renders 'Love,' sign-off with name + default role + default org", () => {
      const text = buildSenderSignatureText({ name: "Mike Sinn" });
      expect(text).toContain("Love,");
      expect(text).toContain("Mike Sinn");
      expect(text).toContain("Recently promoted to Humanity Manager");
      expect(text).toContain("Earth Optimization Services Inc.");
    });

    it("starts with a separator line", () => {
      const text = buildSenderSignatureText({ name: "X" });
      expect(text.startsWith("\n---\n")).toBe(true);
    });

    it("respects role and org overrides", () => {
      const text = buildSenderSignatureText({
        name: "Mike",
        role: "Senior Voter",
        org: "1% Treaty Coalition",
      });
      expect(text).toContain("Senior Voter");
      expect(text).toContain("1% Treaty Coalition");
      expect(text).not.toContain("Recently promoted");
    });
  });

  describe("buildSenderSignatureHtml", () => {
    it("escapes HTML-unsafe characters in name / role / org", () => {
      const html = buildSenderSignatureHtml({
        name: "<script>",
        role: "<img onerror=x>",
        org: "Org<tag>",
      });
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img onerror");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("Org&lt;tag&gt;");
    });

    it("renders without an avatar image (we don't have the sender's photo)", () => {
      const html = buildSenderSignatureHtml({ name: "Mike Sinn" });
      expect(html).not.toContain("<img");
    });
  });
});
