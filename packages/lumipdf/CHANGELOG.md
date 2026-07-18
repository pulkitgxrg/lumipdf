# Changelog

All notable changes to **lumipdf** are documented in this file.

## [1.1.0] - 2026-07-18

Major viewer UX release: Canva-style annotation editing, richer formatting controls, page navigation chrome, and toolbar polish.

### Annotations

- **Canva-style editing** — click to select (dashed box + corner handles), drag to move, drag handles to resize
- **Delete** selected annotations via the red × control, toolbar action, or `Delete` / `Backspace`
- **Double-click** free-text annotations to re-edit content
- **Escape** clears selection and exits the active tool
- New **`AnnotationStyleModal`** (format bar) for live style controls while drawing or after selecting
- Expanded formatting:
  - Highlight — color, opacity
  - Draw (ink) — color, thickness, dotted stroke
  - Shapes — color, thickness, dotted, filled, fill color/opacity
  - Text — color, size, font family, align, bold, italic, underline, background
- Style changes apply to **new** annotations and update the **currently selected** annotation
- Annotations remain **viewer overlays only** — download and print still use the original PDF without annotations
- Persist with `onAnnotationChange`, `serializeAnnotations`, and `parseAnnotations`

### Navigation & toolbar

- New **`PageNavigator`** component for compact page jumping
- Toolbar layout and density improvements
- Fit modes: page fit, page width, actual size
- Spread mode controls
- Pinch-zoom reliability improvements
- Correct left/right page rotation rendering

### Viewer UX

- Keyboard shortcuts for annotation delete / tool exit
- Focus-trap support for annotation style dialog
- Substantial stylesheet updates for selection handles, format bar, and responsive toolbar

### Docs & site (monorepo)

- Public docs site: installation, quick start, sources, annotations, theming, migration, API reference
- Interactive playground for trying the viewer
- Revamped marketing landing page

### Upgrade notes

```bash
npm install lumipdf@1.1.0
```

No breaking API changes from `1.0.1`. Existing `DocumentViewer` props, ref methods, and hooks continue to work. New UI ships automatically with the default toolbar.

```tsx
import { DocumentViewer } from "lumipdf";
import "lumipdf/styles";

<DocumentViewer
  source={{ kind: "url", url: "/contract.pdf" }}
  onAnnotationChange={(annotations) => {
    localStorage.setItem("annotations", JSON.stringify(annotations));
  }}
/>
```

---

## [1.0.1] - 2026-07-17

Initial public release of LumiPDF:

- React PDF viewer on PDF.js with virtualized rendering
- Text selection, full-text search with match highlighting
- Thumbnails, outline, attachments sidebar
- Zoom, fit modes, rotation, download, print
- Password-protected documents
- Annotation tools: highlight, freehand, rectangle, ellipse, line, arrow, free text
- Themes: light, dark, auto, sepia
- Hooks: `useDocViewer`, `useDocument`, `useZoom`, `useNavigation`, `useSearch`, `useAnnotations`, and more
- TypeScript-first API with `PdfViewerProps` / `PdfViewerRef`
- Migration helper path from `@react-pdf-viewer`
