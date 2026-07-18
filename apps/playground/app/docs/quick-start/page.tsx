import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsH1,
  DocsH2,
  DocsLead,
  DocsP,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "Quick start",
  description: "Render your first PDF with LumiPDF DocumentViewer.",
};

const BASIC = `import { DocumentViewer } from "lumipdf";
import "lumipdf/styles";

export function App() {
  return (
    <div style={{ height: "100vh" }}>
      <DocumentViewer
        source={{ kind: "url", url: "/report.pdf" }}
        theme="light"
      />
    </div>
  );
}`;

const CALLBACKS = `import { DocumentViewer } from "lumipdf";

export function Viewer() {
  return (
    <DocumentViewer
      source={{ kind: "url", url: "/contract.pdf" }}
      onDocumentLoad={(model) => {
        console.log("pages", model.pageCount);
      }}
      onPageChange={(page, pageCount) => {
        console.log(page, "of", pageCount);
      }}
      onError={(error) => {
        console.error(error);
      }}
    />
  );
}`;

export default function QuickStartPage() {
  return (
    <>
      <DocsH1>Quick start</DocsH1>
      <DocsLead>
        Render a PDF in a few lines. Give the viewer a height so the virtualized canvas can
        size correctly.
      </DocsLead>

      <DocsH2 id="basic">Basic example</DocsH2>
      <DocsP>
        Import{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          DocumentViewer
        </code>
        , pass a{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          source
        </code>
        , and mount it in a full-height container:
      </DocsP>
      <CodeBlock code={BASIC} />

      <DocsH2 id="events">Load and page events</DocsH2>
      <DocsP>
        Hook into document lifecycle and navigation with optional callbacks:
      </DocsP>
      <CodeBlock code={CALLBACKS} />

      <DocsH2 id="next">What next?</DocsH2>
      <DocsP>
        Learn how to load from files and buffers in{" "}
        <a href="/docs/sources" className="font-medium text-meadow hover:underline">
          Document sources
        </a>
        , or browse the full{" "}
        <a
          href="/docs/api/document-viewer"
          className="font-medium text-meadow hover:underline"
        >
          DocumentViewer API
        </a>
        .
      </DocsP>
    </>
  );
}
