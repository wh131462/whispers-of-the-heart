import React, { useState, useCallback, useRef } from 'react';
import { Send, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../stores/useAuthStore';
import {
  api,
  setAuthToken,
  uploadMedia,
  type MediaFilter,
  type MediaItem,
} from '@whispers/utils';
import { CommentEditor, type MediaSelectResult } from '@whispers/ui';
import MediaPickerDialog from './media/MediaPickerDialog';
import { useNavigate } from 'react-router-dom';

// 定义编辑器 ref 类型
type CommentEditorHandle = {
  clearContent: () => void;
  getContent: () => string;
};

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentAdded: () => void;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = '写下你的想法...',
  compact = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<CommentEditorHandle>(null);
  const { addToast } = useToast();
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const isAdmin = user?.isAdmin || false;
  const navigate = useNavigate();

  // 媒体选择器状态
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState<MediaFilter>('image');
  const [mediaSelectCallback, setMediaSelectCallback] = useState<
    ((result: MediaSelectResult) => void) | null
  >(null);

  const handleContentChange = useCallback((markdown: string) => {
    setContent(markdown);
  }, []);

  // 上传文件
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const token = accessToken || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未登录');
      }
      setAuthToken(token);

      const media = await uploadMedia(file, { purpose: 'editor' });
      return media.url;
    },
    [accessToken]
  );

  // 打开媒体选择器
  const handleOpenMediaPicker = useCallback(
    (
      type: 'image' | 'video' | 'audio' | 'file',
      onSelect: (result: MediaSelectResult) => void
    ) => {
      const pickerType: MediaFilter = type === 'file' ? 'file' : type;
      setMediaPickerType(pickerType);
      setMediaSelectCallback(() => onSelect);
      setMediaPickerOpen(true);
    },
    []
  );

  // 关闭媒体选择器
  const handleCloseMediaPicker = useCallback(() => {
    setMediaPickerOpen(false);
    setMediaSelectCallback(null);
  }, []);

  // 处理媒体选择
  const handleMediaSelect = useCallback(
    (result: MediaSelectResult) => {
      if (mediaSelectCallback) {
        mediaSelectCallback(result);
      }
      handleCloseMediaPicker();
    },
    [mediaSelectCallback, handleCloseMediaPicker]
  );

  const handleSubmit = async () => {
    if (!content.trim()) {
      addToast({
        title: '请输入内容',
        description: '评论内容不能为空',
        variant: 'warning',
      });
      return;
    }

    if (!isAuthenticated) {
      addToast({
        title: '请先登录',
        description: '登录后才能发表评论',
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 确保 token 已设置（解决 hydration 时序问题）
      // 优先使用 store 中的 token，否则从 localStorage 获取
      const token = accessToken || localStorage.getItem('auth_token');
      if (token) {
        setAuthToken(token);
      } else {
        addToast({
          title: '认证失败',
          description: '请重新登录后再试',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      await api.post('/comments', {
        content: content.trim(),
        postId,
        parentId,
      });

      setContent('');
      // 使用 ref 清空编辑器内容，避免重新挂载组件
      editorRef.current?.clearContent();
      onCommentAdded();
      addToast({
        title: '评论成功',
        description: '您的评论已提交',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to submit comment:', error);
      addToast({
        title: '评论失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <div className="comment-form-login-prompt">
        <div className="flex items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/30">
          <LogIn className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">登录后参与评论</span>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/login')}
          >
            立即登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-form space-y-3">
      <CommentEditor
        ref={editorRef}
        content=""
        onChange={handleContentChange}
        onSubmit={handleSubmit}
        placeholder={placeholder}
        disabled={isSubmitting}
        minHeight={compact ? 80 : 120}
        authToken={accessToken}
        uploadFile={uploadFile}
        onOpenMediaPicker={handleOpenMediaPicker}
      />

      {/* 媒体选择器 */}
      <MediaPickerDialog
        isOpen={mediaPickerOpen}
        onClose={handleCloseMediaPicker}
        onSelect={(media: MediaItem) =>
          handleMediaSelect({
            url: media.url,
            fileName: media.originalName,
            fileSize: media.size,
          })
        }
        filterType={mediaPickerType}
        purpose="editor"
        all={isAdmin}
      />

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="min-w-[100px]"
        >
          <Send className="h-4 w-4 mr-1.5" />
          {isSubmitting ? '发送中...' : '发表评论'}
        </Button>
      </div>
    </div>
  );
};

export default CommentForm;
