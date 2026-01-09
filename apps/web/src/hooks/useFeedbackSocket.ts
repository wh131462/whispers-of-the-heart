import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Feedback {
  id: string;
  type: string;
  content: string;
  contact?: string;
  status: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  pending: number;
  read: number;
  resolved: number;
  byType: Record<string, number>;
}

interface FeedbackEvent {
  type: string;
  data: Feedback;
  timestamp: string;
}

interface FeedbackStatsEvent {
  type: string;
  data: FeedbackStats;
  timestamp: string;
}

interface UseFeedbackSocketOptions {
  onNewFeedback?: (feedback: Feedback) => void;
  onStatsUpdate?: (stats: FeedbackStats) => void;
  enabled?: boolean;
}

export function useFeedbackSocket(options: UseFeedbackSocketOptions = {}) {
  const { onNewFeedback, onStatsUpdate, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newFeedbacks, setNewFeedbacks] = useState<Feedback[]>([]);

  // 使用 ref 存储回调，避免重新连接
  const onNewFeedbackRef = useRef(onNewFeedback);
  const onStatsUpdateRef = useRef(onStatsUpdate);

  // 更新 ref
  useEffect(() => {
    onNewFeedbackRef.current = onNewFeedback;
  }, [onNewFeedback]);

  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onStatsUpdate]);

  // 清除新反馈通知
  const clearNewFeedbacks = useCallback(() => {
    setNewFeedbacks([]);
  }, []);

  // 标记单个反馈为已读
  const markAsRead = useCallback((feedbackId: string) => {
    setNewFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 获取 API 基础 URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7777';
    const wsUrl = apiUrl.replace('/api/v1', '');

    // 创建 Socket 连接
    const socket = io(`${wsUrl}/notifications`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // 连接成功
    socket.on('connect', () => {
      console.log('Feedback WebSocket connected');
      setIsConnected(true);
      // 加入管理员房间
      socket.emit('joinAdmin');
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log('Feedback WebSocket disconnected');
      setIsConnected(false);
    });

    // 收到新反馈
    socket.on('newFeedback', (event: FeedbackEvent) => {
      console.log('New feedback received:', event);
      setNewFeedbacks(prev => [event.data, ...prev]);
      onNewFeedbackRef.current?.(event.data);
    });

    // 统计更新
    socket.on('feedbackStatsUpdate', (event: FeedbackStatsEvent) => {
      console.log('Feedback stats updated:', event);
      onStatsUpdateRef.current?.(event.data);
    });

    // 连接错误
    socket.on('connect_error', error => {
      console.error('Feedback WebSocket connection error:', error);
    });

    // 清理
    return () => {
      socket.emit('leaveAdmin');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]); // 只依赖 enabled

  return {
    isConnected,
    newFeedbacks,
    newFeedbacksCount: newFeedbacks.length,
    clearNewFeedbacks,
    markAsRead,
  };
}
