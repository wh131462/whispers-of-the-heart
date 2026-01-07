import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  dataUrl: string | null;
  fileType: string | null;
}

export function ImagePreview({ dataUrl, fileType }: ImagePreviewProps) {
  if (!dataUrl || !fileType?.startsWith('image/')) {
    return null;
  }

  return (
    <div
      className={cn('p-4', 'bg-zinc-50 rounded-lg', 'border border-zinc-200')}
    >
      <p className="text-xs font-medium text-zinc-600 mb-3">图片预览</p>
      <div className="flex justify-center">
        <img
          src={dataUrl}
          alt="Preview"
          className="max-w-full max-h-48 rounded-lg object-contain"
        />
      </div>
    </div>
  );
}
