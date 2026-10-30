import type Tesseract from 'tesseract.js';
import type {
  Adapter,
  OcrLine,
  OcrPageResult,
  OcrRegion,
  OcrRegionResult,
  OcrStage,
  OcrWord,
  PageRef,
  SearchMatch,
  SearchQuery,
  TextLayerItem,
} from './types';
import { ViewerError } from './errors';
import { findTextItemMatches } from './text-match';

export const OCR_LANGUAGES: ReadonlyArray<{ readonly code: string; readonly label: string }> = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'ita', label: 'Italian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'nld', label: 'Dutch' },
  { code: 'pol', label: 'Polish' },
  { code: 'tur', label: 'Turkish' },
  { code: 'rus', label: 'Russian' },
  { code: 'ukr', label: 'Ukrainian' },
  { code: 'ara', label: 'Arabic' },
  { code: 'hin', label: 'Hindi' },
  { code: 'ben', label: 'Bengali' },
  { code: 'tam', label: 'Tamil' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'chi_tra', label: 'Chinese (Traditional)' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'kor', label: 'Korean' },
  { code: 'vie', label: 'Vietnamese' },
];

export const DEFAULT_OCR_LANGUAGE = 'eng';

const OCR_MAX_SCALE = 300 / 72;
const OCR_TARGET_LONG_EDGE = 3000;
const OCR_REGION_MAX_LONG_EDGE = 4000;
const OCR_MIN_LINE_CONFIDENCE = 50;
const OCR_MIN_REGION_SIZE = 0.002;

type TesseractModule = typeof Tesseract;
type TesseractWorker = Tesseract.Worker;

export interface OcrPageProgress {
  readonly stage: OcrStage;
  readonly progress: number;
}

export interface RecognizePageOptions {
  readonly adapter: Adapter;
  readonly page: PageRef;
  readonly language: string;
  readonly signal: AbortSignal;
  readonly onProgress: (progress: OcrPageProgress) => void;
}

let tesseractModule: Promise<TesseractModule> | null = null;

function loadTesseract(): Promise<TesseractModule> {
  if (!tesseractModule) {
    tesseractModule = import('tesseract.js')
      .then((mod) => {
        const resolved = (mod as { default?: TesseractModule }).default ?? (mod as TesseractModule);
        if (typeof resolved.createWorker !== 'function') {
          throw new Error('tesseract.js did not expose createWorker.');
        }
        return resolved;
      })
      .catch((error: unknown) => {
        tesseractModule = null;
        throw error;
      });
  }
  return tesseractModule;
}

export function isAbortError(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'AbortError';
}

function abortError(): DOMException {
  return new DOMException('OCR was cancelled.', 'AbortError');
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  return new Error('OCR engine failed.');
}

function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

export function getOcrScale(page: PageRef, region?: OcrRegion): number {
  if (region) {
    const longEdge = Math.max(region.width * page.width, region.height * page.height, 1);
    return Math.min(OCR_MAX_SCALE, OCR_REGION_MAX_LONG_EDGE / longEdge);
  }
  const longEdge = Math.max(page.width, page.height, 1);
  return Math.max(1, Math.min(OCR_MAX_SCALE, OCR_TARGET_LONG_EDGE / longEdge));
}

