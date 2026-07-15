/* ============================================================
 * PDFAdapter – direct (main-thread) PDF.js integration.
 *
 * The Comlink + Web Worker approach does not work in Next.js / Turbopack
 * because Turbopack cannot bundle TypeScript source files as module workers
 * via `new Worker(new URL(...))`.  Instead we call pdfjs-dist directly on the
 * main thread and let PDF.js manage its own internal worker via the bundled
 * worker script that ships with pdfjs-dist.
 * ============================================================ */

import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type {
  Adapter,
  AdapterManifest,
  DocumentModel,
  DocumentMetadata,
  FileSourceReader,
  OutlineNode,
  PageRef,
  RenderContext,
  RenderResult,
  TextLayer,
  TextLayerItem,
  SearchQuery,
  SearchResult,
  SearchMatch,
  ParseOptions,
} from '../core/types';
import { ViewerError } from '../core/errors';
import type { PdfMetadata } from './types';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const CMAP_URL = '/pdfjs/cmaps/';
const STANDARD_FONT_DATA_URL = '/pdfjs/standard_fonts/';

export const pdfManifest: AdapterManifest = {
  id: 'pdf',
  label: 'PDF Document',
  extensions: ['pdf'],
  mimeTypes: ['application/pdf'],
  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h7l4 4v10H3V1zm7 0v4h4l-4-4zM5 7v1h6V7H5zm0 3v1h6v-1H5zm0 3v1h6v-1H5z"/></svg>`,
  features: {
    search: true,
    annotations: true,
    textSelection: true,
    print: true,
    thumbnails: true,
    outline: true,
    zoom: true,
    rotation: true,
    attachments: true,
    fullscreen: true,
    download: true,
  },
  priority: 100,
  protocolVersion: 1,
};

type RawOutlineItem = {
  title: string;
  dest: string | readonly unknown[] | null;
  items?: readonly RawOutlineItem[];
};

export class PdfAdapter implements Adapter {
  readonly manifest = pdfManifest;

  private doc: PDFDocumentProxy | null = null;
  private originalBuffer: ArrayBuffer | null = null;

