import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Hash, Users, MessageSquare, Shield } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Hash,
    title: '约定房间码',
    description: '与好友约定一个相同的房间码，可以是任意文字或数字',
  },
  {
    icon: Users,
    title: '输入房间码',
    description: '双方分别输入相同的房间码并点击"加入房间"',
  },
  {
    icon: MessageSquare,
    title: '开始聊天',
    description: '连接成功后即可发送消息，支持多人同时在线',
  },
];

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  if (!open) return null;

  return (
    <AlertDialog>
      <AlertDialogOverlay onClick={onClose} />
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">
            如何使用 P2P 聊天
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            <div className="space-y-4 mt-4">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                      'bg-amber-100 text-amber-600'
                    )}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-800 text-sm">
                      {step.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex gap-2 items-start">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-emerald-700">
                    端到端加密
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    所有消息通过 WebRTC 直接传输，不经过任何服务器
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600"
          >
            知道了
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
