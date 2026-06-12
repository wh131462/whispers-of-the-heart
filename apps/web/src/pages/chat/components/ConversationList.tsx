import React, { useMemo, useState } from 'react';
import {
  MessageSquarePlus,
  Trash2,
  Pencil,
  Check,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiChatStore } from '@/stores/useAiChatStore';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { AiConversation } from '@whispers/types';

interface ConversationListProps {
  className?: string;
  onSelect?: () => void;
}

type Group = { label: string; items: AiConversation[] };

const DAY_MS = 24 * 60 * 60 * 1000;

function groupConversations(items: AiConversation[]): Group[] {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const yesterday = today - DAY_MS;
  const last7 = today - 7 * DAY_MS;
  const last30 = today - 30 * DAY_MS;

  const buckets: Record<string, AiConversation[]> = {
    今天: [],
    昨天: [],
    最近一周: [],
    最近一个月: [],
    更早: [],
  };

  for (const c of [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )) {
    const t = new Date(c.updatedAt).getTime();
    if (t >= today) buckets['今天'].push(c);
    else if (t >= yesterday) buckets['昨天'].push(c);
    else if (t >= last7) buckets['最近一周'].push(c);
    else if (t >= last30) buckets['最近一个月'].push(c);
    else buckets['更早'].push(c);
  }

  return Object.entries(buckets)
    .filter(([, v]) => v.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export const ConversationList: React.FC<ConversationListProps> = ({
  className,
  onSelect,
}) => {
  const conversations = useAiChatStore(s => s.conversations);
  const activeId = useAiChatStore(s => s.activeConversationId);
  const setActive = useAiChatStore(s => s.setActiveConversation);
  const createConv = useAiChatStore(s => s.createConversation);
  const removeConv = useAiChatStore(s => s.deleteConversation);
  const renameConv = useAiChatStore(s => s.renameConversation);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const groups = useMemo(
    () => groupConversations(conversations),
    [conversations]
  );

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
    setMenuOpenId(null);
  };
  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) renameConv(editingId, editTitle.trim());
    setEditingId(null);
    setEditTitle('');
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-50 dark:bg-gray-900/50',
        className
      )}
      onClick={() => setMenuOpenId(null)}
    >
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => {
            createConv();
            onSelect?.();
          }}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'text-gray-700 dark:text-gray-200 text-sm font-medium',
            'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
            'shadow-sm'
          )}
        >
          <MessageSquarePlus className="w-4 h-4" />
          新建会话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-3">
        {conversations.length === 0 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
            暂无会话
          </div>
        )}

        {groups.map(group => (
          <div key={group.label}>
            <div className="px-2 mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(conv => {
                const active = conv.id === activeId;
                const isEditing = editingId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex items-center gap-1 rounded-lg pl-3 pr-1 py-2 cursor-pointer text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                    )}
                    onClick={() => {
                      if (isEditing) return;
                      setActive(conv.id);
                      onSelect?.();
                    }}
                  >
                    {isEditing ? (
                      <>
                        <input
                          value={editTitle}
                          autoFocus
                          onChange={e => setEditTitle(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 min-w-0 bg-transparent border-b border-primary/40 text-sm outline-none"
                        />
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSaveEdit();
                          }}
                          className="p-1 text-green-600 hover:text-green-700"
                          aria-label="保存"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          aria-label="取消"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{conv.title}</span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setMenuOpenId(
                              menuOpenId === conv.id ? null : conv.id
                            );
                          }}
                          className={cn(
                            'p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity',
                            menuOpenId === conv.id
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          )}
                          aria-label="更多"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {menuOpenId === conv.id && (
                          <div
                            className={cn(
                              'absolute right-1 top-full mt-1 z-10 min-w-[120px]',
                              'rounded-lg border border-gray-200 dark:border-gray-700',
                              'bg-white dark:bg-gray-900 shadow-lg py-1'
                            )}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                handleStartEdit(conv.id, conv.title)
                              }
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              重命名
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                setPendingDelete({
                                  id: conv.id,
                                  title: conv.title,
                                });
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              删除
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeConv(pendingDelete.id);
          setPendingDelete(null);
        }}
        title="删除会话"
        description={
          pendingDelete
            ? `确定要删除会话「${pendingDelete.title}」吗？此操作不可撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
};
