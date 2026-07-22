import React, { useEffect, useRef } from 'react';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { MessageItem } from './MessageItem';

export const MessageList: React.FC = () => {
  const conv = useAiChatStore(s =>
    s.conversations.find(c => c.id === s.activeConversationId)
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [
    conv?.messages.length,
    conv?.messages[conv.messages.length - 1]?.content,
  ]);

  if (!conv || conv.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="mb-5 h-12 w-12 rounded-2xl border border-stone-200 dark:border-amber-100/10 bg-white dark:bg-[#211d1a] shadow-sm dark:shadow-black/30 flex items-center justify-center text-xl text-stone-600 dark:text-amber-100/80">
          ✦
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-stone-900 via-stone-600 to-stone-900 dark:from-amber-50 dark:via-stone-300 dark:to-amber-50 bg-clip-text text-transparent">
          有什么可以帮你的？
        </h1>
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 max-w-md">
          直接在下方输入你的问题，AI 会基于站内内容为你解答。
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 [scrollbar-color:rgba(120,113,108,0.35)_transparent]">
      <div className="max-w-3xl mx-auto">
        {conv.messages.map(m => (
          <MessageItem key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
