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
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-gray-100 dark:via-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
          有什么可以帮你的？
        </h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-md">
          直接在下方输入你的问题，AI 会基于站内内容为你解答。
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto">
        {conv.messages.map(m => (
          <MessageItem key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
