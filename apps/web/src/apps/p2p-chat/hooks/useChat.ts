import { useState, useCallback } from 'react';
import type { ChatMessage, DeliveryUpdate, MessageType } from '../types';

// 生成 UUID（兼容非 HTTPS 环境）
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 使用 crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
      ).toString(16)
    );
  }
  // 最后 fallback: Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback(
    (
      content: string,
      sender: 'local' | 'remote',
      senderName: string,
      type: MessageType = 'text',
      options: Partial<
        Pick<
          ChatMessage,
          | 'id'
          | 'timestamp'
          | 'peerId'
          | 'deliveryStatus'
          | 'deliveredPeers'
          | 'totalPeers'
        >
      > = {}
    ): ChatMessage => {
      const newMessage: ChatMessage = {
        id: options.id || generateUUID(),
        type,
        content,
        timestamp: options.timestamp || Date.now(),
        sender,
        senderName,
        ...options,
      };
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  const updateDelivery = useCallback((update: DeliveryUpdate) => {
    setMessages(prev =>
      prev.map(message =>
        message.id === update.messageId
          ? {
              ...message,
              deliveryStatus: update.status,
              deliveredPeers: update.deliveredPeers,
              totalPeers: update.totalPeers,
              deliveryError: update.error,
            }
          : message
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    updateDelivery,
    clearMessages,
  };
}
