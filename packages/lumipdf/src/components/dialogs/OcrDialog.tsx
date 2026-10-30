import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { DocumentModel, OcrProgress } from "../../core/types";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useViewerStore } from "../../hooks/useDocumentViewer";
import { useStrings, formatString } from "../../constants/strings";
import {
  OCR_LANGUAGES,
  formatOcrText,
  parsePageRange,
  sortOcrResults,
} from "../../core/ocr";

interface OcrDialogProps {
  document: DocumentModel;
  onClose: () => void;
}

type PageScope = "current" | "all" | "custom" | "area";

export function OcrDialog({ document: doc, onClose }: OcrDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useFocusTrap(dialogRef, true, onClose);
  const strings = useStrings().ocr;
  const fieldId = useId();

  const currentPage = useViewerStore((s) => s.currentPage);
  const status = useViewerStore((s) => s.ocrStatus);
  const progress = useViewerStore((s) => s.ocrProgress);
  const error = useViewerStore((s) => s.ocrError);
  const language = useViewerStore((s) => s.ocrLanguage);
  const results = useViewerStore((s) => s.ocrResults);
  const runOcr = useViewerStore((s) => s.runOcr);
  const cancelOcr = useViewerStore((s) => s.cancelOcr);
  const clearOcr = useViewerStore((s) => s.clearOcr);
  const setOcrLanguage = useViewerStore((s) => s.setOcrLanguage);
  const regionResult = useViewerStore((s) => s.ocrRegionResult);
  const lastRun = useViewerStore((s) => s.ocrLastRun);
  const setOcrRegionMode = useViewerStore((s) => s.setOcrRegionMode);

  const sortedResults = useMemo(() => sortOcrResults(results), [results]);
  const showingRegion = lastRun === "region" && regionResult !== null;
  const hasAnyResult = showingRegion || sortedResults.length > 0;
  const [scope, setScope] = useState<PageScope>(
    lastRun === "region" ? "area" : "current",
  );
  const [customRange, setCustomRange] = useState("");
  const [showForm, setShowForm] = useState(
    () => status !== "running" && !hasAnyResult,
  );
  const [copied, setCopied] = useState(false);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const customPages =
    scope === "custom" ? parsePageRange(customRange, doc.pageCount) : null;
  const rangeInvalid =
    scope === "custom" && customRange.trim() !== "" && customPages === null;
  const canStart = scope !== "custom" || customPages !== null;

  const languageOptions = useMemo(
    () =>
      OCR_LANGUAGES.some((option) => option.code === language)
        ? OCR_LANGUAGES
        : [...OCR_LANGUAGES, { code: language, label: language }],
    [language],
  );

  const text = useMemo(
    () =>
      showingRegion ? regionResult.text : formatOcrText(sortedResults),
    [showingRegion, regionResult, sortedResults],
  );
  const hasText = text.length > 0;
  const hasNativeText =
    !showingRegion && sortedResults.some((result) => result.hasNativeText);
  const averageConfidence = useMemo(() => {
    if (showingRegion) return Math.round(regionResult.confidence);
    const scored = sortedResults.filter((result) => result.lines.length > 0);
    if (scored.length === 0) return 0;
    return Math.round(
      scored.reduce((sum, result) => sum + result.confidence, 0) /
        scored.length,
    );
  }, [showingRegion, regionResult, sortedResults]);

  const running = status === "running";
  const view = running
    ? "progress"
    : showForm || !hasAnyResult
      ? "form"
      : "results";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(window.document.activeElement)) {
      dialog.focus();
    }
  }, [view]);

  const handleStart = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!canStart) return;
      if (scope === "area") {
        setOcrRegionMode(true);
        return;
      }
      const pages =
        scope === "current"
          ? [currentPage]
          : scope === "custom"
            ? (customPages ?? [])
            : undefined;
      setShowForm(false);
      setCopied(false);
      runOcr(pages ? { pages, language } : { language }).catch(() => {});
    },
    [canStart, scope, currentPage, customPages, language, runOcr, setOcrRegionMode],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [text]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = showingRegion
      ? `${stripExtension(doc.meta.name)}-page-${regionResult.pageIndex + 1}-area-ocr.txt`
      : `${stripExtension(doc.meta.name)}-ocr.txt`;
    anchor.rel = "noopener";
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, [text, doc.meta.name, showingRegion, regionResult]);

  const handleClear = useCallback(() => {
    clearOcr();
    setShowForm(true);
  }, [clearOcr]);

  return (
    <div
      className="dv-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={strings.title}
    >
      <div className="dv-dialog dv-ocr-dialog" ref={dialogRef} tabIndex={-1}>
        <div className="dv-dialog-header">
          <h2 className="dv-dialog-title">{strings.title}</h2>
          <Button variant="icon" onClick={onClose} aria-label={strings.close}>
            <Icon name="close" />
          </Button>
        </div>

        {view === "form" && (
          <form className="dv-ocr-form" onSubmit={handleStart}>
            <p className="dv-dialog-description">{strings.description}</p>

            <fieldset className="dv-ocr-fieldset">
              <legend className="dv-ocr-label">{strings.pages}</legend>
              <div className="dv-ocr-scope">
                <ScopeOption
                  name={`${fieldId}-scope`}
                  value="current"
                  checked={scope === "current"}
                  onSelect={setScope}
                  label={strings.currentPage}
                  hint={formatString(strings.currentPageHint, currentPage + 1)}
                />
                <ScopeOption
                  name={`${fieldId}-scope`}
                  value="all"
                  checked={scope === "all"}
                  onSelect={setScope}
                  label={strings.allPages}
                  hint={formatString(strings.allPagesHint, doc.pageCount)}
                />
                <ScopeOption
                  name={`${fieldId}-scope`}
                  value="custom"
                  checked={scope === "custom"}
                  onSelect={setScope}
                  label={strings.customPages}
                  hint={strings.customPlaceholder}
                />
                <ScopeOption
                  name={`${fieldId}-scope`}
                  value="area"
                  checked={scope === "area"}
                  onSelect={setScope}
                  label={strings.regionPages}
                  hint={strings.regionPagesHint}
                />
              </div>
              {scope === "custom" && (
                <input
                  type="text"
                  className="dv-search-input dv-ocr-input"
                  value={customRange}
                  onChange={(e) => setCustomRange(e.target.value)}
                  placeholder={strings.customPlaceholder}
                  aria-label={strings.customPages}
                  aria-invalid={rangeInvalid}
                  autoFocus
                />
              )}
              {rangeInvalid && (
                <p className="dv-dialog-error" role="alert">
                  {formatString(strings.invalidRange, doc.pageCount)}
                </p>
              )}
            </fieldset>

            <label className="dv-ocr-field" htmlFor={`${fieldId}-language`}>
              <span className="dv-ocr-label">{strings.language}</span>
              <select
                id={`${fieldId}-language`}
                className="dv-ocr-select"
                value={language}
                onChange={(e) => setOcrLanguage(e.target.value)}
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {status === "error" && error && (
              <p className="dv-dialog-error" role="alert">
                {error}
              </p>
            )}

            <div className="dv-dialog-actions">
              {hasAnyResult && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  {strings.cancel}
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={!canStart}>
                {scope === "area"
                  ? strings.regionStart
                  : status === "error"
                    ? strings.retry
                    : strings.start}
              </Button>
            </div>
          </form>
        )}

        {view === "progress" && progress && (
          <div className="dv-ocr-progress-view">
            <OcrProgressBar progress={progress} region={lastRun === "region"} />
            <div className="dv-dialog-actions">
              <Button type="button" variant="ghost" onClick={cancelOcr}>
                {strings.cancel}
              </Button>
            </div>
          </div>
        )}

        {view === "results" && (
          <div className="dv-ocr-results">
            <div className="dv-ocr-results-header">
              <span className="dv-ocr-label">{strings.resultLabel}</span>
              <span className="dv-ocr-summary">
                {showingRegion
                  ? formatString(
                      hasText
                        ? strings.regionSummary
                        : strings.regionSummaryEmpty,
                      regionResult.pageIndex + 1,
                      averageConfidence,
                    )
                  : formatString(
                      hasText
                        ? sortedResults.length === 1
                          ? strings.resultSummarySingle
                          : strings.resultSummary
                        : sortedResults.length === 1
                          ? strings.resultSummaryEmptySingle
                          : strings.resultSummaryEmpty,
                      sortedResults.length,
                      averageConfidence,
                    )}
              </span>
            </div>

            {status === "cancelled" && (
              <p className="dv-dialog-description">{strings.cancelled}</p>
            )}
            {status === "error" && (
              <p className="dv-dialog-error" role="alert">
                {error ?? strings.failed}
              </p>
            )}

            {hasText ? (
              <textarea
                ref={textareaRef}
                className="dv-ocr-text"
                value={text}
                readOnly
                spellCheck={false}
                aria-label={strings.resultLabel}
              />
            ) : (
              <p className="dv-ocr-empty">
                {showingRegion ? strings.regionNoText : strings.noText}
              </p>
            )}

            {hasNativeText && (
              <p className="dv-ocr-notice">{strings.nativeTextNotice}</p>
            )}

            <div className="dv-dialog-actions dv-ocr-actions">
              {showingRegion ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(true)}
                >
                  {strings.newScan}
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={handleClear}>
                  {strings.clear}
                </Button>
              )}
              <span className="dv-ocr-actions-spacer" />
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  showingRegion ? setOcrRegionMode(true) : setShowForm(true)
                }
              >
                {showingRegion ? strings.regionAgain : strings.newScan}
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
                disabled={!hasText}
              >
                {strings.download}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCopy}
                disabled={!hasText}
                aria-live="polite"
              >
                {copied ? strings.copied : strings.copy}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ScopeOptionProps {
  name: string;
  value: PageScope;
  checked: boolean;
  onSelect: (value: PageScope) => void;
  label: string;
  hint: string;
}

