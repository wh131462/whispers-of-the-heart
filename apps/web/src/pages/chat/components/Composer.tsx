import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Square, MessageSquarePlus, BookOpen, BookX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { ModelSwitcher } from './ModelSwitcher';

interface ComposerProps {
  onOpenSettings?: () => void;
}

export const Composer: React.FC<ComposerProps> = ({ onOpenSettings }) => {
  const [input, setInput] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = useAiChatStore(s => s.isStreaming);
  const knowledgeEnabled = useAiChatStore(s => s.knowledgeEnabled);
  const setKnowledgeEnabled = useAiChatStore(s => s.setKnowledgeEnabled);
  const sendMessage = useAiChatStore(s => s.sendMessage);
  const stop = useAiChatStore(s => s.stop);
  const createConv = useAiChatStore(s => s.createConversation);

  const canSend = input.trim().length > 0 && !isStreaming;

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const submit = async () => {
    if (!canSend) return;
    const text = input;
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    await sendMessage(text);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="px-3 sm:px-4 pt-4 pb-3">
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            'rounded-3xl border border-gray-200 dark:border-gray-700',
            'bg-white dark:bg-gray-800',
            'shadow-sm hover:shadow-md transition-shadow',
            'focus-within:shadow-md focus-within:border-gray-300 dark:focus-within:border-gray-600'
          )}
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="给 AI 发消息..."
            className={cn(
              'w-full resize-none bg-transparent text-sm leading-6',
              'min-h-[48px] max-h-[200px]',
              'px-5 pt-4 pb-2 focus:outline-none',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500'
            )}
          />

          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <ModelSwitcher onOpenSettings={onOpenSettings} />
              <button
                onClick={() => setKnowledgeEnabled(!knowledgeEnabled)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                  knowledgeEnabled
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                title={
                  knowledgeEnabled
                    ? '知识库已开启（点击关闭）'
                    : '知识库已关闭（点击开启）'
                }
              >
                {knowledgeEnabled ? (
                  <BookOpen className="w-3.5 h-3.5" />
                ) : (
                  <BookX className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => createConv()}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs',
                  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                )}
                title="新对话"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming && (
                <button
                  onClick={stop}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
                    'hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                  )}
                >
                  <Square className="w-3 h-3" />
                  停止
                </button>
              )}
              <button
                onClick={submit}
                disabled={!canSend}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  canSend
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                )}
                aria-label="发送"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
