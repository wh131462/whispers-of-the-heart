import { useCallback, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileInfo } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  fileInfo: FileInfo | null;
  onClear: () => void;
}

export function FileUpload({
  onFileSelect,
  fileInfo,
  onClear,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (fileInfo) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-4',
          'bg-zinc-50 rounded-lg',
          'border border-zinc-200'
        )}
      >
        <File className="w-8 h-8 text-emerald-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-800 truncate">
            {fileInfo.name}
          </p>
          <p className="text-xs text-zinc-500">
            {fileInfo.type || '未知类型'} &bull; {formatFileSize(fileInfo.size)}
          </p>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded hover:bg-zinc-200 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8',
        'bg-zinc-50 rounded-lg',
        'border-2 border-dashed border-zinc-300',
        'cursor-pointer transition-colors',
        'hover:border-emerald-400 hover:bg-zinc-100'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
      />
      <Upload className="w-8 h-8 text-zinc-400" />
      <div className="text-center">
        <p className="text-sm text-zinc-600">点击或拖拽文件到此处</p>
        <p className="text-xs text-zinc-500 mt-1">支持任意文件类型</p>
      </div>
    </div>
  );
}
