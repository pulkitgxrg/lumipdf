import type { StateCreator } from 'zustand';
import type {
  OcrPageResult,
  OcrProgress,
  OcrRegion,
  OcrRegionResult,
  OcrRequest,
  OcrRunKind,
  OcrStatus,
} from '../types';
import { ViewerError } from '../errors';
import {
  DEFAULT_OCR_LANGUAGE,
  OcrEngine,
  isAbortError,
  normalizeOcrPages,
  normalizeOcrRegion,
} from '../ocr';
import type { DocumentSlice } from './document';
import type { SearchSlice } from './search';
import type { ViewportSlice } from './viewport';
import type { AnnotationSlice } from './annotation';

export interface OcrSlice {
  ocrResults: Record<number, OcrPageResult>;
  ocrStatus: OcrStatus;
  ocrProgress: OcrProgress | null;
  ocrError: string | null;
  ocrLanguage: string;
  ocrDialogOpen: boolean;
  ocrRegionMode: boolean;
  ocrRegionResult: OcrRegionResult | null;
  ocrLastRun: OcrRunKind | null;

  runOcr: (request?: OcrRequest) => Promise<OcrPageResult[]>;
  runRegionOcr: (
    pageIndex: number,
    region: OcrRegion,
    language?: string,
  ) => Promise<OcrRegionResult | null>;
  setOcrRegionMode: (enabled: boolean) => void;
  cancelOcr: () => void;
  clearOcr: () => void;
  setOcrLanguage: (language: string) => void;
  setOcrDialogOpen: (open: boolean) => void;
  _resetOcr: () => void;
  _ocrController: AbortController | null;
}

export const createOcrSlice: StateCreator<
  OcrSlice & DocumentSlice & SearchSlice & ViewportSlice & AnnotationSlice,
  [],
  [],
  OcrSlice
