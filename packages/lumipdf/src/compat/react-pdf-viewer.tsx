/**
 * Compatibility adapter: drop-in replacement for @react-pdf-viewer/core
 * and @react-pdf-viewer/default-layout.
 *
 * Configure your bundler alias:
 *   '@react-pdf-viewer/core'           → 'lumipdf/compat/react-pdf-viewer'
 *   '@react-pdf-viewer/default-layout' → 'lumipdf/compat/react-pdf-viewer'
 */

import React, { useRef, useEffect, useMemo, useState, memo } from "react";
import { DocumentViewer } from "../components/DocumentViewer";
import { useViewerStore } from "../hooks/useDocumentViewer";
import type {
  PdfViewerRef,
  DocumentModel,
  FileSource,
  FitMode,
  OutlineNode,
  SearchQuery,
} from "../core/types";

export enum SpecialZoomLevel {
  ActualSize = "ActualSize",
  PageFit = "PageFit",
  PageWidth = "PageWidth",
}

export enum ScrollMode {
  Horizontal = "Horizontal",
  Page = "Page",
  Vertical = "Vertical",
  Wrapped = "Wrapped",
}

export enum ViewMode {
  DualPage = "DualPage",
  DualPageWithCover = "DualPageWithCover",
  SinglePage = "SinglePage",
}

export enum SelectionMode {
  Hand = "Hand",
  Text = "Text",
}

export enum RotateDirection {
  Backward = "Backward",
  Forward = "Forward",
}

export enum ThemeContext {
  Dark = "dark",
  Light = "light",
}

export interface DocumentLoadEvent {
  doc: { numPages: number };
  file: { name: string; size: number };
}

export interface PageChangeEvent {
  /** 0-indexed, matching react-pdf-viewer convention. */
  currentPage: number;
  doc: { numPages: number };
}

export interface ZoomEvent {
  scale: number;
  doc: { numPages: number } | null;
}

export interface LoadError {
  message: string;
  name: string;
}

export interface ViewerTheme {
  theme?: string;
}

export interface SearchRenderProps {
  clearHighlights: () => void;
  currentMatch: number;
  jumpToNextMatch: () => void;
  jumpToPreviousMatch: () => void;
  keyword: string;
  numberOfMatches: number;
  readingMode?: boolean;
  searchFor: (keyword: string) => void;
  setKeyword: (keyword: string) => void;
}

export interface RenderPageProps {
  canvasLayer: React.ReactElement;
  canvasLayerRendered: boolean;
  textLayer: React.ReactElement;
  textLayerRendered: boolean;
  annotationLayer: React.ReactElement;
  annotationLayerRendered: boolean;
  height: number;
  width: number;
  pageIndex: number;
  rotation: number;
  scale: number;
  doc: { numPages: number };
}

export interface Plugin {
  _lumiPdfPlugin: true;
  _type: string;
  _connect?: (ref: PdfViewerRef) => void;
  _disconnect?: () => void;
}

