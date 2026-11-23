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
  title: "Types",
  description: "Core TypeScript types exported by lumipdf.",
};

export default function TypesPage() {
  return (
    <>
      <DocsH1>Types</DocsH1>
      <DocsLead>
        LumiPDF ships full TypeScript definitions. Import types alongside components.
      </DocsLead>

      <DocsH2 id="import">Importing types</DocsH2>
      <CodeBlock
        code={`import type {
  FileSource,
  DocumentModel,
  PdfViewerProps,
  PdfViewerRef,
  Annotation,
  Theme,
  FitMode,
} from "lumipdf";`}
      />

      <DocsH2 id="core">Core types</DocsH2>
      <DocsUl>
        <DocsLi>
          <strong className="font-semibold text-ink">FileSource</strong> - url | file |
          buffer | handle
        </DocsLi>
        <DocsLi>
          <strong className="font-semibold text-ink">DocumentModel</strong> - loaded
          document metadata and page list
        </DocsLi>
        <DocsLi>
          <strong className="font-semibold text-ink">PdfViewerProps</strong> /{" "}
          <strong className="font-semibold text-ink">PdfViewerRef</strong> - component
          surface
        </DocsLi>
        <DocsLi>
          <strong className="font-semibold text-ink">Annotation</strong> and related tool /
          style types
        </DocsLi>
        <DocsLi>
          <strong className="font-semibold text-ink">Theme</strong>,{" "}
          <strong className="font-semibold text-ink">FitMode</strong>,{" "}
          <strong className="font-semibold text-ink">ScrollMode</strong>,{" "}
          <strong className="font-semibold text-ink">SidebarView</strong>
        </DocsLi>
      </DocsUl>

      <DocsH2 id="filesource">FileSource</DocsH2>
      <CodeBlock
        language="ts"
        code={`type FileSource =
  | { kind: "file"; file: File }
  | { kind: "handle"; handle: FileSystemFileHandle }
  | { kind: "url"; url: string; filename?: string }
  | { kind: "buffer"; buffer: ArrayBuffer; name: string; type?: string };`}
      />

      <DocsH2 id="helpers">Annotation helpers</DocsH2>
      <DocsP>
        Use{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          serializeAnnotations
        </code>{" "}
        and{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          parseAnnotations
        </code>{" "}
        for validated storage payloads.
      </DocsP>
    </>
  );
}
