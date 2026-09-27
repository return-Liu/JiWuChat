import type { TextSegment } from "../types/untilsTypes";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Splits untrusted text into plain-text segments for Vue interpolation.
 * Matching is case-insensitive and never returns HTML.
 */
export const segmentHighlightedText = (
  text: string | null | undefined,
  keyword: string | null | undefined,
): TextSegment[] => {
  const value = text || "";
  const search = keyword || "";

  if (!search) {
    return value ? [{ text: value, highlighted: false }] : [];
  }

  const regex = new RegExp(escapeRegExp(search), "gi");
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ text: value.slice(lastIndex, index), highlighted: false });
    }
    segments.push({ text: match[0], highlighted: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < value.length) {
    segments.push({ text: value.slice(lastIndex), highlighted: false });
  }

  return segments.length > 0 ? segments : [{ text: value, highlighted: false }];
};
