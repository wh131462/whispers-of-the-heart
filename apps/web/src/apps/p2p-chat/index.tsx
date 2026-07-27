import { useState, useCallback } from 'react';
import { Info, LogOut } from 'lucide-react';
import { ChatShell } from './components/ChatShell';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ConnectionPanel } from './components/ConnectionPanel';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { HelpDialog } from './components/HelpDialog';
import { useRoom } from './hooks/useWebRTC';
import { useChat } from './hooks/useChat';
import type { MessagePayload, MessageType } from './types';

// 生成默认用户名
function generateDefaultName() {
  return `用户${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function P2PChat() {
  const [showHelp, setShowHelp] = useState(false);
  const [userName, setUserName] = useState(generateDefaultName);
  const { messages, addMessage, updateDelivery, clearMessages } = useChat();

  const handleMessage = useCallback(
    (payload: MessagePayload) => {
      addMessage(payload.content, 'remote', payload.senderName, payload.type, {
        id: `${payload.peerId}:${payload.messageId}`,
        peerId: payload.peerId,
      });
    },
    [addMessage]
  );

  const { state, joinRoom, sendMessage, retryMessage, reset } = useRoom({
    userName,
    onMessage: handleMessage,
    onDeliveryUpdate: updateDelivery,
  });

  const handleSend = useCallback(
    (content: string, type: MessageType) => {
      const message = addMessage(content, 'local', userName, type, {
        deliveryStatus: 'sending',
        totalPeers: state.peerCount,
      });
      sendMessage({
        messageId: message.id,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp,
      });
    },
    [sendMessage, addMessage, userName, state.peerCount]
  );

  const handleReset = useCallback(() => {
    reset();
    clearMessages();
  }, [reset, clearMessages]);

  const handleRetry = useCallback(
    (messageId: string) => {
      if (retryMessage(messageId)) return;
      const message = messages.find(
        item => item.id === messageId && item.sender === 'local'
      );
      if (!message) return;
      sendMessage({
        messageId: message.id,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp,
      });
    },
    [messages, retryMessage, sendMessage]
  );

  const isConnected = state.connectionState === 'connected';
  const hasJoinedRoom = Boolean(state.roomCode);
  const canSend = isConnected && state.readyPeerCount > 0;

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
            {!hasJoinedRoom && (
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                title="帮助"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
            {hasJoinedRoom && (
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
        {hasJoinedRoom ? (
          <>
            {!canSend && (
              <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
                {!isConnected
                  ? '数据通道正在恢复，未确认消息会在重连后继续发送。'
                  : state.peerCount === 0
                    ? '等待对方加入房间。'
                    : '正在建立安全数据通道，请稍候。'}
              </div>
            )}
            <MessageList messages={messages} onRetry={handleRetry} />
            <MessageInput onSend={handleSend} disabled={!canSend} />
          </>
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
