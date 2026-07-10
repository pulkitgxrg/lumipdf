import { useCallback, useRef, useState } from 'react';
import type { FileSource } from '../core/types';

interface UseFileInputOptions {
  /** Accepted file extensions (e.g. ['.pdf']) or MIME types (e.g. ['application/pdf']) */
  accept?: string[];
  /** Called when a valid file is selected or dropped */
  onFile: (source: FileSource) => void;
  /** Allow multiple file selection (default: false) */
  multiple?: boolean;
  /** Optional callback when file is rejected due to type filtering */
  onError?: (message: string) => void;
}

export function useFileInput(options: UseFileInputOptions) {
  const { accept, onFile, onError } = options;

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFile({ kind: 'file', file });
      }

      e.target.value = '';
    },
    [onFile]
  );

  const isFileAccepted = useCallback(
    (file: File): boolean => {
      if (!accept || accept.length === 0) return true;

      const extension = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
      const mimeType = file.type;

      return accept.some((a) => {
        const normalized = a.toLowerCase();
        return normalized === extension || normalized === mimeType;
      });
    },
    [accept]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0]!;

      if (isFileAccepted(file)) {
        onFile({ kind: 'file', file });
      } else {
        onError?.(`File type not supported. Accepted: ${accept?.join(', ')}`);
      }
    },
    [onFile, isFileAccepted, onError, accept]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const dragProps = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  } as const;

  return {
    inputRef,
    isDragging,
    openPicker,
    handleInputChange,
    dragProps,
  };
}
