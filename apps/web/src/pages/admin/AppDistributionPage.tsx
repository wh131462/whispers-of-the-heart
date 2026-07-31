import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Copy,
  ExternalLink,
  History,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Rocket,
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
} from '@whispers/ui';
import { api, getFullUrl } from '@whispers/utils';

import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

interface AppRelease {
  id: string;
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DistributedApp {
  id: string;
  name: string;
  slug: string;
  releases: AppRelease[];
  createdAt: string;
  updatedAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

interface AppFormState {
  name: string;
  slug: string;
}

interface ReleaseFormState {
  versionCode: string;
  versionName: string;
  apkUrl: string;
  releaseNotes: string;
}

type DeleteTarget =
  | { type: 'app'; app: DistributedApp }
  | { type: 'release'; app: DistributedApp; release: AppRelease };

const EMPTY_APP_FORM: AppFormState = { name: '', slug: '' };
const EMPTY_RELEASE_FORM: ReleaseFormState = {
  versionCode: '',
  versionName: '',
  apkUrl: '',
  releaseNotes: '',
};

const AppDistributionPage: React.FC = () => {
  const { addToast } = useToast();
  const [apps, setApps] = useState<DistributedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DistributedApp | null>(null);
  const [releaseApp, setReleaseApp] = useState<DistributedApp | null>(null);
  const [editingRelease, setEditingRelease] = useState<AppRelease | null>(null);
  const [appForm, setAppForm] = useState<AppFormState>(EMPTY_APP_FORM);
  const [releaseForm, setReleaseForm] =
    useState<ReleaseFormState>(EMPTY_RELEASE_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const success = useCallback(
    (message: string): void => {
      addToast({
        title: '成功',
        description: message,
        variant: 'success',
      });
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string): void => {
      addToast({
        title: '错误',
        description: message,
        variant: 'destructive',
      });
    },
    [addToast]
  );

  const fetchApps = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.get<ApiEnvelope<DistributedApp[]>>(
        '/admin/app-distributions'
      );
      setApps(response.data.data);
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : '获取分发应用失败');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void fetchApps();
  }, [fetchApps]);

  const totalReleases = useMemo(
    () => apps.reduce((total, app) => total + app.releases.length, 0),
    [apps]
  );

  const getEndpointUrl = (slug: string): string =>
    getFullUrl(`/app-distributions/${slug}/latest.json`);

  const openCreateApp = (): void => {
    setEditingApp(null);
    setAppForm(EMPTY_APP_FORM);
    setAppDialogOpen(true);
  };

  const openEditApp = (app: DistributedApp): void => {
    setEditingApp(app);
    setAppForm({ name: app.name, slug: app.slug });
    setAppDialogOpen(true);
  };

  const openCreateRelease = (app: DistributedApp): void => {
    setReleaseApp(app);
    setEditingRelease(null);
    setReleaseForm(EMPTY_RELEASE_FORM);
    setReleaseDialogOpen(true);
  };

  const openEditRelease = (app: DistributedApp, release: AppRelease): void => {
    setReleaseApp(app);
    setEditingRelease(release);
    setReleaseForm({
      versionCode: String(release.versionCode),
      versionName: release.versionName,
      apkUrl: release.apkUrl,
      releaseNotes: release.releaseNotes ?? '',
    });
    setReleaseDialogOpen(true);
  };

