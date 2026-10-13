import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

interface DragFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface UseWebDragDropOptions {
  onFileDrop?: (file: DragFile) => void;
  enabled?: boolean;
}

interface UseWebDragDropReturn {
  dropRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
}

export const useWebDragDrop = (
  options: UseWebDragDropOptions = {}
): UseWebDragDropReturn => {
  const { onFileDrop, enabled = true } = options;
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const processFile = useCallback(
    (file: File) => {
      const uri = URL.createObjectURL(file);
      const dragFile: DragFile = {
        uri,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
      };
      onFileDrop?.(dragFile);
    },
    [onFileDrop]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || !onFileDrop) return;

    const el = dropRef.current;
    if (!el) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    };

    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);

    return () => {
      el.removeEventListener('dragenter', handleDragEnter);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('drop', handleDrop);
    };
  }, [enabled, onFileDrop, processFile]);

  return { dropRef, isDragging };
};