export function Worker({
  children,
}: {
  workerUrl: string;
  children?: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}

function fileUrlToSource(fileUrl: string | Uint8Array): FileSource {
  if (typeof fileUrl === "string") {
    return { kind: "url", url: fileUrl };
  }

  const copy = fileUrl.buffer.slice(
    fileUrl.byteOffset,
    fileUrl.byteOffset + fileUrl.byteLength,
  ) as ArrayBuffer;
  return { kind: "buffer", buffer: copy, name: "document.pdf" };
}

function resolveTheme(
  theme: string | ViewerTheme | undefined,
): "light" | "dark" | "auto" | "sepia" | undefined {
  const raw = typeof theme === "string" ? theme : theme?.theme;
  if (raw === "dark" || raw === "light" || raw === "auto" || raw === "sepia") {
    return raw;
  }
  return undefined;
}

function resolveInitialZoom(
  defaultScale: number | SpecialZoomLevel | undefined,
): number | undefined {
  if (defaultScale === undefined) return undefined;
  if (typeof defaultScale === "number") return defaultScale;

  if (defaultScale === SpecialZoomLevel.ActualSize) return 1;
  return undefined;
}

export interface ViewerProps {
  fileUrl: string | Uint8Array;
  plugins?: Plugin[];
  defaultScale?: number | SpecialZoomLevel;
  initialPage?: number;
  theme?: string | ViewerTheme;
  onDocumentLoad?: (e: DocumentLoadEvent) => void;
  onPageChange?: (e: PageChangeEvent) => void;
  onZoom?: (e: ZoomEvent) => void;
  /** @deprecated Ignored — lumipdf manages its own loading indicator. */
  renderLoader?: (percentages: number) => React.ReactElement;
  /** @deprecated Use onError on the host component instead. */
  renderError?: (error: LoadError) => React.ReactElement;
  /** @deprecated Ignored — lumipdf manages its own scroll mode. */
  scrollMode?: ScrollMode;
  /** @deprecated Ignored — lumipdf manages its own view/spread mode. */
  viewMode?: ViewMode;
  withCredentials?: boolean;
  httpHeaders?: Record<string, string>;
  characterMap?: { isCompressed: boolean; url: string };
  enableSmoothScroll?: boolean;
  /** @deprecated Ignored — lumipdf manages its own page render pipeline. */
  renderPage?: (props: RenderPageProps) => React.ReactElement;
}

export function Viewer({
  fileUrl,
  plugins = [],
  defaultScale,
  initialPage,
  theme,
  onDocumentLoad,
  onPageChange,
  onZoom,
}: ViewerProps): React.ReactElement {
  const viewerRef = useRef<PdfViewerRef>(null);

  useEffect(() => {
    const ref = viewerRef.current;
    if (ref) {
      plugins.forEach((p) => p._connect?.(ref));
    }
    return () => {
      plugins.forEach((p) => p._disconnect?.());
    };
  }, [plugins]);

  const source = useMemo(() => fileUrlToSource(fileUrl), [fileUrl]);
  const mappedTheme = useMemo(() => resolveTheme(theme), [theme]);
  const initialZoom = useMemo(
    () => resolveInitialZoom(defaultScale),
    [defaultScale],
  );

  const handleDocumentLoad = useMemo<
    ((model: DocumentModel) => void) | undefined
  >(
    () =>
      onDocumentLoad
        ? (model) =>
            onDocumentLoad({
              doc: { numPages: model.pageCount },
              file: { name: model.meta.name, size: model.meta.size },
            })
        : undefined,
    [onDocumentLoad],
  );

  const handlePageChange = useMemo<
    ((page: number, pageCount: number) => void) | undefined
  >(
    () =>
      onPageChange
        ? (page, pageCount) =>
            onPageChange({ currentPage: page, doc: { numPages: pageCount } })
        : undefined,
    [onPageChange],
  );

  const handleZoom = useMemo<
    ((zoom: number, fitMode: FitMode) => void) | undefined
  >(
    () => (onZoom ? (zoom) => onZoom({ scale: zoom, doc: null }) : undefined),
    [onZoom],
  );

  const viewerProps = {
    ref: viewerRef,
    source,
    ...(initialZoom !== undefined && { initialZoom }),
    ...(initialPage !== undefined && { page: initialPage }),
    ...(mappedTheme !== undefined && { theme: mappedTheme }),
    ...(handleDocumentLoad && { onDocumentLoad: handleDocumentLoad }),
    ...(handlePageChange && { onPageChange: handlePageChange }),
    ...(handleZoom && { onZoom: handleZoom }),
  };

  return <DocumentViewer {...viewerProps} />;
}

export function defaultLayoutPlugin(_options?: {
  renderToolbar?: (Toolbar: React.FC) => React.ReactElement;
}): Plugin {
  return {
    _lumiPdfPlugin: true,
    _type: "default-layout",
  };
}

export interface ToolbarPluginApi {
  Toolbar: React.FC;
  renderDefaultToolbar: () => React.ReactElement;
}

export function toolbarPlugin(): Plugin & ToolbarPluginApi {
  const Toolbar: React.FC = function Toolbar() {
    return null;
  };
  return {
    _lumiPdfPlugin: true,
    _type: "toolbar",
    Toolbar,
    renderDefaultToolbar: () => React.createElement(Toolbar),
  };
}

export interface SearchPluginApi {
  clearHighlights: () => void;
  highlight: (keyword: string | string[]) => void;
  jumpToMatch: (index: number) => void;
  jumpToNextMatch: () => void;
  jumpToPreviousMatch: () => void;
  Search: React.FC<{
    children: (props: SearchRenderProps) => React.ReactElement;
  }>;
}

export function searchPlugin(options?: {
  keyword?: string | string[];
  onHighlightKeyword?: (props: unknown) => React.ReactElement;
}): Plugin & SearchPluginApi {
  let _ref: PdfViewerRef | null = null;

  const initialKeyword = Array.isArray(options?.keyword)
    ? (options.keyword[0] ?? "")
    : (options?.keyword ?? "");

  const Search: React.FC<{
    children: (props: SearchRenderProps) => React.ReactElement;
  }> = function Search({ children }) {
    const storeSearch = useViewerStore((s) => s.search);
    const clearSearch = useViewerStore((s) => s.clearSearch);
    const storeNextMatch = useViewerStore((s) => s.nextMatch);
    const storePrevMatch = useViewerStore((s) => s.prevMatch);
    const searchResult = useViewerStore((s) => s.searchResult);
    const currentMatchIndex = useViewerStore((s) => s.currentMatchIndex);

    const [keyword, setKeyword] = useState<string>(initialKeyword);

    const searchFor = (kw: string): void => {
      setKeyword(kw);
      if (!kw.trim()) {
        clearSearch();
        return;
      }
      storeSearch({
        text: kw,
        caseSensitive: false,
        wholeWord: false,
        regex: false,
        diacritics: false,
      });
    };

    return children({
      clearHighlights: clearSearch,
      currentMatch: currentMatchIndex,
      jumpToNextMatch: storeNextMatch,
      jumpToPreviousMatch: storePrevMatch,
      keyword,
      numberOfMatches: searchResult?.totalMatches ?? 0,
      searchFor,
      setKeyword,
    });
  };

  return {
    _lumiPdfPlugin: true,
    _type: "search",
    _connect: (ref) => {
      _ref = ref;
    },
    _disconnect: () => {
      _ref = null;
    },

    clearHighlights: () => {
      // No clearSearch on PdfViewerRef; imperative clear is limited outside store.
    },
    highlight: (keyword) => {
      if (!_ref) return;
      const text = Array.isArray(keyword) ? keyword.join(" OR ") : keyword;
      const query: SearchQuery = {
        text,
        caseSensitive: false,
        wholeWord: false,
        regex: false,
        diacritics: false,
      };
      _ref.search(query);
    },
    jumpToMatch: (_index) => {
      // PdfViewerRef has no goToMatch; use the Search component's render props
    },
    jumpToNextMatch: () => _ref?.nextMatch(),
    jumpToPreviousMatch: () => _ref?.prevMatch(),
    Search,
  };
}

export interface ZoomPluginApi {
  CurrentScale: React.FC<{
    children?: (props: { scale: number }) => React.ReactElement;
  }>;
  ZoomIn: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }>;
  ZoomInButton: React.FC;
  ZoomOut: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }>;
  ZoomOutButton: React.FC;
  zoomTo: (scale: number | SpecialZoomLevel) => void;
}

