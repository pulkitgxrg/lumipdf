import type { Metadata } from "next";
import {
  DocsH1,
  DocsH2,
  DocsLead,
  DocsLi,
  DocsP,
  DocsUl,
} from "@/components/docs/mdx-components";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with LumiPDF - GitHub issues, discussions, and contributing.",
};

export default function SupportDocsPage() {
  return (
    <>
      <DocsH1>Support</DocsH1>
      <DocsLead>
        LumiPDF is open source. The best place for questions and bug reports is GitHub.
      </DocsLead>

      <DocsH2 id="channels">Channels</DocsH2>
      <DocsUl>
        <DocsLi>
          <a
            href="https://github.com/pulkitgxrg/lumipdf/issues"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-meadow hover:underline"
          >
            GitHub Issues
          </a>{" "}
          - bugs, regressions, and feature requests
        </DocsLi>
        <DocsLi>
          <a
            href="https://github.com/pulkitgxrg/lumipdf"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-meadow hover:underline"
          >
            Repository
          </a>{" "}
          - source, README, and license
        </DocsLi>
        <DocsLi>
          <a
            href="https://www.npmjs.com/package/lumipdf"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-meadow hover:underline"
          >
            npm package
          </a>{" "}
          - releases and install stats
        </DocsLi>
      </DocsUl>

      <DocsH2 id="report">Reporting a bug</DocsH2>
      <DocsP>Include as much of the following as you can:</DocsP>
      <DocsUl>
        <DocsLi>LumiPDF and pdfjs-dist versions</DocsLi>
        <DocsLi>React and bundler (Next.js, Vite, etc.)</DocsLi>
        <DocsLi>Minimal reproduction or playground steps</DocsLi>
        <DocsLi>Browser and OS</DocsLi>
      </DocsUl>

      <DocsH2 id="security">Security</DocsH2>
      <DocsP>
        Prefer private disclosure for security-sensitive issues. Open a draft security
        advisory on GitHub when available, or contact the maintainer listed on the
        repository.
      </DocsP>
    </>
  );
}
