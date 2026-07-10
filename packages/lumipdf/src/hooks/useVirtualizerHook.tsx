import { type RefObject, useMemo } from 'react';
import { useVirtualizer as useTanstackVirtualizer } from '@tanstack/react-virtual';
import { useViewerStore } from './useDocumentViewer';

export function useVirtualizer(
  scrollRef: RefObject<HTMLDivElement | null>
) {
  const document = useViewerStore((s) => s.document);
  const zoom = useViewerStore((s) => s.zoom);
  const rotation = useViewerStore((s) => s.rotation);
  const scrollMode = useViewerStore((s) => s.scrollMode);

  const pageCount = document?.pages.length ?? 0;

  const sizes = useMemo(() => {
    if (!document) return new Array(pageCount).fill(400);

    return document.pages.map((page) => {
      const isRotated = rotation === 90 || rotation === 270;
      const dimension = isRotated ? page.width : page.height;
      return Math.max(50, Math.floor(dimension * zoom));
    });
  }, [document, zoom, rotation, pageCount]);

  const virtualizer = useTanstackVirtualizer({
    count: pageCount,
    getScrollElement: () => scrollRef.current,
    
    estimateSize: (index) => sizes[index] ?? 400,
    
    overscan: 3,
    horizontal: scrollMode === 'horizontal',
    
    measureElement: (el) => {
      if (!el) return 400;
      return scrollMode === 'horizontal' 
        ? el.getBoundingClientRect().width 
        : el.getBoundingClientRect().height;
    },
  });

  return {
    virtualizer,
    pageCount,
    sizes,
  };
}