import { cn } from '@/lib/utils';
import { JsonEditor } from './components/JsonEditor';
import { JsonTreeView } from './components/JsonTreeView';
import { ActionBar } from './components/ActionBar';
import { ErrorDisplay } from './components/ErrorDisplay';
import { useJsonFormatter } from './hooks/useJsonFormatter';

export default function JsonFormatter() {
  const {
    state,
    copied,
    treeData,
    setInput,
    format,
    minify,
    copyToClipboard,
    clear,
    loadSample,
    setViewMode,
    setIndentSize,
  } = useJsonFormatter();

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div
        className={cn(
          'flex flex-col gap-4 p-5',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 操作栏 */}
        <ActionBar
          viewMode={state.viewMode}
          indentSize={state.indentSize}
          copied={copied}
          hasInput={!!state.input.trim()}
          onFormat={format}
          onMinify={minify}
          onCopy={copyToClipboard}
          onClear={clear}
          onLoadSample={loadSample}
          onViewModeChange={setViewMode}
          onIndentSizeChange={setIndentSize}
        />

        {/* 编辑区域 */}
        <div className="min-h-[400px] flex flex-col">
          {state.viewMode === 'code' ? (
            <JsonEditor
              value={state.input}
              onChange={setInput}
              error={state.error}
            />
          ) : (
            <JsonTreeView data={treeData} />
          )}
        </div>

        {/* 状态显示 */}
        <ErrorDisplay
          error={state.error}
          isValid={state.isValid}
          stats={state.stats}
          hasInput={!!state.input.trim()}
        />
      </div>
    </div>
  );
}
