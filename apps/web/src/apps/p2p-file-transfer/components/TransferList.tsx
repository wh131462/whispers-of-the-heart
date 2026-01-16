import {
  Download,
  Upload,
  Check,
  X,
  Loader2,
  FileIcon,
  Trash2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileTransferItem } from '../types';

interface TransferListProps {
  transfers: FileTransferItem[];
  onDownload: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function TransferList({
  transfers,
  onDownload,
  onRemove,
}: TransferListProps) {
  if (transfers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-6">
        <FileIcon className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">暂无传输记录</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {transfers.map(item => (
        <TransferItem
          key={item.id}
          item={item}
          onDownload={onDownload}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface TransferItemProps {
  item: FileTransferItem;
  onDownload: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

function TransferItem({ item, onDownload, onRemove }: TransferItemProps) {
  const isSending = item.direction === 'send';
  const isCompleted = item.status === 'completed';
  const isFailed = item.status === 'failed';
  const isPending = item.status === 'pending';
  const isTransferring = item.status === 'transferring';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3',
        'bg-zinc-50 rounded-lg',
        'border',
        isFailed ? 'border-red-200' : 'border-zinc-100'
      )}
    >
      {/* 方向图标 */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          isSending
            ? 'bg-blue-100 text-blue-500'
            : 'bg-green-100 text-green-500'
        )}
      >
        {isSending ? (
          <Upload className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700 truncate">
            {item.name}
          </span>
          {isPending && (
            <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          )}
          {isTransferring && (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
          )}
          {isCompleted && (
            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          )}
          {isFailed && <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-400">
            {formatFileSize(item.size)}
          </span>
          <span className="text-xs text-zinc-300">&middot;</span>
          <span className="text-xs text-zinc-400">
            {isSending ? `发送给 ${item.peerName}` : `来自 ${item.peerName}`}
          </span>
        </div>

        {/* 进度条 */}
        {(isTransferring || (isCompleted && item.progress > 0)) && (
          <div className="mt-2">
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-zinc-400">{item.progress}%</span>
              {item.error && (
                <span className="text-xs text-red-500">{item.error}</span>
              )}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {isFailed && item.error && !isTransferring && (
          <p className="text-xs text-red-500 mt-1">{item.error}</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* 下载按钮（仅接收完成的文件） */}
        {!isSending && isCompleted && item.blob && (
          <button
            onClick={() => onDownload(item.id)}
            className={cn(
              'p-2 rounded-lg',
              'text-green-500 hover:bg-green-50',
              'transition-colors'
            )}
            title="下载文件"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* 删除按钮 */}
        {(isCompleted || isFailed) && (
          <button
            onClick={() => onRemove(item.id)}
            className={cn(
              'p-2 rounded-lg',
              'text-zinc-400 hover:text-red-500 hover:bg-red-50',
              'transition-colors'
            )}
            title="删除记录"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
