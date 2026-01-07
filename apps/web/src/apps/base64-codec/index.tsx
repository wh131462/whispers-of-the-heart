import { cn } from '@/lib/utils';
import { TextArea } from './components/TextArea';
import { FileUpload } from './components/FileUpload';
import { ActionButtons } from './components/ActionButtons';
import { ImagePreview } from './components/ImagePreview';
import { useBase64 } from './hooks/useBase64';
import { AlertCircle } from 'lucide-react';

export default function Base64Codec() {
  const {
    state,
    copied,
    fileInfo,
    setMode,
    setDirection,
    setInput,
    process,
    handleFileUpload,
    copyToClipboard,
    downloadResult,
    clear,
    swap,
  } = useBase64();

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className={cn(
          'flex flex-col gap-4 p-5',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 操作按钮 */}
        <ActionButtons
          mode={state.mode}
          direction={state.direction}
          hasInput={!!state.input.trim()}
          hasOutput={!!state.output}
          copied={copied}
          onProcess={process}
          onCopy={copyToClipboard}
          onDownload={downloadResult}
          onClear={clear}
          onSwap={swap}
          onModeChange={setMode}
          onDirectionChange={setDirection}
        />

        {/* 分隔线 */}
        <div className="h-px bg-zinc-200" />

        {/* 输入区域 */}
        {state.mode === 'text' ? (
          <TextArea
            value={state.input}
            onChange={setInput}
            placeholder={
              state.direction === 'encode'
                ? '输入要编码的文本...'
                : '输入要解码的 Base64 字符串...'
            }
            label="输入"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-600">文件</label>
            <FileUpload
              onFileSelect={handleFileUpload}
              fileInfo={fileInfo}
              onClear={clear}
            />
          </div>
        )}

        {/* 图片预览 */}
        {state.mode === 'file' && state.direction === 'encode' && (
          <ImagePreview dataUrl={state.input} fileType={state.fileType} />
        )}

        {/* 输出区域 */}
        {state.output && (
          <TextArea value={state.output} readOnly label="输出" rows={8} />
        )}

        {/* 错误显示 */}
        {state.error && (
          <div
            className={cn(
              'flex items-start gap-2 p-3',
              'bg-red-50 rounded-lg',
              'border border-red-200'
            )}
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
