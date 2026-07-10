import { useViewerStore } from './useDocumentViewer';

export function useNavigation() {
  const currentPage = useViewerStore((s) => s.currentPage);
  const pageCount = useViewerStore((s) => s.document?.pageCount ?? 0);
  const goToPage = useViewerStore((s) => s.goToPage);
  const nextPage = useViewerStore((s) => s.nextPage);
  const prevPage = useViewerStore((s) => s.prevPage);
  const firstPage = useViewerStore((s) => s.firstPage);
  const lastPage = useViewerStore((s) => s.lastPage);

  return {
    currentPage,
    pageCount,
    totalPages: pageCount,

    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,

    hasPrevious: currentPage > 1,
    hasNext: currentPage < pageCount,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === pageCount,

    goToPageNumber: (page: number | string) => {
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      if (!isNaN(pageNum)) {
        goToPage(Math.max(1, Math.min(pageNum, pageCount)));
      }
    },
  };
}