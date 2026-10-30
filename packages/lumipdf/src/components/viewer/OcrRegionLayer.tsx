import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { OcrRegion } from '../../core/types';
import { useViewerStore } from '../../hooks/useDocumentViewer';
import { useStrings } from '../../constants/strings';

export interface OcrRegionLayerProps {
  pageIndex: number;
  rotation?: 0 | 90 | 180 | 270;
}

interface DisplayPoint {
  u: number;
  v: number;
}

const MIN_SELECTION_PX = 8;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toPageCoords(
  { u, v }: DisplayPoint,
  rotation: 0 | 90 | 180 | 270,
): { x: number; y: number } {
  switch (rotation) {
    case 90:
      return { x: v, y: 1 - u };
    case 180:
      return { x: 1 - u, y: 1 - v };
    case 270:
      return { x: 1 - v, y: u };
    default:
      return { x: u, y: v };
  }
}

function toPageRegion(
  start: DisplayPoint,
  end: DisplayPoint,
  rotation: 0 | 90 | 180 | 270,
): OcrRegion {
  const a = toPageCoords(start, rotation);
  const b = toPageCoords(end, rotation);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export function OcrRegionLayer({ pageIndex, rotation = 0 }: OcrRegionLayerProps) {
  const runRegionOcr = useViewerStore((s) => s.runRegionOcr);
  const setOcrDialogOpen = useViewerStore((s) => s.setOcrDialogOpen);
  const label = useStrings().ocr.regionHint;
  const layerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<DisplayPoint | null>(null);
  const [draft, setDraft] = useState<{ start: DisplayPoint; end: DisplayPoint } | null>(null);

  const toDisplayPoint = (e: ReactPointerEvent): DisplayPoint => {
    const rect = layerRef.current!.getBoundingClientRect();
    return {
      u: clamp01((e.clientX - rect.left) / rect.width),
      v: clamp01((e.clientY - rect.top) / rect.height),
    };
  };

  const reset = (e: ReactPointerEvent) => {
    startRef.current = null;
    setDraft(null);
    if (layerRef.current?.hasPointerCapture(e.pointerId)) {
      layerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const point = toDisplayPoint(e);
    startRef.current = point;
    setDraft({ start: point, end: point });
    layerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    const start = startRef.current;
    if (!start) return;
    e.preventDefault();
    setDraft({ start, end: toDisplayPoint(e) });
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    const start = startRef.current;
    if (!start || !layerRef.current) return;
    const end = toDisplayPoint(e);
    const rect = layerRef.current.getBoundingClientRect();
    reset(e);

    const widthPx = Math.abs(end.u - start.u) * rect.width;
    const heightPx = Math.abs(end.v - start.v) * rect.height;
    if (widthPx < MIN_SELECTION_PX || heightPx < MIN_SELECTION_PX) return;

    setOcrDialogOpen(true);
    runRegionOcr(pageIndex, toPageRegion(start, end, rotation)).catch(() => {});
  };

  return (
    <div
      ref={layerRef}
      className="dv-ocr-region-layer"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={reset}
      aria-label={label}
    >
      {draft && (
        <div
          className="dv-ocr-region-rect"
          style={{
            left: `${Math.min(draft.start.u, draft.end.u) * 100}%`,
            top: `${Math.min(draft.start.v, draft.end.v) * 100}%`,
            width: `${Math.abs(draft.end.u - draft.start.u) * 100}%`,
            height: `${Math.abs(draft.end.v - draft.start.v) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