export function zoomPlugin(): Plugin & ZoomPluginApi {
  let _ref: PdfViewerRef | null = null;

  const CurrentScale: React.FC<{
    children?: (props: { scale: number }) => React.ReactElement;
  }> = function CurrentScale({ children }) {
    const zoom = useViewerStore((s) => s.zoom);
    const scale = Math.round(zoom * 100) / 100;
    if (children) return <>{children({ scale })}</>;
    return <span className="rpv-zoom__scale">{Math.round(scale * 100)}%</span>;
  };

  const ZoomIn: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }> = function ZoomIn({ children }) {
    const zoomIn = useViewerStore((s) => s.zoomIn);
    if (children) return <>{children({ onClick: zoomIn })}</>;
    return (
      <button
        className="rpv-zoom__btn-zoom-in"
        onClick={zoomIn}
        title="Zoom in"
        type="button"
      >
        +
      </button>
    );
  };

  const ZoomOut: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }> = function ZoomOut({ children }) {
    const zoomOut = useViewerStore((s) => s.zoomOut);
    if (children) return <>{children({ onClick: zoomOut })}</>;
    return (
      <button
        className="rpv-zoom__btn-zoom-out"
        onClick={zoomOut}
        title="Zoom out"
        type="button"
      >
        -
      </button>
    );
  };

  const ZoomInButton: React.FC = () => <ZoomIn />;
  const ZoomOutButton: React.FC = () => <ZoomOut />;

  return {
    _lumiPdfPlugin: true,
    _type: "zoom",
    _connect: (ref) => {
      _ref = ref;
    },
    _disconnect: () => {
      _ref = null;
    },

    zoomTo: (scale) => {
      if (!_ref) return;
      if (typeof scale === "number") {
        _ref.setZoom(scale);
        return;
      }
      switch (scale) {
        case SpecialZoomLevel.ActualSize:
          _ref.setZoom(1);
          break;
        case SpecialZoomLevel.PageFit:
          _ref.setZoom(1);
          break;
        case SpecialZoomLevel.PageWidth:
          _ref.setZoom(1.5);
          break;
      }
    },
    CurrentScale,
    ZoomIn,
    ZoomInButton,
    ZoomOut,
    ZoomOutButton,
  };
}