export function normalizeOcrRegion(region: OcrRegion): OcrRegion | null {
  const values = [region.x, region.y, region.width, region.height];
  if (!values.every(Number.isFinite)) return null;
  const x0 = clamp01(Math.min(region.x, region.x + region.width));
  const y0 = clamp01(Math.min(region.y, region.y + region.height));
  const x1 = clamp01(Math.max(region.x, region.x + region.width));
  const y1 = clamp01(Math.max(region.y, region.y + region.height));
  if (x1 - x0 < OCR_MIN_REGION_SIZE || y1 - y0 < OCR_MIN_REGION_SIZE) return null;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

interface Recognition {
  readonly text: string;
  readonly confidence: number;
  readonly lines: OcrLine[];
}

export class OcrEngine {
  private worker: Promise<TesseractWorker> | null = null;
  private workerLanguage: string | null = null;
  private generation = 0;
  private progressListener: ((progress: OcrPageProgress) => void) | null = null;

  async recognizePage(options: RecognizePageOptions): Promise<OcrPageResult> {
    const { adapter, page, language, signal } = options;
    const recognition = await this.recognize(options, () =>
      raceAbort(detectNativeText(adapter, page.index, signal), signal),
    );
    return {
      pageIndex: page.index,
      language,
      text: recognition.text,
      confidence: recognition.confidence,
      lines: recognition.lines,
      hasNativeText: recognition.extra,
      recognizedAt: Date.now(),
    };
  }

  async recognizeRegion(
    options: RecognizePageOptions & { readonly region: OcrRegion },
  ): Promise<OcrRegionResult> {
    const recognition = await this.recognize(options, async () => undefined);
    return {
      pageIndex: options.page.index,
      region: options.region,
      language: options.language,
      text: recognition.text,
      confidence: recognition.confidence,
      lines: recognition.lines,
      recognizedAt: Date.now(),
    };
  }

  private async recognize<T>(
    {
      adapter,
      page,
      language,
      signal,
      onProgress,
      region,
    }: RecognizePageOptions & { readonly region?: OcrRegion },
    prepare: () => Promise<T>,
  ): Promise<Recognition & { readonly extra: T }> {
    if (!adapter.rasterizePage) {
      throw new ViewerError('OCR_ERROR', 'This document type does not support OCR.');
    }

    const onAbort = () => this.terminate();
    if (signal.aborted) throw abortError();
    signal.addEventListener('abort', onAbort, { once: true });
    this.progressListener = onProgress;

    let canvas: HTMLCanvasElement | null = null;
    try {
      onProgress({ stage: 'rendering', progress: 0 });
      const scale = getOcrScale(page, region);
      canvas = await raceAbort(adapter.rasterizePage(page.index, scale, signal, region), signal);

      const extra = await prepare();

      onProgress({ stage: 'loading', progress: 0 });
      const worker = await raceAbort(this.getWorker(language), signal);

      onProgress({ stage: 'recognizing', progress: 0 });
      const { data } = await raceAbort(
        worker.recognize(canvas, {}, { text: true, blocks: true }),
        signal,
      );

      const pageWidth = page.width * scale;
      const pageHeight = page.height * scale;
      const { lines, text } = extractLines(data, {
        offsetX: region ? region.x * pageWidth : 0,
        offsetY: region ? region.y * pageHeight : 0,
        width: pageWidth,
        height: pageHeight,
      });
      const confidence =
        lines.length > 0
          ? lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length
          : 0;

      return { text, confidence, lines, extra };
    } catch (cause) {
      if (signal.aborted || isAbortError(cause)) throw abortError();
      if (cause instanceof ViewerError) throw cause;
      throw new ViewerError('OCR_ERROR', toError(cause).message, { cause, retryable: true });
    } finally {
      signal.removeEventListener('abort', onAbort);
      if (this.progressListener === onProgress) this.progressListener = null;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }

  terminate(): void {
    this.generation++;
    const worker = this.worker;
    this.worker = null;
    this.workerLanguage = null;
    worker?.then((w) => w.terminate()).catch(() => {});
  }

  private getWorker(language: string): Promise<TesseractWorker> {
    if (this.worker && this.workerLanguage === language) return this.worker;
    this.terminate();

    const generation = this.generation;
    const worker = this.createWorker(language).catch((error: unknown) => {
      if (this.generation === generation) {
        this.worker = null;
        this.workerLanguage = null;
      }
      throw error;
    });
    this.worker = worker;
    this.workerLanguage = language;
    return worker;
  }

  private async createWorker(language: string): Promise<TesseractWorker> {
    const tesseract = await loadTesseract();

    let rejectInit: (error: Error) => void = () => {};
    const initFailure = new Promise<never>((_, reject) => {
      rejectInit = reject;
    });
    initFailure.catch(() => {});

    const created = tesseract.createWorker(language, tesseract.OEM.LSTM_ONLY, {
      logger: (message) => {
        const listener = this.progressListener;
        if (!listener) return;
        const recognizing = message.status === 'recognizing text';
        listener({
          stage: recognizing ? 'recognizing' : 'loading',
          progress: recognizing ? clamp01(message.progress) : 0,
        });
      },
      errorHandler: (error) => {
        rejectInit(new Error(`OCR engine failed to load "${language}": ${toError(error).message}`));
      },
    });

    try {
      return await Promise.race([created, initFailure]);
    } catch (error) {
      created.then((w) => w.terminate()).catch(() => {});
      throw error;
    }
  }
}

async function detectNativeText(
  adapter: Adapter,
  pageIndex: number,
  signal: AbortSignal,
): Promise<boolean> {
  if (!adapter.getTextLayer) return false;
  try {
    const layer = await adapter.getTextLayer(pageIndex, signal);
    return layer.items.some((item) => item.str.trim().length > 0);
  } catch {
    return false;
  }
}

interface PageFrame {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly width: number;
  readonly height: number;
}

function extractLines(
  data: Tesseract.Page,
  frame: PageFrame,
): { lines: OcrLine[]; text: string } {
  const lines: OcrLine[] = [];
  const paragraphs: string[] = [];

  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      const paragraphLines: string[] = [];
      for (const line of paragraph.lines) {
        if (line.confidence < OCR_MIN_LINE_CONFIDENCE) continue;
        const words: OcrWord[] = line.words
          .filter((word) => word.text.trim().length > 0)
          .map((word) => ({
            text: word.text.trim(),
            confidence: word.confidence,
            ...normalizeBox(word.bbox, frame),
          }));
        const text = line.text.replace(/\s+/g, ' ').trim();
        if (words.length === 0 || text.length === 0) continue;

        paragraphLines.push(text);
        lines.push({
          text,
          confidence: line.confidence,
          ...normalizeBox(line.bbox, frame),
          words,
        });
      }
      if (paragraphLines.length > 0) paragraphs.push(paragraphLines.join('\n'));
    }
  }

  return { lines, text: normalizeText(paragraphs.join('\n\n')) };
}

