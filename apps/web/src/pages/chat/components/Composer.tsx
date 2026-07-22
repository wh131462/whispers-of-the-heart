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
    <div className="px-3 sm:px-4 pt-4 pb-3 bg-gradient-to-t from-stone-100 via-stone-100/95 to-transparent dark:from-[#0e0c0b] dark:via-[#0e0c0b]/95 dark:to-transparent">
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            'rounded-3xl border border-stone-200 dark:border-white/[0.09]',
            'bg-white/95 dark:bg-[#1d1917]/95 backdrop-blur-xl',
            'shadow-sm hover:shadow-md dark:shadow-[0_18px_55px_rgba(0,0,0,0.32)] transition-all',
            'focus-within:shadow-md focus-within:border-stone-300 dark:focus-within:border-amber-100/20 dark:focus-within:ring-1 dark:focus-within:ring-amber-100/[0.06]'
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
              'text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500'
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
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 hover:bg-stone-100 dark:hover:text-stone-300 dark:hover:bg-white/[0.06]'
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
                  'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200',
                  'hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors'
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
                    'bg-stone-100 dark:bg-white/[0.07] text-stone-700 dark:text-stone-200',
                    'hover:bg-stone-200 dark:hover:bg-white/[0.1] transition-colors'
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
                    ? 'bg-stone-800 text-white hover:bg-stone-700 dark:bg-amber-100 dark:text-[#211b17] dark:hover:bg-amber-50 shadow-sm'
                    : 'bg-stone-100 dark:bg-white/[0.06] text-stone-400 dark:text-stone-600'
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
