export type DocsNavItem = {
  title: string;
  href: string;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

export const DOCS_NAV: DocsNavGroup[] = [
  {
    title: "Getting started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Document sources", href: "/docs/sources" },
      { title: "Annotations", href: "/docs/annotations" },
      { title: "Theming", href: "/docs/theming" },
      { title: "Migration", href: "/docs/migration" },
    ],
  },
  {
    title: "API reference",
    items: [
      { title: "DocumentViewer", href: "/docs/api/document-viewer" },
      { title: "Types", href: "/docs/api/types" },
    ],
  },
  {
    title: "Help",
    items: [{ title: "Support", href: "/docs/support" }],
  },
];

export function getDocsPageMeta(pathname: string): {
  title: string;
  description: string;
  prev: DocsNavItem | null;
  next: DocsNavItem | null;
} {
  const flat = DOCS_NAV.flatMap((g) => g.items);
  const index = flat.findIndex((item) => item.href === pathname);
  const current = flat[index];

  const meta: Record<string, string> = {
    "/docs": "Overview of LumiPDF - a modern React PDF viewer.",
    "/docs/installation": "Install LumiPDF and its peer dependencies in your React app.",
    "/docs/quick-start": "Render your first PDF with DocumentViewer in a few lines of code.",
    "/docs/sources": "Load PDFs from URL, File, ArrayBuffer, or file handles.",
    "/docs/annotations": "Highlight, draw, and persist annotations on documents.",
    "/docs/theming": "Light, dark, auto, and sepia themes for the viewer.",
    "/docs/migration": "Migrate from @react-pdf-viewer to LumiPDF.",
    "/docs/api/document-viewer": "Props, ref methods, and callbacks for DocumentViewer.",
    "/docs/api/types": "Core TypeScript types exported by lumipdf.",
    "/docs/support": "Get help, report issues, and contribute.",
  };

  return {
    title: current?.title ?? "Docs",
    description: meta[pathname] ?? "LumiPDF documentation.",
    prev: index > 0 ? flat[index - 1] : null,
    next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null,
  };
}
