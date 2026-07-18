import { useViewerStore } from '../../hooks/useDocumentViewer';

export function PageNavigator() {
  const currentPage = useViewerStore((s) => s.currentPage);
  const pageCount = useViewerStore((s) => s.document?.pageCount ?? 0);
  const goToPage = useViewerStore((s) => s.goToPage);
  const nextPage = useViewerStore((s) => s.nextPage);
  const prevPage = useViewerStore((s) => s.prevPage);
  const firstPage = useViewerStore((s) => s.firstPage);
  const lastPage = useViewerStore((s) => s.lastPage);
  const zoomIn = useViewerStore((s) => s.zoomIn);
  const zoomOut = useViewerStore((s) => s.zoomOut);
  const hasDocument = pageCount > 0;

  if (!hasDocument) return null;

  return (
    <div className="dv-page-nav-pill" role="navigation" aria-label="Page navigation">
      <button
        type="button"
        className="dv-page-nav-btn"
        onClick={firstPage}
        disabled={currentPage <= 0}
        aria-label="First page"
        title="First page"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path d="M3 3h1.5v10H3V3zm3.2 5L11 3.5v9L6.2 8z" />
        </svg>
      </button>
      <button
        type="button"
        className="dv-page-nav-btn"
        onClick={prevPage}
        disabled={currentPage <= 0}
        aria-label="Previous page"
        title="Previous page"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path d="M10 3.5L5.5 8 10 12.5V3.5z" />
        </svg>
      </button>
      <div className="dv-page-nav-status">
        <input
          type="number"
          className="dv-page-nav-input"
          value={currentPage + 1}
          min={1}
          max={pageCount || 1}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) goToPage(val - 1);
          }}
          aria-label="Page number"
        />
        <span className="dv-page-nav-sep">/</span>
        <span className="dv-page-nav-total">{pageCount}</span>
      </div>
      <button
        type="button"
        className="dv-page-nav-btn"
        onClick={nextPage}
        disabled={currentPage >= pageCount - 1}
        aria-label="Next page"
        title="Next page"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path d="M6 3.5L10.5 8 6 12.5V3.5z" />
        </svg>
      </button>
      <button
        type="button"
        className="dv-page-nav-btn"
        onClick={lastPage}
        disabled={currentPage >= pageCount - 1}
        aria-label="Last page"
        title="Last page"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path d="M11.5 3H13v10h-1.5V3zM5 3.5v9L9.8 8 5 3.5z" />
        </svg>
      </button>
      <span className="dv-page-nav-divider" aria-hidden />
      <button
        type="button"
        className="dv-page-nav-btn"
        onClick={zoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path d="M3.5 7.25h9v1.5h-9v-1.5z" />
        </svg>
      </button>
      <button
        type="button"
        className="dv-page-nav-btn"
        onClick={zoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path d="M7.25 3.5h1.5v3.75H12.5v1.5H8.75V12.5h-1.5V8.75H3.5v-1.5h3.75V3.5z" />
        </svg>
      </button>
    </div>
  );
}
