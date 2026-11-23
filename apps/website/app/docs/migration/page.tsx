import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsCallout,
  DocsH1,
  DocsH2,
  DocsLead,
  DocsLi,
  DocsOl,
  DocsP,
  DocsUl,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "Migration",
  description: "Migrate from @react-pdf-viewer to LumiPDF.",
};

export default function MigrationPage() {
  return (
    <>
      <DocsH1>Migration from @react-pdf-viewer</DocsH1>
      <DocsLead>
        Moving from{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[15px]">
          @react-pdf-viewer
        </code>
        ? Start with the native API, or use the compatibility entry for incremental
        migration.
      </DocsLead>

      <DocsH2 id="native">Recommended: native API</DocsH2>
      <DocsP>Replace the old viewer with DocumentViewer:</DocsP>
      <CodeBlock
        code={`// Before
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

// After
import { DocumentViewer } from "lumipdf";
import "lumipdf/styles";

<DocumentViewer source={{ kind: "url", url: fileUrl }} />`}
      />

      <DocsH2 id="compat">Compatibility layer</DocsH2>
      <DocsP>
        A thin compatibility surface lives at{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          lumipdf/compat/react-pdf-viewer
        </code>{" "}
        (when using the package exports available in your build). Prefer the native{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          DocumentViewer
        </code>{" "}
        for new code - it exposes the full feature set and types.
      </DocsP>

      <DocsH2 id="checklist">Checklist</DocsH2>
      <DocsOl>
        <DocsLi>Install lumipdf and remove @react-pdf-viewer/* packages when ready</DocsLi>
        <DocsLi>Swap stylesheets to lumipdf/styles</DocsLi>
        <DocsLi>Map fileUrl / fileUrlString to FileSource</DocsLi>
        <DocsLi>Re-test search, zoom, and print shortcuts in your app shell</DocsLi>
      </DocsOl>

      <DocsCallout title="Differences">
        <DocsUl>
          <DocsLi>
            Plugin architecture differs - use props, callbacks, and the ref API instead of
            plugin packages
          </DocsLi>
          <DocsLi>Annotation model is first-class with serialize/parse helpers</DocsLi>
          <DocsLi>Themes use a single theme prop rather than nested theme objects</DocsLi>
        </DocsUl>
      </DocsCallout>
    </>
  );
}
