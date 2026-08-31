import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Code2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@whispers/ui';
import { api, getMediaUrl } from '@whispers/utils';

import ConfirmDialog from '../../components/ConfirmDialog';
import MediaPickerDialog from '../../components/admin/MediaPickerDialog';
import { useToast } from '../../contexts/ToastContext';
import {
  SHOWCASE_PROJECT_TYPE_LABELS,
  SHOWCASE_PROJECT_TYPES,
  type ApiEnvelope,
  type ShowcaseProject,
  type ShowcaseProjectStatus,
  type ShowcaseProjectType,
} from '../../types/project-showcase';

interface DistributedAppOption {
  id: string;
  name: string;
  slug: string;
  releases: Array<{ id: string; versionName: string; versionCode: number }>;
}

interface ProjectFormState {
  name: string;
  slug: string;
  type: ShowcaseProjectType;
  summary: string;
  description: string;
  icon: string;
  coverImage: string;
  tags: string;
  platforms: string;
  repositoryUrl: string;
  websiteUrl: string;
  downloadUrl: string;
  status: ShowcaseProjectStatus;
  featured: boolean;
  sortOrder: string;
  distributedAppId: string;
}

type MediaField = 'icon' | 'coverImage';

interface ErrorEnvelope {
  response?: { data?: { message?: string | string[] } };
}

const EMPTY_FORM: ProjectFormState = {
  name: '',
  slug: '',
  type: 'OPEN_SOURCE',
  summary: '',
  description: '',
  icon: '',
  coverImage: '',
  tags: '',
  platforms: '',
  repositoryUrl: '',
  websiteUrl: '',
  downloadUrl: '',
  status: 'DRAFT',
  featured: false,
  sortOrder: '0',
  distributedAppId: '',
};

const splitList = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(/[,，\n]/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );

const getRequestError = (error: unknown, fallback: string): string => {
  const message = (error as ErrorEnvelope).response?.data?.message;
  if (Array.isArray(message)) return message.join('；');
  if (typeof message === 'string') return message;
  return error instanceof Error ? error.message : fallback;
};

