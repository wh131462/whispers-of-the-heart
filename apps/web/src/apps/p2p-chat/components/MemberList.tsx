import { cn } from '@/lib/utils';
import { User, Crown } from 'lucide-react';
import type { PeerInfo } from '../types';

interface MemberListProps {
  open: boolean;
  onClose: () => void;
  members: PeerInfo[];
  currentUserName: string;
}

export function MemberList({
  open,
  onClose,
  members,
  currentUserName,
}: MemberListProps) {
  if (!open) return null;

  // 包含自己的完整成员列表
  const allMembers = [
    { id: 'self', name: currentUserName, isSelf: true },
    ...members.map(m => ({ ...m, isSelf: false })),
  ];

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* 成员列表弹窗 */}
      <div
        className={cn(
          'absolute right-0 top-full mt-2 z-50',
          'w-48 py-2 rounded-xl',
          'bg-white border border-zinc-200',
          'shadow-lg shadow-zinc-200/50',
          'animate-in fade-in slide-in-from-top-2 duration-200'
        )}
      >
        <div className="px-3 py-1.5 border-b border-zinc-100">
          <p className="text-xs font-medium text-zinc-500">
            在线成员 ({allMembers.length})
          </p>
        </div>

        <div className="max-h-48 overflow-y-auto">
          {allMembers.map(member => (
            <div
              key={member.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'hover:bg-zinc-50 transition-colors'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center',
                  member.isSelf ? 'bg-amber-100' : 'bg-zinc-100'
                )}
              >
                {member.isSelf ? (
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm truncate',
                    member.isSelf
                      ? 'font-medium text-amber-700'
                      : 'text-zinc-700'
                  )}
                >
                  {member.name}
                </p>
                {member.isSelf && (
                  <p className="text-[10px] text-amber-500">我</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
