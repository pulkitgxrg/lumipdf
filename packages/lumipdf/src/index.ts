export type {
  FileSource,
  RecentFile,
  ParseOptions,
  FileMeta,
  FileSourceReader,
  DocumentModel,
  PageRef,
  OutlineNode,
  PageDestination,
  AttachmentRef,
  DocumentMetadata,
  DocumentPermissions,
  AdapterFeatures,
  AdapterManifest,
  Adapter,
  AdapterConstructor,
  AdapterLoaderModule,
  AdapterLoader,
  AdapterRegistry,
  RenderTarget,
  RenderContext,
  RenderResult,
  TextLayerItem,
  SearchQuery,
  SearchMatch,
  SearchResult,
  AnnotationType,
  BaseAnnotation,
  HighlightAnnotation,
  InkAnnotation,
  StickyNoteAnnotation,
  ShapeAnnotation,
  FreeTextAnnotation,
  ShapeKind,
  Annotation,
  AnnotationTool,
  AnnotationChangeListener,
  AnnotationStyle,
  Theme,
  SidebarView,
  FitMode,
  ScrollMode,
  SpreadMode,
  CursorMode,
  DocViewerSelection,
  PdfViewerProps,
  PdfViewerRef,
} from "./core/types";

export { ViewerError, isViewerError } from "./core/errors";
export type { ViewerErrorCode } from "./core/errors";
export { normalizeFileSource } from "./core/file-source";
export { createRegistry } from "./core/registry";
export { createViewerStore } from "./core/store";
export type {
  ViewerStore,
  DocumentSlice,
  LoadState,
  NavigationSlice,
  ViewportSlice,
  SearchSlice,
  AnnotationSlice,
  UiSlice,
  ToolbarDensity,
} from "./core/store";

export { LRUCache } from "./core/cache/lru-cache";
export type { LRUEntry } from "./core/cache/lru-cache";
export {
  PageCache,
  makeCacheKey,
  estimateBitmapByteSize,
} from "./core/cache/page-cache";
export type { CachedPage } from "./core/cache/page-cache";

export { serializeAnnotations, parseAnnotations } from "./core/annotations";
export type { SerializedAnnotations } from "./core/annotations";

export { PdfAdapter, pdfManifest } from "./adapter/PDFAdapter";
export { registerBuiltInAdapters } from "./adapter/index";

export {
  useDocViewer,
  useViewerStore,
  ViewerStoreProvider,
} from "./hooks/useDocumentViewer";
export { useDocument } from "./hooks/useDocument";
export { useZoom } from "./hooks/useZoom";
export { useNavigation } from "./hooks/useNavigation";
export { useSearch } from "./hooks/useSearch";
export { useAnnotations } from "./hooks/useAnnotations";
export { useVirtualizer } from "./hooks/useVirtualizerHook";
export { useFileInput } from "./hooks/useFileInput";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { useFocusTrap } from "./hooks/useFocusTrap";

export { useStrings, formatString, DEFAULT_STRINGS } from "./constants/strings";
export type { ViewerStrings } from "./constants/strings";

export { DocumentViewer } from "./components/DocumentViewer";
export { Toolbar } from "./components/toolbar/Toolbar";
export { ViewerContainer } from "./components/viewer/ViewerContainer";
export { PageRenderer } from "./components/viewer/PageRenderer";
export { TextLayer } from "./components/viewer/TextLayer";
export { SearchHighlightLayer } from "./components/viewer/SearchHighlightLayer";
export { AnnotationLayer } from "./components/viewer/AnnotationLayer";
export { Sidebar } from "./components/viewer/Sidebar";
export { ThumbnailRenderer } from "./components/viewer/ThumbnailRenderer";

export {
  EmptyState,
  LoadingState,
  ErrorState,
  UnsupportedState,
} from "./components/states/StateComponents";

export { PasswordDialog } from "./components/dialogs/PasswordDialog";
export { PropertiesDialog } from "./components/dialogs/PropertiesDialog";
export { ErrorDialog } from "./components/dialogs/ErrorDialog";
export { Button } from "./components/common/Button";
export { Icon } from "./components/common/Icon";
export { Spinner } from "./components/common/Spinner";
export { Tooltip } from "./components/common/Tooltip";
