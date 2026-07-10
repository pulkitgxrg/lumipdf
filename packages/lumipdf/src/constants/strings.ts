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
