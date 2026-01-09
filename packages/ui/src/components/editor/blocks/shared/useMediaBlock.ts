import { useState, useCallback, useRef, useEffect } from 'react';

export type MediaWidth = '25%' | '50%' | '75%' | '100%';
export type MediaAlign = 'left' | 'center' | 'right';

interface UseMediaBlockOptions {
  url: string;
  onUrlChange: (url: string) => void;
  minWidth?: number;
  maxWidth?: number;
}

// 延迟时间，防止初始化时意外选中（毫秒）
const MOUNT_DELAY = 200;

interface UseMediaBlockReturn {
  // URL 输入状态
  isUrlInput: boolean;
  setIsUrlInput: (v: boolean) => void;
  urlInputValue: string;
  setUrlInputValue: (v: string) => void;
  handleUrlSubmit: () => void;
  handleUrlCancel: () => void;

  // 拖拽状态
  isDragging: boolean;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, onFile?: (file: File) => void) => void;

  // 粘贴处理
  handlePaste: (e: React.ClipboardEvent) => void;

  // 删除
  handleRemove: () => void;

  // 选中状态
  isSelected: boolean;
  setIsSelected: (v: boolean) => void;

  // 宽度调整
  resizing: boolean;
  handleResizeStart: (
    e: React.MouseEvent,
    side: 'left' | 'right',
    currentWidth: number,
    containerRef: React.RefObject<HTMLElement | null>,
    onWidthChange: (width: number) => void
  ) => void;
}

export function useMediaBlock({
  url,
  onUrlChange,
  minWidth = 25,
  maxWidth = 100,
}: UseMediaBlockOptions): UseMediaBlockReturn {
  const [isUrlInput, setIsUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(url || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [resizing, setResizing] = useState(false);

  const dragCounter = useRef(0);
  // 组件挂载稳定后才允许选中，防止初始化时意外选中
  const isMountedStableRef = useRef(false);

  // 同步外部 url 变化
  useEffect(() => {
    setUrlInputValue(url || '');
  }, [url]);

  // 组件挂载后延迟设置稳定状态
  useEffect(() => {
    const timer = setTimeout(() => {
      isMountedStableRef.current = true;
    }, MOUNT_DELAY);
    return () => {
      clearTimeout(timer);
      isMountedStableRef.current = false;
    };
  }, []);

  // 安全的设置选中状态函数，只有在组件稳定后才允许选中
  const safeSetIsSelected = useCallback((value: boolean) => {
    // 取消选中总是允许的，但选中需要组件已稳定
    if (value === false || isMountedStableRef.current) {
      setIsSelected(value);
    }
  }, []);

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlInputValue.trim();
    if (trimmed) {
      onUrlChange(trimmed);
      setIsUrlInput(false);
    }
  }, [urlInputValue, onUrlChange]);

  const handleUrlCancel = useCallback(() => {
    setIsUrlInput(false);
    setUrlInputValue(url || '');
  }, [url]);

  const handleRemove = useCallback(() => {
    onUrlChange('');
    setUrlInputValue('');
  }, [onUrlChange]);

  // 拖拽处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, onFile?: (file: File) => void) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = e.dataTransfer.files;
      if (files.length > 0 && onFile) {
        onFile(files[0]);
      }
    },
    []
  );

  // 粘贴处理
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData('text');
      if (text && isValidUrl(text)) {
        e.preventDefault();
        onUrlChange(text.trim());
      }
    },
    [onUrlChange]
  );

  // 宽度调整
  const handleResizeStart = useCallback(
    (
      e: React.MouseEvent,
      side: 'left' | 'right',
      currentWidth: number,
      containerRef: React.RefObject<HTMLElement | null>,
      onWidthChange: (width: number) => void
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing(true);

      const startX = e.clientX;
      const startWidth = currentWidth;
      const parentWidth =
        containerRef.current?.parentElement?.offsetWidth || 800;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaPercent = (deltaX / parentWidth) * 100;

        let newWidth: number;
        if (side === 'right') {
          newWidth = startWidth + deltaPercent;
        } else {
          newWidth = startWidth - deltaPercent;
        }

        // 限制范围并对齐到 5% 刻度
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newWidth = Math.round(newWidth / 5) * 5;

        onWidthChange(newWidth);
      };

      const handleMouseUp = () => {
        setResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [minWidth, maxWidth]
  );

  return {
    isUrlInput,
    setIsUrlInput,
    urlInputValue,
    setUrlInputValue,
    handleUrlSubmit,
    handleUrlCancel,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    handleRemove,
    isSelected,
    setIsSelected: safeSetIsSelected,
    resizing,
    handleResizeStart,
  };
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
