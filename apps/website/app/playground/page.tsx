import type { Metadata } from "next";
import { PlaygroundShell } from "@/components/playground/playground-shell";

export const metadata: Metadata = {
  title: "Playground - LumiPDF",
  description:
    "Interactive LumiPDF playground. Open sample documents or load a PDF from URL and explore the high-performance viewer.",
};

export default function PlaygroundPage() {
  return <PlaygroundShell />;
}
