import React, { useState } from 'react';
import {
  Copy,
  Pencil,
  RefreshCw,
  User as UserIcon,
  Bot,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { AiMessage } from '@whispers/types';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { Markdown } from './Markdown';

interface MessageItemProps {
  message: AiMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const regenerate = useAiChatStore(s => s.regenerate);
  const editUserMessage = useAiChatStore(s => s.editUserMessage);
  const isStreaming = useAiChatStore(s => s.isStreaming);

  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-3 py-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
        )}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : '')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2 text-left',
            isUser
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'max-w-full'
          )}
        >
          {editing ? (
            <div className="min-w-[16rem]">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                className="w-full bg-white/10 rounded-md p-2 text-sm text-current outline-none"
              />
              <div className="mt-2 flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(false)}
                  className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    setEditing(false);
                    await editUserMessage(message.id, editText);
                  }}
                  className="px-2 py-1 text-xs rounded bg-white text-primary hover:bg-white/90"
                >
                  发送
                </button>
              </div>
            </div>
          ) : isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <>
              {message.content.length === 0 && message.isStreaming ? (
                <div className="flex items-center gap-1 text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse [animation-delay:0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse [animation-delay:0.3s]" />
                </div>
              ) : (
                <Markdown content={message.content} />
              )}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">参考来源：</span>
                  {message.sources.map((s, i) => (
                    <span key={s.slug}>
                      {i > 0 && '、'}
                      <Link
                        to={`/posts/${s.slug}`}
                        className="text-primary hover:underline"
                      >
                        {s.title}
                      </Link>
                    </span>
                  ))}
                </div>
              )}
              {message.error && (
                <div className="mt-2 flex items-start gap-1 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{message.error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {!editing && (
          <div
            className={cn(
              'mt-1 flex items-center gap-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <button
              onClick={handleCopy}
              className="text-xs flex items-center gap-1 hover:text-primary"
              aria-label="复制"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? '已复制' : '复制'}
            </button>
            {isUser && (
              <button
                onClick={() => {
                  setEditText(message.content);
                  setEditing(true);
                }}
                disabled={isStreaming}
                className="text-xs flex items-center gap-1 hover:text-primary disabled:opacity-40"
                aria-label="编辑"
              >
                <Pencil className="w-3.5 h-3.5" />
                编辑
              </button>
            )}
            {isAssistant && !message.isStreaming && (
              <button
                onClick={() => regenerate(message.id)}
                disabled={isStreaming}
                className="text-xs flex items-center gap-1 hover:text-primary disabled:opacity-40"
                aria-label="重新生成"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新生成
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
