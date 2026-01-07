import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, BlockNoteEditor } from '@whispers/ui';
import {
  Save,
  ArrowLeft,
  Trash2,
  Eye,
  Tag,
  FileText,
  Circle,
} from 'lucide-react';
import {
  blogApi,
  api,
  generateExcerpt as generateExcerptFromMarkdown,
} from '@whispers/utils';
import { useToastContext } from '../../contexts/ToastContext';
import { useAuthStore } from '../../stores/useAuthStore';
import MediaPickerDialog from '../../components/admin/MediaPickerDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  CoverImage,
  PropertyRow,
  TagSelector,
  ExcerptEditor,
} from '../../components/admin/post-editor';

interface TagData {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface LocalPost {
  id?: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
}

const PostEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error: showError } = useToastContext();
  const { accessToken } = useAuthStore();
  const isEditing = !!id;

  const [post, setPost] = useState<LocalPost>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    published: false,
    views: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<TagData[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [editorKey, setEditorKey] = useState(0);
  const contentRef = useRef(post.content);

  // Editor MediaPicker 状态
  const [showEditorMediaPicker, setShowEditorMediaPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editorMediaType, setEditorMediaType] = useState<
    'image' | 'video' | 'audio'
  >('image');
  const editorMediaCallbackRef = useRef<((url: string) => void) | null>(null);

  useEffect(() => {
    if (accessToken) {
      blogApi.setToken(accessToken);
    }
    fetchTags();
    if (isEditing) {
      fetchPost();
    }
  }, [id, accessToken]);

  // 滚动时隐藏/显示工具栏
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowToolbar(false);
      } else {
        setShowToolbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fetchTags = async () => {
    try {
      const response = await blogApi.getTags();
      if (response.success && response.data) {
        setTags(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await blogApi.getPostForEdit(id!);

      if (response.success && response.data) {
        const apiPost = response.data as any;
        contentRef.current = apiPost.content;
        // 从 postTags 数组中提取标签名称
        const tagNames = (apiPost.postTags || []).map(
          (pt: { tag: { name: string } }) => pt.tag.name
        );
        setPost({
          id: apiPost.id,
          title: apiPost.title,
          content: apiPost.content,
          excerpt: apiPost.excerpt || '',
          tags: tagNames,
          published: !!apiPost.publishedAt || apiPost.status === 'PUBLISHED',
          coverImage: apiPost.coverImage,
          createdAt: apiPost.createdAt,
          updatedAt: apiPost.updatedAt,
          views: apiPost.views || 0,
        });
        // 重新创建编辑器以加载新内容
        setEditorKey(prev => prev + 1);
      } else {
        showError('文章不存在');
        navigate('/admin/posts');
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
      showError('获取文章失败');
      navigate('/admin/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (shouldPublish?: boolean) => {
    if (!post.title.trim()) {
      showError('请输入文章标题');
      return;
    }

    try {
      setSaving(true);
      const publishStatus =
        shouldPublish !== undefined ? shouldPublish : post.published;

      const apiData = {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        published: publishStatus,
        tags: post.tags,
      };

      let response;
      if (isEditing) {
        response = await blogApi.updatePost(id!, apiData);
      } else {
        response = await blogApi.createPost(apiData);
      }

      if (response.success) {
        if (!isEditing && response.data) {
          navigate(`/admin/posts/edit/${response.data.id}`, { replace: true });
        }
        setPost(prev => ({ ...prev, published: publishStatus }));
        success(publishStatus ? '文章发布成功！' : '文章保存成功！');
      } else {
        showError(response.message || '保存失败');
      }
    } catch (err: any) {
      console.error('Failed to save post:', err);
      if (err.statusCode === 409) {
        showError('文章标题已存在');
      } else {
        showError('保存失败，请稍后重试');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/blog/post/${id}`);
      success('文章删除成功！');
      navigate('/admin/posts');
    } catch (err) {
      console.error('Failed to delete post:', err);
      showError('删除文章失败');
    }
  };

  const generateExcerpt = useCallback(() => {
    if (!post.content) {
      showError('请先输入文章内容');
      return;
    }

    const excerpt = generateExcerptFromMarkdown(post.content, 150);
    setPost(prev => ({ ...prev, excerpt }));
    success('摘要已生成');
  }, [post.content, showError, success]);

  const handleAddTag = (tagName: string) => {
    if (post.tags.includes(tagName)) return;
    setPost(prev => ({ ...prev, tags: [...prev.tags, tagName] }));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleCreateTag = async (tagName: string) => {
    try {
      const response = await blogApi.createTag({ name: tagName });
      if (response.success && response.data) {
        // 添加新标签到可用标签列表
        setTags(prev => [...prev, response.data!]);
        success(`标签 "${tagName}" 创建成功`);
      } else {
        showError(response.message || '创建标签失败');
      }
    } catch (err: any) {
      console.error('Failed to create tag:', err);
      if (err.response?.status === 409) {
        showError('标签已存在');
      } else {
        showError('创建标签失败');
      }
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 悬浮工具栏 */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300 ease-out
          ${showToolbar ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="max-w-[900px] mx-auto px-4 py-2 flex items-center justify-between">
            {/* 左侧 */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/posts')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* 状态指示 */}
              <div className="flex items-center gap-2">
                {post.published ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <Circle className="h-2 w-2 fill-current" />
                    已发布
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Circle className="h-2 w-2" />
                    草稿
                  </span>
                )}
                {isEditing && post.views !== undefined && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views}
                  </span>
                )}
              </div>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="text-muted-foreground"
              >
                保存草稿
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? '保存中...' : '发布'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="pt-14">
        {/* 封面图片 */}
        <CoverImage
          coverImage={post.coverImage}
          onCoverChange={url => setPost(prev => ({ ...prev, coverImage: url }))}
          onOpenMediaPicker={() => setShowMediaPicker(true)}
        />

        {/* 内容容器 */}
        <div className="max-w-[900px] mx-auto px-6 py-8">
          {/* 标题 */}
          <input
            type="text"
            placeholder="无标题"
            value={post.title}
            onChange={e =>
              setPost(prev => ({ ...prev, title: e.target.value }))
            }
            className="w-full text-4xl font-bold bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/30 mb-4"
          />

          {/* 属性区域 */}
          <div className="border-y border-border/50 py-2 mb-8 space-y-0.5">
            {/* 标签 */}
            <PropertyRow icon={Tag} label="标签">
              <TagSelector
                selectedTags={post.tags}
                availableTags={tags}
                onAdd={handleAddTag}
                onRemove={handleRemoveTag}
                onCreate={handleCreateTag}
              />
            </PropertyRow>

            {/* 摘要 */}
            <PropertyRow icon={FileText} label="摘要">
              <ExcerptEditor
                excerpt={post.excerpt}
                onChange={excerpt => setPost(prev => ({ ...prev, excerpt }))}
                onGenerate={generateExcerpt}
                canGenerate={!!post.content}
              />
            </PropertyRow>
          </div>

          {/* 编辑器 */}
          <div className="min-h-[500px]">
            <BlockNoteEditor
              key={editorKey}
              content={contentRef.current}
              onChange={value => setPost(prev => ({ ...prev, content: value }))}
              placeholder="开始写作，输入 / 打开命令菜单..."
              editable={true}
              authToken={accessToken}
              onOpenMediaPicker={(type, onSelect) => {
                console.log(
                  '[PostEditPage] Opening media picker for editor:',
                  type
                );
                setEditorMediaType(type);
                editorMediaCallbackRef.current = onSelect;
                setShowEditorMediaPicker(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* 封面图片选择器 */}
      <MediaPickerDialog
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={url => {
          setPost(prev => ({ ...prev, coverImage: url }));
          setShowMediaPicker(false);
        }}
        filterType="image"
        title="选择封面图片"
      />

      {/* 编辑器媒体选择器 */}
      <MediaPickerDialog
        isOpen={showEditorMediaPicker}
        onClose={() => {
          setShowEditorMediaPicker(false);
          editorMediaCallbackRef.current = null;
        }}
        onSelect={url => {
          console.log('[PostEditPage] Media selected for editor:', url);
          if (editorMediaCallbackRef.current) {
            editorMediaCallbackRef.current(url);
          }
          setShowEditorMediaPicker(false);
          editorMediaCallbackRef.current = null;
        }}
        filterType={editorMediaType}
        title={
          editorMediaType === 'image'
            ? '选择图片'
            : editorMediaType === 'video'
              ? '选择视频'
              : '选择音频'
        }
      />

      {/* 删除文章确认弹窗 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="删除文章"
        description="确定要删除这篇文章吗？此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
};

export default PostEditPage;
