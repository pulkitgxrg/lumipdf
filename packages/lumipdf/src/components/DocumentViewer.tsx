import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { createViewerStore } from "../core/store";
import { createRegistry } from "../core/registry";
import { registerBuiltInAdapters } from "../adapter/index";
import {
  ViewerStoreProvider,
  useViewerStore,
} from "../hooks/useDocumentViewer";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { ViewerContainer } from "./viewer/ViewerContainer";
import { Toolbar } from "./toolbar/Toolbar";
import { Sidebar } from "./viewer/Sidebar";
import { PasswordDialog } from "./dialogs/PasswordDialog";
import { PropertiesDialog } from "./dialogs/PropertiesDialog";
import type {
  PdfViewerProps,
  PdfViewerRef,
  AnnotationTool,
} from "../core/types";

interface InnerProps extends PdfViewerProps {
  innerRef: React.Ref<PdfViewerRef>;
}

function DocumentViewerInner({ innerRef, ...props }: InnerProps) {
  const {
    source,
    onDocumentLoad,
    onError,
    onAnnotationChange,
    page,
    onPageChange,
    onZoom,
    onSearchResult,
    onVisiblePagesChange,
    theme,
    initialZoom,
    showToolbar = true,
    className,
  } = props;

  const openDocument = useViewerStore((s) => s.openDocument);
  const pdfDocument = useViewerStore((s) => s.document);
  const loadState = useViewerStore((s) => s.loadState);
  const loadError = useViewerStore((s) => s.loadError);
  const adapter = useViewerStore((s) => s.adapter);
  const currentPage = useViewerStore((s) => s.currentPage);
  const visiblePages = useViewerStore((s) => s.visiblePages);
  const zoom = useViewerStore((s) => s.zoom);
  const fitMode = useViewerStore((s) => s.fitMode);
  const searchResult = useViewerStore((s) => s.searchResult);
  const annotations = useViewerStore((s) => s.annotations);
  const propertiesOpen = useViewerStore((s) => s.propertiesOpen);
  const sidebarOpen = useViewerStore((s) => s.sidebarOpen);
  const _pendingPassword = useViewerStore((s) => s._pendingPassword);

  const goToPage = useViewerStore((s) => s.goToPage);
  const zoomIn = useViewerStore((s) => s.zoomIn);
  const zoomOut = useViewerStore((s) => s.zoomOut);
  const setZoom = useViewerStore((s) => s.setZoom);
  const rotateClockwise = useViewerStore((s) => s.rotateClockwise);
  const rotateCounterClockwise = useViewerStore(
    (s) => s.rotateCounterClockwise,
  );
  const search = useViewerStore((s) => s.search);
  const nextMatch = useViewerStore((s) => s.nextMatch);
  const prevMatch = useViewerStore((s) => s.prevMatch);
  const downloadDocument = useViewerStore((s) => s.downloadDocument);
  const printDocument = useViewerStore((s) => s.printDocument);
  const addAnnotation = useViewerStore((s) => s.addAnnotation);
  const updateAnnotation = useViewerStore((s) => s.updateAnnotation);
  const deleteAnnotation = useViewerStore((s) => s.deleteAnnotation);
  const setAnnotations = useViewerStore((s) => s.setAnnotations);
  const clearAnnotations = useViewerStore((s) => s.clearAnnotations);
  const setActiveTool = useViewerStore((s) => s.setActiveTool);
  const onAnnotationChangeSub = useViewerStore((s) => s.onAnnotationChange);
  const setPropertiesOpen = useViewerStore((s) => s.setPropertiesOpen);
  const submitPassword = useViewerStore((s) => s.submitPassword);
  const cancelPassword = useViewerStore((s) => s.cancelPassword);
  const setTheme = useViewerStore((s) => s.setTheme);
  const setRootElement = useViewerStore((s) => s.setRootElement);
  const _setFullscreen = useViewerStore((s) => s._setFullscreen);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRootElement(rootRef.current);
    return () => setRootElement(null);
  }, [setRootElement]);

  useEffect(() => {
    const handler = () => {
      _setFullscreen(window.document.fullscreenElement === rootRef.current);
    };
    window.document.addEventListener("fullscreenchange", handler);
    return () =>
      window.document.removeEventListener("fullscreenchange", handler);
  }, [_setFullscreen]);

  useEffect(() => {
    if (theme) setTheme(theme);
  }, [theme, setTheme]);

  const didSetInitialZoom = useRef(false);
  useEffect(() => {
    if (initialZoom !== undefined && !didSetInitialZoom.current) {
      didSetInitialZoom.current = true;
      setZoom(initialZoom);
    }
  }, [initialZoom, setZoom]);

  useEffect(() => {
    if (source) openDocument(source);
  }, [source, openDocument]);

  useEffect(() => {
    if (page !== undefined) goToPage(page);
  }, [page, goToPage]);

  useEffect(() => {
    if (loadState === "loaded" && pdfDocument && onDocumentLoad) {
      onDocumentLoad(pdfDocument);
    }
  }, [loadState, pdfDocument, onDocumentLoad]);

  useEffect(() => {
    if (loadState === "error" && loadError && onError) {
      onError(loadError);
    }
  }, [loadState, loadError, onError]);

  useEffect(() => {
    if (onPageChange && pdfDocument) {
      onPageChange(currentPage, pdfDocument.pageCount);
    }
  }, [currentPage, pdfDocument, onPageChange]);

  useEffect(() => {
    if (onZoom) onZoom(zoom, fitMode);
  }, [zoom, fitMode, onZoom]);

  useEffect(() => {
    if (onSearchResult) onSearchResult(searchResult);
  }, [searchResult, onSearchResult]);

  useEffect(() => {
    if (onVisiblePagesChange) onVisiblePagesChange(visiblePages);
  }, [visiblePages, onVisiblePagesChange]);

  useEffect(() => {
    if (!onAnnotationChange) return;
    return onAnnotationChangeSub(onAnnotationChange);
  }, [onAnnotationChangeSub, onAnnotationChange]);

  useKeyboardShortcuts(true);

  useImperativeHandle(
    innerRef,
    () => ({
      goToPage,
      zoomIn,
      zoomOut,
      setZoom,
      rotate: (direction: "cw" | "ccw") => {
        if (direction === "cw") rotateClockwise();
        else rotateCounterClockwise();
      },
      search,
      nextMatch,
      prevMatch,
      download: downloadDocument,
      print: printDocument,
      getDocument: () => pdfDocument,
      getAnnotations: () => annotations,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      setAnnotations,
      clearAnnotations,
      setActiveTool: (tool: AnnotationTool | null) => setActiveTool(tool),
    }),
    [
      goToPage,
      zoomIn,
      zoomOut,
      setZoom,
      rotateClockwise,
      rotateCounterClockwise,
      search,
      nextMatch,
      prevMatch,
      downloadDocument,
      printDocument,
      pdfDocument,
      annotations,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      setAnnotations,
      clearAnnotations,
      setActiveTool,
    ],
  );

  const isPasswordError =
    loadError?.code === "PASSWORD_REQUIRED" ||
    loadError?.code === "PASSWORD_INCORRECT";

  const pendingPassword = _pendingPassword as {
    reader: { meta: { name: string } };
    source: unknown;
  } | null;

  return (
    <div
      ref={rootRef}
      className={["dv-root", theme ? `dv-theme-${theme}` : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      data-theme={theme ?? "auto"}
      tabIndex={-1}
    >
      {showToolbar && <Toolbar features={adapter?.manifest.features} />}

      <div className="dv-body">
        {sidebarOpen && pdfDocument && <Sidebar />}
        <ViewerContainer />
      </div>

      {isPasswordError && pendingPassword && (
        <PasswordDialog
          fileName={pendingPassword.reader.meta.name}
          incorrect={loadError?.code === "PASSWORD_INCORRECT"}
          onSubmit={submitPassword}
          onCancel={cancelPassword}
        />
      )}

      {propertiesOpen && pdfDocument && (
        <PropertiesDialog
          document={pdfDocument}
          onClose={() => setPropertiesOpen(false)}
        />
      )}
    </div>
  );
}

export const DocumentViewer = forwardRef<PdfViewerRef, PdfViewerProps>(
  function DocumentViewer(props, ref) {
    const store = useMemo(() => {
      const registry = createRegistry();
      registerBuiltInAdapters(registry);
      const s = createViewerStore({ persistKey: props.persistKey });
      s.getState().setRegistry(registry);
      return s;
    }, [props.persistKey]);

    return (
      <ViewerStoreProvider store={store}>
        <DocumentViewerInner innerRef={ref} {...props} />
      </ViewerStoreProvider>
    );
  },
);
