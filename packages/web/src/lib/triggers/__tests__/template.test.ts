import { describe, expect, it } from "vitest";
import { render, renderAll, validateTemplate } from "../template";

describe("triggers/template/render", () => {
  it("substitutes a top-level token", () => {
    expect(render("hello {{name}}", { name: "Mike" })).toEqual({
      rendered: "hello Mike",
      missingPaths: [],
    });
  });

  it("substitutes a nested dot-path token", () => {
    expect(render("user/{{user.id}}/onboarding", { user: { id: "u_42" } })).toEqual({
      rendered: "user/u_42/onboarding",
      missingPaths: [],
    });
  });

  it("trims whitespace inside braces", () => {
    expect(render("{{   user.id   }}", { user: { id: "u" } }).rendered).toBe("u");
  });

  it("renders missing tokens as empty string and reports the path", () => {
    const r = render("hello {{user.idd}}", { user: { id: "u" } });
    expect(r.rendered).toBe("hello ");
    expect(r.missingPaths).toEqual(["user.idd"]);
  });

  it("stringifies numbers and booleans", () => {
    expect(render("{{n}}/{{b}}", { n: 42, b: true }).rendered).toBe("42/true");
  });

  it("JSON-stringifies objects", () => {
    expect(render("{{x}}", { x: { a: 1 } }).rendered).toBe('{"a":1}');
  });

  it("returns literal templates unchanged", () => {
    expect(render("no tokens here", {}).rendered).toBe("no tokens here");
  });

  it("renders multiple templates and aggregates missingPaths", () => {
    const r = renderAll(["{{a}}", "{{b}}", "{{a}}"], { a: "x" });
    expect(r.rendered).toEqual(["x", "", "x"]);
    expect(r.missingPaths).toEqual(["b"]);
  });
});

describe("triggers/template/validateTemplate", () => {
  it("accepts well-formed token paths", () => {
    expect(validateTemplate("hello {{user.id}}")).toEqual({ valid: true });
    expect(validateTemplate("{{a.b.c.d}}")).toEqual({ valid: true });
    expect(validateTemplate("plain literal")).toEqual({ valid: true });
  });

  it("treats literal {{}} as text (no token)", () => {
    expect(validateTemplate("hi {{}}")).toEqual({ valid: true });
    expect(render("hi {{}}", {}).rendered).toBe("hi {{}}");
  });

  it("rejects token paths with invalid characters", () => {
    const r = validateTemplate("hi {{user-id}}");
    expect(r.valid).toBe(false);
  });
});