const isValidOptionalUrl = (value: string): boolean => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const ProjectShowcasePage: React.FC = () => {
  const { addToast } = useToast();
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [distributedApps, setDistributedApps] = useState<
    DistributedAppOption[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ShowcaseProject | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ShowcaseProject | null>(
    null
  );
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [mediaField, setMediaField] = useState<MediaField | null>(null);

  const showSuccess = useCallback(
    (message: string): void => {
      addToast({ title: '成功', description: message, variant: 'success' });
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string): void => {
      addToast({ title: '错误', description: message, variant: 'destructive' });
    },
    [addToast]
  );

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [projectsResponse, appsResponse] = await Promise.all([
        api.get<ApiEnvelope<ShowcaseProject[]>>('/admin/projects'),
        api.get<ApiEnvelope<DistributedAppOption[]>>(
          '/admin/app-distributions'
        ),
      ]);
      setProjects(projectsResponse.data.data);
      setDistributedApps(appsResponse.data.data);
    } catch (error: unknown) {
      showError(getRequestError(error, '获取作品数据失败'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      published: projects.filter(project => project.status === 'PUBLISHED')
        .length,
      featured: projects.filter(project => project.featured).length,
    }),
    [projects]
  );

  const openCreate = (): void => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (project: ShowcaseProject): void => {
    setEditingProject(project);
    setForm({
      name: project.name,
      slug: project.slug,
      type: project.type,
      summary: project.summary,
      description: project.description ?? '',
      icon: project.icon ?? '',
      coverImage: project.coverImage ?? '',
      tags: project.tags.join(', '),
      platforms: project.platforms.join(', '),
      repositoryUrl: project.repositoryUrl ?? '',
      websiteUrl: project.websiteUrl ?? '',
      downloadUrl: project.downloadUrl ?? '',
      status: project.status,
      featured: project.featured,
      sortOrder: String(project.sortOrder),
      distributedAppId: project.distributedAppId ?? '',
    });
    setDialogOpen(true);
  };

  const updateForm = <K extends keyof ProjectFormState>(
    key: K,
    value: ProjectFormState[K]
  ): void => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const validateForm = (): string | null => {
    if (!form.name.trim() || !form.slug.trim() || !form.summary.trim()) {
      return '作品名称、slug 和一句话介绍必填';
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      return 'slug 只能包含小写字母、数字和连字符';
    }
    const urls = [form.repositoryUrl, form.websiteUrl, form.downloadUrl];
    if (!urls.every(isValidOptionalUrl)) {
      return '源码、官网和下载地址必须是完整的 HTTP 或 HTTPS URL';
    }
    if (form.summary.trim().length > 240) {
      return '一句话介绍不能超过 240 个字符';
    }
    return null;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      type: form.type,
      summary: form.summary.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      coverImage: form.coverImage.trim() || null,
      tags: splitList(form.tags),
      platforms: splitList(form.platforms),
      repositoryUrl: form.repositoryUrl.trim() || null,
      websiteUrl: form.websiteUrl.trim() || null,
      downloadUrl: form.downloadUrl.trim() || null,
      status: form.status,
      featured: form.featured,
      sortOrder: Number(form.sortOrder) || 0,
      distributedAppId:
        form.type === 'APP' && form.distributedAppId
          ? form.distributedAppId
          : null,
    };

    try {
      setSubmitting(true);
      if (editingProject) {
        await api.patch(`/admin/projects/${editingProject.id}`, payload);
        showSuccess('作品已更新');
      } else {
        await api.post('/admin/projects', payload);
        showSuccess('作品已创建');
      }
      setDialogOpen(false);
      setEditingProject(null);
      setForm(EMPTY_FORM);
      await fetchData();
    } catch (error: unknown) {
      showError(getRequestError(error, '保存作品失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateProjectState = async (
    project: ShowcaseProject,
    patch: Partial<Pick<ShowcaseProject, 'status' | 'featured'>>,
    message: string
  ): Promise<void> => {
    try {
      await api.patch(`/admin/projects/${project.id}`, patch);
      showSuccess(message);
      await fetchData();
    } catch (error: unknown) {
      showError(getRequestError(error, '更新作品状态失败'));
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/projects/${deleteTarget.id}`);
      showSuccess('作品已删除');
      setDeleteTarget(null);
      await fetchData();
    } catch (error: unknown) {
      showError(getRequestError(error, '删除作品失败'));
    }
  };

  const handleMediaSelect = (url: string): void => {
    if (mediaField) updateForm(mediaField, url);
    setMediaField(null);
    setDialogOpen(true);
  };

  const openMediaPicker = (field: MediaField): void => {
    setDialogOpen(false);
    setMediaField(field);
  };

  const closeMediaPicker = (): void => {
    setMediaField(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">作品管理</h1>
          <p className="mt-1 text-muted-foreground">
            维护前台展示的开源项目、APP、网站和站内工具
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增作品
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: '全部作品', value: stats.total },
          { label: '已上线', value: stats.published },
          { label: '首页推荐', value: stats.featured },
        ].map(item => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {item.label}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            还没有作品
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            创建并上线作品后，它会出现在前台作品页。
          </p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            创建第一个作品
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <article
              key={project.id}
              className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {project.icon ? (
                      <img
                        src={getMediaUrl(project.icon)}
                        alt={`${project.name} 图标`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Code2 className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-foreground">
                        {project.name}
                      </h2>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {SHOWCASE_PROJECT_TYPE_LABELS[project.type]}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          project.status === 'PUBLISHED'
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {project.status === 'PUBLISHED' ? '已上线' : '草稿'}
                      </span>
                      {project.featured && (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          首页推荐
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {project.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                      <span>{project.slug}</span>
                      <span>排序 {project.sortOrder}</span>
                      {project.distributedApp && (
                        <span>关联 {project.distributedApp.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void updateProjectState(
                        project,
                        {
                          status:
                            project.status === 'PUBLISHED'
                              ? 'DRAFT'
                              : 'PUBLISHED',
                        },
                        project.status === 'PUBLISHED'
                          ? '作品已转为草稿'
                          : '作品已上线'
                      )
                    }
                  >
                    {project.status === 'PUBLISHED' ? '下线' : '上线'}
                  </Button>
                  <Button
                    size="sm"
                    variant={project.featured ? 'default' : 'outline'}
                    onClick={() =>
                      void updateProjectState(
                        project,
                        { featured: !project.featured },
                        project.featured ? '已取消首页推荐' : '已设为首页推荐'
                      )
                    }
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {project.featured ? '已推荐' : '推荐'}
                  </Button>
                  {(project.websiteUrl || project.repositoryUrl) && (
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={
                          project.websiteUrl ?? project.repositoryUrl ?? '#'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title="打开作品链接"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="编辑作品"
                    onClick={() => openEdit(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="删除作品"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(project)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? '编辑作品' : '新增作品'}
              </DialogTitle>
              <DialogDescription>
                草稿不会出现在前台；首页推荐只有作品上线后才会展示。
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">
                <span>作品名称 *</span>
                <Input
                  value={form.name}
                  maxLength={100}
                  onChange={event => updateForm('name', event.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>slug *</span>
                <Input
                  value={form.slug}
                  maxLength={80}
                  className="font-mono"
                  placeholder="例如：whispers-android"
                  onChange={event =>
                    updateForm('slug', event.target.value.toLowerCase())
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>作品类型 *</span>
                <Select
                  value={form.type}
                  onValueChange={value =>
                    updateForm('type', value as ShowcaseProjectType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOWCASE_PROJECT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {SHOWCASE_PROJECT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>排序值</span>
                <Input
                  type="number"
                  min={-10000}
                  max={10000}
                  value={form.sortOrder}
                  onChange={event =>
                    updateForm('sortOrder', event.target.value)
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                <span>一句话介绍 *</span>
                <Input
                  value={form.summary}
                  maxLength={240}
                  placeholder="用一句具体的话说明作品解决了什么问题"
                  onChange={event => updateForm('summary', event.target.value)}
                />
                <span className="block text-right text-xs font-normal text-muted-foreground">
                  {form.summary.length}/240
                </span>
              </label>
              <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                <span>详细介绍</span>
                <textarea
                  value={form.description}
                  maxLength={5000}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onChange={event =>
                    updateForm('description', event.target.value)
                  }
                />
              </label>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold text-foreground">视觉素材</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(['icon', 'coverImage'] as MediaField[]).map(field => {
                  const value = form[field];
                  const label = field === 'icon' ? '作品图标' : '作品封面';
                  return (
                    <div key={field} className="space-y-2">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ${
                            field === 'icon' ? 'h-16 w-16' : 'h-16 w-28'
                          }`}
                        >
                          {value ? (
                            <img
                              src={getMediaUrl(value)}
                              alt={label}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openMediaPicker(field)}
                          >
                            选择图片
                          </Button>
                          {value && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => updateForm(field, '')}
                            >
                              清除
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">
                <span>技术标签</span>
                <Input
                  value={form.tags}
                  placeholder="React, NestJS, PostgreSQL"
                  onChange={event => updateForm('tags', event.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>支持平台</span>
                <Input
                  value={form.platforms}
                  placeholder="Web, Android, iOS"
                  onChange={event =>
                    updateForm('platforms', event.target.value)
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                <span>源码地址</span>
                <Input
                  type="url"
                  value={form.repositoryUrl}
                  placeholder="https://github.com/..."
                  onChange={event =>
                    updateForm('repositoryUrl', event.target.value)
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>官网或体验地址</span>
                <Input
                  type="url"
                  value={form.websiteUrl}
                  placeholder="https://..."
                  onChange={event =>
                    updateForm('websiteUrl', event.target.value)
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>手工下载地址</span>
                <Input
                  type="url"
                  value={form.downloadUrl}
                  placeholder="https://..."
                  onChange={event =>
                    updateForm('downloadUrl', event.target.value)
                  }
                />
              </label>
            </div>

            {form.type === 'APP' && (
              <label className="block space-y-1.5 text-sm font-medium">
                <span>关联应用分发</span>
                <Select
                  value={form.distributedAppId || 'NONE'}
                  onValueChange={value =>
                    updateForm(
                      'distributedAppId',
                      value === 'NONE' ? '' : value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="不关联" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">不关联</SelectItem>
                    {distributedApps.map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}（{app.slug}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="block text-xs font-normal text-muted-foreground">
                  关联后，前台下载按钮优先使用最高 versionCode 对应的 APK。
                </span>
              </label>
            )}

            <div className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.status === 'PUBLISHED'}
                  className="h-4 w-4 rounded border-input accent-primary"
                  onChange={event =>
                    updateForm(
                      'status',
                      event.target.checked ? 'PUBLISHED' : 'DRAFT'
                    )
                  }
                />
                <span>
                  <span className="block text-sm font-medium">立即上线</span>
                  <span className="text-xs text-muted-foreground">
                    关闭时保存为草稿
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.featured}
                  className="h-4 w-4 rounded border-input accent-primary"
                  onChange={event =>
                    updateForm('featured', event.target.checked)
                  }
                />
                <span>
                  <span className="block text-sm font-medium">首页推荐</span>
                  <span className="text-xs text-muted-foreground">
                    首页最多读取四项
                  </span>
                </span>
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingProject ? '保存修改' : '创建作品'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        isOpen={mediaField !== null}
        onClose={closeMediaPicker}
        onSelect={handleMediaSelect}
        filterType="image"
        title={mediaField === 'icon' ? '选择作品图标' : '选择作品封面'}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        variant="danger"
        title="删除作品"
        description={`确定删除“${deleteTarget?.name ?? ''}”吗？该操作不会删除关联的分发应用和媒体文件。`}
        confirmText="确认删除"
      />
    </div>
  );
};

export default ProjectShowcasePage;
