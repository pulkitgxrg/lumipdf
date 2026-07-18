"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DocumentViewer } from "lumipdf";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileText,
  Link2,
  PanelLeft,
  PanelLeftClose,
  Plus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [panelOpen, setPanelOpen] = useState(false);
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
      if (e.key === "Escape") setDocMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [docMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panelOpen) setPanelOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  const selectPdf = useCallback((pdf: PdfDocument) => {
    setSelectedPdf(pdf);
    setPanelOpen(false);
    setDocMenuOpen(false);
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
      setUrlError("Invalid URL - must start with https://");
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
    setPanelOpen(false);
    setDocMenuOpen(false);
  }, [urlInput]);

  const handleRemoveCustom = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCustomPdfs((prev) => prev.filter((p) => p.id !== id));
      if (selectedPdf.id === id) {
        setSelectedPdf(samplePdfs[0]);
      }
    },
    [selectedPdf.id],
  );

  return (
    <div className="relative isolate flex h-svh w-screen flex-col overflow-hidden text-ink">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/background.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-white/55" />
      </div>

      <header className="relative z-40 shrink-0 border-b border-black/[0.08] bg-white/85 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="font-display shrink-0 text-[1.4rem] leading-none tracking-[-0.03em] text-ink transition-opacity hover:opacity-75"
            >
              lumipdf
            </Link>
            <span className="hidden h-4 w-px bg-black/10 sm:block" aria-hidden />
            <span className="hidden rounded-md bg-meadow-light px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-meadow sm:inline">
              Playground
            </span>
          </div>

          <div className="relative mx-auto min-w-0 max-w-md flex-1 sm:mx-0 sm:ml-2" ref={docMenuRef}>
            <button
              type="button"
              onClick={() => {
                setDocMenuOpen((v) => !v);
                setShowUrlForm(false);
              }}
              className={cn(
                "group flex w-full max-w-full items-center gap-2 rounded-xl border bg-white/90 px-2.5 py-1.5 text-left shadow-sm transition-all sm:px-3",
                docMenuOpen
                  ? "border-meadow/30 ring-2 ring-meadow/15"
                  : "border-black/[0.08] hover:border-black/[0.14] hover:bg-white",
              )}
              aria-expanded={docMenuOpen}
              aria-haspopup="listbox"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-meadow-light text-meadow">
                {selectedPdf.category === "Custom" ? (
                  <Link2 className="size-3.5" />
                ) : (
                  <FileText className="size-3.5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold tracking-tight text-ink">
                  {selectedPdf.name}
                </span>
                <span className="hidden truncate text-[10px] font-medium text-ink-muted sm:block">
                  {selectedPdf.category}
                  {selectedPdf.description ? ` · ${selectedPdf.description}` : ""}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-ink-muted transition-transform",
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
                              <span className="min-w-0">
                                <span
                                  className={cn(
                                    "block truncate text-[13px]",
                                    active
                                      ? "font-semibold text-ink"
                                      : "font-medium text-ink-soft",
                                  )}
                                >
                                  {pdf.name}
                                </span>
                                <span className="block truncate text-[11px] text-ink-muted">
                                  {pdf.category}
                                  {pdf.description ? ` · ${pdf.description}` : ""}
                                </span>
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
                    <button
                      type="button"
                      onClick={() => {
                        setDocMenuOpen(false);
                        setShowUrlForm(true);
                        setPanelOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-meadow transition-colors hover:bg-meadow-light"
                    >
                      <Plus className="size-3.5" />
                      Open PDF from URL
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-8 gap-1.5 px-2.5 text-ink-soft sm:inline-flex"
              onClick={() => {
                setShowUrlForm(true);
                setPanelOpen(true);
                setDocMenuOpen(false);
              }}
            >
              <Link2 className="size-3.5" />
              <span className="hidden lg:inline">Open URL</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setPanelOpen((v) => !v);
                setDocMenuOpen(false);
              }}
              aria-label={panelOpen ? "Close documents panel" : "Open documents panel"}
              aria-expanded={panelOpen}
            >
              {panelOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeft className="size-4" />
              )}
            </Button>

            <span className="mx-0.5 hidden h-5 w-px bg-black/10 md:block" aria-hidden />

            <nav className="hidden items-center gap-0.5 md:flex" aria-label="Site">
              <Link
                href="/docs"
                className="rounded-full px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Docs
              </Link>
              <a
                href="https://github.com/pulkitgxrg/lumipdf"
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                GitHub
              </a>
            </nav>

            <Button size="sm" className="hidden h-8 sm:inline-flex" asChild>
              <Link href="/docs/installation">Install</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {panelOpen ? (
            <>
              <motion.button
                type="button"
                key="panel-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 z-20 bg-ink/25 backdrop-blur-[2px] md:bg-ink/10"
                aria-label="Close documents panel"
                onClick={() => setPanelOpen(false)}
              />
              <motion.aside
                key="panel"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -16, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                className="absolute inset-y-0 left-0 z-30 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col border-r border-black/[0.08] bg-white/95 shadow-float backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-ink">Documents</p>
                    <p className="text-[11px] text-ink-muted">
                      {allPdfs.length} available
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.04] hover:text-ink"
                    aria-label="Collapse panel"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-3 p-3">
                  <AnimatePresence mode="wait">
                    {showUrlForm ? (
                      <motion.div
                        key="url-form"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-soft"
                      >
                        <div className="flex items-center gap-1.5 border-b border-black/[0.06] bg-[#f8faf6] px-3 py-2 text-xs font-semibold text-ink-soft">
                          <Link2 className="size-3.5" />
                          Open from URL
                        </div>
                        <div className="space-y-2.5 p-3">
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
                              "h-10",
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
                            <Button size="sm" className="flex-1" onClick={handleAddUrl}>
                              <ArrowRight className="size-3" />
                              Open
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
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
                      </motion.div>
                    ) : (
                      <motion.button
                        key="url-btn"
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowUrlForm(true)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-meadow/40 bg-meadow-light/50 px-3 py-2.5 text-xs font-semibold text-meadow transition-all hover:border-meadow/55 hover:bg-meadow-light"
                      >
                        <Plus className="size-3.5" />
                        Open PDF from URL
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <ScrollArea className="min-h-0 flex-1 px-2">
                  <div className="space-y-4 px-1.5 pb-4">
                    <section>
                      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                        Samples
                      </p>
                      <div className="space-y-1">
                        {samplePdfs.map((pdf) => (
                          <DocCard
                            key={pdf.id}
                            pdf={pdf}
                            active={selectedPdf.id === pdf.id}
                            onSelect={() => selectPdf(pdf)}
                          />
                        ))}
                      </div>
                    </section>

                    {customPdfs.length > 0 ? (
                      <section>
                        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                          Your URLs
                        </p>
                        <div className="space-y-1">
                          {customPdfs.map((pdf) => (
                            <DocCard
                              key={pdf.id}
                              pdf={pdf}
                              active={selectedPdf.id === pdf.id}
                              onSelect={() => selectPdf(pdf)}
                              onRemove={(e) => handleRemoveCustom(pdf.id, e)}
                            />
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                </ScrollArea>

                <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-3">
                  <Link
                    href="/docs"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted transition-colors hover:text-ink"
                  >
                    <BookOpen className="size-3" />
                    Docs
                  </Link>
                  <a
                    href="https://github.com/pulkitgxrg/lumipdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted transition-colors hover:text-ink"
                  >
                    GitHub
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-white/35">
            <DocumentViewer
              key={selectedPdf.url}
              source={viewerSource}
              theme="light"
            />
          </div>

          {!panelOpen ? (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/95 px-3 py-2 text-xs font-semibold text-ink shadow-soft backdrop-blur-md transition-all hover:border-meadow/30 hover:shadow-card md:bottom-5 md:left-5"
            >
              <PanelLeft className="size-3.5 text-meadow" />
              Documents
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {allPdfs.length}
              </Badge>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DocCard({
  pdf,
  active,
  onSelect,
  onRemove,
}: {
  pdf: PdfDocument;
  active: boolean;
  onSelect: () => void;
  onRemove?: (e: React.MouseEvent) => void;
}) {
  const isCustom = pdf.category === "Custom";
  return (
    <div
      className={cn(
        "group flex items-stretch overflow-hidden rounded-xl border transition-all",
        active
          ? "border-meadow/25 bg-meadow-light shadow-sm"
          : "border-black/[0.05] bg-white/70 hover:border-black/[0.1] hover:bg-white",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2.5 text-left"
      >
        <span
          className={cn(
            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
            active ? "bg-white text-meadow shadow-sm" : "bg-black/[0.04] text-ink-muted",
          )}
        >
          {isCustom ? <Link2 className="size-3.5" /> : <FileText className="size-3.5" />}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-[13px]",
              active ? "font-semibold text-ink" : "font-medium text-ink-soft",
            )}
          >
            {pdf.name}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-[11px]",
              active ? "text-meadow" : "text-ink-muted",
            )}
          >
            {pdf.description ?? pdf.category}
          </span>
        </span>
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="px-2.5 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
