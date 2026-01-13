import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback(
    (content: string, sender: 'local' | 'remote', senderName: string) => {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        timestamp: Date.now(),
        sender,
        senderName,
      };
      setMessages(prev => [...prev, newMessage]);
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
}
