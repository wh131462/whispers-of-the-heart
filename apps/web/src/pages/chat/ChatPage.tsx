import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Settings as SettingsIcon,
  X,
  LogIn,
  AlertTriangle,
} from 'lucide-react';
import { SERVER_DEFAULT_PROVIDER_ID } from '@whispers/types';
import { cn } from '@/lib/utils';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getAllProviders } from '@/stores/aiChatBuiltins';
import { ConversationList } from './components/ConversationList';
import { MessageList } from './components/MessageList';
import { Composer } from './components/Composer';
import { ProviderSettingsDialog } from './components/ProviderSettingsDialog';

const ChatPage: React.FC = () => {
  const conversations = useAiChatStore(s => s.conversations);
  const activeConvId = useAiChatStore(s => s.activeConversationId);
  const setActiveConv = useAiChatStore(s => s.setActiveConversation);
  const createConv = useAiChatStore(s => s.createConversation);
  const userProviders = useAiChatStore(s => s.userProviders);
  const activeProviderId = useAiChatStore(s => s.activeProviderId);
  const activeProvider = useMemo(() => {
    const all = getAllProviders(userProviders);
    return (
      all.find(p => p.id === activeProviderId) ??
      all.find(p => p.id === SERVER_DEFAULT_PROVIDER_ID)
    );
  }, [userProviders, activeProviderId]);
  const lastError = useAiChatStore(s => s.lastError);
  const clearError = useAiChatStore(s => s.clearError);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const activeConversation = useMemo(
    () => conversations.find(c => c.id === activeConvId),
    [conversations, activeConvId]
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (conversations.length === 0) {
      createConv();
    } else if (!activeConvId) {
      setActiveConv(conversations[0].id);
    }
  }, []);

  const needLoginForDefault =
    activeProvider?.isServerDefault && !isAuthenticated;

  return (
    <div className="flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950">
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 w-64 shrink-0',
          'md:relative md:translate-x-0',
          'fixed inset-y-0 left-0 z-40 transition-transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 md:hidden border-b border-gray-200 dark:border-gray-800">
          <span className="text-sm font-medium">会话列表</span>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <ConversationList onSelect={() => setSidebarOpen(false)} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部：简洁标题栏 */}
        <header className="flex items-center gap-2 px-4 sm:px-6 h-12 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="打开会话列表"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {activeConversation?.title ?? '新会话'}
            </span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="设置"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </header>

        {needLoginForDefault && (
          <div className="mx-4 sm:mx-6 mb-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            使用「系统默认」配置需要先登录。
            <Link
              to="/login?redirect=/chat"
              className="inline-flex items-center gap-1 underline font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              去登录
            </Link>
          </div>
        )}

        {lastError && (
          <div className="mx-4 sm:mx-6 mb-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-xs flex items-center justify-between gap-2">
            <span>
              {lastError.message}
              {lastError.resetAt && (
                <>
                  {' · '}重置时间:{' '}
                  {new Date(lastError.resetAt).toLocaleString()}
                </>
              )}
            </span>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
              aria-label="关闭"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <MessageList />
        <Composer onOpenSettings={() => setSettingsOpen(true)} />
      </main>

      <ProviderSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default ChatPage;
