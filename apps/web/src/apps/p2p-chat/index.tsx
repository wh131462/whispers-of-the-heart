import { useState, useCallback, useEffect } from 'react';
import { Info, LogOut } from 'lucide-react';
import { ChatShell } from './components/ChatShell';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ConnectionPanel } from './components/ConnectionPanel';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { HelpDialog } from './components/HelpDialog';
import { useRoom } from './hooks/useWebRTC';
import { useChat } from './hooks/useChat';
import type { MessagePayload } from './types';

// 生成默认用户名
function generateDefaultName() {
  return `用户${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function P2PChat() {
  const [showHelp, setShowHelp] = useState(false);
  const [userName, setUserName] = useState(generateDefaultName);
  const { messages, addMessage, clearMessages } = useChat();

  const handleMessage = useCallback(
    (payload: MessagePayload) => {
      addMessage(payload.content, 'remote', payload.senderName);
    },
    [addMessage]
  );

  const { state, joinRoom, sendMessage, reset } = useRoom({
    userName,
    onMessage: handleMessage,
  });

  // 被断开连接后自动返回到连接页面
  useEffect(() => {
    if (state.connectionState === 'disconnected') {
      const timer = setTimeout(() => {
        reset();
        clearMessages();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.connectionState, reset, clearMessages]);

  const handleSend = useCallback(
    (content: string) => {
      if (sendMessage(content)) {
        addMessage(content, 'local', userName);
      }
    },
    [sendMessage, addMessage, userName]
  );

  const handleReset = useCallback(() => {
    reset();
    clearMessages();
  }, [reset, clearMessages]);

  const isConnected = state.connectionState === 'connected';
  const isConnecting = state.connectionState === 'connecting';
  const isDisconnected = state.connectionState === 'disconnected';

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <ChatShell>
        {/* 顶部状态栏 */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-zinc-700">P2P 聊天</h1>
            {state.roomCode && (
              <span className="text-xs text-zinc-400 font-mono">
                #{state.roomCode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatus
              state={state.connectionState}
              peerCount={state.peerCount}
              peers={state.peers}
              currentUserName={userName}
            />
            {!isConnected && !isConnecting && (
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                title="帮助"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
            {(isConnected || isConnecting) && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="离开房间"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 主内容区 */}
        {isConnected ? (
          <>
            <MessageList messages={messages} />
            <MessageInput onSend={handleSend} />
          </>
        ) : isDisconnected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">连接已断开</p>
              <p className="text-xs text-zinc-500 mt-1">正在返回...</p>
            </div>
          </div>
        ) : (
          <ConnectionPanel
            state={state}
            userName={userName}
            onUserNameChange={setUserName}
            onJoinRoom={joinRoom}
            onShowHelp={() => setShowHelp(true)}
          />
        )}
      </ChatShell>

      {/* 帮助弹窗 */}
      <HelpDialog open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
