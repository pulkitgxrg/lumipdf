export const DEFAULT_STRINGS = {
  toolbar: {
    sidebarToggle: "Toggle sidebar",
    searchToggle: "Toggle search",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    rotateClockwise: "Rotate clockwise",
    rotateCounterClockwise: "Rotate counter-clockwise",
    download: "Download",
    print: "Print",
    fullscreen: "Fullscreen",
    properties: "Document properties",
    ocr: "Recognize text (OCR)",
  },

  navigation: {
    previousPage: "Previous page",
    nextPage: "Next page",
    pageInput: "Page number",
    of: "of",
  },

  search: {
    placeholder: "Search…",
    /** Template: `{0} of {1}` */
    resultsCount: "{0} of {1}",
    noResults: "No results",
    prevMatch: "Previous match",
    nextMatch: "Next match",
    close: "Close search",
  },

  states: {
    empty: "No document open",
    emptyDescription: "Click or drop a PDF here to open it.",
    loading: "Loading…",
    error: "Failed to load document",
    retry: "Retry",
    unsupported: "Unsupported format",
    /** Template: `Cannot open "{0}"` */
    unsupportedFormat: 'Cannot open "{0}"',
    unsupportedDescription: "This file format is not supported.",
    openPrompt: "Open a document",
  },

  dialog: {
    passwordTitle: "Password Required",
    /** Template: `"{0}" is password-protected.` */
    passwordDescription: '"{0}" is password-protected.',
    passwordInput: "Password",
    passwordEmpty: "Please enter a password.",
    passwordIncorrect: "Incorrect password. Please try again.",
    passwordSubmit: "Open",
    cancel: "Cancel",
  },

  properties: {
    properties: "Document Properties",
    close: "Close",
    fileName: "File Name",
    format: "Format",
    fileSize: "File Size",
    mimeType: "MIME Type",
    pages: "Pages",
    title: "Title",
    author: "Author",
    subject: "Subject",
    creator: "Creator",
    producer: "Producer",
    creationDate: "Created",
    modificationDate: "Modified",
  },

  ocr: {
    title: "Recognize Text (OCR)",
    description:
      "Extract text from scanned pages and images. Recognition runs in your browser; language data is downloaded on first use.",
    close: "Close",
    pages: "Pages",
    currentPage: "Current page",
    allPages: "All pages",
    customPages: "Custom",
    regionPages: "Select area",
    regionPagesHint: "Drag on a page",
    regionStart: "Select area on page",
    regionHint: "Drag over the area you want to recognize. Press Esc to cancel.",
    regionRecognizing: "Recognizing selected area on page {0}…",
    regionSummary: "Selected area · page {0} · {1}% confidence",
    regionSummaryEmpty: "Selected area · page {0}",
    regionNoText: "No text was detected in the selected area.",
    regionAgain: "Select another area",
    currentPageHint: "Page {0}",
    allPagesHint: "{0} pages",
    customPlaceholder: "e.g. 1-3, 5",
    invalidRange: "Enter pages between 1 and {0}, like 1-3, 5.",
    language: "Language",
    start: "Recognize text",
    cancel: "Cancel",
    rendering: "Preparing page {0}…",
    loading: "Loading OCR engine…",
    recognizing: "Recognizing page {0} ({1} of {2})…",
    cancelled: "Recognition was cancelled.",
    failed: "Text recognition failed.",
    retry: "Try again",
    resultLabel: "Extracted text",
    resultSummary: "{0} pages · {1}% average confidence",
    resultSummarySingle: "{0} page · {1}% average confidence",
    resultSummaryEmpty: "{0} pages",
    resultSummaryEmptySingle: "{0} page",
    noText: "No text was detected on the selected pages.",
    nativeTextNotice:
      "Some pages already contain selectable text, so their OCR text is not added to the page overlay or search.",
    copy: "Copy text",
    copied: "Copied",
    download: "Download .txt",
    newScan: "Recognize more",
    clear: "Clear results",
  },
} as const;

export type ViewerStrings = typeof DEFAULT_STRINGS;

export function useStrings(): ViewerStrings {
  return DEFAULT_STRINGS;
}

export function formatString(
  template: string,
  ...args: (string | number)[]
): string {
  return template.replace(/\{(\d+)\}/g, (_, i) =>
    String(args[Number(i)] ?? ""),
  );
}
