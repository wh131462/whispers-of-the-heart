import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@whispers/ui';
import {
  RefreshCw,
  MessageCircle,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
  BarChart3,
  Mail,
  User,
  Calendar,
  Send,
  Wifi,
  WifiOff,
  Bell,
} from 'lucide-react';
import { api } from '@whispers/utils';
import { useToastContext } from '../../contexts/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useFeedbackSocket } from '../../hooks/useFeedbackSocket';

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

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  suggestion: '功能建议',
  bug: '问题反馈',
  question: '使用咨询',
  other: '其他',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
  read: { label: '已读', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: '已处理', color: 'bg-green-100 text-green-800' },
};

type TabType = 'all' | 'pending' | 'read' | 'resolved';

const FeedbackPage: React.FC = () => {
  const { success, error: showError } = useToastContext();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  // WebSocket 实时更新
  const handleNewFeedback = useCallback(
    (feedback: Feedback) => {
      // 如果当前在第一页且是全部或待处理标签，添加到列表顶部
      if (page === 1 && (activeTab === 'all' || activeTab === 'pending')) {
        setFeedbacks(prev => {
          // 避免重复添加
          if (prev.some(f => f.id === feedback.id)) return prev;
          return [feedback, ...prev];
        });
      }
      success('收到新反馈');
    },
    [page, activeTab, success]
  );

  const handleStatsUpdate = useCallback((newStats: FeedbackStats) => {
    setStats(newStats);
  }, []);

  const { isConnected, newFeedbacksCount, clearNewFeedbacks } =
    useFeedbackSocket({
      onNewFeedback: handleNewFeedback,
      onStatsUpdate: handleStatsUpdate,
      enabled: true,
    });

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/feedback/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch {
      // 静默处理
    }
  }, []);

  // 获取反馈列表
  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const response = await api.get('/feedback', { params });
      if (response.data?.success) {
        setFeedbacks(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
      }
    } catch {
      showError('获取反馈列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // 查看详情
  const handleViewDetail = async (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setReplyContent(''); // 清空回复内容
    // 如果是待处理状态，自动标记为已读
    if (feedback.status === 'pending') {
      try {
        await api.patch(`/feedback/${feedback.id}/status`, { status: 'read' });
        setFeedbacks(prev =>
          prev.map(f => (f.id === feedback.id ? { ...f, status: 'read' } : f))
        );
        fetchStats();
      } catch {
        // 静默处理
      }
    }
  };

  // 更新状态
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/feedback/${id}/status`, { status });
      setFeedbacks(prev => prev.map(f => (f.id === id ? { ...f, status } : f)));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(prev => (prev ? { ...prev, status } : null));
      }
      fetchStats();
      success('状态已更新');
    } catch {
      showError('更新状态失败');
    }
  };

  // 删除反馈
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/feedback/${deleteTarget}`);
      setFeedbacks(prev => prev.filter(f => f.id !== deleteTarget));
      if (selectedFeedback?.id === deleteTarget) {
        setSelectedFeedback(null);
      }
      fetchStats();
      success('反馈已删除');
    } catch {
      showError('删除失败');
    } finally {
      setDeleteTarget(null);
    }
  };

  // 回复反馈
  const handleReply = async () => {
    if (!selectedFeedback || !replyContent.trim()) return;
    setReplying(true);
    try {
      const response = await api.post(
        `/feedback/${selectedFeedback.id}/reply`,
        {
          content: replyContent.trim(),
        }
      );
      if (response.data?.success) {
        success('回复已发送');
        setReplyContent('');
        // 更新本地状态
        setFeedbacks(prev =>
          prev.map(f =>
            f.id === selectedFeedback.id ? { ...f, status: 'resolved' } : f
          )
        );
        setSelectedFeedback(prev =>
          prev ? { ...prev, status: 'resolved' } : null
        );
        fetchStats();
      } else {
        showError(response.data?.message || '发送回复失败');
      }
    } catch {
      showError('发送回复失败');
    } finally {
      setReplying(false);
    }
  };

  // 刷新
  const handleRefresh = () => {
    fetchFeedbacks();
    fetchStats();
  };

  const tabs = [
    { key: 'all', label: '全部', count: stats?.total },
    { key: 'pending', label: '待处理', count: stats?.pending },
    { key: 'read', label: '已读', count: stats?.read },
    { key: 'resolved', label: '已处理', count: stats?.resolved },
  ] as const;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">反馈管理</h1>
            <p className="text-muted-foreground mt-1">查看和处理用户反馈</p>
          </div>
          {/* WebSocket 连接状态 */}
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
            title={isConnected ? '实时更新已连接' : '实时更新未连接'}
          >
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span>{isConnected ? '实时' : '离线'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {newFeedbacksCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearNewFeedbacks}>
              <Bell className="h-4 w-4 mr-1" />
              {newFeedbacksCount} 条新反馈
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">总计</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2 text-yellow-600 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">待处理</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">已读</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">已处理</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats.resolved}
            </p>
          </div>
        </div>
      )}

      {/* 标签页 */}
      <div className="border-b">
        <nav className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-primary/10'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 反馈列表 */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无反馈</p>
            </div>
          ) : (
            feedbacks.map(feedback => (
              <div
                key={feedback.id}
                onClick={() => handleViewDetail(feedback)}
                className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors hover:border-primary ${
                  selectedFeedback?.id === feedback.id
                    ? 'border-primary ring-1 ring-primary'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                      {FEEDBACK_TYPE_LABELS[feedback.type] || feedback.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${STATUS_LABELS[feedback.status]?.color || 'bg-gray-100'}`}
                    >
                      {STATUS_LABELS[feedback.status]?.label || feedback.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">
                  {feedback.content}
                </p>
                {feedback.contact && (
                  <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{feedback.contact}</span>
                  </div>
                )}
              </div>
            ))
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </div>

        {/* 详情面板 */}
        <div className="lg:col-span-1">
          {selectedFeedback ? (
            <div className="bg-card border rounded-lg p-4 sticky top-4 space-y-4">
              <h3 className="font-semibold text-foreground">反馈详情</h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                    {FEEDBACK_TYPE_LABELS[selectedFeedback.type] ||
                      selectedFeedback.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${STATUS_LABELS[selectedFeedback.status]?.color || 'bg-gray-100'}`}
                  >
                    {STATUS_LABELS[selectedFeedback.status]?.label ||
                      selectedFeedback.status}
                  </span>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedFeedback.content}
                  </p>
                </div>

                {selectedFeedback.contact && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedFeedback.contact}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(selectedFeedback.createdAt).toLocaleString(
                      'zh-CN'
                    )}
                  </span>
                </div>

                {selectedFeedback.ipAddress && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>IP: {selectedFeedback.ipAddress}</span>
                  </div>
                )}
              </div>

              {/* 回复表单 */}
              {selectedFeedback.contact && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    回复用户
                  </p>
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder="输入回复内容..."
                    className="w-full h-24 px-3 py-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={replying || !replyContent.trim()}
                    className="w-full"
                  >
                    {replying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        发送回复邮件
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    回复将发送至: {selectedFeedback.contact}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium text-foreground mb-2">操作</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFeedback.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleUpdateStatus(selectedFeedback.id, 'resolved')
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      标记已处理
                    </Button>
                  )}
                  {selectedFeedback.status === 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleUpdateStatus(selectedFeedback.id, 'pending')
                      }
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      重置为待处理
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(selectedFeedback.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>选择一条反馈查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="删除反馈"
        description="确定要删除这条反馈吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
};

export default FeedbackPage;
