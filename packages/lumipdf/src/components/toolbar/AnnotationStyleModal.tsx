import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useViewerStore } from '../../hooks/useDocumentViewer';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type {
  Annotation,
  AnnotationStyle,
  AnnotationTool,
  FreeTextAnnotation,
  InkAnnotation,
  ShapeAnnotation,
  TextAlign,
} from '../../core/types';

const COLOR_PRESETS = [
  '#ffd400',
  '#f59e0b',
  '#ef4444',
  '#e11d48',
  '#5f8a2e',
  '#6f9c3b',
  '#84cc16',
  '#14b8a6',
  '#0d9488',
  '#78716c',
  '#57534e',
  '#1a1d24',
  '#6b7280',
  '#ffffff',
] as const;

const TOOL_META: Record<
  string,
  { title: string; subtitle: string; icon: string }
> = {
  highlight: {
    title: 'Highlight',
    subtitle: 'Mark text regions with a translucent color',
    icon: 'M3 11l6-6 4 4-6 6H3v-4zm0 6h14v-1H3v1z',
  },
  ink: {
    title: 'Draw',
    subtitle: 'Freehand pen strokes on the page',
    icon: 'M2 14l1-3 7-7 2 2-7 7-3 1zm9-10l1.5-1.5 2 2L13 6l-2-2z',
  },
  rectangle: {
    title: 'Rectangle',
    subtitle: 'Box outlines with optional fill',
    icon: 'M2 3h12v10H2V3zm1.5 1.5v7h9v-7h-9z',
  },
  ellipse: {
    title: 'Ellipse',
    subtitle: 'Oval shapes with stroke and fill',
    icon: 'M8 3c3.6 0 6.5 2.2 6.5 5S11.6 13 8 13 1.5 10.8 1.5 8 4.4 3 8 3zm0 1.5C5.2 4.5 3 6.1 3 8s2.2 3.5 5 3.5 5-1.6 5-3.5-2.2-3.5-5-3.5z',
  },
  line: {
    title: 'Line',
    subtitle: 'Straight line strokes',
    icon: 'M2.8 12.6l-1-1L12.2 1.2l1 1L2.8 12.6z',
  },
  arrow: {
    title: 'Arrow',
    subtitle: 'Directional callouts',
    icon: 'M2.8 12.6l-1-1L10 3.4H6V2h6.5v6.5H11v-4l-8.2 8.1z',
  },
  'free-text': {
    title: 'Text',
    subtitle: 'Type notes directly on the page',
    icon: 'M2 2h12v3h-1.5V3.5H8.75v9H10V14H6v-1.5h1.25v-9H3.5V5H2V2z',
  },
  shape: {
    title: 'Shape',
    subtitle: 'Edit shape appearance',
    icon: 'M2 3h12v10H2V3zm1.5 1.5v7h9v-7h-9z',
  },
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function annotationBBox(a: Annotation): { w: number; h: number } | null {
  if (a.type === 'highlight') {
    const r = a.data.rects[0];
    if (!r) return null;
    return { w: r.width, h: r.height };
  }
  if (a.type === 'shape') {
    return {
      w: Math.abs(a.data.to.x - a.data.from.x),
      h: Math.abs(a.data.to.y - a.data.from.y),
    };
  }
  if (a.type === 'free-text') {
    return {
      w: a.data.boxWidth ?? 0.28,
      h: a.data.fontSize * Math.max(1, a.data.text.split('\n').length) * 1.25,
    };
  }
  return null;
}

function setHighlightSize(a: Annotation, w: number, h: number): Annotation | null {
  if (a.type !== 'highlight' || !a.data.rects[0]) return null;
  const r = a.data.rects[0];
  return {
    ...a,
    data: {
      rects: [
        {
          x: r.x,
          y: r.y,
          width: Math.max(0.01, Math.min(1 - r.x, w)),
          height: Math.max(0.01, Math.min(1 - r.y, h)),
        },
        ...a.data.rects.slice(1),
      ],
    },
  };
}

function setShapeSize(a: Annotation, w: number, h: number): Annotation | null {
  if (a.type !== 'shape') return null;
  const x = Math.min(a.data.from.x, a.data.to.x);
  const y = Math.min(a.data.from.y, a.data.to.y);
  const nw = Math.max(0.01, Math.min(1 - x, w));
  const nh = Math.max(0.01, Math.min(1 - y, h));
  return {
    ...a,
    data: {
      ...a.data,
      from: { x, y },
      to: { x: x + nw, y: y + nh },
    },
  };
}

function modeFromTool(tool: AnnotationTool | null): string | null {
  if (!tool) return null;
  if (['rectangle', 'ellipse', 'line', 'arrow'].includes(tool)) return 'shape';
  return tool;
}

function ColorSwatches({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  const normalized = value.toLowerCase();
  return (
    <div className="dv-anno-modal-section">
      <div className="dv-anno-modal-section-head">
        <span>{label}</span>
        <label className="dv-anno-custom-color" title="Custom color">
          <span
            className="dv-anno-custom-color-swatch"
            style={{ background: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} custom`}
          />
        </label>
      </div>
      <div className="dv-anno-swatches" role="listbox" aria-label={label}>
        {COLOR_PRESETS.map((c) => {
          const active = normalized === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={active}
              className="dv-anno-swatch"
              data-active={active || undefined}
              data-light={c === '#ffffff' || undefined}
              style={{ background: c }}
              title={c}
              onClick={() => onChange(c)}
            />
          );
        })}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="dv-anno-slider-row">
      <div className="dv-anno-slider-labels">
        <span>{label}</span>
        <span className="dv-anno-slider-value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dv-anno-range"
      />
    </div>
  );
}

function TogglePill({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="dv-anno-toggle"
      data-on={checked || undefined}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="dv-anno-toggle-knob" />
      <span>{label}</span>
    </button>
  );
}

export function AnnotationStyleModal() {
  const activeTool = useViewerStore((s) => s.activeAnnotationTool);
  const annotationStyle = useViewerStore((s) => s.annotationStyle);
  const setAnnotationStyle = useViewerStore((s) => s.setAnnotationStyle);
  const annotations = useViewerStore((s) => s.annotations);
  const selectedAnnotationId = useViewerStore((s) => s.selectedAnnotationId);
  const updateAnnotation = useViewerStore((s) => s.updateAnnotation);
  const deleteAnnotation = useViewerStore((s) => s.deleteAnnotation);
  const selectAnnotation = useViewerStore((s) => s.selectAnnotation);
  const setActiveTool = useViewerStore((s) => s.setActiveTool);

  const selected = useMemo(
    () =>
      selectedAnnotationId
        ? annotations.find((a) => a.id === selectedAnnotationId) ?? null
        : null,
    [annotations, selectedAnnotationId],
  );

  const mode = selected?.type ?? modeFromTool(activeTool);
  const toolKey =
    selected?.type === 'shape'
      ? selected.data.shape
      : selected?.type ?? activeTool ?? 'highlight';

  // Settings open only when user clicks the settings chip — never auto-open
  // on tool change or selecting an annotation (including with hand tool).
  const [open, setOpen] = useState(false);
  const hasContext = Boolean(activeTool || selected);

  useEffect(() => {
    if (!hasContext) setOpen(false);
  }, [hasContext]);

  const dialogRef = useRef<HTMLDivElement>(null);

  const closeAndExit = useCallback(() => {
    setOpen(false);
    selectAnnotation(null);
    setActiveTool(null);
  }, [selectAnnotation, setActiveTool]);

  const startDrawing = useCallback(() => {
    // Keep the tool; close modal so the page can be annotated.
    setOpen(false);
    selectAnnotation(null);
  }, [selectAnnotation]);

  const dismissKeepSelection = useCallback(() => {
    setOpen(false);
  }, []);

  useFocusTrap(dialogRef, open, selected ? dismissKeepSelection : closeAndExit);

  const applyStyle = useCallback(
    (
      style: Partial<AnnotationStyle>,
      selectedPatch?: (
        a: Annotation,
      ) => Partial<Omit<Annotation, 'id' | 'pageIndex' | 'type'>> | null,
    ) => {
      setAnnotationStyle(style);
      if (selected && selectedPatch) {
        const patch = selectedPatch(selected);
        if (patch) updateAnnotation(selected.id, patch);
      }
    },
    [selected, setAnnotationStyle, updateAnnotation],
  );

  const commit = useCallback(
    (next: Annotation) => {
      const { id, pageIndex: _p, type: _t, ...rest } = next;
      updateAnnotation(id, rest);
    },
    [updateAnnotation],
  );

  if (!mode && !activeTool && !selected) return null;

  const meta =
    TOOL_META[toolKey] ??
    TOOL_META[mode ?? ''] ??
    TOOL_META.highlight;

  const size = selected ? annotationBBox(selected) : null;
  const canResizeSize =
    selected?.type === 'highlight' ||
    (selected?.type === 'shape' &&
      (selected.data.shape === 'rectangle' || selected.data.shape === 'ellipse'));

  const isShapeMode = mode === 'shape';
  const isHighlight = mode === 'highlight';
  const isInk = mode === 'ink';
  const isText = mode === 'free-text';

  const primaryColor = isHighlight
    ? selected?.type === 'highlight'
      ? selected.color
      : annotationStyle.highlightColor
    : isInk
      ? selected?.type === 'ink'
        ? selected.color
        : annotationStyle.inkColor
      : isText
        ? selected?.type === 'free-text'
          ? selected.color
          : annotationStyle.textColor
        : selected?.type === 'shape'
          ? selected.color
          : annotationStyle.shapeColor;

  const setPrimaryColor = (color: string) => {
    if (isHighlight) {
      applyStyle({ highlightColor: color }, (a) =>
        a.type === 'highlight' ? { color } : null,
      );
    } else if (isInk) {
      applyStyle({ inkColor: color }, (a) =>
        a.type === 'ink' ? { color } : null,
      );
    } else if (isText) {
      applyStyle({ textColor: color }, (a) =>
        a.type === 'free-text' ? { color } : null,
      );
    } else if (isShapeMode) {
      applyStyle({ shapeColor: color }, (a) =>
        a.type === 'shape' ? { color } : null,
      );
    }
  };

  // Chip only — click to open settings. Selecting on-page never opens the modal.
  if (!open && hasContext) {
    return (
      <div className="dv-anno-chip-wrap">
        <button
          type="button"
          className="dv-anno-chip"
          onClick={() => setOpen(true)}
        >
          <span
            className="dv-anno-chip-dot"
            style={{ background: primaryColor }}
          />
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d={meta.icon} />
          </svg>
          <span>
            {selected ? `Edit ${meta.title}` : `${meta.title} settings`}
          </span>
        </button>
        <button
          type="button"
          className="dv-anno-chip-close"
          aria-label="Exit annotation tool"
          onClick={closeAndExit}
        >
          ×
        </button>
      </div>
    );
  }

  if (!open) return null;

  const filled =
    selected?.type === 'shape'
      ? Boolean(selected.data.filled)
      : annotationStyle.shapeFilled;

  return (
    <div
      className="dv-anno-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (selected) dismissKeepSelection();
          else startDrawing();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="dv-anno-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dv-anno-modal-title"
        tabIndex={-1}
      >
        <div className="dv-anno-modal-header">
          <div className="dv-anno-modal-brand">
            <span
              className="dv-anno-modal-icon"
              style={{
                background: `color-mix(in srgb, ${primaryColor} 22%, transparent)`,
                color: primaryColor === '#ffffff' ? '#111827' : primaryColor,
              }}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                <path d={meta.icon} />
              </svg>
            </span>
            <div>
              <h2 id="dv-anno-modal-title" className="dv-anno-modal-title">
                {selected ? `Edit ${meta.title}` : meta.title}
              </h2>
              <p className="dv-anno-modal-sub">{meta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="dv-anno-modal-x"
            aria-label="Close"
            onClick={() => {
              if (selected) dismissKeepSelection();
              else startDrawing();
            }}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="dv-anno-modal-body">
          <ColorSwatches
            label={isShapeMode ? 'Stroke color' : 'Color'}
            value={primaryColor}
            onChange={setPrimaryColor}
          />

          {isHighlight && (
            <div className="dv-anno-modal-section">
              <SliderRow
                label="Opacity"
                value={
                  selected?.type === 'highlight'
                    ? selected.opacity
                    : annotationStyle.highlightOpacity
                }
                min={0.1}
                max={1}
                step={0.05}
                display={pct(
                  selected?.type === 'highlight'
                    ? selected.opacity
                    : annotationStyle.highlightOpacity,
                )}
                onChange={(opacity) =>
                  applyStyle({ highlightOpacity: opacity }, (a) =>
                    a.type === 'highlight' ? { opacity } : null,
                  )
                }
              />
            </div>
          )}

          {isInk && (
            <div className="dv-anno-modal-section">
              <SliderRow
                label="Opacity"
                value={
                  selected?.type === 'ink'
                    ? selected.opacity
                    : annotationStyle.inkOpacity
                }
                min={0.1}
                max={1}
                step={0.05}
                display={pct(
                  selected?.type === 'ink'
                    ? selected.opacity
                    : annotationStyle.inkOpacity,
                )}
                onChange={(opacity) =>
                  applyStyle({ inkOpacity: opacity }, (a) =>
                    a.type === 'ink' ? { opacity } : null,
                  )
                }
              />
              <SliderRow
                label="Thickness"
                value={
                  selected?.type === 'ink'
                    ? selected.data.thickness
                    : annotationStyle.inkThickness
                }
                min={0.001}
                max={0.02}
                step={0.001}
                display={String(
                  Math.round(
                    (selected?.type === 'ink'
                      ? selected.data.thickness
                      : annotationStyle.inkThickness) * 1000,
                  ),
                )}
                onChange={(thickness) =>
                  applyStyle({ inkThickness: thickness }, (a) =>
                    a.type === 'ink'
                      ? {
                          data: {
                            ...a.data,
                            thickness,
                          } as InkAnnotation['data'],
                        }
                      : null,
                  )
                }
              />
              <div className="dv-anno-toggles">
                <TogglePill
                  label="Dotted"
                  checked={
                    selected?.type === 'ink'
                      ? Boolean(selected.data.dashed)
                      : annotationStyle.inkDashed
                  }
                  onChange={(dashed) =>
                    applyStyle({ inkDashed: dashed }, (a) =>
                      a.type === 'ink'
                        ? {
                            data: {
                              ...a.data,
                              dashed,
                            } as InkAnnotation['data'],
                          }
                        : null,
                    )
                  }
                />
              </div>
            </div>
          )}

          {isShapeMode && (
            <div className="dv-anno-modal-section">
              <SliderRow
                label="Stroke opacity"
                value={
                  selected?.type === 'shape'
                    ? selected.opacity
                    : annotationStyle.shapeOpacity
                }
                min={0.1}
                max={1}
                step={0.05}
                display={pct(
                  selected?.type === 'shape'
                    ? selected.opacity
                    : annotationStyle.shapeOpacity,
                )}
                onChange={(opacity) =>
                  applyStyle({ shapeOpacity: opacity }, (a) =>
                    a.type === 'shape' ? { opacity } : null,
                  )
                }
              />
              <SliderRow
                label="Thickness"
                value={
                  selected?.type === 'shape'
                    ? selected.data.strokeWidth
                    : annotationStyle.shapeThickness
                }
                min={0.001}
                max={0.02}
                step={0.001}
                display={String(
                  Math.round(
                    (selected?.type === 'shape'
                      ? selected.data.strokeWidth
                      : annotationStyle.shapeThickness) * 1000,
                  ),
                )}
                onChange={(strokeWidth) =>
                  applyStyle({ shapeThickness: strokeWidth }, (a) =>
                    a.type === 'shape'
                      ? {
                          data: {
                            ...a.data,
                            strokeWidth,
                          } as ShapeAnnotation['data'],
                        }
                      : null,
                  )
                }
              />
              <div className="dv-anno-toggles">
                <TogglePill
                  label="Dotted"
                  checked={
                    selected?.type === 'shape'
                      ? Boolean(selected.data.dashed)
                      : annotationStyle.shapeDashed
                  }
                  onChange={(dashed) =>
                    applyStyle({ shapeDashed: dashed }, (a) =>
                      a.type === 'shape'
                        ? {
                            data: {
                              ...a.data,
                              dashed,
                            } as ShapeAnnotation['data'],
                          }
                        : null,
                    )
                  }
                />
                <TogglePill
                  label="Filled"
                  checked={filled}
                  onChange={(next) =>
                    applyStyle({ shapeFilled: next }, (a) => {
                      if (a.type !== 'shape') return null;
                      if (next) {
                        return {
                          data: {
                            ...a.data,
                            filled: true,
                            fillColor:
                              a.data.fillColor ?? annotationStyle.shapeFillColor,
                            fillOpacity:
                              a.data.fillOpacity ??
                              annotationStyle.shapeFillOpacity,
                          } as ShapeAnnotation['data'],
                        };
                      }
                      const { fillColor: _fc, fillOpacity: _fo, ...rest } =
                        a.data;
                      return {
                        data: {
                          ...rest,
                          filled: false,
                        } as ShapeAnnotation['data'],
                      };
                    })
                  }
                />
              </div>
              {filled && (
                <div className="dv-anno-fill-block">
                  <ColorSwatches
                    label="Fill color"
                    value={
                      selected?.type === 'shape' && selected.data.fillColor
                        ? selected.data.fillColor
                        : annotationStyle.shapeFillColor
                    }
                    onChange={(color) =>
                      applyStyle({ shapeFillColor: color }, (a) =>
                        a.type === 'shape'
                          ? {
                              data: {
                                ...a.data,
                                filled: true,
                                fillColor: color,
                              } as ShapeAnnotation['data'],
                            }
                          : null,
                      )
                    }
                  />
                  <SliderRow
                    label="Fill opacity"
                    value={
                      selected?.type === 'shape' &&
                      selected.data.fillOpacity != null
                        ? selected.data.fillOpacity
                        : annotationStyle.shapeFillOpacity
                    }
                    min={0.05}
                    max={1}
                    step={0.05}
                    display={pct(
                      selected?.type === 'shape' &&
                        selected.data.fillOpacity != null
                        ? selected.data.fillOpacity
                        : annotationStyle.shapeFillOpacity,
                    )}
                    onChange={(fillOpacity) =>
                      applyStyle({ shapeFillOpacity: fillOpacity }, (a) =>
                        a.type === 'shape'
                          ? {
                              data: {
                                ...a.data,
                                filled: true,
                                fillOpacity,
                              } as ShapeAnnotation['data'],
                            }
                          : null,
                      )
                    }
                  />
                </div>
              )}
            </div>
          )}

          {isText && (
            <div className="dv-anno-modal-section">
              <SliderRow
                label="Opacity"
                value={
                  selected?.type === 'free-text'
                    ? selected.opacity
                    : annotationStyle.textOpacity
                }
                min={0.1}
                max={1}
                step={0.05}
                display={pct(
                  selected?.type === 'free-text'
                    ? selected.opacity
                    : annotationStyle.textOpacity,
                )}
                onChange={(opacity) =>
                  applyStyle({ textOpacity: opacity }, (a) =>
                    a.type === 'free-text' ? { opacity } : null,
                  )
                }
              />
              <SliderRow
                label="Size"
                value={
                  selected?.type === 'free-text'
                    ? selected.data.fontSize
                    : annotationStyle.textSize
                }
                min={0.012}
                max={0.08}
                step={0.002}
                display={String(
                  Math.round(
                    (selected?.type === 'free-text'
                      ? selected.data.fontSize
                      : annotationStyle.textSize) * 1000,
                  ),
                )}
                onChange={(fontSize) =>
                  applyStyle({ textSize: fontSize }, (a) =>
                    a.type === 'free-text'
                      ? {
                          data: {
                            ...a.data,
                            fontSize,
                          } as FreeTextAnnotation['data'],
                        }
                      : null,
                  )
                }
              />
              <div className="dv-anno-field-grid">
                <label className="dv-anno-select-field">
                  Font
                  <select
                    value={
                      selected?.type === 'free-text'
                        ? selected.data.fontFamily ??
                          annotationStyle.textFontFamily
                        : annotationStyle.textFontFamily
                    }
                    onChange={(e) =>
                      applyStyle({ textFontFamily: e.target.value }, (a) =>
                        a.type === 'free-text'
                          ? {
                              data: {
                                ...a.data,
                                fontFamily: e.target.value,
                              } as FreeTextAnnotation['data'],
                            }
                          : null,
                      )
                    }
                  >
                    <option value="sans-serif">Sans</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Mono</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Courier New', monospace">Courier</option>
                  </select>
                </label>
                <label className="dv-anno-select-field">
                  Align
                  <select
                    value={
                      selected?.type === 'free-text'
                        ? selected.data.textAlign ?? annotationStyle.textAlign
                        : annotationStyle.textAlign
                    }
                    onChange={(e) => {
                      const textAlign = e.target.value as TextAlign;
                      applyStyle({ textAlign }, (a) =>
                        a.type === 'free-text'
                          ? {
                              data: {
                                ...a.data,
                                textAlign,
                              } as FreeTextAnnotation['data'],
                            }
                          : null,
                      );
                    }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>
              <div className="dv-anno-toggles">
                <TogglePill
                  label="Bold"
                  checked={
                    selected?.type === 'free-text'
                      ? selected.data.fontWeight === 'bold'
                      : annotationStyle.textBold
                  }
                  onChange={(v) =>
                    applyStyle({ textBold: v }, (a) =>
                      a.type === 'free-text'
                        ? {
                            data: {
                              ...a.data,
                              fontWeight: v ? 'bold' : 'normal',
                            } as FreeTextAnnotation['data'],
                          }
                        : null,
                    )
                  }
                />
                <TogglePill
                  label="Italic"
                  checked={
                    selected?.type === 'free-text'
                      ? selected.data.fontStyle === 'italic'
                      : annotationStyle.textItalic
                  }
                  onChange={(v) =>
                    applyStyle({ textItalic: v }, (a) =>
                      a.type === 'free-text'
                        ? {
                            data: {
                              ...a.data,
                              fontStyle: v ? 'italic' : 'normal',
                            } as FreeTextAnnotation['data'],
                          }
                        : null,
                    )
                  }
                />
                <TogglePill
                  label="Underline"
                  checked={
                    selected?.type === 'free-text'
                      ? Boolean(selected.data.underline)
                      : annotationStyle.textUnderline
                  }
                  onChange={(v) =>
                    applyStyle({ textUnderline: v }, (a) =>
                      a.type === 'free-text'
                        ? {
                            data: {
                              ...a.data,
                              underline: v,
                            } as FreeTextAnnotation['data'],
                          }
                        : null,
                    )
                  }
                />
                <TogglePill
                  label="Background"
                  checked={
                    selected?.type === 'free-text'
                      ? Boolean(selected.data.backgroundColor)
                      : annotationStyle.textBackgroundEnabled
                  }
                  onChange={(v) =>
                    applyStyle({ textBackgroundEnabled: v }, (a) => {
                      if (a.type !== 'free-text') return null;
                      if (v) {
                        return {
                          data: {
                            ...a.data,
                            backgroundColor: annotationStyle.textBackground,
                          } as FreeTextAnnotation['data'],
                        };
                      }
                      const { backgroundColor: _bg, ...rest } = a.data;
                      return { data: rest as FreeTextAnnotation['data'] };
                    })
                  }
                />
              </div>
              {((selected?.type === 'free-text' &&
                selected.data.backgroundColor) ||
                (!selected && annotationStyle.textBackgroundEnabled)) && (
                <ColorSwatches
                  label="Background color"
                  value={
                    selected?.type === 'free-text' &&
                    selected.data.backgroundColor
                      ? selected.data.backgroundColor
                      : annotationStyle.textBackground
                  }
                  onChange={(color) =>
                    applyStyle({ textBackground: color }, (a) =>
                      a.type === 'free-text'
                        ? {
                            data: {
                              ...a.data,
                              backgroundColor: color,
                            } as FreeTextAnnotation['data'],
                          }
                        : null,
                    )
                  }
                />
              )}
            </div>
          )}

          {canResizeSize && size && (
            <div className="dv-anno-modal-section">
              <div className="dv-anno-modal-section-head">
                <span>Size</span>
                <span className="dv-anno-hint">or drag handles on page</span>
              </div>
              <SliderRow
                label="Width"
                value={size.w}
                min={0.02}
                max={0.95}
                step={0.01}
                display={pct(size.w)}
                onChange={(w) => {
                  if (!selected) return;
                  const next =
                    selected.type === 'highlight'
                      ? setHighlightSize(selected, w, size.h)
                      : setShapeSize(selected, w, size.h);
                  if (next) commit(next);
                }}
              />
              <SliderRow
                label="Height"
                value={size.h}
                min={0.02}
                max={0.95}
                step={0.01}
                display={pct(size.h)}
                onChange={(h) => {
                  if (!selected) return;
                  const next =
                    selected.type === 'highlight'
                      ? setHighlightSize(selected, size.w, h)
                      : setShapeSize(selected, size.w, h);
                  if (next) commit(next);
                }}
              />
            </div>
          )}

          <div className="dv-anno-preview">
            <span className="dv-anno-preview-label">Preview</span>
            <div className="dv-anno-preview-canvas">
              {isHighlight && (
                <div
                  className="dv-anno-preview-hl"
                  style={{
                    background: primaryColor,
                    opacity:
                      selected?.type === 'highlight'
                        ? selected.opacity
                        : annotationStyle.highlightOpacity,
                  }}
                />
              )}
              {isInk && (
                <svg width="100%" height="40" viewBox="0 0 200 40">
                  <path
                    d="M10 28 C 40 8, 70 32, 100 18 S 160 8, 190 22"
                    fill="none"
                    stroke={primaryColor}
                    strokeOpacity={
                      selected?.type === 'ink'
                        ? selected.opacity
                        : annotationStyle.inkOpacity
                    }
                    strokeWidth={
                      (selected?.type === 'ink'
                        ? selected.data.thickness
                        : annotationStyle.inkThickness) * 400
                    }
                    strokeLinecap="round"
                    strokeDasharray={
                      (selected?.type === 'ink'
                        ? selected.data.dashed
                        : annotationStyle.inkDashed)
                        ? '6 5'
                        : undefined
                    }
                  />
                </svg>
              )}
              {isShapeMode && (
                <svg width="100%" height="56" viewBox="0 0 200 56">
                  <rect
                    x="30"
                    y="10"
                    width="140"
                    height="36"
                    rx="6"
                    fill={
                      filled
                        ? selected?.type === 'shape' && selected.data.fillColor
                          ? selected.data.fillColor
                          : annotationStyle.shapeFillColor
                        : 'none'
                    }
                    fillOpacity={
                      filled
                        ? selected?.type === 'shape' &&
                          selected.data.fillOpacity != null
                          ? selected.data.fillOpacity
                          : annotationStyle.shapeFillOpacity
                        : 0
                    }
                    stroke={primaryColor}
                    strokeOpacity={
                      selected?.type === 'shape'
                        ? selected.opacity
                        : annotationStyle.shapeOpacity
                    }
                    strokeWidth={
                      (selected?.type === 'shape'
                        ? selected.data.strokeWidth
                        : annotationStyle.shapeThickness) * 500
                    }
                    strokeDasharray={
                      (selected?.type === 'shape'
                        ? selected.data.dashed
                        : annotationStyle.shapeDashed)
                        ? '8 5'
                        : undefined
                    }
                  />
                </svg>
              )}
              {isText && (
                <span
                  style={{
                    color: primaryColor,
                    opacity:
                      selected?.type === 'free-text'
                        ? selected.opacity
                        : annotationStyle.textOpacity,
                    fontWeight:
                      selected?.type === 'free-text'
                        ? selected.data.fontWeight
                        : annotationStyle.textBold
                          ? 'bold'
                          : 'normal',
                    fontStyle:
                      selected?.type === 'free-text'
                        ? selected.data.fontStyle
                        : annotationStyle.textItalic
                          ? 'italic'
                          : 'normal',
                    textDecoration:
                      (selected?.type === 'free-text'
                        ? selected.data.underline
                        : annotationStyle.textUnderline)
                        ? 'underline'
                        : undefined,
                    fontFamily:
                      selected?.type === 'free-text'
                        ? selected.data.fontFamily
                        : annotationStyle.textFontFamily,
                    background:
                      selected?.type === 'free-text' &&
                      selected.data.backgroundColor
                        ? selected.data.backgroundColor
                        : annotationStyle.textBackgroundEnabled
                          ? annotationStyle.textBackground
                          : 'transparent',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 16,
                  }}
                >
                  Sample text
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="dv-anno-modal-footer">
          {selected ? (
            <>
              <button
                type="button"
                className="dv-anno-btn dv-anno-btn-danger"
                onClick={() => {
                  deleteAnnotation(selected.id);
                  setOpen(false);
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="dv-anno-btn dv-anno-btn-primary"
                onClick={dismissKeepSelection}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="dv-anno-btn dv-anno-btn-ghost"
                onClick={closeAndExit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dv-anno-btn dv-anno-btn-primary"
                onClick={startDrawing}
              >
                Draw on page
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const AnnotationFormatBar = AnnotationStyleModal;
