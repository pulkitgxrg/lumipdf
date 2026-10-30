import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TextLayerItem } from '../../core/types';
import { useViewerStore } from '../../hooks/useDocumentViewer';
import { ocrTextLayerItems } from '../../core/ocr';

export interface TextLayerProps {
  pageIndex: number;
  /** Rendered page width in CSS px (page.width * zoom). */
  width: number;
  /** Rendered page height in CSS px. */
  height: number;
  rotation?: 0 | 90 | 180 | 270;
}

function rotationTransform(
  rotation: 0 | 90 | 180 | 270,
  width: number,
  height: number,
): string | undefined {
  switch (rotation) {
    case 90:
      return `translate(${width}px, 0) rotate(90deg)`;
    case 180:
      return `translate(${width}px, ${height}px) rotate(180deg)`;
    case 270:
      return `translate(0, ${height}px) rotate(270deg)`;
    default:
      return undefined;
  }
}

export function TextLayer({
  pageIndex,
  width: layerWidth,
  height: layerHeight,
  rotation = 0,
}: TextLayerProps) {
  const isSideways = rotation === 90 || rotation === 270;
  const width = isSideways ? layerHeight : layerWidth;
  const height = isSideways ? layerWidth : layerHeight;
  const adapter = useViewerStore((s) => s.adapter);
  const ocrResult = useViewerStore((s) => s.ocrResults[pageIndex]);
  const [nativeItems, setNativeItems] = useState<readonly TextLayerItem[]>([]);
  const items = useMemo(
    () =>
      ocrResult && !ocrResult.hasNativeText
        ? ocrTextLayerItems(ocrResult)
        : nativeItems,
    [ocrResult, nativeItems],
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adapter?.getTextLayer) {
      setNativeItems([]);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    adapter
      .getTextLayer(pageIndex, controller.signal)
      .then((layer) => {
        if (!cancelled) setNativeItems(layer.items);
      })
      .catch(() => {
        if (!cancelled) setNativeItems([]);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [adapter, pageIndex]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const spans = container.querySelectorAll<HTMLElement>('span[data-tw]');
    spans.forEach((span) => {
      span.style.transform = '';
      const target = parseFloat(span.dataset.tw ?? '0');
      const natural = span.offsetWidth;
      if (target > 0 && natural > 0) {
        span.style.transform = `scaleX(${target / natural})`;
      }
    });
  }, [items, width, height]);

  if (items.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="dv-text-layer"
      style={{
        width,
        height,
        transform: rotationTransform(rotation, layerWidth, layerHeight),
        transformOrigin: '0 0',
      }}
      aria-hidden="false"
    >
      {items.map((item, i) =>
        item.str ? (
          <span
            key={i}
            data-item-index={i}
            data-tw={item.width * width}
            style={{
              left: `${item.x * width}px`,
              top: `${item.y * height}px`,
              fontSize: `${Math.max(item.height * height, 1)}px`,
            }}
          >
            {item.str}
          </span>
        ) : null,
      )}
    </div>
  );
}