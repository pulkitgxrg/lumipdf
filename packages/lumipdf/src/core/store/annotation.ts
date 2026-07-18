import type { StateCreator } from 'zustand';
import type {
  Annotation,
  AnnotationTool,
  AnnotationChangeListener,
  AnnotationStyle,
} from '../types';

export interface AnnotationSlice {
  annotations: Annotation[];
  activeAnnotationTool: AnnotationTool | null;
  selectedAnnotationId: string | null;
  annotationStyle: AnnotationStyle;

  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (
    id: string,
    patch: Partial<Omit<Annotation, 'id' | 'pageIndex' | 'type'>>,
  ) => void;
  deleteAnnotation: (id: string) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  clearAnnotations: () => void;
  selectAnnotation: (id: string | null) => void;
  setActiveTool: (tool: AnnotationTool | null) => void;
  setAnnotationStyle: (style: Partial<AnnotationStyle>) => void;
  onAnnotationChange: (cb: AnnotationChangeListener) => () => void;
  _resetAnnotations: () => void;
}

export const createAnnotationSlice: StateCreator<
  AnnotationSlice,
  [],
  [],
  AnnotationSlice
> = (set, get) => {
  const listeners = new Set<AnnotationChangeListener>();

  const notify = (annotations: Annotation[]) => {
    for (const cb of listeners) {
      cb(annotations);
    }
  };

  return {
    annotations: [],
    activeAnnotationTool: null,
    selectedAnnotationId: null,
    annotationStyle: {
      highlightColor: '#ffd400',
      highlightOpacity: 0.4,
      shapeColor: '#5f8a2e',
      shapeOpacity: 1,
      shapeThickness: 0.003,
      shapeDashed: false,
      shapeFilled: false,
      shapeFillColor: '#5f8a2e',
      shapeFillOpacity: 0.25,
      inkColor: '#ef4444',
      inkOpacity: 1,
      inkThickness: 0.004,
      inkDashed: false,
      textColor: '#111827',
      textOpacity: 1,
      textSize: 0.024,
      textBold: false,
      textItalic: false,
      textUnderline: false,
      textAlign: 'left',
      textFontFamily: 'sans-serif',
      textBackground: '#fef08a',
      textBackgroundEnabled: false,
    },

    addAnnotation: (annotation: Annotation) => {
      const next = [...get().annotations, annotation];
      set({ annotations: next });
      notify(next);
    },

    updateAnnotation: (
      id: string,
      patch: Partial<Omit<Annotation, 'id' | 'pageIndex' | 'type'>>,
    ) => {
      const next = get().annotations.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
      ) as Annotation[];
      set({ annotations: next });
      notify(next);
    },

    deleteAnnotation: (id: string) => {
      const next = get().annotations.filter((a) => a.id !== id);
      set({
        annotations: next,
        selectedAnnotationId:
          get().selectedAnnotationId === id ? null : get().selectedAnnotationId,
      });
      notify(next);
    },

    setAnnotations: (annotations: Annotation[]) => {
      const next = [...annotations];
      set({ annotations: next, selectedAnnotationId: null });
      notify(next);
    },

    clearAnnotations: () => {
      const had = get().annotations.length > 0;
      set({ annotations: [], selectedAnnotationId: null });
      if (had) notify([]);
    },

    selectAnnotation: (id: string | null) =>
      set({ selectedAnnotationId: id }),

    setActiveTool: (tool: AnnotationTool | null) =>
      set({ activeAnnotationTool: tool }),

    setAnnotationStyle: (style: Partial<AnnotationStyle>) =>
      set((state) => ({ annotationStyle: { ...state.annotationStyle, ...style } })),

    onAnnotationChange: (cb: AnnotationChangeListener) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },

    _resetAnnotations: () => {
      const had = get().annotations.length > 0;
      set({
        annotations: [],
        selectedAnnotationId: null,
        activeAnnotationTool: null,
      });
      if (had) notify([]);
    },
  };
};
