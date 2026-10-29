# Changelog

All notable changes to **lumipdf** are documented in this file.

## [1.1.1] - 2026-10-29

Patch release fixing overlays on rotated pages.

### Fixes

- **Annotations rotate with the page** — highlights, ink, shapes, free text and sticky notes now stay attached to the content they were placed on when a page is rotated left or right, instead of staying fixed in their screen position
- Drawing, moving and resizing annotations works correctly on rotated pages, and resize handle cursors follow the rotation
- **Text selection** lines up with the page content on rotated pages
- **Search highlights** land on the matched text on rotated pages

### API

- `AnnotationLayer`, `TextLayer` and `SearchHighlightLayer` accept an optional `rotation` prop (`0 | 90 | 180 | 270`, default `0`). `DocumentViewer` passes it automatically; only needed if you render these layers yourself

### Upgrade notes

```bash
npm install lumipdf@1.1.1
```

No breaking API changes. Annotation coordinates are now always relative to the unrotated page. Annotations created at 0° (and any saved with `serializeAnnotations`) are unaffected; annotations drawn on a rotated page in `1.1.0` were saved relative to the rotated view and may appear shifted.

---

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
