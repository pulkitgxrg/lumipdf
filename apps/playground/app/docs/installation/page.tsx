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
  title: "Installation",
  description: "Install LumiPDF and peer dependencies in your React project.",
};

export default function InstallationPage() {
  return (
    <>
      <DocsH1>Installation</DocsH1>
      <DocsLead>
        Add LumiPDF to your React app with npm, yarn, or pnpm. Peer dependencies must be
        installed in your project.
      </DocsLead>

      <DocsH2 id="package">Package</DocsH2>
      <CodeBlock language="bash" code="npm install lumipdf" />
      <CodeBlock language="bash" code="yarn add lumipdf" />
      <CodeBlock language="bash" code="pnpm add lumipdf" />

      <DocsH2 id="peers">Peer dependencies</DocsH2>
      <DocsP>
        LumiPDF expects React 18+ and PDF.js. Install them if your project does not already
        include them:
      </DocsP>
      <CodeBlock language="bash" code="npm install react react-dom pdfjs-dist" />
      <DocsUl>
        <DocsLi>
          <strong className="font-semibold text-ink">react</strong> /{" "}
          <strong className="font-semibold text-ink">react-dom</strong> ≥ 18
        </DocsLi>
        <DocsLi>
          <strong className="font-semibold text-ink">pdfjs-dist</strong> ^4.7
        </DocsLi>
      </DocsUl>

      <DocsH2 id="styles">Styles</DocsH2>
      <DocsP>
        Import the package stylesheet once in your app root (e.g.{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          layout.tsx
        </code>{" "}
        or{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          main.tsx
        </code>
        ):
      </DocsP>
      <CodeBlock language="tsx" code={`import "lumipdf/styles";`} />

      <DocsH2 id="worker">PDF.js worker</DocsH2>
      <DocsP>
        By default the PDF.js worker can load from a CDN (jsDelivr). For self-hosted
        workers, set{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
          GlobalWorkerOptions.workerSrc
        </code>{" "}
        before rendering:
      </DocsP>
      <CodeBlock
        language="tsx"
        code={`import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();`}
      />

      <DocsCallout title="CORS">
        <DocsP>
          Remote PDF URLs must allow cross-origin access from your app origin. Prefer
          same-origin assets or a proxy when the host does not send CORS headers.
        </DocsP>
      </DocsCallout>

      <DocsH2 id="checklist">Checklist</DocsH2>
      <DocsOl>
        <DocsLi>Install lumipdf and peers</DocsLi>
        <DocsLi>Import lumipdf/styles</DocsLi>
        <DocsLi>Optionally configure the PDF.js worker</DocsLi>
        <DocsLi>
          Continue to{" "}
          <a href="/docs/quick-start" className="font-medium text-meadow hover:underline">
            Quick start
          </a>
        </DocsLi>
      </DocsOl>
    </>
  );
}
