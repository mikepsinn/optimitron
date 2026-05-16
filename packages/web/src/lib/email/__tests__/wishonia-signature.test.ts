import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WISHONIA_TAGLINES,
  WISHONIA_TITLES,
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
    it("ships 15 titles per the spec (collectors' items)", () => {
      expect(WISHONIA_TITLES).toHaveLength(15);
    });

    it("ships 11 taglines per the spec", () => {
      expect(WISHONIA_TAGLINES).toHaveLength(11);
    });

    it("includes the canonical first title from the spec", () => {
      expect(WISHONIA_TITLES).toContain("Chief Optimization Officer");
    });

    it("titles and taglines are non-empty strings", () => {
      for (const t of WISHONIA_TITLES) {
        expect(typeof t).toBe("string");
        expect(t.length).toBeGreaterThan(0);
      }
      for (const t of WISHONIA_TAGLINES) {
        expect(typeof t).toBe("string");
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });

  describe("selectWishoniaSignature", () => {
    it("returns a title and tagline drawn from the registered arrays", () => {
      const sel = selectWishoniaSignature();
      expect(WISHONIA_TITLES).toContain(sel.title);
      expect(WISHONIA_TAGLINES).toContain(sel.tagline);
    });

    it("samples title and tagline INDEPENDENTLY (all 15×11=165 combos reachable)", () => {
      // Two consecutive Math.random calls feed title then tagline. Drive
      // them to opposite corners of each array to verify independent indexing.
      const spy = vi.spyOn(Math, "random");
      spy.mockReturnValueOnce(0).mockReturnValueOnce(0.99);
      const sel1 = selectWishoniaSignature();
      expect(sel1.title).toBe(WISHONIA_TITLES[0]);
      expect(sel1.tagline).toBe(WISHONIA_TAGLINES.at(-1));

      spy.mockReturnValueOnce(0.99).mockReturnValueOnce(0);
      const sel2 = selectWishoniaSignature();
      expect(sel2.title).toBe(WISHONIA_TITLES.at(-1));
      expect(sel2.tagline).toBe(WISHONIA_TAGLINES[0]);
    });
  });

  describe("buildWishoniaSignatureText", () => {
    it("renders the canonical 'Love,' sign-off, name, title, company, and tagline", () => {
      const text = buildWishoniaSignatureText({
        title: "Chief Optimization Officer",
        tagline: "Maximizing median income and health-adjusted life years since 2026",
      });
      expect(text).toContain("Love,");
      expect(text).toContain("🛸 Wishonia");
      expect(text).toContain("Chief Optimization Officer");
      expect(text).toContain("Earth Optimization Services LLC");
      expect(text).toContain("Maximizing median income and health-adjusted life years since 2026");
    });

    it("starts with a separator line so it visually disconnects from the body", () => {
      const text = buildWishoniaSignatureText({ title: "X", tagline: "Y" });
      expect(text.startsWith("\n---\n")).toBe(true);
    });
  });

  describe("buildWishoniaSignatureHtml", () => {
    it("includes the absolute avatar URL from the email base", () => {
      const html = buildWishoniaSignatureHtml({ title: "X", tagline: "Y" });
      expect(html).toContain("https://test.example/sprites/wishonia/happy-smile.png");
    });

    it("includes the canonical sign-off, name, and company", () => {
      const html = buildWishoniaSignatureHtml({ title: "X", tagline: "Y" });
      expect(html).toContain("Love,");
      expect(html).toContain("🛸 Wishonia");
      expect(html).toContain("Earth Optimization Services LLC");
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
      // Pin the random selection so html/text agree.
      vi.spyOn(Math, "random").mockReturnValue(0); // first title, first tagline
      const out = appendWishoniaSignature({ html: "<p>body</p>", text: "body" });
      expect(out.text).toContain(WISHONIA_TITLES[0]!);
      expect(out.text).toContain(WISHONIA_TAGLINES[0]!);
      expect(out.html).toContain(WISHONIA_TITLES[0]!);
      expect(out.html).toContain(WISHONIA_TAGLINES[0]!);
    });

    it("keeps the original body intact at the start", () => {
      const out = appendWishoniaSignature({ html: "<p>body</p>", text: "BODY" });
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
      expect(text).toContain("Earth Optimization Services LLC");
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
