import React, { useState, useEffect, useMemo } from 'react';
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

// 邮件模板配置
interface MailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  mockData: Record<string, string>;
  htmlContent: string;
}

// 全局变量
const globalContext = {
  appName: 'Whispers of the Heart',
  webUrl: 'https://131462.wang',
  year: new Date().getFullYear().toString(),
};

// 邮件模板列表
const mailTemplates: MailTemplate[] = [
  {
    id: 'welcome',
    name: '欢迎邮件',
    description: '新用户注册成功后发送',
    subject: '欢迎加入 {{appName}}',
    mockData: {
      username: '张三',
      loginUrl: 'https://131462.wang/login',
    },
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>欢迎加入</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #333; }
    .welcome-icon { font-size: 48px; margin-bottom: 16px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .features { background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .features ul { margin: 0; padding-left: 20px; }
    .features li { margin-bottom: 8px; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="welcome-icon">🎉</div>
        <div class="logo">{{appName}}</div>
      </div>
      <div class="content">
        <p>您好，{{username}}：</p>
        <p>欢迎加入 {{appName}}！我们很高兴您成为我们社区的一员。</p>
        <div class="features">
          <p><strong>您现在可以：</strong></p>
          <ul>
            <li>阅读并评论精彩文章</li>
            <li>收藏您喜欢的内容</li>
            <li>与其他用户互动交流</li>
          </ul>
        </div>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{loginUrl}}" class="button">开始探索</a>
        </p>
      </div>
      <div class="footer">
        <p>如有任何问题，欢迎随时联系我们。</p>
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'password-reset',
    name: '密码重置',
    description: '用户请求重置密码时发送',
    subject: '重置您的密码 - {{appName}}',
    mockData: {
      username: '张三',
      resetUrl: 'https://131462.wang/reset-password?token=abc123',
      expiresIn: '1小时',
    },
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>重置密码</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #333; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .warning { background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-top: 20px; font-size: 14px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header"><div class="logo">{{appName}}</div></div>
      <div class="content">
        <p>您好，{{username}}：</p>
        <p>我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" class="button">重置密码</a>
        </p>
        <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
        <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">{{resetUrl}}</p>
        <div class="warning">
          <strong>请注意：</strong>此链接将在 {{expiresIn}} 后失效。如果您没有请求重置密码，请忽略此邮件。
        </div>
      </div>
      <div class="footer">
        <p>此邮件由系统自动发送，请勿直接回复。</p>
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'comment-notification',
    name: '评论通知',
    description: '当有人评论用户文章时发送',
    subject: '您的文章收到了新评论',
    mockData: {
      authorName: '张三',
      commenterName: '李四',
      postTitle: '如何使用 React 构建现代 Web 应用',
      postUrl: 'https://131462.wang/posts/how-to-build-modern-web-app',
      commentContent: '这篇文章写得非常好！',
    },
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>新评论通知</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #333; }
    .notification-icon { font-size: 48px; margin-bottom: 16px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .comment-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 0 6px 6px 0; padding: 16px; margin: 20px 0; }
    .comment-author { font-weight: 600; color: #3b82f6; margin-bottom: 8px; }
    .comment-content { color: #4b5563; }
    .post-title { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="notification-icon">💬</div>
        <div class="logo">{{appName}}</div>
      </div>
      <div class="content">
        <p>您好，{{authorName}}：</p>
        <p><strong>{{commenterName}}</strong> 评论了您的文章 <a href="{{postUrl}}" class="post-title">「{{postTitle}}」</a>：</p>
        <div class="comment-box">
          <div class="comment-author">{{commenterName}} 说：</div>
          <div class="comment-content">{{commentContent}}</div>
        </div>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{postUrl}}" class="button">查看评论</a>
        </p>
      </div>
      <div class="footer">
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'reply-notification',
    name: '回复通知',
    description: '当有人回复用户评论时发送',
    subject: '有人回复了您的评论',
    mockData: {
      originalCommenterName: '张三',
      replierName: '李四',
      postTitle: '深入理解 JavaScript 异步编程',
      postUrl: 'https://131462.wang/posts/understanding-javascript-async',
      originalComment: '请问这个例子中的 Promise 是如何工作的？',
      replyContent: 'Promise 是一个代表异步操作最终完成或失败的对象。',
    },
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>回复通知</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #333; }
    .notification-icon { font-size: 48px; margin-bottom: 16px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .comment-box { background-color: #f8fafc; border-left: 4px solid #9ca3af; border-radius: 0 6px 6px 0; padding: 16px; margin: 16px 0; }
    .reply-box { background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 6px 6px 0; padding: 16px; margin: 16px 0; }
    .comment-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
    .comment-author { font-weight: 600; margin-bottom: 8px; }
    .comment-content { color: #4b5563; }
    .post-title { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="notification-icon">↩️</div>
        <div class="logo">{{appName}}</div>
      </div>
      <div class="content">
        <p>您好，{{originalCommenterName}}：</p>
        <p><strong>{{replierName}}</strong> 回复了您在 <a href="{{postUrl}}" class="post-title">「{{postTitle}}」</a> 下的评论：</p>
        <div class="comment-box">
          <div class="comment-label">您的评论</div>
          <div class="comment-content">{{originalComment}}</div>
        </div>
        <div class="reply-box">
          <div class="comment-author" style="color: #22c55e;">{{replierName}} 回复：</div>
          <div class="comment-content">{{replyContent}}</div>
        </div>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{postUrl}}" class="button">查看回复</a>
        </p>
      </div>
      <div class="footer">
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'verification-code',
    name: '验证码',
    description: '用户注册或更换邮箱时发送',
    subject: '您的验证码 - {{appName}}',
    mockData: {
      username: '张三',
      purpose: '注册账号',
      code: '386942',
      expiresIn: '10分钟',
    },
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>验证码</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #333; }
    .code-box { text-align: center; margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 2px dashed #cbd5e1; }
    .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; font-family: 'Courier New', monospace; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .warning { background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-top: 20px; font-size: 14px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header"><div class="logo">{{appName}}</div></div>
      <div class="content">
        <p>您好，{{username}}：</p>
        <p>您正在进行<strong>{{purpose}}</strong>操作，请使用以下验证码完成验证：</p>
        <div class="code-box">
          <div class="code">{{code}}</div>
        </div>
        <div class="warning">
          <strong>请注意：</strong>此验证码将在 {{expiresIn}} 后失效。如果您没有请求此操作，请忽略此邮件。
        </div>
      </div>
      <div class="footer">
        <p>此邮件由系统自动发送，请勿直接回复。</p>
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
];

// 替换模板变量
const renderTemplate = (
  template: string,
  data: Record<string, string>
): string => {
  let result = template;
  const allData = { ...globalContext, ...data };
  Object.entries(allData).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

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

  // 加载数据
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchMailLogs();
      fetchStats();
      fetchMailStatus();
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

  // 渲染后的模板预览 HTML
  const renderedTemplateHtml = useMemo(() => {
    if (!selectedTemplate) return '';
    return renderTemplate(
      selectedTemplate.htmlContent,
      selectedTemplate.mockData
    );
  }, [selectedTemplate]);

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
                  onClick={() => setSelectedTemplate(template)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  预览
                </Button>
              </div>
            ))}
          </div>
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
            onClick={() => setSelectedTemplate(null)}
          />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedTemplate.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  主题:{' '}
                  {renderTemplate(
                    selectedTemplate.subject,
                    selectedTemplate.mockData
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTemplate(null)}
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
              <iframe
                srcDoc={renderedTemplateHtml}
                title="邮件预览"
                className="w-full h-full min-h-[500px] bg-white rounded shadow"
                sandbox="allow-same-origin"
              />
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