export interface PageNavigationPluginApi {
  CurrentPageLabel: React.FC<{
    children?: (props: {
      currentPage: number;
      numberOfPages: number;
      pageLabel: string;
    }) => React.ReactElement;
  }>;
  GoToFirstPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }>;
  GoToLastPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }>;
  GoToNextPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }>;
  GoToPreviousPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }>;
  NumberOfPages: React.FC;
  jumpToPage: (index: number) => void;
  GoToFirstPageButton: React.FC;
  GoToLastPageButton: React.FC;
  GoToNextPageButton: React.FC;
  GoToPreviousPageButton: React.FC;
}

export function pageNavigationPlugin(): Plugin & PageNavigationPluginApi {
  let _ref: PdfViewerRef | null = null;

  const CurrentPageLabel: React.FC<{
    children?: (props: {
      currentPage: number;
      numberOfPages: number;
      pageLabel: string;
    }) => React.ReactElement;
  }> = function CurrentPageLabel({ children }) {
    const currentPage = useViewerStore((s) => s.currentPage);
    const doc = useViewerStore((s) => s.document);
    const numberOfPages = doc?.pageCount ?? 0;
    const pageLabel = doc?.pages[currentPage]?.label ?? String(currentPage + 1);

    if (children) {
      return <>{children({ currentPage, numberOfPages, pageLabel })}</>;
    }
    return (
      <span className="rpv-page-navigation__current-page-label">
        {currentPage + 1} / {numberOfPages}
      </span>
    );
  };

  const NumberOfPages: React.FC = function NumberOfPages() {
    const doc = useViewerStore((s) => s.document);
    return (
      <span className="rpv-page-navigation__number-of-pages">
        {doc?.pageCount ?? 0}
      </span>
    );
  };

  const GoToFirstPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }> = function GoToFirstPage({ children }) {
    const firstPage = useViewerStore((s) => s.firstPage);
    const currentPage = useViewerStore((s) => s.currentPage);
    const isDisabled = currentPage === 0;
    if (children) return <>{children({ isDisabled, onClick: firstPage })}</>;
    return (
      <button
        className="rpv-page-navigation__go-to-first"
        disabled={isDisabled}
        onClick={firstPage}
        title="First page"
        type="button"
      >
        «
      </button>
    );
  };

  const GoToLastPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }> = function GoToLastPage({ children }) {
    const lastPage = useViewerStore((s) => s.lastPage);
    const currentPage = useViewerStore((s) => s.currentPage);
    const doc = useViewerStore((s) => s.document);
    const isDisabled = !doc || currentPage === doc.pageCount - 1;
    if (children) return <>{children({ isDisabled, onClick: lastPage })}</>;
    return (
      <button
        className="rpv-page-navigation__go-to-last"
        disabled={isDisabled}
        onClick={lastPage}
        title="Last page"
        type="button"
      >
        »
      </button>
    );
  };

  const GoToNextPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }> = function GoToNextPage({ children }) {
    const nextPage = useViewerStore((s) => s.nextPage);
    const currentPage = useViewerStore((s) => s.currentPage);
    const doc = useViewerStore((s) => s.document);
    const isDisabled = !doc || currentPage === doc.pageCount - 1;
    if (children) return <>{children({ isDisabled, onClick: nextPage })}</>;
    return (
      <button
        className="rpv-page-navigation__go-to-next"
        disabled={isDisabled}
        onClick={nextPage}
        title="Next page"
        type="button"
      >
        ›
      </button>
    );
  };

  const GoToPreviousPage: React.FC<{
    children?: (props: {
      isDisabled: boolean;
      onClick: () => void;
    }) => React.ReactElement;
  }> = function GoToPreviousPage({ children }) {
    const prevPage = useViewerStore((s) => s.prevPage);
    const currentPage = useViewerStore((s) => s.currentPage);
    const isDisabled = currentPage === 0;
    if (children) return <>{children({ isDisabled, onClick: prevPage })}</>;
    return (
      <button
        className="rpv-page-navigation__go-to-previous"
        disabled={isDisabled}
        onClick={prevPage}
        title="Previous page"
        type="button"
      >
        ‹
      </button>
    );
  };

  const GoToFirstPageButton: React.FC = () => <GoToFirstPage />;
  const GoToLastPageButton: React.FC = () => <GoToLastPage />;
  const GoToNextPageButton: React.FC = () => <GoToNextPage />;
  const GoToPreviousPageButton: React.FC = () => <GoToPreviousPage />;

  return {
    _lumiPdfPlugin: true,
    _type: "page-navigation",
    _connect: (ref) => {
      _ref = ref;
    },
    _disconnect: () => {
      _ref = null;
    },

    jumpToPage: (index) => _ref?.goToPage(index),
    CurrentPageLabel,
    NumberOfPages,
    GoToFirstPage,
    GoToLastPage,
    GoToNextPage,
    GoToPreviousPage,
    GoToFirstPageButton,
    GoToLastPageButton,
    GoToNextPageButton,
    GoToPreviousPageButton,
  };
}

