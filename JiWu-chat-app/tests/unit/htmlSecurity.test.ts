import { describe, expect, it } from "vitest";
import { segmentHighlightedText } from "../../untils/htmlSecurity";

describe("segmentHighlightedText", () => {
  it("returns highlighted and plain text segments without generating HTML", () => {
    expect(segmentHighlightedText("Hello hello!", "hello")).toEqual([
      { text: "Hello", highlighted: true },
      { text: " ", highlighted: false },
      { text: "hello", highlighted: true },
      { text: "!", highlighted: false },
    ]);
  });

  it("treats regex metacharacters as literal search text", () => {
    expect(segmentHighlightedText("a+b and aab", "a+b")).toEqual([
      { text: "a+b", highlighted: true },
      { text: " and aab", highlighted: false },
    ]);
  });

  it("keeps malicious message markup as inert text", () => {
    const malicious = '<img src=x onerror="alert(1)">needle<script>alert(1)</script>';
    const segments = segmentHighlightedText(malicious, "needle");

    expect(segments.map((segment) => segment.text).join("")).toBe(malicious);
    expect(segments.filter((segment) => segment.highlighted)).toEqual([
      { text: "needle", highlighted: true },
    ]);
  });
});
