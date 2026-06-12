import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Pencil,
  Save,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { AiProvider, AiProtocol } from '@whispers/types';
import { SERVER_DEFAULT_PROVIDER_ID } from '@whispers/types';
import { cn } from '@/lib/utils';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { getAllProviders } from '@/stores/aiChatBuiltins';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@whispers/ui';

interface ProviderSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ProviderFormState {
  id?: string;
  name: string;
  protocol: AiProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: string;
  maxTokens: string;
}

const emptyForm: ProviderFormState = {
  name: '',
  protocol: 'openai',
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: '0.7',
  maxTokens: '2048',
};

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export const ProviderSettingsDialog: React.FC<ProviderSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const userProviders = useAiChatStore(s => s.userProviders);
  const activeProviderId = useAiChatStore(s => s.activeProviderId);
  const setActive = useAiChatStore(s => s.setActiveProvider);
  const addProvider = useAiChatStore(s => s.addProvider);
  const updateProvider = useAiChatStore(s => s.updateProvider);
  const removeProvider = useAiChatStore(s => s.removeProvider);
  const resetAll = useAiChatStore(s => s.resetAll);
  const allProviders = useMemo(
    () => getAllProviders(userProviders),
    [userProviders]
  );

  const [form, setForm] = useState<ProviderFormState>(emptyForm);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [pendingDeleteProvider, setPendingDeleteProvider] =
    useState<AiProvider | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const editingProvider = useMemo(
    () => userProviders.find(p => p.id === editingId) ?? null,
    [userProviders, editingId]
  );

  useEffect(() => {
    setTestResult(null);
  }, [form.baseUrl, form.model, form.protocol, form.apiKey]);

  useEffect(() => {
    if (editingProvider) {
      setForm({
        id: editingProvider.id,
        name: editingProvider.name,
        protocol: editingProvider.protocol,
        baseUrl: editingProvider.baseUrl,
        apiKey: editingProvider.apiKey ?? '',
        model: editingProvider.model,
        temperature: String(editingProvider.temperature),
        maxTokens: String(editingProvider.maxTokens),
      });
    }
  }, [editingProvider]);

  if (!open) return null;

  const handleStartFromPreset = (preset: AiProvider) => {
    setEditingId(null);
    setForm({
      name: `${preset.name} 副本`,
      protocol: preset.protocol,
      baseUrl: preset.baseUrl,
      apiKey: '',
      model: preset.model,
      temperature: String(preset.temperature),
      maxTokens: String(preset.maxTokens),
    });
    setError(null);
  };

  const handleStartEdit = (provider: AiProvider) => {
    setEditingId(provider.id);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleDelete = (provider: AiProvider) => {
    setPendingDeleteProvider(provider);
  };

  const confirmDeleteProvider = () => {
    if (pendingDeleteProvider) {
      removeProvider(pendingDeleteProvider.id);
      if (editingId === pendingDeleteProvider.id) {
        handleCancelEdit();
      }
    }
    setPendingDeleteProvider(null);
  };

  const handleTest = async () => {
    if (!isHttpUrl(form.baseUrl)) return setError('baseUrl 不是合法 URL');
    if (!form.model.trim()) return setError('请填写模型名');

    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const baseUrl = form.baseUrl.trim().replace(/\/$/, '');
      const isAnthropic = form.protocol === 'anthropic';
      const targetUrl = isAnthropic
        ? `${baseUrl}/messages`
        : `${baseUrl}/chat/completions`;
      const body = isAnthropic
        ? {
            model: form.model.trim(),
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          }
        : {
            model: form.model.trim(),
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
            stream: false,
          };

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (form.apiKey) headers['x-provider-api-key'] = form.apiKey;

      const res = await fetch(
        `/api/v1/ai-proxy/proxy?url=${encodeURIComponent(targetUrl)}`,
        { method: 'POST', headers, body: JSON.stringify(body) }
      );

      if (res.ok || res.status === 200) {
        setTestResult('success');
      } else {
        const txt = await res.text().catch(() => '');
        setTestResult('fail');
        setError(`测试失败 (${res.status}): ${txt.slice(0, 100)}`);
      }
    } catch (err: unknown) {
      setTestResult('fail');
      setError(`测试失败: ${err instanceof Error ? err.message : '网络错误'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('请填写显示名');
    if (!isHttpUrl(form.baseUrl)) return setError('baseUrl 不是合法 URL');
    if (!form.model.trim()) return setError('请填写模型名');
    const t = Number(form.temperature);
    if (Number.isNaN(t) || t < 0 || t > 2)
      return setError('temperature 必须在 0-2');
    const mt = Number(form.maxTokens);
    if (!Number.isInteger(mt) || mt <= 0)
      return setError('maxTokens 必须为正整数');

    const payload = {
      name: form.name.trim(),
      protocol: form.protocol,
      baseUrl: form.baseUrl.trim(),
      apiKey: form.apiKey,
      model: form.model.trim(),
      temperature: t,
      maxTokens: mt,
    };
    if (editingId) {
      updateProvider(editingId, payload);
    } else {
      const p = addProvider(payload);
      setActive(p.id);
    }
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold">AI 模型配置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <section>
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              当前激活
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allProviders
                .filter(p => p.isServerDefault || !p.isPreset)
                .map(p => (
                  <div
                    key={p.id}
                    className={cn(
                      'relative group text-left p-2.5 rounded-lg border text-sm cursor-pointer',
                      activeProviderId === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                    onClick={() => setActive(p.id)}
                  >
                    <div className="flex items-center gap-1 font-medium">
                      {p.isServerDefault && (
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      )}
                      {p.name}
                    </div>
                    {p.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {p.description}
                      </div>
                    )}
                    {!p.isServerDefault && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {p.protocol} &middot; {p.model || '未配置模型'}
                      </div>
                    )}
                    {!p.isServerDefault && !p.isPreset && (
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleStartEdit(p);
                          }}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-primary"
                          title="编辑"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(p);
                          }}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {userProviders.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">
                还没有自定义 Provider，下方可基于预设模板新建后再激活。
              </p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {editingId ? '编辑 Provider' : '新增 Provider'}
              </h3>
              {!editingId && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>从预设复制：</span>
                  <Select
                    value=""
                    onValueChange={value => {
                      if (!value) return;
                      const preset = allProviders.find(
                        p => p.id === value && p.isPreset
                      );
                      if (preset) handleStartFromPreset(preset);
                    }}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue placeholder="选择预设" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProviders
                        .filter(
                          p => p.isPreset && p.id !== SERVER_DEFAULT_PROVIDER_ID
                        )
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="显示名">
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="协议">
                <Select
                  value={form.protocol}
                  onValueChange={value =>
                    setForm({ ...form, protocol: value as AiProtocol })
                  }
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      OpenAI 兼容（/chat/completions）
                    </SelectItem>
                    <SelectItem value="anthropic">
                      Anthropic（/messages）
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="baseUrl" className="sm:col-span-2">
                <input
                  value={form.baseUrl}
                  onChange={e => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className={inputCls}
                />
              </Field>
              <Field label="模型名">
                <input
                  value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="API Key（仅存浏览器）">
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={form.apiKey}
                    onChange={e => setForm({ ...form, apiKey: e.target.value })}
                    className={cn(inputCls, 'pr-9')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field label="temperature (0-2)">
                <input
                  value={form.temperature}
                  onChange={e =>
                    setForm({ ...form, temperature: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="maxTokens">
                <input
                  value={form.maxTokens}
                  onChange={e =>
                    setForm({ ...form, maxTokens: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            {error && (
              <div className="mt-3 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleSubmit}
                className="px-3 py-1.5 rounded-md bg-primary text-white text-sm hover:bg-primary/90 flex items-center gap-1"
              >
                {editingId ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    保存
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    新增
                  </>
                )}
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm flex items-center gap-1 border',
                  testResult === 'success'
                    ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300'
                    : testResult === 'fail'
                      ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : testResult === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : testResult === 'fail' ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {testing
                  ? '测试中'
                  : testResult === 'success'
                    ? '可用'
                    : testResult === 'fail'
                      ? '失败'
                      : '测试连接'}
              </button>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm"
                >
                  取消
                </button>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                提示：API Key 仅保存在本浏览器，不会上传到服务器
              </span>
            </div>
          </section>

          <section className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-red-600 hover:text-red-700 underline"
            >
              清除所有本地 AI 配置与历史
            </button>
          </section>
        </div>

        <ConfirmDialog
          isOpen={!!pendingDeleteProvider}
          onClose={() => setPendingDeleteProvider(null)}
          onConfirm={confirmDeleteProvider}
          title="删除 Provider"
          description={
            pendingDeleteProvider
              ? `确定要删除 Provider「${pendingDeleteProvider.name}」吗？`
              : ''
          }
          confirmText="删除"
          cancelText="取消"
          variant="danger"
        />

        <ConfirmDialog
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          onConfirm={() => {
            resetAll();
            setShowResetConfirm(false);
            onClose();
          }}
          title="清除所有配置"
          description="将清除所有本地 AI 对话配置与历史，此操作不可恢复。"
          confirmText="确认清除"
          cancelText="取消"
          variant="danger"
        />
      </div>
    </div>
  );
};

const inputCls =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

const Field: React.FC<{
  label: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, className, children }) => (
  <label className={cn('block', className)}>
    <span className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
      {label}
    </span>
    {children}
  </label>
);
