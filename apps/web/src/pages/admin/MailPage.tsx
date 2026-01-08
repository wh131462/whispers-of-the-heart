import React, { useState, useEffect } from 'react';
import {
  Mail,
  Eye,
  FileText,
  X,
  Search,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { Button, Input } from '@whispers/ui';
import { api } from '@whispers/utils';
import { useToastContext } from '../../contexts/ToastContext';

// 邮件记录接口
interface MailLog {
  id: string;
  to: string;
  subject: string;
  template: string | null;
  context: Record<string, any> | null;
  status: 'pending' | 'sent' | 'failed';
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

// 邮件统计接口
interface MailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

// 邮件服务状态
interface MailStatus {
  enabled: boolean;
  connected: boolean;
}

// 邮件模板配置（从后端获取）
interface MailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  mockData: Record<string, string>;
}

// 状态图标组件
const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'sent':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

// 状态标签组件
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = {
    sent: { text: '已发送', className: 'bg-green-100 text-green-700' },
    failed: { text: '发送失败', className: 'bg-red-100 text-red-700' },
    pending: { text: '待发送', className: 'bg-yellow-100 text-yellow-700' },
  };
  const { text, className } =
    config[status as keyof typeof config] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      <StatusIcon status={status} />
      {text}
    </span>
  );
};

