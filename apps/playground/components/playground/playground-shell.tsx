"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DocumentViewer } from "lumipdf";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  FileText,
  Link2,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PdfDocument {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string;
}

const samplePdfs: PdfDocument[] = [
  {
    id: "1",
    name: "TraceMonkey PLDI Paper",
    url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
    category: "Research",
    description: "Classic multi-page research paper",
  },
  {
    id: "2",
    name: "Sample PDF",
    url: "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf",
    category: "Technical",
    description: "Simple technical sample document",
  },
];

export function PlaygroundShell() {
  const [selectedPdf, setSelectedPdf] = useState<PdfDocument>(samplePdfs[0]);
  const [customPdfs, setCustomPdfs] = useState<PdfDocument[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [docMenuOpen, setDocMenuOpen] = useState(false);
  const docMenuRef = useRef<HTMLDivElement>(null);

  const allPdfs = [...samplePdfs, ...customPdfs];

  const viewerSource = useMemo(
    () => ({ kind: "url" as const, url: selectedPdf.url }),
    [selectedPdf.url],
  );

  useEffect(() => {
    if (!docMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (docMenuRef.current && !docMenuRef.current.contains(e.target as Node)) {
        setDocMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDocMenuOpen(false);
        setShowUrlForm(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [docMenuOpen]);

  const selectPdf = useCallback((pdf: PdfDocument) => {
    setSelectedPdf(pdf);
    setDocMenuOpen(false);
    setShowUrlForm(false);
  }, []);

  const handleAddUrl = useCallback(() => {
    setUrlError("");
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Please enter a URL.");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setUrlError("Invalid URL — must start with https://");
      return;
    }
    if (!trimmed.toLowerCase().endsWith(".pdf") && !trimmed.includes(".pdf?")) {
      setUrlError("URL does not appear to point to a PDF file.");
      return;
    }

    const filename = (() => {
      try {
        const path = new URL(trimmed).pathname;
        const last = path.split("/").filter(Boolean).pop() ?? "document.pdf";
        return decodeURIComponent(last).replace(/\.pdf$/i, "");
      } catch {
        return "Custom PDF";
      }
    })();

    const newDoc: PdfDocument = {
      id: `custom-${Date.now()}`,
      name: filename,
      url: trimmed,
      category: "Custom",
      description: "Loaded from URL",
    };

    setCustomPdfs((prev) => [...prev, newDoc]);
    setSelectedPdf(newDoc);
    setUrlInput("");
    setShowUrlForm(false);
    setDocMenuOpen(false);
  }, [urlInput]);

  const handleRemoveCustom = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCustomPdfs((prev) => prev.filter((p) => p.id !== id));
      if (selectedPdf.id === id) setSelectedPdf(samplePdfs[0]);
    },
    [selectedPdf.id],
  );

  return (
    <div className="flex h-svh w-screen flex-col overflow-hidden bg-[#f3f4f1] text-ink">
      <header className="z-40 shrink-0 border-b border-black/[0.08] bg-white">
        <div className="relative flex h-14 items-center justify-between gap-4 px-4 sm:px-5">
          <div className="flex shrink-0 items-center gap-3 sm:gap-3.5">
            <Link
              href="/"
              className="font-display shrink-0 text-[1.4rem] leading-none tracking-[-0.03em] text-ink transition-opacity hover:opacity-75"
            >
              lumipdf
            </Link>
            <span className="hidden h-4 w-px bg-black/10 sm:block" aria-hidden />
            <span className="hidden rounded-md bg-meadow-light px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-meadow sm:inline">
              Playground
            </span>
          </div>

          <div
            className="absolute left-1/2 top-1/2 z-10 w-[min(20rem,calc(100vw-12rem))] -translate-x-1/2 -translate-y-1/2"
            ref={docMenuRef}
          >
            <button
              type="button"
              onClick={() => {
                setDocMenuOpen((v) => !v);
                setShowUrlForm(false);
              }}
              className={cn(
                "group flex h-8 w-full items-center gap-2 rounded-lg border bg-white px-2 py-1 text-left shadow-sm transition-all sm:px-2.5",
                docMenuOpen
                  ? "border-meadow/30 ring-2 ring-meadow/15"
                  : "border-black/[0.08] hover:border-black/[0.14] hover:bg-[#fafaf8]",
              )}
              aria-expanded={docMenuOpen}
              aria-haspopup="listbox"
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-meadow-light text-meadow">
                {selectedPdf.category === "Custom" ? (
                  <Link2 className="size-3" />
                ) : (
                  <FileText className="size-3" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-ink">
                {selectedPdf.name}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 text-ink-muted transition-transform",
                  docMenuOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {docMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-float sm:left-0 sm:right-auto sm:w-[min(22rem,calc(100vw-1.5rem))]"
                  role="listbox"
                >
                  <div className="border-b border-black/[0.06] px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Switch document
                    </p>
                  </div>
                  <ScrollArea className="max-h-[min(50vh,280px)]">
                    <div className="space-y-0.5 p-1.5">
                      {allPdfs.map((pdf) => {
                        const active = selectedPdf.id === pdf.id;
                        const isCustom = pdf.category === "Custom";
                        return (
                          <div
                            key={pdf.id}
                            className={cn(
                              "group flex items-center rounded-lg",
                              active ? "bg-meadow-light" : "hover:bg-black/[0.03]",
                            )}
                          >
                            <button
                              type="button"
                              role="option"
                              aria-selected={active}
                              onClick={() => selectPdf(pdf)}
                              className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left"
                            >
                              <span
                                className={cn(
                                  "grid size-8 shrink-0 place-items-center rounded-lg",
                                  active
                                    ? "bg-white text-meadow shadow-sm"
                                    : "bg-black/[0.04] text-ink-muted",
                                )}
                              >
                                {isCustom ? (
                                  <Link2 className="size-3.5" />
                                ) : (
                                  <FileText className="size-3.5" />
                                )}
                              </span>
                              <span
                                className={cn(
                                  "min-w-0 truncate text-[13px]",
                                  active
                                    ? "font-semibold text-ink"
                                    : "font-medium text-ink-soft",
                                )}
                              >
                                {pdf.name}
                              </span>
                            </button>
                            {isCustom ? (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveCustom(pdf.id, e)}
                                className="mr-1.5 rounded-md p-1.5 text-ink-muted opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                title="Remove"
                                aria-label={`Remove ${pdf.name}`}
                              >
                                <X className="size-3.5" />
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="border-t border-black/[0.06] p-1.5">
                    {showUrlForm ? (
                      <div className="space-y-2 rounded-lg bg-[#f8faf6] p-2.5">
                        <Input
                          type="url"
                          value={urlInput}
                          onChange={(e) => {
                            setUrlInput(e.target.value);
                            setUrlError("");
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                          placeholder="https://example.com/file.pdf"
                          autoFocus
                          className={cn(
                            "h-9 bg-white",
                            urlError && "border-red-400 focus-visible:ring-red-300",
                          )}
                        />
                        {urlError ? (
                          <p className="text-[11px] text-red-500">{urlError}</p>
                        ) : (
                          <p className="text-[11px] text-ink-muted">
                            Public HTTPS URLs ending in .pdf
                          </p>
                        )}
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-8 flex-1"
                            onClick={handleAddUrl}
                          >
                            <ArrowRight className="size-3" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8"
                            onClick={() => {
                              setShowUrlForm(false);
                              setUrlError("");
                              setUrlInput("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowUrlForm(true)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-meadow transition-colors hover:bg-meadow-light"
                      >
                        <Plus className="size-3.5" />
                        Open PDF from URL
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <nav className="hidden items-center gap-1 md:flex" aria-label="Site">
              <Link
                href="/docs"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Docs
              </Link>
            </nav>

            <Button size="sm" className="hidden h-8 px-3.5 sm:inline-flex" asChild>
              <Link href="/docs/installation">Install</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#eceee8]">
        <DocumentViewer
          key={selectedPdf.url}
          source={viewerSource}
          theme="light"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
