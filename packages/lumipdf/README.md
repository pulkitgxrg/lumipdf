# LumiPDF

React PDF viewer built on PDF.js. Includes text selection, search, thumbnails, outline navigation, zoom, rotation, downloads, printing, and editable annotations.

## Install

```bash
npm install lumipdf
```

`react`, `react-dom`, and `pdfjs-dist` are peer dependencies.

## Annotations

Toolbar includes highlight, freehand draw, rectangle, ellipse, line, arrow, and text tools. Annotations are **viewer overlays only** — download and print always use the original PDF without annotations.

### Editing (Canva-style)

- Click an annotation to select it (dashed box + corner handles)
- Drag to move; drag corner handles to resize
- Delete with the red ×, **Delete/Backspace**, or the toolbar action
- Double-click text to re-edit content
- Escape clears selection and exits the active tool

### Formatting

Use annotation controls for:

- **Highlight** — color, opacity
- **Draw** — color, thickness, dotted stroke
- **Shapes** — color, thickness, dotted, filled
- **Text** — color, size, font family, align, bold, italic, underline, background

Style changes apply to new annotations and update the currently selected annotation.

Persist annotations with callback data:

```tsx
<DocumentViewer
  source={{ kind: 'url', url: '/contract.pdf' }}
  onAnnotationChange={(annotations) => localStorage.setItem('contract-annotations', JSON.stringify(annotations))}
/>
```

Use `serializeAnnotations` and `parseAnnotations` for validated stored annotation payloads.

## Notes

- PDF.js worker loads from jsDelivr by default. Configure `pdfjsLib.GlobalWorkerOptions.workerSrc` before rendering if application requires self-hosted worker assets.
- Remote PDFs need CORS access.
- Package supports React 18+.