> = (set, get) => {
  let engine: OcrEngine | null = null;

  return {
    ocrResults: {},
    ocrStatus: 'idle',
    ocrProgress: null,
    ocrError: null,
    ocrLanguage: DEFAULT_OCR_LANGUAGE,
    ocrDialogOpen: false,
    ocrRegionMode: false,
    ocrRegionResult: null,
    ocrLastRun: null,
    _ocrController: null,

    runOcr: async (request?: OcrRequest) => {
      const { adapter, document: model } = get();
      if (!model || !adapter?.rasterizePage) {
        throw new ViewerError('OCR_ERROR', 'No document is open for OCR.');
      }

      get()._ocrController?.abort();
      const controller = new AbortController();
      const { signal } = controller;
      const language = request?.language?.trim() || get().ocrLanguage;
      const pages = normalizeOcrPages(request?.pages, model.pageCount);
      if (pages.length === 0) {
        throw new ViewerError('OCR_ERROR', 'No valid pages were selected for OCR.');
      }

      set({
        ocrStatus: 'running',
        ocrError: null,
        ocrLanguage: language,
        ocrLastRun: 'pages',
        ocrRegionMode: false,
        ocrProgress: {
          stage: 'rendering',
          pageIndex: pages[0],
          completedPages: 0,
          totalPages: pages.length,
          pageProgress: 0,
        },
        _ocrController: controller,
      });

      engine ??= new OcrEngine();
      const completed: OcrPageResult[] = [];

      const finishWithResults = () => {
        const { searchQuery } = get();
        if (completed.length > 0 && searchQuery && get().adapter === adapter) {
          get().search(searchQuery);
        }
        return completed;
      };

      try {
        for (const [position, pageIndex] of pages.entries()) {
          const page = model.pages[pageIndex];
          if (!page) continue;

          const result = await engine.recognizePage({
            adapter,
            page,
            language,
            signal,
            onProgress: ({ stage, progress }) => {
              if (signal.aborted) return;
              set({
                ocrProgress: {
                  stage,
                  pageIndex,
                  completedPages: position,
                  totalPages: pages.length,
                  pageProgress: progress,
                },
              });
            },
          });
          if (signal.aborted) return finishWithResults();

          completed.push(result);
          set((state) => ({
            ocrResults: { ...state.ocrResults, [pageIndex]: result },
            ocrProgress: {
              stage: 'recognizing',
              pageIndex,
              completedPages: position + 1,
              totalPages: pages.length,
              pageProgress: 1,
            },
          }));
        }
      } catch (cause) {
        if (signal.aborted || isAbortError(cause)) return finishWithResults();

        const error =
          cause instanceof ViewerError
            ? cause
            : new ViewerError('OCR_ERROR', 'Text recognition failed.', { cause });
        set({ ocrStatus: 'error', ocrError: error.message, _ocrController: null });
        finishWithResults();
        throw error;
      }

      if (signal.aborted) return finishWithResults();
      set({ ocrStatus: 'done', _ocrController: null });
      return finishWithResults();
    },

    runRegionOcr: async (pageIndex: number, region: OcrRegion, requestedLanguage?: string) => {
      const { adapter, document: model } = get();
      if (!model || !adapter?.rasterizePage) {
        throw new ViewerError('OCR_ERROR', 'No document is open for OCR.');
      }
      const page = model.pages[pageIndex];
      if (!page) {
        throw new ViewerError('OCR_ERROR', `Page ${pageIndex + 1} does not exist.`);
      }
      const area = normalizeOcrRegion(region);
      if (!area) {
        throw new ViewerError('OCR_ERROR', 'The selected area is too small to recognize.');
      }

      get()._ocrController?.abort();
      const controller = new AbortController();
      const { signal } = controller;
      const language = requestedLanguage?.trim() || get().ocrLanguage;

      set({
        ocrStatus: 'running',
        ocrError: null,
        ocrLanguage: language,
        ocrLastRun: 'region',
        ocrRegionMode: false,
        ocrRegionResult: null,
        ocrProgress: {
          stage: 'rendering',
          pageIndex,
          completedPages: 0,
          totalPages: 1,
          pageProgress: 0,
        },
        _ocrController: controller,
      });

      engine ??= new OcrEngine();

      try {
        const result = await engine.recognizeRegion({
          adapter,
          page,
          language,
          region: area,
          signal,
          onProgress: ({ stage, progress }) => {
            if (signal.aborted) return;
            set({
              ocrProgress: {
                stage,
                pageIndex,
                completedPages: 0,
                totalPages: 1,
                pageProgress: progress,
              },
            });
          },
        });
        if (signal.aborted) return null;
        set({
          ocrRegionResult: result,
          ocrStatus: 'done',
          ocrProgress: {
            stage: 'recognizing',
            pageIndex,
            completedPages: 1,
            totalPages: 1,
            pageProgress: 1,
          },
          _ocrController: null,
        });
        return result;
      } catch (cause) {
        if (signal.aborted || isAbortError(cause)) return null;
        const error =
          cause instanceof ViewerError
            ? cause
            : new ViewerError('OCR_ERROR', 'Text recognition failed.', { cause });
        set({ ocrStatus: 'error', ocrError: error.message, _ocrController: null });
        throw error;
      }
    },

    setOcrRegionMode: (enabled: boolean) => {
      if (enabled) {
        if (!get().document || !get().adapter?.rasterizePage) return;
        set({
          ocrRegionMode: true,
          ocrDialogOpen: false,
          activeAnnotationTool: null,
          selectedAnnotationId: null,
          cursorMode: 'select',
        });
      } else {
        set({ ocrRegionMode: false });
      }
    },

    cancelOcr: () => {
      const controller = get()._ocrController;
      if (!controller) return;
      controller.abort();
      set({ ocrStatus: 'cancelled', ocrProgress: null, _ocrController: null });
    },

    clearOcr: () => {
      get()._ocrController?.abort();
      const { searchQuery } = get();
      set({
        ocrResults: {},
        ocrRegionResult: null,
        ocrLastRun: null,
        ocrStatus: 'idle',
        ocrProgress: null,
        ocrError: null,
        _ocrController: null,
      });
      if (searchQuery) get().search(searchQuery);
    },

    setOcrLanguage: (language: string) => set({ ocrLanguage: language }),

    setOcrDialogOpen: (open: boolean) => set({ ocrDialogOpen: open }),

    _resetOcr: () => {
      get()._ocrController?.abort();
      engine?.terminate();
      engine = null;
      set({
        ocrResults: {},
        ocrStatus: 'idle',
        ocrProgress: null,
        ocrError: null,
        ocrDialogOpen: false,
        ocrRegionMode: false,
        ocrRegionResult: null,
        ocrLastRun: null,
        _ocrController: null,
      });
    },
  };
};
