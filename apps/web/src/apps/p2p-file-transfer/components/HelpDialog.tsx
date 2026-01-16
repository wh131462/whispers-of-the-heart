import { X, Shield, Wifi, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div
        className={cn(
          'relative w-full max-w-md',
          'bg-white rounded-2xl shadow-xl',
          'animate-in fade-in-0 zoom-in-95'
        )}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-800">使用帮助</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-800">
                如何传输文件？
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                1. 创建或输入房间码加入房间
                <br />
                2. 将房间码分享给对方
                <br />
                3. 对方加入后，拖拽或选择文件即可传输
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-800">点对点传输</h3>
              <p className="text-sm text-zinc-500 mt-1">
                文件通过 WebRTC
                直接在两个浏览器之间传输，不经过服务器存储，速度更快、更安全。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-800">隐私安全</h3>
              <p className="text-sm text-zinc-500 mt-1">
                传输数据端到端加密，房间码仅用于连接建立，关闭页面后自动销毁。
              </p>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className={cn(
              'w-full py-2.5',
              'bg-zinc-100 hover:bg-zinc-200 text-zinc-700',
              'rounded-xl text-sm font-medium',
              'transition-colors'
            )}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
