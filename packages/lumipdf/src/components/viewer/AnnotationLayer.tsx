import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type {
  Annotation,
  HighlightAnnotation,
  InkAnnotation,
  ShapeAnnotation,
  ShapeKind,
  FreeTextAnnotation,
} from '../../core/types';
import { useViewerStore } from '../../hooks/useDocumentViewer';

export interface AnnotationLayerProps {
  pageIndex: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLE_SIZE = 9;
const MIN_BOX = 0.01;
const BOX_HANDLE_TYPES = new Set(['highlight', 'shape', 'free-text', 'ink']);

const SHAPE_TOOLS = ['rectangle', 'ellipse', 'line', 'arrow'] as const;
type ShapeTool = (typeof SHAPE_TOOLS)[number];
const isShapeTool = (t: unknown): t is ShapeTool =>
  SHAPE_TOOLS.includes(t as ShapeTool);

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `a-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function pointsToPath(points: Point[], width: number, height: number): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * width} ${p.y * height}`)
    .join(' ');
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function unionBBox(boxes: BBox[]): BBox | null {
  if (boxes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function annotationBBox(annotation: Annotation): BBox | null {
  if (annotation.type === 'highlight') {
    return unionBBox(
      annotation.data.rects.map((r) => ({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      })),
    );
  }
  if (annotation.type === 'ink') {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    for (const path of annotation.data.paths) {
      for (const p of path) {
        any = true;
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }
    if (!any) return null;
    const pad = annotation.data.thickness;
    return {
      x: minX - pad,
      y: minY - pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
  }
  if (annotation.type === 'shape') {
    const { from, to } = annotation.data;
    return {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x) || MIN_BOX,
      height: Math.abs(to.y - from.y) || MIN_BOX,
    };
  }
  if (annotation.type === 'free-text') {
    const fontH = annotation.data.fontSize;
    const lines = annotation.data.text.split('\n');
    const estW =
      annotation.data.boxWidth ??
      Math.min(0.45, Math.max(0.08, lines.reduce((m, l) => Math.max(m, l.length), 1) * fontH * 0.55));
    const estH = Math.max(fontH, lines.length * fontH * 1.25);
    return {
      x: annotation.data.x,
      y: annotation.data.y - fontH,
      width: estW,
      height: estH,
    };
  }
  if (annotation.type === 'sticky-note') {
    return { x: annotation.data.x, y: annotation.data.y, width: 0.03, height: 0.03 };
  }
  return null;
}

function moveAnnotation(annotation: Annotation, dx: number, dy: number): Annotation {
  if (annotation.type === 'highlight') {
    return {
      ...annotation,
      data: {
        rects: annotation.data.rects.map((r) => ({
          ...r,
          x: clamp01(r.x + dx),
          y: clamp01(r.y + dy),
        })),
      },
    };
  }
  if (annotation.type === 'ink') {
    return {
      ...annotation,
      data: {
        ...annotation.data,
        paths: annotation.data.paths.map((path) =>
          path.map((p) => ({ x: clamp01(p.x + dx), y: clamp01(p.y + dy) })),
        ),
      },
    };
  }
  if (annotation.type === 'shape') {
    return {
      ...annotation,
      data: {
        ...annotation.data,
        from: {
          x: clamp01(annotation.data.from.x + dx),
          y: clamp01(annotation.data.from.y + dy),
        },
        to: {
          x: clamp01(annotation.data.to.x + dx),
          y: clamp01(annotation.data.to.y + dy),
        },
      },
    };
  }
  if (annotation.type === 'free-text') {
    return {
      ...annotation,
      data: {
        ...annotation.data,
        x: clamp01(annotation.data.x + dx),
        y: clamp01(annotation.data.y + dy),
      },
    };
  }
  if (annotation.type === 'sticky-note') {
    return {
      ...annotation,
      data: {
        ...annotation.data,
        x: clamp01(annotation.data.x + dx),
        y: clamp01(annotation.data.y + dy),
      },
    };
  }
  return annotation;
}

function scalePoint(p: Point, box: BBox, next: BBox): Point {
  const rx = box.width > 0 ? (p.x - box.x) / box.width : 0;
  const ry = box.height > 0 ? (p.y - box.y) / box.height : 0;
  return {
    x: clamp01(next.x + rx * next.width),
    y: clamp01(next.y + ry * next.height),
  };
}

function resizeAnnotation(
  annotation: Annotation,
  fromBox: BBox,
  toBox: BBox,
): Annotation {
  const next: BBox = {
    x: clamp01(toBox.x),
    y: clamp01(toBox.y),
    width: Math.max(MIN_BOX, toBox.width),
    height: Math.max(MIN_BOX, toBox.height),
  };

  if (annotation.type === 'highlight') {
    return {
      ...annotation,
      data: {
        rects: annotation.data.rects.map((r) => {
          const tl = scalePoint({ x: r.x, y: r.y }, fromBox, next);
          const br = scalePoint(
            { x: r.x + r.width, y: r.y + r.height },
            fromBox,
            next,
          );
          return {
            x: Math.min(tl.x, br.x),
            y: Math.min(tl.y, br.y),
            width: Math.abs(br.x - tl.x),
            height: Math.abs(br.y - tl.y),
          };
        }),
      },
    };
  }
  if (annotation.type === 'ink') {
    return {
      ...annotation,
      data: {
        ...annotation.data,
        paths: annotation.data.paths.map((path) =>
          path.map((p) => scalePoint(p, fromBox, next)),
        ),
      },
    };
  }
  if (annotation.type === 'shape') {
    return {
      ...annotation,
      data: {
        ...annotation.data,
        from: scalePoint(annotation.data.from, fromBox, next),
        to: scalePoint(annotation.data.to, fromBox, next),
      },
    };
  }
  if (annotation.type === 'free-text') {
    const scaleY = fromBox.height > 0 ? next.height / fromBox.height : 1;
    return {
      ...annotation,
      data: {
        ...annotation.data,
        x: next.x,
        y: next.y + annotation.data.fontSize * scaleY,
        fontSize: Math.max(0.01, annotation.data.fontSize * scaleY),
        boxWidth: next.width,
      },
    };
  }
  if (annotation.type === 'sticky-note') {
    return {
      ...annotation,
      data: {
        ...annotation.data,
        x: next.x,
        y: next.y,
      },
    };
  }
  return annotation;
}

function applyResizeHandle(
  box: BBox,
  dir: HandleDir,
  point: Point,
): BBox {
  let { x, y, width, height } = box;
  const right = x + width;
  const bottom = y + height;

  if (dir.includes('w')) {
    x = Math.min(point.x, right - MIN_BOX);
    width = right - x;
  }
  if (dir.includes('e')) {
    width = Math.max(MIN_BOX, point.x - x);
  }
  if (dir.includes('n')) {
    y = Math.min(point.y, bottom - MIN_BOX);
    height = bottom - y;
  }
  if (dir.includes('s')) {
    height = Math.max(MIN_BOX, point.y - y);
  }
  return { x, y, width, height };
}

function renderShapeGeometry(
  shape: ShapeKind,
  from: Point,
  to: Point,
  color: string,
  strokeWidth: number,
  dashed: boolean,
  filled: boolean,
  width: number,
  height: number,
  fillColor?: string,
  fillOpacity?: number,
  strokeOpacity?: number,
): React.ReactNode {
  const stroke = strokeWidth * width;
  const x1 = from.x * width;
  const y1 = from.y * height;
  const x2 = to.x * width;
  const y2 = to.y * height;
  const common = {
    stroke: color,
    strokeWidth: stroke,
    strokeOpacity: strokeOpacity ?? 1,
    fill: filled ? (fillColor ?? color) : ('none' as const),
    fillOpacity: filled ? (fillOpacity ?? 0.25) : undefined,
    strokeLinecap: 'round' as const,
    ...(dashed ? { strokeDasharray: `${stroke * 3} ${stroke * 2}` } : {}),
  };
  if (shape === 'rectangle') {
    return (
      <rect
        x={Math.min(x1, x2)}
        y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1)}
        height={Math.abs(y2 - y1)}
        {...common}
      />
    );
  }
  if (shape === 'ellipse') {
    return (
      <ellipse
        cx={(x1 + x2) / 2}
        cy={(y1 + y2) / 2}
        rx={Math.abs(x2 - x1) / 2}
        ry={Math.abs(y2 - y1) / 2}
        {...common}
      />
    );
  }

  const line = <line x1={x1} y1={y1} x2={x2} y2={y2} {...common} fill="none" />;
  if (shape === 'line') return line;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = stroke * 3 + 5;
  const a1x = x2 - head * Math.cos(angle - 0.45);
  const a1y = y2 - head * Math.sin(angle - 0.45);
  const a2x = x2 - head * Math.cos(angle + 0.45);
  const a2y = y2 - head * Math.sin(angle + 0.45);
  return (
    <g>
      {line}
      <polygon points={`${x2},${y2} ${a1x},${a1y} ${a2x},${a2y}`} fill={color} />
    </g>
  );
}

export function AnnotationLayer({ pageIndex, width, height }: AnnotationLayerProps) {
  const annotations = useViewerStore((s) => s.annotations);
  const activeTool = useViewerStore((s) => s.activeAnnotationTool);
  const selectedId = useViewerStore((s) => s.selectedAnnotationId);
  const addAnnotation = useViewerStore((s) => s.addAnnotation);
  const deleteAnnotation = useViewerStore((s) => s.deleteAnnotation);
  const updateAnnotation = useViewerStore((s) => s.updateAnnotation);
  const selectAnnotation = useViewerStore((s) => s.selectAnnotation);
  const annotationStyle = useViewerStore((s) => s.annotationStyle);

  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);
  const startRef = useRef<Point | null>(null);
  const [draftBox, setDraftBox] = useState<{ from: Point; to: Point } | null>(null);
  const [draftPath, setDraftPath] = useState<Point[]>([]);
  const [textBox, setTextBox] = useState<{
    point: Point;
    text: string;
    editId?: string;
  } | null>(null);

  const isDrawingTool = activeTool !== null;

  const toPoint = (e: { clientX: number; clientY: number }): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  };

  const commitAnnotationUpdate = (next: Annotation) => {
    const { id, pageIndex: _p, type: _t, ...rest } = next;
    updateAnnotation(id, rest);
  };

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (!isDrawingTool) {
      // Click empty area to deselect
      if (e.target === svgRef.current) {
        selectAnnotation(null);
      }
      return;
    }
    e.preventDefault();
    selectAnnotation(null);
    const pt = toPoint(e);
    svgRef.current?.setPointerCapture(e.pointerId);

    if (activeTool === 'free-text') {
      setTextBox({ point: pt, text: '' });
      return;
    }

    drawingRef.current = true;
    startRef.current = pt;
    if (activeTool === 'ink') setDraftPath([pt]);
    else setDraftBox({ from: pt, to: pt });
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!drawingRef.current || !startRef.current) return;
    const pt = toPoint(e);
    if (activeTool === 'ink') {
      setDraftPath((prev) => [...prev, pt]);
    } else {
      setDraftBox({ from: startRef.current, to: pt });
    }
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    svgRef.current?.releasePointerCapture(e.pointerId);

    if (activeTool === 'ink') {
      if (draftPath.length > 1) {
        const ink: InkAnnotation = {
          id: newId(),
          pageIndex,
          type: 'ink',
          color: annotationStyle.inkColor,
          opacity: annotationStyle.inkOpacity,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {
            paths: [draftPath],
            thickness: annotationStyle.inkThickness,
            dashed: annotationStyle.inkDashed,
          },
        };
        addAnnotation(ink);
      }
      setDraftPath([]);
    } else if (draftBox && startRef.current) {
      const from = startRef.current;
      const to = draftBox.to;
      const dx = Math.abs(to.x - from.x);
      const dy = Math.abs(to.y - from.y);

      if (isShapeTool(activeTool) && Math.hypot(dx, dy) > 0.005) {
        const shape: ShapeAnnotation = {
          id: newId(),
          pageIndex,
          type: 'shape',
          color: annotationStyle.shapeColor,
          opacity: annotationStyle.shapeOpacity,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {
            shape: activeTool,
            from,
            to,
            strokeWidth: annotationStyle.shapeThickness,
            dashed: annotationStyle.shapeDashed,
            filled: annotationStyle.shapeFilled,
            ...(annotationStyle.shapeFilled
              ? {
                  fillColor: annotationStyle.shapeFillColor,
                  fillOpacity: annotationStyle.shapeFillOpacity,
                }
              : {}),
          },
        };
        addAnnotation(shape);
      } else if (activeTool === 'highlight' && dx > 0.002 && dy > 0.002) {
        const hl: HighlightAnnotation = {
          id: newId(),
          pageIndex,
          type: 'highlight',
          color: annotationStyle.highlightColor,
          opacity: annotationStyle.highlightOpacity,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {
            rects: [
              {
                x: Math.min(from.x, to.x),
                y: Math.min(from.y, to.y),
                width: dx,
                height: dy,
              },
            ],
          },
        };
        addAnnotation(hl);
      }
      setDraftBox(null);
    }
    startRef.current = null;
  };

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  return (
    <svg
      ref={svgRef}
      className="dv-annotation-layer"
      width={width}
      height={height}
      style={{
        pointerEvents: isDrawingTool || selectedId ? 'auto' : 'none',
        touchAction: 'none',
      }}
      data-tool={activeTool ?? undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {pageAnnotations.map((a) => (
        <AnnotationShape
          key={a.id}
          annotation={a}
          width={width}
          height={height}
          selected={a.id === selectedId}
          interactive={!isDrawingTool}
          onSelect={() => selectAnnotation(a.id)}
          onDelete={() => deleteAnnotation(a.id)}
          onCommit={commitAnnotationUpdate}
          {...(a.type === 'free-text'
            ? {
                onEditText: () =>
                  setTextBox({
                    point: { x: a.data.x, y: a.data.y - a.data.fontSize },
                    text: a.data.text,
                    editId: a.id,
                  }),
              }
            : {})}
        />
      ))}

      {draftBox && activeTool === 'highlight' && (
        <rect
          x={Math.min(draftBox.from.x, draftBox.to.x) * width}
          y={Math.min(draftBox.from.y, draftBox.to.y) * height}
          width={Math.abs(draftBox.to.x - draftBox.from.x) * width}
          height={Math.abs(draftBox.to.y - draftBox.from.y) * height}
          fill={annotationStyle.highlightColor}
          opacity={annotationStyle.highlightOpacity}
        />
      )}
      {draftBox &&
        isShapeTool(activeTool) &&
        renderShapeGeometry(
          activeTool,
          draftBox.from,
          draftBox.to,
          annotationStyle.shapeColor,
          annotationStyle.shapeThickness,
          annotationStyle.shapeDashed,
          annotationStyle.shapeFilled,
          width,
          height,
          annotationStyle.shapeFillColor,
          annotationStyle.shapeFillOpacity,
          annotationStyle.shapeOpacity,
        )}
      {draftPath.length > 1 && (
        <path
          d={pointsToPath(draftPath, width, height)}
          fill="none"
          stroke={annotationStyle.inkColor}
          strokeOpacity={annotationStyle.inkOpacity}
          strokeWidth={annotationStyle.inkThickness * width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={
            annotationStyle.inkDashed
              ? `${annotationStyle.inkThickness * width * 3} ${annotationStyle.inkThickness * width * 2}`
              : undefined
          }
        />
      )}
      {textBox && (
        <foreignObject
          x={textBox.point.x * width}
          y={textBox.point.y * height}
          width={Math.max(180, width * 0.28)}
          height={Math.max(80, height * 0.12)}
        >
          <textarea
            autoFocus
            className="dv-annotation-textbox"
            value={textBox.text}
            onChange={(event) =>
              setTextBox({ ...textBox, text: event.target.value })
            }
            onPointerDown={(event) => event.stopPropagation()}
            onBlur={() => {
              const text = textBox.text.trim();
              if (textBox.editId) {
                const existing = annotations.find((a) => a.id === textBox.editId);
                if (existing?.type === 'free-text') {
                  updateAnnotation(textBox.editId, {
                    data: { ...existing.data, text: text || existing.data.text },
                  });
                }
              } else if (text) {
                const ann: FreeTextAnnotation = {
                  id: newId(),
                  pageIndex,
                  type: 'free-text',
                  color: annotationStyle.textColor,
                  opacity: annotationStyle.textOpacity,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  data: {
                    x: textBox.point.x,
                    y: textBox.point.y + annotationStyle.textSize,
                    text,
                    fontSize: annotationStyle.textSize,
                    fontWeight: annotationStyle.textBold ? 'bold' : 'normal',
                    fontStyle: annotationStyle.textItalic ? 'italic' : 'normal',
                    underline: annotationStyle.textUnderline,
                    fontFamily: annotationStyle.textFontFamily,
                    textAlign: annotationStyle.textAlign,
                    ...(annotationStyle.textBackgroundEnabled
                      ? { backgroundColor: annotationStyle.textBackground }
                      : {}),
                  },
                };
                addAnnotation(ann);
              }
              setTextBox(null);
            }}
            style={{
              color: annotationStyle.textColor,
              fontSize: `${annotationStyle.textSize * height}px`,
              fontWeight: annotationStyle.textBold ? 'bold' : 'normal',
              fontStyle: annotationStyle.textItalic ? 'italic' : 'normal',
              fontFamily: annotationStyle.textFontFamily,
              textAlign: annotationStyle.textAlign,
              textDecoration: annotationStyle.textUnderline ? 'underline' : 'none',
              background: annotationStyle.textBackgroundEnabled
                ? annotationStyle.textBackground
                : 'rgba(255, 255, 255, 0.92)',
            }}
          />
        </foreignObject>
      )}
    </svg>
  );
}

function AnnotationShape({
  annotation,
  width,
  height,
  selected,
  interactive,
  onSelect,
  onDelete,
  onCommit,
  onEditText,
}: {
  annotation: Annotation;
  width: number;
  height: number;
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onCommit: (next: Annotation) => void;
  onEditText?: () => void;
}) {
  const dragRef = useRef<{
    mode: 'move' | 'resize';
    corner?: HandleDir;
    start: Point;
    origin: Annotation;
    originBox: BBox;
  } | null>(null);

  const box = annotationBBox(annotation);
  const pointerStyle = {
    pointerEvents: interactive ? ('auto' as const) : ('none' as const),
    cursor: interactive ? ('move' as const) : undefined,
  };

  const beginMove = (e: ReactPointerEvent) => {
    if (!interactive || !box) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const start = {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
    dragRef.current = {
      mode: 'move',
      start,
      origin: annotation,
      originBox: box,
    };
    const move = (moveEvent: PointerEvent) => {
      if (!dragRef.current || dragRef.current.mode !== 'move') return;
      const pt = {
        x: clamp01((moveEvent.clientX - rect.left) / rect.width),
        y: clamp01((moveEvent.clientY - rect.top) / rect.height),
      };
      const dx = pt.x - dragRef.current.start.x;
      const dy = pt.y - dragRef.current.start.y;
      onCommit(moveAnnotation(dragRef.current.origin, dx, dy));
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  };

  const beginResize = (dir: HandleDir) => (e: ReactPointerEvent) => {
    if (!interactive || !box) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    dragRef.current = {
      mode: 'resize',
      corner: dir,
      start: {
        x: clamp01((e.clientX - rect.left) / rect.width),
        y: clamp01((e.clientY - rect.top) / rect.height),
      },
      origin: annotation,
      originBox: box,
    };
    const move = (moveEvent: PointerEvent) => {
      if (!dragRef.current || dragRef.current.mode !== 'resize' || !dragRef.current.corner)
        return;
      const pt = {
        x: clamp01((moveEvent.clientX - rect.left) / rect.width),
        y: clamp01((moveEvent.clientY - rect.top) / rect.height),
      };
      const nextBox = applyResizeHandle(
        dragRef.current.originBox,
        dragRef.current.corner,
        pt,
      );
      onCommit(
        resizeAnnotation(
          dragRef.current.origin,
          dragRef.current.originBox,
          nextBox,
        ),
      );
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  };

  let body: React.ReactNode = null;
  let anchor = { x: 0, y: 0 };

  if (annotation.type === 'highlight') {
    body = annotation.data.rects.map((r, i) => (
      <rect
        key={i}
        x={r.x * width}
        y={r.y * height}
        width={r.width * width}
        height={r.height * height}
        fill={annotation.color}
        opacity={annotation.opacity}
        style={pointerStyle}
        onPointerDown={beginMove}
      />
    ));
    if (box) anchor = { x: (box.x + box.width) * width, y: box.y * height };
  } else if (annotation.type === 'ink') {
    const stroke = annotation.data.thickness * width;
    body = annotation.data.paths.map((path, i) => (
      <g key={i}>
        <path
          d={pointsToPath(path as Point[], width, height)}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(14, stroke + 10)}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={pointerStyle}
          onPointerDown={beginMove}
        />
        <path
          d={pointsToPath(path as Point[], width, height)}
          fill="none"
          stroke={annotation.color}
          strokeOpacity={annotation.opacity}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={
            annotation.data.dashed
              ? `${stroke * 3} ${stroke * 2}`
              : undefined
          }
          style={{ pointerEvents: 'none' }}
        />
      </g>
    ));
    if (box) anchor = { x: (box.x + box.width) * width, y: box.y * height };
  } else if (annotation.type === 'shape') {
    const { shape, from, to } = annotation.data;
    const x1 = from.x * width;
    const y1 = from.y * height;
    const x2 = to.x * width;
    const y2 = to.y * height;

    const hit =
      shape === 'line' || shape === 'arrow' ? (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="transparent"
          strokeWidth={14}
        />
      ) : (
        <rect
          x={Math.min(x1, x2)}
          y={Math.min(y1, y2)}
          width={Math.abs(x2 - x1)}
          height={Math.abs(y2 - y1)}
          fill="transparent"
          stroke="transparent"
          strokeWidth={14}
        />
      );
    body = (
      <g>
        <g style={{ pointerEvents: 'none' }}>
          {renderShapeGeometry(
            shape,
            from,
            to,
            annotation.color,
            annotation.data.strokeWidth,
            annotation.data.dashed ?? false,
            annotation.data.filled ?? false,
            width,
            height,
            annotation.data.fillColor,
            annotation.data.fillOpacity,
            annotation.opacity,
          )}
        </g>
        {interactive && (
          <g style={pointerStyle} onPointerDown={beginMove}>
            {hit}
          </g>
        )}
      </g>
    );
    if (box) anchor = { x: (box.x + box.width) * width, y: box.y * height };
  } else if (annotation.type === 'free-text') {
    const x = annotation.data.x * width;
    const y = annotation.data.y * height;
    const fontPx = annotation.data.fontSize * height;
    const bg = annotation.data.backgroundColor;
    const boxW = (annotation.data.boxWidth ?? 0.28) * width;
    if (box) anchor = { x: (box.x + box.width) * width, y: box.y * height };
    body = (
      <g style={pointerStyle} onPointerDown={beginMove} onDoubleClick={onEditText}>
        {bg && box && (
          <rect
            x={box.x * width}
            y={box.y * height}
            width={box.width * width}
            height={box.height * height}
            fill={bg}
            opacity={0.85}
            rx={3}
          />
        )}
        <text
          x={x}
          y={y}
          fontSize={fontPx}
          fill={annotation.color}
          fillOpacity={annotation.opacity}
          fontWeight={annotation.data.fontWeight}
          fontStyle={annotation.data.fontStyle}
          fontFamily={annotation.data.fontFamily ?? 'sans-serif'}
          textAnchor={
            annotation.data.textAlign === 'center'
              ? 'middle'
              : annotation.data.textAlign === 'right'
                ? 'end'
                : 'start'
          }
          textDecoration={annotation.data.underline ? 'underline' : undefined}
          style={{ whiteSpace: 'pre' }}
        >
          {annotation.data.text.split('\n').map((line, i) => (
            <tspan key={i} x={x} dy={i === 0 ? 0 : fontPx * 1.25}>
              {line}
            </tspan>
          ))}
        </text>

        {box && (
          <rect
            x={box.x * width}
            y={box.y * height}
            width={Math.max(boxW, box.width * width)}
            height={box.height * height}
            fill="transparent"
          />
        )}
      </g>
    );
  } else if (annotation.type === 'sticky-note') {
    const x = annotation.data.x * width;
    const y = annotation.data.y * height;
    anchor = { x: x + 18, y };
    body = (
      <g style={pointerStyle} onPointerDown={beginMove}>
        <title>{annotation.data.comment}</title>
        <rect x={x} y={y} width={18} height={18} rx={3} fill={annotation.color} />
        <path
          d={`M ${x + 4} ${y + 6} H ${x + 14} M ${x + 4} ${y + 9} H ${x + 14} M ${x + 4} ${y + 12} H ${x + 10}`}
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={1}
        />
      </g>
    );
  }

  const handles: HandleDir[] = BOX_HANDLE_TYPES.has(annotation.type)
    ? ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
    : ['nw', 'ne', 'sw', 'se'];
  const handlePos = (c: HandleDir) => {
    if (!box) return { cx: 0, cy: 0 };
    const midX = (box.x + box.width / 2) * width;
    const midY = (box.y + box.height / 2) * height;
    const map: Record<HandleDir, { cx: number; cy: number }> = {
      nw: { cx: box.x * width, cy: box.y * height },
      n: { cx: midX, cy: box.y * height },
      ne: { cx: (box.x + box.width) * width, cy: box.y * height },
      e: { cx: (box.x + box.width) * width, cy: midY },
      se: { cx: (box.x + box.width) * width, cy: (box.y + box.height) * height },
      s: { cx: midX, cy: (box.y + box.height) * height },
      sw: { cx: box.x * width, cy: (box.y + box.height) * height },
      w: { cx: box.x * width, cy: midY },
    };
    return map[c];
  };
  const cursorFor: Record<HandleDir, string> = {
    nw: 'nwse-resize',
    se: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
  };

  return (
    <g className="dv-annotation" data-selected={selected || undefined} data-type={annotation.type}>
      {body}
      {selected && interactive && box && (
        <>
          <rect
            className="dv-annotation-selection"
            x={box.x * width}
            y={box.y * height}
            width={box.width * width}
            height={box.height * height}
            fill="none"
            stroke="var(--dv-button-primary-bg, #5f8a2e)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            style={{ pointerEvents: 'none' }}
          />
          {handles.map((c) => {
            const { cx, cy } = handlePos(c);
            return (
              <rect
                key={c}
                className="dv-annotation-handle"
                x={cx - HANDLE_SIZE / 2}
                y={cy - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill="white"
                stroke="var(--dv-button-primary-bg, #5f8a2e)"
                strokeWidth={1.5}
                rx={1.5}
                style={{ pointerEvents: 'auto', cursor: cursorFor[c] }}
                onPointerDown={beginResize(c)}
              />
            );
          })}
        </>
      )}
      {selected && interactive && (
        <g
          className="dv-annotation-delete"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <circle cx={anchor.x + 10} cy={anchor.y - 10} r={9} fill="#ef4444" />
          <path
            d={`M ${anchor.x + 6} ${anchor.y - 14} L ${anchor.x + 14} ${anchor.y - 6} M ${anchor.x + 14} ${anchor.y - 14} L ${anchor.x + 6} ${anchor.y - 6}`}
            stroke="white"
            strokeWidth={1.5}
          />
        </g>
      )}
    </g>
  );
}
