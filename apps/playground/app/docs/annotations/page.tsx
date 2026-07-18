import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsH1,
  DocsH2,
  DocsLead,
  DocsLi,
  DocsP,
  DocsUl,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "Annotations",
  description: "Highlight, draw, and persist PDF annotations with LumiPDF.",
};

export default function AnnotationsPage() {
  return (
    <>
      <DocsH1>Annotations</DocsH1>
      <DocsLead>
        The toolbar includes highlight, freehand, rectangle, ellipse, line, arrow, and text
        tools. Persist changes with{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[15px]">
          onAnnotationChange
        </code>
        .
      </DocsLead>

      <DocsH2 id="tools">Built-in tools</DocsH2>
      <DocsUl>
        <DocsLi>Highlight (with color controls)</DocsLi>
        <DocsLi>Freehand ink</DocsLi>
        <DocsLi>Shapes: rectangle, ellipse, line, arrow</DocsLi>
        <DocsLi>Free text overlay</DocsLi>
      </DocsUl>

      <DocsH2 id="persist">Persist annotations</DocsH2>
      <DocsP>
        Listen for changes and store the array. Restore later with the ref API or by
        rehydrating stored payloads via{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          parseAnnotations
        </code>
        :
      </DocsP>
      <CodeBlock
        code={`import {
  DocumentViewer,
  serializeAnnotations,
  parseAnnotations,
} from "lumipdf";

<DocumentViewer
  source={{ kind: "url", url: "/contract.pdf" }}
  onAnnotationChange={(annotations) => {
    localStorage.setItem(
      "contract-annotations",
      JSON.stringify(serializeAnnotations(annotations)),
    );
  }}
/>

// Restore
const raw = localStorage.getItem("contract-annotations");
const annotations = raw ? parseAnnotations(JSON.parse(raw)) : [];
// ref.setAnnotations(annotations)`}
      />

      <DocsH2 id="ref">Imperative control</DocsH2>
      <CodeBlock
        code={`import { useRef } from "react";
import { DocumentViewer, type PdfViewerRef } from "lumipdf";

const ref = useRef<PdfViewerRef>(null);

// ref.current?.addAnnotation(...)
// ref.current?.deleteAnnotation(id)
// ref.current?.clearAnnotations()
// ref.current?.setActiveTool("highlight")`}
      />
    </>
  );
}
