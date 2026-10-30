import { useMemo } from 'react';
import { useViewerStore } from './useDocumentViewer';
import { formatOcrText, sortOcrResults } from '../core/ocr';

export function useOcr() {
  const ocrResults = useViewerStore((s) => s.ocrResults);
  const ocrStatus = useViewerStore((s) => s.ocrStatus);
  const ocrProgress = useViewerStore((s) => s.ocrProgress);
  const ocrError = useViewerStore((s) => s.ocrError);
  const ocrLanguage = useViewerStore((s) => s.ocrLanguage);
  const runOcr = useViewerStore((s) => s.runOcr);
  const cancelOcr = useViewerStore((s) => s.cancelOcr);
  const clearOcr = useViewerStore((s) => s.clearOcr);
  const setOcrLanguage = useViewerStore((s) => s.setOcrLanguage);
  const setOcrDialogOpen = useViewerStore((s) => s.setOcrDialogOpen);
  const ocrRegionMode = useViewerStore((s) => s.ocrRegionMode);
  const ocrRegionResult = useViewerStore((s) => s.ocrRegionResult);
  const runRegionOcr = useViewerStore((s) => s.runRegionOcr);
  const setOcrRegionMode = useViewerStore((s) => s.setOcrRegionMode);

  const results = useMemo(() => sortOcrResults(ocrResults), [ocrResults]);
  const text = useMemo(() => formatOcrText(results), [results]);

  return {
    results,
    text,
    status: ocrStatus,
    progress: ocrProgress,
    error: ocrError,
    language: ocrLanguage,
    isRunning: ocrStatus === 'running',
    runOcr,
    regionResult: ocrRegionResult,
    isSelectingRegion: ocrRegionMode,
    runRegionOcr,
    selectRegion: () => setOcrRegionMode(true),
    cancelRegionSelection: () => setOcrRegionMode(false),
    cancelOcr,
    clearOcr,
    setLanguage: setOcrLanguage,
    openDialog: () => setOcrDialogOpen(true),
    closeDialog: () => setOcrDialogOpen(false),
  };
}