  const handleAppSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!appForm.name.trim() || !appForm.slug.trim()) {
      showError('应用名称和接口标识必填');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: appForm.name.trim(),
        slug: appForm.slug.trim(),
      };
      if (editingApp) {
        await api.patch(`/admin/app-distributions/${editingApp.id}`, payload);
        success('应用信息已更新');
      } else {
        await api.post('/admin/app-distributions', payload);
        success('应用注册成功');
      }
      setAppDialogOpen(false);
      await fetchApps();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : '保存应用失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!releaseApp) return;

    const versionCode = Number(releaseForm.versionCode);
    if (!Number.isInteger(versionCode) || versionCode < 1) {
      showError('versionCode 必须是正整数');
      return;
    }

    try {
      const apkUrl = new URL(releaseForm.apkUrl.trim());
      if (apkUrl.protocol !== 'https:') {
        showError('APK 地址必须使用 HTTPS');
        return;
      }
    } catch {
      showError('请输入有效的 HTTPS APK 地址');
      return;
    }

    if (!releaseForm.versionName.trim()) {
      showError('versionName 必填');
      return;
    }

    const payload = {
      versionCode,
      versionName: releaseForm.versionName.trim(),
      apkUrl: releaseForm.apkUrl.trim(),
      releaseNotes: releaseForm.releaseNotes.trim() || null,
    };

    try {
      setSubmitting(true);
      if (editingRelease) {
        await api.patch(
          `/admin/app-distributions/${releaseApp.id}/releases/${editingRelease.id}`,
          payload
        );
        success('版本信息已更新');
      } else {
        await api.post(
          `/admin/app-distributions/${releaseApp.id}/releases`,
          payload
        );
        success('新版本发布成功');
      }
      setReleaseDialogOpen(false);
      await fetchApps();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : '保存版本失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyEndpoint = async (slug: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(getEndpointUrl(slug));
      success('更新接口地址已复制');
    } catch {
      showError('复制失败，请手动复制接口地址');
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'app') {
        await api.delete(`/admin/app-distributions/${deleteTarget.app.id}`);
        success('应用及其版本历史已删除');
      } else {
        await api.delete(
          `/admin/app-distributions/${deleteTarget.app.id}/releases/${deleteTarget.release.id}`
        );
        success('版本已删除');
      }
      await fetchApps();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatDate = (value: string): string =>
    new Date(value).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">应用分发</h1>
          <p className="mt-1 text-muted-foreground">
            注册客户端应用，维护版本历史并提供更新检查 JSON
          </p>
        </div>
        <Button onClick={openCreateApp}>
          <Plus className="mr-2 h-4 w-4" />
          注册应用
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">已注册应用</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {apps.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">版本记录</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {totalReleases}
          </p>
        </div>
      </div>

      {loading && apps.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            还没有分发应用
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            注册应用后即可发布版本并获得更新接口
          </p>
          <Button className="mt-5" onClick={openCreateApp}>
            <Plus className="mr-2 h-4 w-4" />
            注册第一个应用
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {apps.map(app => {
            const endpointUrl = getEndpointUrl(app.slug);
            return (
              <section
                key={app.id}
                className="overflow-hidden rounded-lg border bg-card shadow-sm"
              >
                <div className="border-b p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">
                          {app.name}
                        </h2>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {app.slug}
                        </span>
                      </div>
                      <div className="mt-3 flex max-w-3xl items-center gap-2 rounded-md bg-muted/60 p-2.5">
                        <code className="min-w-0 flex-1 break-all text-xs text-muted-foreground sm:text-sm">
                          {endpointUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="复制更新接口"
                          onClick={() => void handleCopyEndpoint(app.slug)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {app.releases.length > 0 && (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={endpointUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="打开更新接口"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openCreateRelease(app)}>
                        <Rocket className="mr-2 h-4 w-4" />
                        发布版本
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditApp(app)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: 'app', app })}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">删除应用</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                    <History className="h-4 w-4" />
                    版本历史（{app.releases.length}）
                  </div>
                  {app.releases.length === 0 ? (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      尚未发布版本，更新接口当前会返回 404
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {app.releases.map((release, index) => (
                        <article
                          key={release.id}
                          className="rounded-md border p-3 sm:p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {release.versionName}
                                </span>
                                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                                  versionCode {release.versionCode}
                                </span>
                                {index === 0 && (
                                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                                    当前最新
                                  </span>
                                )}
                              </div>
                              <a
                                href={release.apkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block break-all text-sm text-primary hover:underline"
                              >
                                {release.apkUrl}
                              </a>
                              {release.releaseNotes && (
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                  {release.releaseNotes}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                更新于 {formatDate(release.updatedAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1 self-end sm:self-start">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="编辑版本"
                                onClick={() => openEditRelease(app, release)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="删除版本"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'release',
                                    app,
                                    release,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAppSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>{editingApp ? '编辑应用' : '注册应用'}</DialogTitle>
              <DialogDescription>
                接口标识将成为公开更新 URL
                的一部分，只能使用小写字母、数字和连字符。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block space-y-1.5 text-sm font-medium">
                <span>应用名称</span>
                <Input
                  value={appForm.name}
                  maxLength={100}
                  placeholder="例如：心语 Android"
                  onChange={event =>
                    setAppForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>接口标识</span>
                <Input
                  value={appForm.slug}
                  maxLength={80}
                  placeholder="例如：whispers-android"
                  className="font-mono"
                  onChange={event =>
                    setAppForm(current => ({
                      ...current,
                      slug: event.target.value.toLowerCase(),
                    }))
                  }
                />
              </label>
              {appForm.slug && (
                <p className="break-all rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
                  {getEndpointUrl(appForm.slug)}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAppDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingApp ? '保存修改' : '注册应用'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleReleaseSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {editingRelease
                  ? '编辑版本'
                  : `发布 ${releaseApp?.name ?? ''} 新版本`}
              </DialogTitle>
              <DialogDescription>
                公开接口始终返回 versionCode 最大的版本。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium">
                <span>versionCode</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={releaseForm.versionCode}
                  placeholder="例如：42"
                  onChange={event =>
                    setReleaseForm(current => ({
                      ...current,
                      versionCode: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>versionName</span>
                <Input
                  value={releaseForm.versionName}
                  maxLength={50}
                  placeholder="例如：2.3.0"
                  onChange={event =>
                    setReleaseForm(current => ({
                      ...current,
                      versionName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
                <span>APK HTTPS 地址</span>
                <Input
                  type="url"
                  value={releaseForm.apkUrl}
                  maxLength={2048}
                  placeholder="https://downloads.example.com/app.apk"
                  onChange={event =>
                    setReleaseForm(current => ({
                      ...current,
                      apkUrl: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
                <span>releaseNotes（可选）</span>
                <textarea
                  value={releaseForm.releaseNotes}
                  maxLength={10000}
                  rows={5}
                  placeholder="本次版本的更新内容"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onChange={event =>
                    setReleaseForm(current => ({
                      ...current,
                      releaseNotes: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReleaseDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingRelease ? '保存修改' : '发布版本'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        variant="danger"
        title={deleteTarget?.type === 'app' ? '删除分发应用' : '删除应用版本'}
        description={
          deleteTarget?.type === 'app'
            ? `将删除“${deleteTarget.app.name}”及其全部 ${deleteTarget.app.releases.length} 个版本，公开更新接口将立即失效。`
            : `删除版本 ${deleteTarget?.release.versionName ?? ''} 后，次高 versionCode 将自动成为最新版本。`
        }
        confirmText="确认删除"
      />
    </div>
  );
};

export default AppDistributionPage;