  async parse(
    source: FileSourceReader,
    signal: AbortSignal,
    options?: ParseOptions,
  ): Promise<DocumentModel> {
    if (!this.originalBuffer) {
      const src = await source.arrayBuffer();
      if (signal.aborted) throw new Error('Parse cancelled');
      this.originalBuffer = src.slice(0);
    }

    const buffer = this.originalBuffer.slice(0);

    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        password: options?.password,
        cMapUrl: CMAP_URL,
        cMapPacked: true,
        standardFontDataUrl: STANDARD_FONT_DATA_URL,
        useSystemFonts: false,
        disableFontFace: false,
      });

      const onAbort = () => loadingTask.destroy().catch(() => {});
      signal.addEventListener('abort', onAbort, { once: true });

      let doc: PDFDocumentProxy;
      try {
        doc = await loadingTask.promise;
      } finally {
        signal.removeEventListener('abort', onAbort);
      }

      if (signal.aborted) {
        await doc.destroy().catch(() => {});
        throw new Error('Parse cancelled');
      }

      this.doc = doc;

      const pageCount = doc.numPages;
      const pages: PageRef[] = [];

      for (let i = 1; i <= pageCount; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        pages.push({
          index: i - 1,
          width: viewport.width,
          height: viewport.height,
          rotation: viewport.rotation as 0 | 90 | 180 | 270,
        });
        page.cleanup();
      }

      const outline = await this.buildOutline(doc);
      const metadata = await this.getMetadataInternal(doc);

      return {
        format: 'pdf',
        meta: source.meta,
        pageCount,
        pages: pages as readonly PageRef[],
        ...(outline ? { outline } : {}),
        ...(metadata ? { metadata: metadata as unknown as DocumentMetadata } : {}),
        permissions: {
          canPrint: true,
          canCopy: true,
          canAnnotate: true,
          canEdit: false,
          canFillForms: false,
        },
      };
    } catch (cause) {
      const name = (cause as { name?: string })?.name ?? '';
      const message = (cause as { message?: string })?.message ?? '';
      const isPasswordIssue =
        name === 'PasswordException' || /password/i.test(message);
      if (isPasswordIssue) {
        const incorrect = /incorrect/i.test(message);
        throw new ViewerError(
          incorrect ? 'PASSWORD_INCORRECT' : 'PASSWORD_REQUIRED',
          incorrect
            ? 'The password is incorrect.'
            : 'This PDF is password-protected.',
          { cause },
        );
      }
      throw new ViewerError('PARSE_ERROR', 'Failed to parse PDF.', { cause });
    }
  }

  async renderPage(ctx: RenderContext): Promise<RenderResult> {
    if (!this.doc) {
      throw new ViewerError('RENDER_ERROR', 'PDF not parsed.');
    }

    try {
      const page: PDFPageProxy = await this.doc.getPage(ctx.page.index + 1);
      const viewport = page.getViewport({
        scale: ctx.scale * ctx.devicePixelRatio,
        rotation: ctx.rotation,
      });

      const target = ctx.target as HTMLCanvasElement;
      const cssWidth = ctx.page.width * ctx.scale;
      const cssHeight = ctx.page.height * ctx.scale;
      const isSideways = ctx.rotation === 90 || ctx.rotation === 270;
      const outWidth = isSideways ? cssHeight : cssWidth;
      const outHeight = isSideways ? cssWidth : cssHeight;

      if (target instanceof HTMLCanvasElement) {
        const renderWidth = Math.ceil(viewport.width);
        const renderHeight = Math.ceil(viewport.height);
        target.width = renderWidth;
        target.height = renderHeight;
        target.style.width = `${outWidth}px`;
        target.style.height = `${outHeight}px`;

        const c2d = target.getContext('2d');
        if (c2d) {
          await page.render({
            canvasContext: c2d,
            viewport,
          }).promise;
        }
      }

      page.cleanup();

      return { width: outWidth, height: outHeight };
    } catch (cause) {
      throw new ViewerError('RENDER_ERROR', 'Failed to render PDF page.', { cause });
    }
  }

  async getTextLayer(
    pageIndex: number,
    _signal?: AbortSignal,
  ): Promise<TextLayer> {
    if (!this.doc) return { pageIndex, items: [] };

    try {
      const page = await this.doc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const vt = viewport.transform;

      const items: TextLayerItem[] = content.items
        .filter(
          (item): item is import('pdfjs-dist/types/src/display/api').TextItem =>
            'str' in item,
        )
        .map((item) => {
          const tm = item.transform as readonly number[];

          const c = vt[0] * tm[2] + vt[2] * tm[3];
          const d = vt[1] * tm[2] + vt[3] * tm[3];
          const e = vt[0] * tm[4] + vt[2] * tm[5] + vt[4];
          const f = vt[1] * tm[4] + vt[3] * tm[5] + vt[5];

          const fontHeight = Math.hypot(c, d) || item.height || 10;

          return {
            str: item.str,
            x: e / viewport.width,
            y: (f - fontHeight) / viewport.height,
            width: (item.width || item.str.length * fontHeight * 0.5) / viewport.width,
            height: fontHeight / viewport.height,
          };
        });

      page.cleanup();
      return { pageIndex, items };
    } catch {
      return { pageIndex, items: [] };
    }
  }

  async search(
    query: SearchQuery,
    signal: AbortSignal,
  ): Promise<SearchResult> {
    if (!this.doc) return { query, matches: [], totalMatches: 0 };

    const matches: SearchMatch[] = [];
    const pageCount = this.doc.numPages;

    for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
      if (signal.aborted) break;
      const textLayer = await this.getTextLayer(pageIdx, signal);
      for (const [itemIndex, item] of textLayer.items.entries()) {
        const ranges = this.findMatchRanges(item.str, query);
        if (ranges.length === 0) continue;

        const safeLength = Math.max(item.str.length, 1);
        for (const range of ranges) {
          const startRatio = range.start / safeLength;
          const endRatio = (range.start + range.length) / safeLength;
          matches.push({
            pageIndex: pageIdx,
            text: item.str.slice(range.start, range.start + range.length),
            textItemIndex: itemIndex,
            textStart: range.start,
            textEnd: range.start + range.length,
            x: item.x + item.width * startRatio,
            y: item.y,
            width: Math.max(item.width * (endRatio - startRatio), 0.001),
            height: item.height,
          });
        }
      }
    }

    return { query, matches, totalMatches: matches.length };
  }

  private findMatchRanges(
    text: string,
    query: SearchQuery,
  ): Array<{ start: number; length: number }> {
    if (!text || !query.text.trim()) return [];

    if (query.regex) {
      try {
        const regex = new RegExp(query.text, query.caseSensitive ? 'g' : 'gi');
        return Array.from(text.matchAll(regex))
          .filter((match) => (match[0] ?? '').length > 0)
          .map((match) => ({
            start: match.index ?? 0,
            length: (match[0] ?? '').length,
          }));
      } catch {
        return [];
      }
    }

    if (query.wholeWord) {
      try {
        const regex = new RegExp(
          `\\b${escapeRegex(query.text)}\\b`,
          query.caseSensitive ? 'g' : 'gi',
        );
        return Array.from(text.matchAll(regex))
          .filter((match) => (match[0] ?? '').length > 0)
          .map((match) => ({
            start: match.index ?? 0,
            length: (match[0] ?? '').length,
          }));
      } catch {
        return [];
      }
    }

    const needle = query.caseSensitive ? query.text : query.text.toLowerCase();
    const haystack = query.caseSensitive ? text : text.toLowerCase();
    const ranges: Array<{ start: number; length: number }> = [];
    let fromIndex = 0;
    while (fromIndex <= haystack.length) {
      const start = haystack.indexOf(needle, fromIndex);
      if (start === -1) break;
      ranges.push({ start, length: needle.length });
      fromIndex = start + Math.max(needle.length, 1);
    }
    return ranges;
  }

  private async buildOutline(
    doc: PDFDocumentProxy,
  ): Promise<readonly OutlineNode[] | undefined> {
    try {
      const outline = (await doc.getOutline()) as RawOutlineItem[] | null;
      if (!outline || outline.length === 0) return undefined;
      return Promise.all(outline.map((item) => this.convertOutlineNode(doc, item)));
    } catch {
      return undefined;
    }
  }

  private async convertOutlineNode(
    doc: PDFDocumentProxy,
    item: RawOutlineItem,
  ): Promise<OutlineNode> {
    const pageIndex = await destToPageIndex(doc, item.dest);
    const children = item.items?.length
      ? await Promise.all(item.items.map((child) => this.convertOutlineNode(doc, child)))
      : undefined;
    return {
      title: item.title,
      dest: { pageIndex: pageIndex ?? 0 },
      ...(children ? { children } : {}),
    };
  }

  private async getMetadataInternal(
    doc: PDFDocumentProxy,
  ): Promise<PdfMetadata | null> {
    try {
      const meta = await doc.getMetadata();
      const info = meta.info as Record<string, unknown>;
      const raw: Record<string, unknown> = {
        title: info.Title,
        author: info.Author,
        subject: info.Subject,
        keywords: info.Keywords,
        creator: info.Creator,
        producer: info.Producer,
        creationDate: info.CreationDate ? new Date(info.CreationDate as string) : undefined,
        modificationDate: info.ModDate ? new Date(info.ModDate as string) : undefined,
      };
      for (const key of Object.keys(raw)) {
        if (raw[key] === undefined) delete raw[key];
      }
      return raw as PdfMetadata;
    } catch {
      return null;
    }
  }

  async exportDocument(_format: 'original' | 'pdf'): Promise<Blob> {
    if (this.originalBuffer) {
      return new Blob([this.originalBuffer], { type: 'application/pdf' });
    }
    return new Blob([], { type: 'application/pdf' });
  }

  dispose(): void {
    this.doc?.destroy().catch(() => {});
    this.doc = null;
    this.originalBuffer = null;
  }
}

async function destToPageIndex(
  doc: PDFDocumentProxy,
  dest: string | readonly unknown[] | null,
): Promise<number | null> {
  try {
    const explicit =
      typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(explicit) || explicit.length === 0) return null;
    const ref = explicit[0];
    if (ref && typeof ref === 'object') {
      return await doc.getPageIndex(ref as { num: number; gen: number });
    }
    if (typeof ref === 'number') return ref;
    return null;
  } catch {
    return null;
  }
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
