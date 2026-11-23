import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsH1,
  DocsH2,
  DocsLead,
  DocsP,
  PropsTable,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "DocumentViewer",
  description: "Props, ref methods, and callbacks for the LumiPDF DocumentViewer.",
};

export default function DocumentViewerApiPage() {
  return (
    <>
      <DocsH1>DocumentViewer</DocsH1>
      <DocsLead>
        Primary React component. Accepts a document source, UI options, and lifecycle
        callbacks. Imperative control is available via ref.
      </DocsLead>

      <DocsH2 id="import">Import</DocsH2>
      <CodeBlock
        code={`import { DocumentViewer, type PdfViewerRef } from "lumipdf";
import "lumipdf/styles";`}
      />

      <DocsH2 id="props">Props</DocsH2>
      <PropsTable
        rows={[
          {
            name: "source",
            type: "FileSource",
            description: "Document to open (url | file | buffer | handle).",
          },
          {
            name: "theme",
            type: "'light' | 'dark' | 'auto' | 'sepia'",
            description: "Viewer chrome theme.",
          },
          {
            name: "page",
            type: "number",
            description: "Controlled page index.",
          },
          {
            name: "initialZoom",
            type: "number",
            description: "Initial zoom factor.",
          },
          {
            name: "showToolbar",
            type: "boolean",
            default: "true",
            description: "Show or hide the top toolbar.",
          },
          {
            name: "showSidebar",
            type: "boolean",
            description: "Control sidebar visibility when supported.",
          },
          {
            name: "className",
            type: "string",
            description: "Root element class name.",
          },
          {
            name: "persistKey",
            type: "string",
            description: "Optional localStorage key for viewer state.",
          },
          {
            name: "onDocumentLoad",
            type: "(model) => void",
            description: "Fired when the document model is ready.",
          },
          {
            name: "onError",
            type: "(error) => void",
            description: "Fired on load or runtime errors.",
          },
          {
            name: "onPageChange",
            type: "(page, pageCount) => void",
            description: "Fired when the current page changes.",
          },
          {
            name: "onZoom",
            type: "(zoom, fitMode) => void",
            description: "Fired when zoom or fit mode changes.",
          },
          {
            name: "onSearchResult",
            type: "(result) => void",
            description: "Fired when search results update.",
          },
          {
            name: "onAnnotationChange",
            type: "(annotations) => void",
            description: "Fired when annotations are added, updated, or removed.",
          },
          {
            name: "onVisiblePagesChange",
            type: "(pages) => void",
            description: "Fired when the set of visible page indices changes.",
          },
          {
            name: "onSelectionChange",
            type: "(selection) => void",
            description: "Fired when text selection changes.",
          },
        ]}
      />

      <DocsH2 id="ref">Ref methods</DocsH2>
      <DocsP>
        Pass a ref typed as{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          PdfViewerRef
        </code>
        :
      </DocsP>
      <PropsTable
        rows={[
          {
            name: "goToPage",
            type: "(index) => void",
            description: "Navigate to a zero-based page index.",
          },
          {
            name: "zoomIn / zoomOut",
            type: "() => void",
            description: "Step zoom levels.",
          },
          {
            name: "setZoom",
            type: "(zoom) => void",
            description: "Set absolute zoom factor.",
          },
          {
            name: "rotate",
            type: "('cw' | 'ccw') => void",
            description: "Rotate pages clockwise or counter-clockwise.",
          },
          {
            name: "search",
            type: "(query) => void",
            description: "Run a full-text search.",
          },
          {
            name: "nextMatch / prevMatch",
            type: "() => void",
            description: "Move between search matches.",
          },
          {
            name: "download / print",
            type: "() => Promise<void>",
            description: "Trigger download or print flows.",
          },
          {
            name: "getDocument",
            type: "() => DocumentModel | null",
            description: "Return the loaded document model.",
          },
          {
            name: "getAnnotations",
            type: "() => Annotation[]",
            description: "Return current annotations.",
          },
          {
            name: "addAnnotation",
            type: "(annotation) => void",
            description: "Add an annotation.",
          },
          {
            name: "updateAnnotation",
            type: "(id, patch) => void",
            description: "Patch an existing annotation.",
          },
          {
            name: "deleteAnnotation",
            type: "(id) => void",
            description: "Remove an annotation by id.",
          },
          {
            name: "setAnnotations",
            type: "(annotations) => void",
            description: "Replace the full annotation set.",
          },
          {
            name: "clearAnnotations",
            type: "() => void",
            description: "Remove all annotations.",
          },
          {
            name: "setActiveTool",
            type: "(tool | null) => void",
            description: "Activate an annotation tool or clear the tool.",
          },
        ]}
      />
    </>
  );
}
