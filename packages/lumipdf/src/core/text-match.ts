import type { SearchMatch, SearchQuery, TextLayerItem } from './types';

export interface MatchRange {
  readonly start: number;
  readonly length: number;
}

export function findMatchRanges(text: string, query: SearchQuery): MatchRange[] {
  if (!text || !query.text.trim()) return [];

  if (query.regex || query.wholeWord) {
    const source = query.regex ? query.text : `\\b${escapeRegex(query.text)}\\b`;
    try {
      const regex = new RegExp(source, query.caseSensitive ? 'g' : 'gi');
      return Array.from(text.matchAll(regex))
        .filter((match) => (match[0] ?? '').length > 0)
        .map((match) => ({
          start: match.index ?? 0,
          length: (match[0] ?? '').length,
        }));
    } catch {
      return [];
    }
  }

  const needle = query.caseSensitive ? query.text : query.text.toLowerCase();
  const haystack = query.caseSensitive ? text : text.toLowerCase();
  const ranges: MatchRange[] = [];
  let fromIndex = 0;
  while (fromIndex <= haystack.length) {
    const start = haystack.indexOf(needle, fromIndex);
    if (start === -1) break;
    ranges.push({ start, length: needle.length });
    fromIndex = start + Math.max(needle.length, 1);
  }
  return ranges;
}

export function findTextItemMatches(
  pageIndex: number,
  items: ReadonlyArray<TextLayerItem>,
  query: SearchQuery,
): SearchMatch[] {
  const matches: SearchMatch[] = [];
  for (const [itemIndex, item] of items.entries()) {
    const ranges = findMatchRanges(item.str, query);
    if (ranges.length === 0) continue;

    const safeLength = Math.max(item.str.length, 1);
    for (const range of ranges) {
      const startRatio = range.start / safeLength;
      const endRatio = (range.start + range.length) / safeLength;
      matches.push({
        pageIndex,
        text: item.str.slice(range.start, range.start + range.length),
        textItemIndex: itemIndex,
        textStart: range.start,
        textEnd: range.start + range.length,
        x: item.x + item.width * startRatio,
        y: item.y,
        width: Math.max(item.width * (endRatio - startRatio), 0.001),
        height: item.height,
      });
    }
  }
  return matches;
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
