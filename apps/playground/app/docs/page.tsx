import type { Metadata } from "next";
import Link from "next/link";
import {
  DocsCallout,
  DocsH1,
  DocsH2,
  DocsLead,
  DocsLi,
  DocsP,
  DocsUl,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "Introduction",
  description:
    "LumiPDF is a high-performance React PDF viewer with virtualized rendering, search, and annotations.",
};

export default function DocsIntroductionPage() {
  return (
    <>
      <DocsH1>Introduction</DocsH1>
      <DocsLead>
        LumiPDF is a high-performance React PDF viewer built on PDF.js. It ships
        virtualized rendering, search, annotations, and a clean TypeScript API.
      </DocsLead>

      <DocsH2 id="what-you-get">What you get</DocsH2>
      <DocsUl>
        <DocsLi>
          <strong className="font-semibold text-ink">DocumentViewer</strong> - drop-in
          React component with toolbar and sidebar
        </DocsLi>
        <DocsLi>Virtualized page rendering for large documents</DocsLi>
        <DocsLi>Full-text search with match navigation</DocsLi>
        <DocsLi>Annotations: highlight, ink, shapes, free text</DocsLi>
        <DocsLi>Light, dark, auto, and sepia themes</DocsLi>
        <DocsLi>Optional compatibility layer for gradual migration</DocsLi>
      </DocsUl>

      <DocsH2 id="requirements">Requirements</DocsH2>
      <DocsUl>
        <DocsLi>React 18 or 19</DocsLi>
        <DocsLi>
          <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
            pdfjs-dist
          </code>{" "}
          ^4.7 (peer dependency)
        </DocsLi>
        <DocsLi>A modern browser with canvas support</DocsLi>
      </DocsUl>

      <DocsCallout title="Open source">
        <DocsP>
          LumiPDF is MIT licensed. Install with{" "}
          <Link href="/docs/installation" className="font-medium text-meadow hover:underline">
            npm install lumipdf
          </Link>
          , try the{" "}
          <Link href="/playground" className="font-medium text-meadow hover:underline">
            playground
          </Link>
          , or jump to the{" "}
          <Link href="/docs/quick-start" className="font-medium text-meadow hover:underline">
            quick start
          </Link>
          .
        </DocsP>
      </DocsCallout>

      <DocsH2 id="next-steps">Next steps</DocsH2>
      <DocsUl>
        <DocsLi>
          <Link href="/docs/installation" className="font-medium text-meadow hover:underline">
            Installation
          </Link>{" "}
          - add the package and styles
        </DocsLi>
        <DocsLi>
          <Link href="/docs/quick-start" className="font-medium text-meadow hover:underline">
            Quick start
          </Link>{" "}
          - render your first PDF
        </DocsLi>
        <DocsLi>
          <Link
            href="/docs/api/document-viewer"
            className="font-medium text-meadow hover:underline"
          >
            API reference
          </Link>{" "}
          - props and imperative methods
        </DocsLi>
      </DocsUl>
    </>
  );
}
