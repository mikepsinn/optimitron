import { describe, expect, it } from "vitest";
import { normalizeTaskTextLineBreaks } from "../task-text";

describe("normalizeTaskTextLineBreaks", () => {
  it("preserves real markdown line breaks", () => {
    expect(normalizeTaskTextLineBreaks("First\r\n\r\n- Second")).toBe(
      "First\n\n- Second",
    );
  });

  it("converts visible escaped line breaks into real markdown line breaks", () => {
    expect(normalizeTaskTextLineBreaks("First\\n\\n- Second")).toBe(
      "First\n\n- Second",
    );
    expect(normalizeTaskTextLineBreaks("First\\\\nSecond")).toBe(
      "First\nSecond",
    );
  });

  it("does not treat obvious file paths as escaped line breaks", () => {
    expect(normalizeTaskTextLineBreaks(String.raw`Open C:\new-folder`)).toBe(
      String.raw`Open C:\new-folder`,
    );
    expect(normalizeTaskTextLineBreaks(String.raw`Open \\server\new-folder`)).toBe(
      String.raw`Open \\server\new-folder`,
    );
    expect(normalizeTaskTextLineBreaks(String.raw`Open ` + "`C:\\new-folder`")).toBe(
      String.raw`Open ` + "`C:\\new-folder`",
    );
    expect(normalizeTaskTextLineBreaks(String.raw`Open (C:\new-folder)`)).toBe(
      String.raw`Open (C:\new-folder)`,
    );
  });

  it("preserves literal escape examples", () => {
    expect(normalizeTaskTextLineBreaks(String.raw`{"separator":"\n"}`)).toBe(
      String.raw`{"separator":"\n"}`,
    );
    expect(normalizeTaskTextLineBreaks(String.raw`Use /\n/ for line breaks`)).toBe(
      String.raw`Use /\n/ for line breaks`,
    );
    expect(normalizeTaskTextLineBreaks(String.raw`Type \n in that field`)).toBe(
      String.raw`Type \n in that field`,
    );
  });
});