export interface PrintPluginApi {
  Print: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }>;
  PrintButton: React.FC;
  print: () => void;
}

export function printPlugin(): Plugin & PrintPluginApi {
  let _ref: PdfViewerRef | null = null;

  const Print: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }> = function Print({ children }) {
    const printDocument = useViewerStore((s) => s.printDocument);
    if (children) return <>{children({ onClick: printDocument })}</>;
    return (
      <button
        className="rpv-print__btn"
        onClick={printDocument}
        title="Print"
        type="button"
      >
        Print
      </button>
    );
  };

  const PrintButton: React.FC = () => <Print />;

  return {
    _lumiPdfPlugin: true,
    _type: "print",
    _connect: (ref) => {
      _ref = ref;
    },
    _disconnect: () => {
      _ref = null;
    },
    print: () => {
      void _ref?.print();
    },
    Print,
    PrintButton,
  };
}

export interface DownloadPluginApi {
  Download: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }>;
  DownloadButton: React.FC;
  download: () => void;
}

export function downloadPlugin(): Plugin & DownloadPluginApi {
  let _ref: PdfViewerRef | null = null;

  const Download: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }> = function Download({ children }) {
    const downloadDocument = useViewerStore((s) => s.downloadDocument);
    if (children) return <>{children({ onClick: downloadDocument })}</>;
    return (
      <button
        className="rpv-download__btn"
        onClick={downloadDocument}
        title="Download"
        type="button"
      >
        Download
      </button>
    );
  };

  const DownloadButton: React.FC = () => <Download />;

  return {
    _lumiPdfPlugin: true,
    _type: "download",
    _connect: (ref) => {
      _ref = ref;
    },
    _disconnect: () => {
      _ref = null;
    },
    download: () => {
      void _ref?.download();
    },
    Download,
    DownloadButton,
  };
}

export interface RotatePluginApi {
  Rotate: React.FC<{
    children?: (props: {
      direction: RotateDirection;
      onClick: () => void;
    }) => React.ReactElement;
    direction?: RotateDirection;
  }>;
  RotateBackwardButton: React.FC;
  RotateForwardButton: React.FC;
}

