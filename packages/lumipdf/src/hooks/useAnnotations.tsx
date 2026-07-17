import { useViewerStore } from './useDocumentViewer';

export function useAnnotations() {
  const annotations = useViewerStore((s) => s.annotations);
  const activeAnnotationTool = useViewerStore((s) => s.activeAnnotationTool);
  const selectedAnnotationId = useViewerStore((s) => s.selectedAnnotationId);
  const annotationStyle = useViewerStore((s) => s.annotationStyle);
  const addAnnotation = useViewerStore((s) => s.addAnnotation);
  const updateAnnotation = useViewerStore((s) => s.updateAnnotation);
  const deleteAnnotation = useViewerStore((s) => s.deleteAnnotation);
  const selectAnnotation = useViewerStore((s) => s.selectAnnotation);
  const setActiveTool = useViewerStore((s) => s.setActiveTool);
  const setAnnotationStyle = useViewerStore((s) => s.setAnnotationStyle);

  return {
    annotations,
    activeAnnotationTool,
    selectedAnnotationId,
    annotationStyle,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    setActiveTool,
    setAnnotationStyle,
  };
}