function ScopeOption({
  name,
  value,
  checked,
  onSelect,
  label,
  hint,
}: ScopeOptionProps) {
  return (
    <label className="dv-ocr-scope-option" data-checked={checked}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
      />
      <span className="dv-ocr-scope-label">{label}</span>
      <span className="dv-ocr-scope-hint">{hint}</span>
    </label>
  );
}

function OcrProgressBar({
  progress,
  region,
}: {
  progress: OcrProgress;
  region: boolean;
}) {
  const strings = useStrings().ocr;
  const fraction =
    progress.totalPages > 0
      ? (progress.completedPages + progress.pageProgress) / progress.totalPages
      : 0;
  const percent = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  const label =
    progress.stage === "rendering"
      ? formatString(strings.rendering, progress.pageIndex + 1)
      : progress.stage === "loading"
        ? strings.loading
        : region
          ? formatString(strings.regionRecognizing, progress.pageIndex + 1)
          : formatString(
            strings.recognizing,
            progress.pageIndex + 1,
            Math.min(progress.completedPages + 1, progress.totalPages),
            progress.totalPages,
          );

  return (
    <div className="dv-ocr-progress">
      <div className="dv-ocr-progress-label" aria-live="polite">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div
        className="dv-ocr-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div
          className="dv-ocr-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function stripExtension(name: string): string {
  return name.replace(/\.[^./\\]+$/, "") || "document";
}