export function rotatePlugin(): Plugin & RotatePluginApi {
  const Rotate: React.FC<{
    children?: (props: {
      direction: RotateDirection;
      onClick: () => void;
    }) => React.ReactElement;
    direction?: RotateDirection;
  }> = function Rotate({ children, direction = RotateDirection.Forward }) {
    const rotateClockwise = useViewerStore((s) => s.rotateClockwise);
    const rotateCounterClockwise = useViewerStore(
      (s) => s.rotateCounterClockwise,
    );
    const onClick =
      direction === RotateDirection.Forward
        ? rotateClockwise
        : rotateCounterClockwise;
    if (children) return <>{children({ direction, onClick })}</>;
    return (
      <button
        className={`rpv-rotate__btn rpv-rotate__btn--${direction.toLowerCase()}`}
        onClick={onClick}
        title={
          direction === RotateDirection.Forward
            ? "Rotate clockwise"
            : "Rotate counter-clockwise"
        }
        type="button"
      >
        {direction === RotateDirection.Forward ? "↻" : "↺"}
      </button>
    );
  };

  const RotateForwardButton: React.FC = () => (
    <Rotate direction={RotateDirection.Forward} />
  );
  const RotateBackwardButton: React.FC = () => (
    <Rotate direction={RotateDirection.Backward} />
  );

  return {
    _lumiPdfPlugin: true,
    _type: "rotate",
    Rotate,
    RotateForwardButton,
    RotateBackwardButton,
  };
}

export interface FullScreenPluginApi {
  EnterFullScreen: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }>;
  EnterFullScreenButton: React.FC;
  ExitFullScreen: React.FC;
}

export function fullScreenPlugin(): Plugin & FullScreenPluginApi {
  const EnterFullScreen: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }> = function EnterFullScreen({ children }) {
    const toggleFullscreen = useViewerStore((s) => s.toggleFullscreen);
    if (children) return <>{children({ onClick: toggleFullscreen })}</>;
    return (
      <button
        className="rpv-full-screen__enter-btn"
        onClick={toggleFullscreen}
        title="Enter full screen"
        type="button"
      >
        ⛶
      </button>
    );
  };

  const EnterFullScreenButton: React.FC = () => <EnterFullScreen />;

  // Renders only while in fullscreen — use as an overlay exit affordance.
  const ExitFullScreen: React.FC = function ExitFullScreen() {
    const isFullscreen = useViewerStore((s) => s.isFullscreen);
    const toggleFullscreen = useViewerStore((s) => s.toggleFullscreen);
    if (!isFullscreen) return null;
    return (
      <button
        className="rpv-full-screen__exit-btn"
        onClick={toggleFullscreen}
        title="Exit full screen"
        type="button"
      >
        ✕
      </button>
    );
  };

  return {
    _lumiPdfPlugin: true,
    _type: "full-screen",
    EnterFullScreen,
    EnterFullScreenButton,
    ExitFullScreen,
  };
}

export interface BookmarkPluginApi {
  Bookmarks: React.FC;
}

