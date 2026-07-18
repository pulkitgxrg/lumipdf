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
  description:
    "Highlight, draw, resize, and format PDF annotations with LumiPDF. Downloads never include overlays.",
};

export default function AnnotationsPage() {
  return (
    <>
      <DocsH1>Annotations</DocsH1>
      <DocsLead>
        The toolbar includes highlight, freehand, rectangle, ellipse, line, arrow, and text
        tools. Annotations are{" "}
        <strong>viewer overlays only</strong> - they never get written into the PDF when you
        download or print. Persist changes with{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[15px]">
          onAnnotationChange
        </code>
        .
      </DocsLead>

      <DocsH2 id="tools">Built-in tools</DocsH2>
      <DocsUl>
        <DocsLi>Highlight (color + opacity)</DocsLi>
        <DocsLi>Freehand ink (color, thickness, dotted)</DocsLi>
        <DocsLi>Shapes: rectangle, ellipse, line, arrow (fill, stroke, dotted)</DocsLi>
        <DocsLi>Free text (font, size, align, bold/italic/underline, background)</DocsLi>
      </DocsUl>

      <DocsH2 id="edit">Select, move, resize, erase</DocsH2>
      <DocsP>
        Annotation tools sit on the main toolbar. Clicking a tool (or an existing annotation)
        opens a <strong>Canva-style style modal</strong> with color swatches, opacity, fill,
        thickness, and size. Choose <strong>Draw on page</strong> to place annotations; a
        floating chip reopens settings anytime.
      </DocsP>
      <DocsUl>
        <DocsLi>Drag the body to move</DocsLi>
        <DocsLi>
          Resize with <strong>8 handles</strong> (4 corners + 4 edges), or width/height sliders
          on the format bar for highlights and rectangles
        </DocsLi>
        <DocsLi>
          Rectangles/ellipses support <strong>filled</strong> mode with separate fill color and
          fill opacity
        </DocsLi>
        <DocsLi>Click the red (x) or press Delete / Backspace to erase</DocsLi>
        <DocsLi>Double-click text annotations to re-edit content</DocsLi>
        <DocsLi>Escape clears selection and exits the active tool</DocsLi>
      </DocsUl>

      <DocsH2 id="download">Download excludes annotations</DocsH2>
      <DocsP>
        Download and print always export the original PDF bytes. Overlay annotations stay in the
        viewer (and in your app state if you persist them). This keeps the source file clean
        even after heavy markup sessions.
      </DocsP>

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
      serializeAnnotations(annotations),
    );
  }}
/>

// Restore
const annotations = parseAnnotations(
  localStorage.getItem("contract-annotations"),
);
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
// ref.current?.setActiveTool("highlight")
// ref.current?.download() // original PDF, no annotations`}
      />
    </>
  );
}
