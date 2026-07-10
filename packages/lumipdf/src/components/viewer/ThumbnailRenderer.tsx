import { useEffect, useRef } from 'react';
import type { RenderContext } from '../../core/types';
import { useViewerStore } from '../../hooks/useDocumentViewer';

export interface ThumbnailRendererProps {
  pageIndex: number;
}

export function ThumbnailRenderer({ pageIndex }: ThumbnailRendererProps) {
  const adapter = useViewerStore((s) => s.adapter);
  const document = useViewerStore((s) => s.document);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!adapter || !document || !canvasRef.current) return;

    const controller = new AbortController();
    const page = document.pages[pageIndex];
    if (!page) return;

    const targetWidth = 100;
    const scale = targetWidth / page.width;

    const ctx: RenderContext = {
      page,
      target: canvasRef.current,
      scale,
      rotation: 0,
      devicePixelRatio: 1,
      signal: controller.signal,
    };

    if (adapter.renderPage) {
      adapter.renderPage(ctx).catch(() => {});
    }

    return () => controller.abort();
  }, [adapter, document, pageIndex]);

  if (!document) return null;
  const page = document.pages[pageIndex];
  if (!page) return null;

  const targetWidth = 100;
  const scale = targetWidth / page.width;
  const height = page.height * scale;

  return (
    <canvas
      ref={canvasRef}
      width={targetWidth}
      height={height}
      style={{ width: `${targetWidth}px`, height: `${height}px`, display: 'block' }}
    />
  );
}
