import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { api } from '@whispers/utils';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'suggestion' | 'bug' | 'question' | 'other';

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'suggestion', label: '功能建议' },
  { value: 'bug', label: '问题反馈' },
  { value: 'question', label: '使用咨询' },
  { value: 'other', label: '其他' },
];

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose }) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setFeedbackType('suggestion');
      setContent('');
      setContact('');
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // 提交反馈
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 6) {
      setError('反馈内容至少需要 6 个字符');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.post('/feedback', {
        type: feedbackType,
        content: content.trim(),
        contact: contact.trim() || undefined,
      });
      if (response.data?.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.data?.message || '提交失败，请稍后重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-md bg-card rounded-lg shadow-2xl border border-border">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">意见反馈</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isSuccess ? (
          // 成功状态
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-foreground font-medium">感谢您的反馈!</p>
            <p className="text-sm text-muted-foreground mt-1">
              我们会认真阅读每一条意见
            </p>
          </div>
        ) : (
          // 表单
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 反馈类型 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                反馈类型
              </label>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFeedbackType(type.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-colors',
                      feedbackType === type.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 反馈内容 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                反馈内容 <span className="text-destructive">*</span>
              </label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="请详细描述您的问题或建议..."
                rows={4}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                required
              />
            </div>

            {/* 联系方式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                联系方式{' '}
                <span className="text-muted-foreground font-normal">
                  (选填)
                </span>
              </label>
              <Input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="邮箱或其他联系方式，方便我们回复您"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  提交反馈
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackDialog;
