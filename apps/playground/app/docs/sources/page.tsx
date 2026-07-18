import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsH1,
  DocsH2,
  DocsLead,
  DocsP,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "Document sources",
  description: "Load PDFs from URL, File, ArrayBuffer, or file handles.",
};

export default function SourcesPage() {
  return (
    <>
      <DocsH1>Document sources</DocsH1>
      <DocsLead>
        LumiPDF accepts a{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[15px]">
          FileSource
        </code>{" "}
        union so you can open PDFs from the network, disk, or memory.
      </DocsLead>

      <DocsH2 id="url">URL</DocsH2>
      <CodeBlock
        code={`<DocumentViewer
  source={{ kind: "url", url: "https://example.com/doc.pdf" }}
/>`}
      />

      <DocsH2 id="file">File input</DocsH2>
      <CodeBlock
        code={`function OpenPdf() {
  return (
    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // setSource({ kind: "file", file })
      }}
    />
  );
}

// <DocumentViewer source={{ kind: "file", file }} />`}
      />

      <DocsH2 id="buffer">ArrayBuffer</DocsH2>
      <CodeBlock
        code={`const buffer = await fetch("/local.pdf").then((r) => r.arrayBuffer());

<DocumentViewer
  source={{ kind: "buffer", buffer, name: "local.pdf" }}
/>`}
      />

      <DocsH2 id="password">Password-protected PDFs</DocsH2>
      <DocsP>
        When a document requires a password, LumiPDF shows a built-in password dialog.
        Users can retry until the correct password is entered.
      </DocsP>
    </>
  );
}
