import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useViewerStore } from '../../hooks/useDocumentViewer';

export interface SearchHighlightLayerProps {
  pageIndex: number;
  width: number;
  height: number;
  rotation?: 0 | 90 | 180 | 270;
}

interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rotateRect(r: NormalizedRect, rotation: 0 | 90 | 180 | 270): NormalizedRect {
  switch (rotation) {
    case 90:
      return { x: 1 - r.y - r.height, y: r.x, width: r.height, height: r.width };
    case 180:
      return { x: 1 - r.x - r.width, y: 1 - r.y - r.height, width: r.width, height: r.height };
    case 270:
      return { x: r.y, y: 1 - r.x - r.width, width: r.height, height: r.width };
    default:
      return r;
  }
}

export function SearchHighlightLayer({
  pageIndex,
  width,
  height,
  rotation = 0,
}: SearchHighlightLayerProps) {
  const [pageElement, setPageElement] = useState<HTMLElement | null>(null);
  const searchResult = useViewerStore((s) => s.searchResult);
  const currentMatchIndex = useViewerStore((s) => s.currentMatchIndex);
  const matchNonce = useViewerStore((s) => s.matchNonce);
  const currentRef = useRef<HTMLDivElement>(null);
  const measureFrameRef = useRef<number | null>(null);
  const [measuredRects, setMeasuredRects] = useState<
    Array<{ left: number; top: number; width: number; height: number } | null>
  >([]);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', inline: 'center' });
  }, [matchNonce, currentMatchIndex, width, height]);

  useLayoutEffect(() => {
    const page =
      (document.querySelector(
        `.dv-page[data-page-index="${pageIndex}"]`,
      ) as HTMLElement | null) ?? null;
    setPageElement(page);
  }, [pageIndex, width, height]);

  useLayoutEffect(() => {
    if (measureFrameRef.current !== null) {
      cancelAnimationFrame(measureFrameRef.current);
      measureFrameRef.current = null;
    }

    measureFrameRef.current = requestAnimationFrame(() => {
      const page = pageElement;
      if (!searchResult || !page) {
        setMeasuredRects([]);
        return;
      }

      const pageRect = page.getBoundingClientRect();
      const nextRects = searchResult.matches.map((match) => {
        if (match.pageIndex !== pageIndex) return null;
        const itemIndex = match.textItemIndex;
        const textStart = match.textStart;
        const textEnd = match.textEnd;
        if (
          itemIndex === undefined ||
          textStart === undefined ||
          textEnd === undefined
        ) {
          return null;
        }

        const span = page.querySelector(
          `.dv-text-layer span[data-item-index="${itemIndex}"]`,
        ) as HTMLSpanElement | null;
        const textNode = span?.firstChild;
        if (!span || !textNode || textNode.nodeType !== Node.TEXT_NODE) return null;

        const range = document.createRange();
        const textLength = textNode.textContent?.length ?? 0;
        range.setStart(textNode, Math.max(0, Math.min(textStart, textLength)));
        range.setEnd(textNode, Math.max(0, Math.min(textEnd, textLength)));

        const rect = range.getBoundingClientRect();
        range.detach?.();

        if (!rect.width || !rect.height) return null;

        return {
          left: rect.left - pageRect.left,
          top: rect.top - pageRect.top,
          width: rect.width,
          height: rect.height,
        };
      });

      setMeasuredRects(nextRects);
    });

    return () => {
      if (measureFrameRef.current !== null) {
        cancelAnimationFrame(measureFrameRef.current);
        measureFrameRef.current = null;
      }
    };
  }, [pageElement, pageIndex, searchResult, width, height, rotation]);

  if (!searchResult || searchResult.matches.length === 0) return null;

  const pageMatches: Array<{ globalIndex: number; match: (typeof searchResult.matches)[number] }> = [];
  searchResult.matches.forEach((match, globalIndex) => {
    if (match.pageIndex === pageIndex) pageMatches.push({ globalIndex, match });
  });

  if (pageMatches.length === 0) return null;

  return (
    <div className="dv-search-layer" style={{ width, height }} aria-hidden="true">
      {pageMatches.map(({ globalIndex, match }) => {
        const isCurrent = globalIndex === currentMatchIndex;
        const measured = measuredRects[globalIndex];
        const fallback = rotateRect(match, rotation);
        return (
          <div
            key={globalIndex}
            ref={isCurrent ? currentRef : undefined}
            className={
              isCurrent
                ? 'dv-search-highlight dv-search-highlight-current'
                : 'dv-search-highlight'
            }
            data-match-current={isCurrent || undefined}
            style={{
              left: `${measured?.left ?? fallback.x * width}px`,
              top: `${measured?.top ?? fallback.y * height}px`,
              width: `${Math.max(measured?.width ?? fallback.width * width, 2)}px`,
              height: `${Math.max(measured?.height ?? fallback.height * height, 2)}px`,
            }}
          />
        );
      })}
    </div>
  );
}