const MailPage: React.FC = () => {
  const { success, error: showError } = useToastContext();

  // 状态
  const [activeTab, setActiveTab] = useState<'logs' | 'templates'>('logs');
  const [mailLogs, setMailLogs] = useState<MailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MailStats | null>(null);
  const [mailStatus, setMailStatus] = useState<MailStatus | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 弹窗状态
  const [selectedLog, setSelectedLog] = useState<MailLog | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate | null>(
    null
  );
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // 模板相关状态
  const [mailTemplates, setMailTemplates] = useState<MailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // 加载数据
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchMailLogs();
      fetchStats();
      fetchMailStatus();
    } else if (activeTab === 'templates') {
      fetchMailTemplates();
    }
  }, [page, statusFilter, activeTab]);

  const fetchMailLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await api.get('/admin/mail/logs', { params });
      if (response.data?.success) {
        setMailLogs(response.data.data.items || []);
        setTotalPages(response.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch mail logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/mail/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch mail stats:', err);
    }
  };

  const fetchMailStatus = async () => {
    try {
      const response = await api.get('/admin/mail/status');
      if (response.data?.success) {
        setMailStatus(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch mail status:', err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMailLogs();
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      showError('请输入收件人邮箱');
      return;
    }

    try {
      setSendingTest(true);
      const response = await api.post('/admin/mail/test', {
        to: testEmail.trim(),
      });
      if (response.data?.success) {
        success('测试邮件已发送');
        setTestEmailOpen(false);
        setTestEmail('');
        fetchMailLogs();
        fetchStats();
      } else {
        showError(response.data?.message || '发送失败');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || '发送失败');
    } finally {
      setSendingTest(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取邮件模板列表
  const fetchMailTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await api.get('/admin/mail/templates');
      if (response.data?.success) {
        setMailTemplates(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch mail templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // 获取模板预览 HTML
  const fetchTemplatePreview = async (template: MailTemplate) => {
    try {
      setPreviewLoading(true);
      setSelectedTemplate(template);
      const response = await api.post(
        `/admin/mail/templates/${template.id}/preview`,
        { context: template.mockData }
      );
      if (response.data?.success) {
        setPreviewHtml(response.data.data.html || '');
      } else {
        showError(response.data?.message || '获取预览失败');
      }
    } catch (err: any) {
      console.error('Failed to fetch template preview:', err);
      showError(err.response?.data?.message || '获取预览失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 关闭模板预览弹窗
  const closeTemplatePreview = () => {
    setSelectedTemplate(null);
    setPreviewHtml('');
  };

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">邮件管理</h1>
          <p className="text-muted-foreground mt-1">
            管理系统邮件的发送记录和模板
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 邮件服务状态 */}
          {mailStatus && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                mailStatus.enabled && mailStatus.connected
                  ? 'bg-green-100 text-green-700'
                  : mailStatus.enabled
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  mailStatus.enabled && mailStatus.connected
                    ? 'bg-green-500'
                    : mailStatus.enabled
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                }`}
              />
              {mailStatus.enabled && mailStatus.connected
                ? '服务正常'
                : mailStatus.enabled
                  ? '连接异常'
                  : '未配置'}
            </div>
          )}
          <Button onClick={() => setTestEmailOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            发送测试邮件
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="text-sm text-muted-foreground">总发送量</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              发送成功
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {stats.sent}
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              发送失败
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">
              {stats.failed}
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              待发送
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">
              {stats.pending}
            </div>
          </div>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          <Mail className="h-4 w-4 inline mr-2" />
          发送记录
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          邮件模板
        </button>
      </div>

      {/* 发送记录 Tab */}
      {activeTab === 'logs' && (
        <>
          {/* 搜索和筛选 */}
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索收件人或主题..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none bg-background border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">全部状态</option>
                  <option value="sent">已发送</option>
                  <option value="failed">发送失败</option>
                  <option value="pending">待发送</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <Button onClick={handleSearch}>搜索</Button>
              <Button
                variant="outline"
                onClick={() => {
                  fetchMailLogs();
                  fetchStats();
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 邮件列表 */}
          <div className="bg-card rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : mailLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Mail className="h-12 w-12 mb-4 opacity-50" />
                <p>暂无邮件记录</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      收件人
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      主题
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      模板
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      时间
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mailLogs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">{log.to}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">
                        {log.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.template || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
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
        </>
      )}

      {/* 邮件模板 Tab */}
      {activeTab === 'templates' && (
        <div className="bg-card rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <p className="text-sm text-muted-foreground">
              系统内置的邮件模板，点击预览查看实际效果
            </p>
          </div>
          {templatesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mailTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>暂无邮件模板</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {mailTemplates.map(template => (
                <div
                  key={template.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {template.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {template.id}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTemplatePreview(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    预览
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 邮件详情弹窗 */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h3 className="text-lg font-semibold">邮件详情</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLog(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    收件人
                  </label>
                  <p className="font-medium">{selectedLog.to}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">状态</label>
                  <p>
                    <StatusBadge status={selectedLog.status} />
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">模板</label>
                  <p className="font-medium">{selectedLog.template || '无'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    创建时间
                  </label>
                  <p className="font-medium">
                    {formatDate(selectedLog.createdAt)}
                  </p>
                </div>
                {selectedLog.sentAt && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      发送时间
                    </label>
                    <p className="font-medium">
                      {formatDate(selectedLog.sentAt)}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">主题</label>
                <p className="font-medium">{selectedLog.subject}</p>
              </div>
              {selectedLog.error && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    错误信息
                  </label>
                  <p className="text-red-600 bg-red-50 p-2 rounded text-sm">
                    {selectedLog.error}
                  </p>
                </div>
              )}
              {selectedLog.context &&
                Object.keys(selectedLog.context).length > 0 && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      模板数据
                    </label>
                    <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* 模板预览弹窗 */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeTemplatePreview}
          />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedTemplate.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  主题: {selectedTemplate.subject}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeTemplatePreview}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-6 py-3 bg-muted/50 border-b shrink-0">
              <p className="text-xs text-muted-foreground mb-2">模拟数据:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedTemplate.mockData).map(
                  ([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-2 py-1 rounded bg-background text-xs"
                    >
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="ml-1 text-foreground font-medium truncate max-w-[200px]">
                        {value}
                      </span>
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#f5f5f5]">
              {previewLoading ? (
                <div className="flex items-center justify-center h-[500px] bg-white rounded shadow">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  title="邮件预览"
                  className="w-full h-full min-h-[500px] bg-white rounded shadow"
                  sandbox="allow-same-origin"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 发送测试邮件弹窗 */}
      {testEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setTestEmailOpen(false)}
          />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">发送测试邮件</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTestEmailOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  收件人邮箱
                </label>
                <Input
                  type="email"
                  placeholder="请输入邮箱地址"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                将发送一封欢迎邮件到指定邮箱，用于测试邮件服务是否正常工作。
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setTestEmailOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSendTestEmail} disabled={sendingTest}>
                {sendingTest ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    发送
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailPage;
