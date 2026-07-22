import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ShieldCheck, ChevronDown, Check, Bot } from 'lucide-react';
import { SERVER_DEFAULT_PROVIDER_ID } from '@whispers/types';
import { cn } from '@/lib/utils';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { getAllProviders } from '@/stores/aiChatBuiltins';

interface ModelSwitcherProps {
  onOpenSettings?: () => void;
}

export const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  onOpenSettings,
}) => {
  const userProviders = useAiChatStore(s => s.userProviders);
  const activeProviderId = useAiChatStore(s => s.activeProviderId);
  const setActive = useAiChatStore(s => s.setActiveProvider);

  const allProviders = useMemo(
    () => getAllProviders(userProviders),
    [userProviders]
  );
  const availableProviders = useMemo(
    () => allProviders.filter(p => p.isServerDefault || !p.isPreset),
    [allProviders]
  );
  const activeProvider = useMemo(
    () =>
      availableProviders.find(p => p.id === activeProviderId) ??
      availableProviders.find(p => p.id === SERVER_DEFAULT_PROVIDER_ID),
    [availableProviders, activeProviderId]
  );

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs',
          'text-stone-600 dark:text-stone-300',
          'hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors'
        )}
        title="切换模型"
      >
        <span className="truncate max-w-[120px] font-medium">
          {activeProvider?.name ?? '选择模型'}
        </span>
        <ChevronDown
          className={cn(
            'w-3 h-3 transition-transform text-stone-400 dark:text-stone-500',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute bottom-full mb-2 left-0 z-30 min-w-[220px]',
            'rounded-xl border border-stone-200 dark:border-white/[0.09]',
            'bg-white dark:bg-[#211d1a] shadow-lg dark:shadow-black/45 overflow-hidden'
          )}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {availableProviders.map(p => {
              const isActive = activeProviderId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActive(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm',
                    'hover:bg-stone-50 dark:hover:bg-white/[0.055] transition-colors',
                    isActive && 'bg-stone-100 dark:bg-amber-100/[0.07]'
                  )}
                >
                  <div className="shrink-0 w-4 flex items-center justify-center">
                    {isActive ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : p.isServerDefault ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="truncate font-medium text-stone-800 dark:text-stone-100">
                      {p.name}
                    </span>
                    {!p.isServerDefault && p.model && (
                      <span className="ml-1.5 text-xs text-stone-400 dark:text-stone-500">
                        {p.model}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {onOpenSettings && (
            <div className="border-t border-stone-100 dark:border-white/[0.07]">
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
                className="w-full px-3 py-2 text-xs text-left text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.055] transition-colors"
              >
                管理配置...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
