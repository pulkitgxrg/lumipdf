# LumiPDF

React PDF viewer built on PDF.js. Includes text selection, search, thumbnails, outline navigation, zoom, rotation, downloads, printing, and editable annotations.

## Install

```bash
npm install lumipdf
```

`react`, `react-dom`, and `pdfjs-dist` are peer dependencies.

## Annotations

Toolbar includes highlight, freehand draw, rectangle, ellipse, line, arrow, and text tools. Text is written directly in a PDF overlay. Use annotation controls for highlight color; shape color, thickness, and dotted strokes; text color, size, bold, and italic.

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
