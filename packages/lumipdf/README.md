# LumiPDF

React PDF viewer built on PDF.js. Virtualized rendering, full-text search, thumbnails & outline, zoom/rotation, download & print, themes, and **Canva-style editable annotations**.

## Install

```bash
npm install lumipdf
```

Peer dependencies: `react`, `react-dom`, and `pdfjs-dist`.

```tsx
import { DocumentViewer } from "lumipdf";
import "lumipdf/styles";

export function App() {
  return (
    <div style={{ height: "100vh" }}>
      <DocumentViewer source={{ kind: "url", url: "/sample.pdf" }} theme="auto" />
    </div>
  );
}
```

## What's new in 1.1

- **Canva-style annotations** — select, move, resize, delete; double-click text to re-edit
- **Annotation format bar** — colors, opacity, thickness, fill, fonts, alignment, and more
- **Page navigator** — compact page jumping in the viewer chrome
- Toolbar, pinch-zoom, and rotation polish

See [CHANGELOG.md](./CHANGELOG.md) for the full release notes.

## Features

| Area | Capabilities |
|------|----------------|
| Viewer | Virtualized pages, text layer, pinch zoom, fit page/width/actual size |
| Navigation | Page navigator, thumbnails, outline, keyboard shortcuts |
| Search | Full-text search with match highlighting and next/prev |
| Annotations | Highlight, ink, rectangle, ellipse, line, arrow, free text |
| Theming | `light`, `dark`, `auto`, `sepia` |
| Sources | URL, `File`, `ArrayBuffer`, file system handles |
| API | `DocumentViewer` props/ref, hooks, Zustand store, TypeScript types |

## Annotations

Toolbar tools: highlight, freehand draw, rectangle, ellipse, line, arrow, and free text. Annotations are **viewer overlays only** — download and print always use the original PDF without annotations.

### Editing (Canva-style)

- Click an annotation to select it (dashed box + corner handles)
- Drag to move; drag corner handles to resize
- Delete with the red ×, **Delete/Backspace**, or the toolbar action
- Double-click text to re-edit content
- Escape clears selection and exits the active tool

### Formatting

Use the annotation format bar for:

- **Highlight** — color, opacity
- **Draw** — color, thickness, dotted stroke
- **Shapes** — color, thickness, dotted, filled
- **Text** — color, size, font family, align, bold, italic, underline, background

Style changes apply to new annotations and update the currently selected annotation.

Persist annotations with callback data:

```tsx
import { DocumentViewer, serializeAnnotations, parseAnnotations } from "lumipdf";

<DocumentViewer
  source={{ kind: "url", url: "/contract.pdf" }}
  onAnnotationChange={(annotations) => {
    localStorage.setItem("contract-annotations", JSON.stringify(serializeAnnotations(annotations)));
  }}
/>
```

Use `serializeAnnotations` and `parseAnnotations` for validated stored annotation payloads.

## Hooks

Compose your own chrome if you do not want the default toolbar:

- `useDocViewer` / `useViewerStore` - full store access
- `useDocument`, `useNavigation`, `useZoom`, `useSearch`, `useAnnotations`
- `useFileInput`, `useKeyboardShortcuts`, `useVirtualizer`

## Notes

- PDF.js worker loads from jsDelivr by default. Set `pdfjsLib.GlobalWorkerOptions.workerSrc` before render if you need self-hosted worker assets.
- Remote PDFs need CORS access.
- Supports React 18+.

## License

MIT