const OutlineTree = memo(function OutlineTree({
  nodes,
  depth,
}: {
  nodes: ReadonlyArray<OutlineNode>;
  depth: number;
}): React.ReactElement {
  const goToPage = useViewerStore((s) => s.goToPage);

  return (
    <ul
      className={`rpv-bookmark__list rpv-bookmark__list--depth-${depth}`}
      style={{
        listStyle: "none",
        margin: 0,
        paddingLeft: depth > 0 ? "1rem" : 0,
      }}
    >
      {nodes.map((node, idx) => (
        <li key={idx} className="rpv-bookmark__item">
          <button
            className="rpv-bookmark__title"
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              textAlign: "left",
              width: "100%",
            }}
            onClick={() => {
              const dest = node.dest;
              if (
                dest !== null &&
                typeof dest === "object" &&
                !Array.isArray(dest) &&
                "pageIndex" in dest
              ) {
                goToPage((dest as { pageIndex: number }).pageIndex);
              }
            }}
          >
            {node.title}
          </button>
          {node.children && node.children.length > 0 && (
            <OutlineTree nodes={node.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
});

export function bookmarkPlugin(): Plugin & BookmarkPluginApi {
  const Bookmarks: React.FC = function Bookmarks() {
    const doc = useViewerStore((s) => s.document);
    const outline = doc?.outline;

    if (!outline || outline.length === 0) {
      return (
        <div
          className="rpv-bookmark__empty"
          style={{ opacity: 0.6, padding: "1rem" }}
        >
          No bookmarks
        </div>
      );
    }

    return (
      <div className="rpv-bookmark__container" style={{ overflow: "auto" }}>
        <OutlineTree nodes={outline} depth={0} />
      </div>
    );
  };

  return {
    _lumiPdfPlugin: true,
    _type: "bookmark",
    Bookmarks,
  };
}

export interface ThumbnailPluginApi {
  Thumbnails: React.FC;
}

export function thumbnailPlugin(): Plugin & ThumbnailPluginApi {
  const Thumbnails: React.FC = function Thumbnails() {
    const doc = useViewerStore((s) => s.document);
    const currentPage = useViewerStore((s) => s.currentPage);
    const goToPage = useViewerStore((s) => s.goToPage);
    const pageCount = doc?.pageCount ?? 0;

    return (
      <div
        className="rpv-thumbnail__container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          overflow: "auto",
          padding: "0.5rem",
        }}
      >
        {Array.from({ length: pageCount }, (_, idx) => (
          <button
            key={idx}
            className={
              "rpv-thumbnail__item" +
              (idx === currentPage ? " rpv-thumbnail__item--active" : "")
            }
            type="button"
            onClick={() => goToPage(idx)}
            style={{
              background:
                idx === currentPage
                  ? "var(--rpv-primary-color, #357edd)"
                  : "var(--rpv-thumbnail-bg, #f5f5f5)",
              border:
                idx === currentPage
                  ? "2px solid currentColor"
                  : "1px solid #ccc",
              borderRadius: 4,
              color: idx === currentPage ? "#fff" : "inherit",
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: "0.5rem",
              textAlign: "center",
            }}
          >
            Page {idx + 1}
          </button>
        ))}
      </div>
    );
  };

  return {
    _lumiPdfPlugin: true,
    _type: "thumbnail",
    Thumbnails,
  };
}

export interface SelectionModePluginApi {
  SwitchSelectionMode: React.FC<{
    children?: (props: {
      mode: SelectionMode;
      onClick: () => void;
    }) => React.ReactElement;
    mode?: SelectionMode;
  }>;
  SwitchSelectionModeButton: React.FC<{ mode?: SelectionMode }>;
}

export function selectionModePlugin(): Plugin & SelectionModePluginApi {
  const SwitchSelectionMode: React.FC<{
    children?: (props: {
      mode: SelectionMode;
      onClick: () => void;
    }) => React.ReactElement;
    mode?: SelectionMode;
  }> = function SwitchSelectionMode({ children, mode = SelectionMode.Text }) {
    const setCursorMode = useViewerStore((s) => s.setCursorMode);
    const onClick = (): void => {
      setCursorMode(mode === SelectionMode.Hand ? "hand" : "select");
    };
    if (children) return <>{children({ mode, onClick })}</>;
    return (
      <button
        className={`rpv-selection-mode__btn rpv-selection-mode__btn--${mode.toLowerCase()}`}
        onClick={onClick}
        title={mode === SelectionMode.Hand ? "Hand tool" : "Text selection"}
        type="button"
      >
        {mode === SelectionMode.Hand ? "✋" : "T"}
      </button>
    );
  };

  const SwitchSelectionModeButton: React.FC<{ mode?: SelectionMode }> = ({
    mode,
  }) =>
    mode !== undefined ? (
      <SwitchSelectionMode mode={mode} />
    ) : (
      <SwitchSelectionMode />
    );

  return {
    _lumiPdfPlugin: true,
    _type: "selection-mode",
    SwitchSelectionMode,
    SwitchSelectionModeButton,
  };
}

export interface ScrollModePluginApi {
  SwitchScrollMode: React.FC<{
    children?: (props: {
      mode: ScrollMode;
      onClick: () => void;
    }) => React.ReactElement;
    mode?: ScrollMode;
  }>;
  SwitchScrollModeButton: React.FC<{ mode?: ScrollMode }>;
}

function toInternalScrollMode(
  mode: ScrollMode,
): "page" | "vertical" | "horizontal" | "wrapped" {
  switch (mode) {
    case ScrollMode.Page:
      return "page";
    case ScrollMode.Horizontal:
      return "horizontal";
    case ScrollMode.Wrapped:
      return "wrapped";
    case ScrollMode.Vertical:
    default:
      return "vertical";
  }
}

export function scrollModePlugin(): Plugin & ScrollModePluginApi {
  const SwitchScrollMode: React.FC<{
    children?: (props: {
      mode: ScrollMode;
      onClick: () => void;
    }) => React.ReactElement;
    mode?: ScrollMode;
  }> = function SwitchScrollMode({ children, mode = ScrollMode.Vertical }) {
    const setScrollMode = useViewerStore((s) => s.setScrollMode);
    const onClick = (): void => setScrollMode(toInternalScrollMode(mode));
    if (children) return <>{children({ mode, onClick })}</>;
    return (
      <button
        className={`rpv-scroll-mode__btn rpv-scroll-mode__btn--${mode.toLowerCase()}`}
        onClick={onClick}
        title={`${mode} scroll`}
        type="button"
      >
        {mode}
      </button>
    );
  };

  const SwitchScrollModeButton: React.FC<{ mode?: ScrollMode }> = ({ mode }) =>
    mode !== undefined ? (
      <SwitchScrollMode mode={mode} />
    ) : (
      <SwitchScrollMode />
    );

  return {
    _lumiPdfPlugin: true,
    _type: "scroll-mode",
    SwitchScrollMode,
    SwitchScrollModeButton,
  };
}

export interface HighlightPluginApi {
  jumpToHighlightArea: (area: unknown) => void;
}

export function highlightPlugin(): Plugin & HighlightPluginApi {
  let _ref: PdfViewerRef | null = null;

  return {
    _lumiPdfPlugin: true,
    _type: "highlight",
    _connect: (ref) => {
      _ref = ref;
    },
    _disconnect: () => {
      _ref = null;
    },
    jumpToHighlightArea: (area) => {
      if (!_ref || typeof area !== "object" || area === null) return;
      const { pageIndex } = area as { pageIndex?: number };
      if (typeof pageIndex === "number") {
        _ref.goToPage(pageIndex);
      }
    },
  };
}

export interface PropertiesPluginApi {
  Properties: React.FC;
  ShowProperties: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }>;
  ShowPropertiesButton: React.FC;
}

export function propertiesPlugin(): Plugin & PropertiesPluginApi {
  const Properties: React.FC = function Properties() {
    const doc = useViewerStore((s) => s.document);
    const propertiesOpen = useViewerStore((s) => s.propertiesOpen);

    if (!propertiesOpen || !doc) return null;

    const { metadata, meta, pageCount } = doc;
    const rows: Array<{ label: string; value: string }> = [
      { label: "File name", value: meta.name },
      { label: "File size", value: `${(meta.size / 1024).toFixed(1)} KB` },
      { label: "Pages", value: String(pageCount) },
      ...(metadata?.title
        ? [{ label: "Title", value: String(metadata.title) }]
        : []),
      ...(metadata?.author
        ? [{ label: "Author", value: String(metadata.author) }]
        : []),
      ...(metadata?.subject
        ? [{ label: "Subject", value: String(metadata.subject) }]
        : []),
      ...(metadata?.creator
        ? [{ label: "Creator", value: String(metadata.creator) }]
        : []),
      ...(metadata?.producer
        ? [{ label: "Producer", value: String(metadata.producer) }]
        : []),
    ];

    return (
      <div
        className="rpv-properties__panel"
        style={{
          background: "var(--rpv-properties-bg, #fff)",
          border: "1px solid #ccc",
          borderRadius: 4,
          minWidth: 280,
          padding: "1rem",
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label}>
                <td
                  style={{
                    fontWeight: 600,
                    padding: "0.25rem 0.5rem",
                    whiteSpace: "nowrap",
                    width: "35%",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{ padding: "0.25rem 0.5rem", wordBreak: "break-all" }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const ShowProperties: React.FC<{
    children?: (props: { onClick: () => void }) => React.ReactElement;
  }> = function ShowProperties({ children }) {
    const setPropertiesOpen = useViewerStore((s) => s.setPropertiesOpen);
    const propertiesOpen = useViewerStore((s) => s.propertiesOpen);
    const onClick = (): void => setPropertiesOpen(!propertiesOpen);
    if (children) return <>{children({ onClick })}</>;
    return (
      <button
        className="rpv-properties__btn"
        onClick={onClick}
        title="Document properties"
        type="button"
      >
        ℹ
      </button>
    );
  };

  const ShowPropertiesButton: React.FC = () => <ShowProperties />;

  return {
    _lumiPdfPlugin: true,
    _type: "properties",
    Properties,
    ShowProperties,
    ShowPropertiesButton,
  };
}
