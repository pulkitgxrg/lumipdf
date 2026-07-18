import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsH1,
  DocsH2,
  DocsLead,
  DocsLi,
  DocsUl,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "Theming",
  description: "Light, dark, auto, and sepia themes for the LumiPDF viewer.",
};

export default function ThemingPage() {
  return (
    <>
      <DocsH1>Theming</DocsH1>
      <DocsLead>
        Pass a{" "}
        <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[15px]">
          theme
        </code>{" "}
        prop to match your product chrome.
      </DocsLead>

      <DocsH2 id="values">Supported values</DocsH2>
      <DocsUl>
        <DocsLi>
          <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
            light
          </code>
        </DocsLi>
        <DocsLi>
          <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
            dark
          </code>
        </DocsLi>
        <DocsLi>
          <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
            auto
          </code>{" "}
          - follow system preference
        </DocsLi>
        <DocsLi>
          <code className="rounded-md border border-black/[0.06] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[13px]">
            sepia
          </code>
        </DocsLi>
      </DocsUl>

      <DocsH2 id="example">Example</DocsH2>
      <CodeBlock
        code={`<DocumentViewer
  source={{ kind: "url", url: "/report.pdf" }}
  theme="dark"
  className="h-full w-full"
/>`}
      />
    </>
  );
}