function normalizeBox(
  bbox: Tesseract.Bbox,
  frame: PageFrame,
): { x: number; y: number; width: number; height: number } {
  const width = Math.max(frame.width, 1);
  const height = Math.max(frame.height, 1);
  const x0 = clamp01((bbox.x0 + frame.offsetX) / width);
  const y0 = clamp01((bbox.y0 + frame.offsetY) / height);
  const x1 = clamp01((bbox.x1 + frame.offsetX) / width);
  const y1 = clamp01((bbox.y1 + frame.offsetY) / height);
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  };
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function ocrTextLayerItems(result: OcrPageResult): TextLayerItem[] {
  return result.lines.map((line) => ({
    str: line.text,
    x: line.x,
    y: line.y,
    width: line.width,
    height: line.height,
  }));
}

export function sortOcrResults(
  results: Readonly<Record<number, OcrPageResult>>,
): OcrPageResult[] {
  return Object.values(results).sort((a, b) => a.pageIndex - b.pageIndex);
}

export function searchOcrResults(
  results: Readonly<Record<number, OcrPageResult>>,
  query: SearchQuery,
): SearchMatch[] {
  return sortOcrResults(results)
    .filter((result) => !result.hasNativeText)
    .flatMap((result) => findTextItemMatches(result.pageIndex, ocrTextLayerItems(result), query));
}

export function formatOcrText(results: ReadonlyArray<OcrPageResult>): string {
  if (results.length === 1) return results[0].text;
  return results
    .map((result) => `--- Page ${result.pageIndex + 1} ---\n${result.text}`)
    .join('\n\n');
}

export function parsePageRange(input: string, pageCount: number): number[] | null {
  const parts = input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const pages = new Set<number>();
  for (const part of parts) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) return null;
    const start = Number(match[1]);
    const end = match[2] !== undefined ? Number(match[2]) : start;
    if (start < 1 || end < start || end > pageCount) return null;
    for (let page = start; page <= end; page++) pages.add(page - 1);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function normalizeOcrPages(
  pages: ReadonlyArray<number> | undefined,
  pageCount: number,
): number[] {
  if (!pages) return Array.from({ length: pageCount }, (_, index) => index);
  return Array.from(
    new Set(pages.filter((page) => Number.isInteger(page) && page >= 0 && page < pageCount)),
  ).sort((a, b) => a - b);
}
