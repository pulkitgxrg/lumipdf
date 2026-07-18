import type { Metadata } from "next";
import { DocsShell } from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s · LumiPDF Docs",
  },
  description:
    "Install and use LumiPDF - a high-performance React PDF viewer built on PDF.js.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
