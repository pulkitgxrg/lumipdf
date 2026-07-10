"use client";

import { DocumentViewer, type PdfViewerRef } from "lumipdf";
import { useRef, useState, useCallback } from "react";

interface PdfDocument {
  id: string;
  name: string;
  url: string;
  category: string;
}

const samplePdfs: PdfDocument[] = [
  {
    id: "1",
    name: "TraceMonkey PLDI Paper",
    url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
    category: "Research",
  },
  {
    id: "2",
    name: "CSS 2.1 Specification",
    url: "https://www.w3.org/TR/2006/REC-CSS21-20060630.pdf",
    category: "Technical",
  },
];

const CATEGORIES = ["All", "Research", "Technical", "Custom"];

function IconFile({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconLink({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconArrow({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function Home() {
  const viewerRef = useRef<PdfViewerRef>(null);
  const [selectedPdf, setSelectedPdf] = useState<PdfDocument>(samplePdfs[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [customPdfs, setCustomPdfs] = useState<PdfDocument[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const allPdfs = [...samplePdfs, ...customPdfs];

  const filteredPdfs =
    selectedCategory === "All"
      ? allPdfs
      : selectedCategory === "Custom"
        ? customPdfs
        : allPdfs.filter((pdf) => pdf.category === selectedCategory);

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
    };

    setCustomPdfs((prev) => [...prev, newDoc]);
    setSelectedPdf(newDoc);
    setSelectedCategory("All");
    setUrlInput("");
    setShowUrlInput(false);
  }, [urlInput]);

  const handleRemoveCustom = useCallback(
    (id: string) => {
      setCustomPdfs((prev) => prev.filter((p) => p.id !== id));
      if (selectedPdf.id === id) {
        setSelectedPdf(samplePdfs[0]);
      }
    },
    [selectedPdf.id],
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f0f2f5",
        overflow: "hidden",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "56px",
          background: "linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%)",
          boxShadow: "0 2px 12px rgba(15, 76, 117, 0.4)",
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconFile size={17} />
          </div>
          <span
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            LumiPDF
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              background: "rgba(255,255,255,0.12)",
              padding: "2px 8px",
              borderRadius: "20px",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
            }}
          >
            Playground
          </span>
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 500,
          }}
        >
          PDF Viewer Library Demo
        </div>
      </header>

      <div
        style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}
      >
        <aside
          style={{
            width: "260px",
            background: "#ffffff",
            borderRight: "1px solid #e2e6ea",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 14px 0" }}>
            {showUrlInput ? (
              <div
                style={{
                  border: "1px solid #c9d4de",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 10px",
                    borderBottom: "1px solid #e2e6ea",
                    background: "#fff",
                  }}
                >
                  <IconLink size={13} />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Open PDF from URL
                  </span>
                </div>
                <div style={{ padding: "10px" }}>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                    placeholder="https://example.com/file.pdf"
                    autoFocus
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 10px",
                      fontSize: "12px",
                      border: urlError
                        ? "1px solid #ef4444"
                        : "1px solid #d1d5db",
                      borderRadius: "6px",
                      outline: "none",
                      color: "#111827",
                      background: "#fff",
                      fontFamily: "inherit",
                    }}
                  />
                  {urlError && (
                    <p
                      style={{
                        margin: "5px 0 0",
                        fontSize: "11px",
                        color: "#ef4444",
                      }}
                    >
                      {urlError}
                    </p>
                  )}
                  <div
                    style={{ display: "flex", gap: "6px", marginTop: "8px" }}
                  >
                    <button
                      onClick={handleAddUrl}
                      style={{
                        flex: 1,
                        padding: "7px",
                        background: "#1b6ca8",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        fontFamily: "inherit",
                      }}
                    >
                      <IconArrow size={12} /> Open
                    </button>
                    <button
                      onClick={() => {
                        setShowUrlInput(false);
                        setUrlError("");
                        setUrlInput("");
                      }}
                      style={{
                        padding: "7px 10px",
                        background: "#f3f4f6",
                        color: "#374151",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowUrlInput(true)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "#f0f7ff",
                  color: "#1b6ca8",
                  border: "1px dashed #93c4e8",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
              >
                <IconPlus size={13} />
                Open PDF from URL
              </button>
            )}
          </div>

          <div style={{ padding: "14px 14px 6px" }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "0 0 8px",
              }}
            >
              Filter
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "4px 10px",
                    background:
                      selectedCategory === cat ? "#1b6ca8" : "#f3f4f6",
                    color: selectedCategory === cat ? "#fff" : "#4b5563",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{ height: "1px", background: "#e5e7eb", margin: "0 14px" }}
          />

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "6px 6px 8px",
              }}
            >
              Documents ({filteredPdfs.length})
            </p>

            {filteredPdfs.length === 0 && (
              <div
                style={{
                  padding: "24px 12px",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "12px",
                }}
              >
                No documents in this category.
              </div>
            )}

            {filteredPdfs.map((pdf) => {
              const isActive = selectedPdf.id === pdf.id;
              const isCustom = pdf.category === "Custom";
              return (
                <div
                  key={pdf.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0",
                    borderRadius: "7px",
                    background: isActive ? "#e8f1fb" : "transparent",
                    border: isActive
                      ? "1px solid #bdd6f0"
                      : "1px solid transparent",
                    marginBottom: "3px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setSelectedPdf(pdf)}
                    style={{
                      flex: 1,
                      padding: "9px 10px",
                      background: "transparent",
                      color: isActive ? "#0f4c75" : "#374151",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: isActive ? 600 : 500,
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        marginTop: "1px",
                        color: isActive ? "#1b6ca8" : "#9ca3af",
                      }}
                    >
                      {isCustom ? (
                        <IconLink size={13} />
                      ) : (
                        <IconFile size={13} />
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pdf.name}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: isActive ? "#4e87c0" : "#9ca3af",
                          marginTop: "1px",
                          fontWeight: 500,
                        }}
                      >
                        {pdf.category}
                      </div>
                    </div>
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => handleRemoveCustom(pdf.id)}
                      title="Remove"
                      style={{
                        padding: "0 10px 0 4px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        height: "100%",
                        fontFamily: "inherit",
                      }}
                    >
                      <IconX size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #e5e7eb",
              fontSize: "10px",
              color: "#c4cdd6",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>LumiPDF</span>
            <span>v0.0.1</span>
          </div>
        </aside>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              height: "46px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              background: "#fff",
              borderBottom: "1px solid #e2e6ea",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minWidth: 0,
              }}
            >
              <span style={{ color: "#9ca3af", flexShrink: 0 }}>
                {selectedPdf.category === "Custom" ? (
                  <IconLink size={14} />
                ) : (
                  <IconFile size={14} />
                )}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedPdf.name}
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#1b6ca8",
                background: "#e8f1fb",
                padding: "3px 9px",
                borderRadius: "20px",
                flexShrink: 0,
              }}
            >
              {selectedPdf.category}
            </span>
          </div>

          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <DocumentViewer
              key={selectedPdf.id}
              ref={viewerRef}
              source={{ kind: "url", url: selectedPdf.url }}
              theme="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
