import React, { useEffect, useRef, useState } from 'react';
import {
  Link2,
  Plus,
  Pencil,
  Trash2,
  X,
  Wand2,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@whispers/ui';
import { api } from '@whispers/utils';
import MediaPickerDialog from '../../components/admin/MediaPickerDialog';

type FriendLinkStatus = 'ACTIVE' | 'INACTIVE';
type AvatarCheck = 'idle' | 'checking' | 'ok' | 'fail';

// 用 <img> 在浏览器侧探测一个 URL 是否能成功加载
const probeImage = (url: string, timeoutMs = 5000): Promise<boolean> =>
  new Promise(resolve => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      finish(img.naturalWidth > 1 && img.naturalHeight > 1);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      finish(false);
    };
    img.src = url;
  });

interface FriendLink {
  id: string;
  name: string;
  url: string;
  avatar: string | null;
  description: string | null;
  sortOrder: number;
  status: FriendLinkStatus;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  name: string;
  url: string;
  avatar: string;
  description: string;
  sortOrder: number;
  status: FriendLinkStatus;
}

const emptyForm: FormState = {
  name: '',
  url: '',
  avatar: '',
  description: '',
  sortOrder: 0,
  status: 'ACTIVE',
};

interface Props {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const FriendLinksSection: React.FC<Props> = ({ onError, onSuccess }) => {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<AvatarCheck>('idle');
  const [probing, setProbing] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const avatarCheckTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/friend-links?includeInactive=true');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLinks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch friend links:', err);
      onError('获取友链列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // 头像 URL 变化时防抖校验
  useEffect(() => {
    if (avatarCheckTimer.current) clearTimeout(avatarCheckTimer.current);
    const url = form.avatar.trim();
    if (!url) {
      setAvatarStatus('idle');
      return;
    }
    setAvatarStatus('checking');
    avatarCheckTimer.current = setTimeout(async () => {
      const ok = await probeImage(url);
      setAvatarStatus(ok ? 'ok' : 'fail');
    }, 400);
    return () => {
      if (avatarCheckTimer.current) clearTimeout(avatarCheckTimer.current);
    };
  }, [form.avatar]);

  const probeFavicons = async () => {
    const url = form.url.trim();
    if (!url) {
      onError('请先填写有效的 URL');
      return;
    }
    setProbing(true);
    setCandidates([]);
    try {
      const res = await api.get(
        `/friend-links/probe-icons?url=${encodeURIComponent(url)}`
      );
      const list: string[] = Array.isArray(res.data?.data) ? res.data.data : [];
      if (list.length === 0) {
        onError('未在站点 head 中找到图标声明');
        return;
      }
      // 二次过滤：用 <img> 在浏览器侧验证哪些真正能加载
      const checks = await Promise.all(
        list.map(async u => ((await probeImage(u)) ? u : null))
      );
      const valid = checks.filter((x): x is string => !!x);
      if (valid.length === 0) {
        onError('找到图标声明但都无法加载');
        return;
      }
      setCandidates(valid);
      if (!form.avatar.trim()) {
        setForm(prev => ({ ...prev, avatar: valid[0] }));
      }
    } catch (err) {
      console.error('Failed to probe icons:', err);
      onError('图标探测失败');
    } finally {
      setProbing(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (link: FriendLink) => {
    setEditingId(link.id);
    setForm({
      name: link.name,
      url: link.url,
      avatar: link.avatar ?? '',
      description: link.description ?? '',
      sortOrder: link.sortOrder,
      status: link.status,
    });
    setShowForm(true);
  };

  const handleMediaSelect = (url: string) => {
    setForm(prev => ({ ...prev, avatar: url }));
    setCandidates([]);
    setMediaPickerOpen(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCandidates([]);
    setAvatarStatus('idle');
    setMediaPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      onError('名称和 URL 必填');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        url: form.url.trim(),
        avatar: form.avatar.trim() || undefined,
        description: form.description.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      };
      if (editingId) {
        await api.patch(`/friend-links/${editingId}`, payload);
        onSuccess('友链更新成功');
      } else {
        await api.post('/friend-links', payload);
        onSuccess('友链创建成功');
      }
      closeForm();
      fetchLinks();
    } catch (err) {
      console.error('Failed to save friend link:', err);
      onError(editingId ? '友链更新失败' : '友链创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除此友链吗？')) return;
    try {
      await api.delete(`/friend-links/${id}`);
      onSuccess('友链删除成功');
      fetchLinks();
    } catch (err) {
      console.error('Failed to delete friend link:', err);
      onError('友链删除失败');
    }
  };

  const toggleStatus = async (link: FriendLink) => {
    try {
      const next: FriendLinkStatus =
        link.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/friend-links/${link.id}`, { status: next });
      onSuccess(next === 'ACTIVE' ? '已上线' : '已下线');
      fetchLinks();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      onError('状态切换失败');
    }
  };

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link2 className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-foreground">友链管理</h2>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新增友链
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground italic">
          暂无友链，点击「新增友链」开始添加
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div
              key={link.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                {link.avatar ? (
                  <img
                    src={link.avatar}
                    alt={link.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        'none';
                    }}
                  />
                ) : (
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {link.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      link.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {link.status === 'ACTIVE' ? '上线' : '下线'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    排序: {link.sortOrder}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {link.url}
                </div>
                {link.description && (
                  <div className="text-xs text-muted-foreground/80 truncate">
                    {link.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleStatus(link)}
                  title={link.status === 'ACTIVE' ? '下线' : '上线'}
                >
                  {link.status === 'ACTIVE' ? '下线' : '上线'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(link)}
                  title="编辑"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(link.id)}
                  title="删除"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingId ? '编辑友链' : '新增友链'}
              </h3>
              <button
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  名称 <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="对方站点名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  URL <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  头像 URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={form.avatar}
                      onChange={e =>
                        setForm({ ...form, avatar: e.target.value })
                      }
                      placeholder="留空将使用对方站点的 favicon"
                      className="pr-9"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      {avatarStatus === 'checking' && (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      )}
                      {avatarStatus === 'ok' && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      {avatarStatus === 'fail' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={probeFavicons}
                    disabled={!form.url.trim() || probing}
                    title="探测对方站点的可用 favicon"
                  >
                    {probing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-1" />
                    )}
                    {probing ? '探测中' : '探测图标'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMediaPickerOpen(true)}
                    title="从媒体库选择图片"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    媒体库
                  </Button>
                </div>
                {avatarStatus === 'fail' && (
                  <p className="text-xs text-destructive mt-1">
                    该图片无法加载，请检查 URL
                  </p>
                )}

                {/* 候选 favicon 列表 */}
                {candidates.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-2">
                      探测到 {candidates.length} 个可用图标，点击选用：
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {candidates.map(url => {
                        const selected = url === form.avatar;
                        return (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setForm({ ...form, avatar: url })}
                            className={`group relative w-12 h-12 rounded-lg overflow-hidden ring-2 transition-all ${
                              selected
                                ? 'ring-primary'
                                : 'ring-border hover:ring-primary/50'
                            }`}
                            title={url}
                          >
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover bg-background"
                            />
                            {selected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Check className="h-5 w-5 text-primary drop-shadow" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 预览 */}
                {form.avatar && avatarStatus === 'ok' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>预览效果：</span>
                    <img
                      src={form.avatar}
                      alt="预览"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-border bg-background"
                    />
                    <span className="truncate">{form.avatar}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  描述
                </label>
                <Input
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="一句话简介"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    排序权重
                  </label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={e =>
                      setForm({
                        ...form,
                        sortOrder: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    状态
                  </label>
                  <Select
                    value={form.status}
                    onValueChange={v =>
                      setForm({ ...form, status: v as FriendLinkStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">上线</SelectItem>
                      <SelectItem value="INACTIVE">下线</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={closeForm}
                disabled={submitting}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <MediaPickerDialog
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        filterType="image"
        title="选择友链头像"
      />
    </div>
  );
};

export default FriendLinksSection;
