import { useState, useCallback, useRef } from 'react';
import { Upload, FileUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  hasPeers: boolean;
}

export function FileDropZone({
  onFilesSelected,
  disabled,
  hasPeers,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && hasPeers) {
        setIsDragging(true);
      }
    },
    [disabled, hasPeers]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || !hasPeers) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [disabled, hasPeers, onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (!disabled && hasPeers) {
      fileInputRef.current?.click();
    }
  }, [disabled, hasPeers]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // 清空 input 以允许重复选择同一文件
      e.target.value = '';
    },
    [onFilesSelected]
  );

  const isDisabled = disabled || !hasPeers;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-6',
        'border-2 border-dashed rounded-xl',
        'transition-all cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : isDisabled
            ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed'
            : 'border-zinc-300 bg-zinc-50/50 hover:border-blue-400 hover:bg-blue-50/50'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      {!hasPeers ? (
        <>
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600">
              等待其他用户加入
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              需要至少一个对方才能传输文件
            </p>
          </div>
        </>
      ) : isDragging ? (
        <>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
            <FileUp className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-blue-600">松开以发送文件</p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
            <Upload className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600">拖拽文件到这里</p>
            <p className="text-xs text-zinc-400 mt-1">或点击选择文件</p>
          </div>
        </>
      )}
    </div>
  );
}
