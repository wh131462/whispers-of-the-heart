import { cn } from '@/lib/utils';
import { PasswordDisplay } from './components/PasswordDisplay';
import { StrengthIndicator } from './components/StrengthIndicator';
import { LengthSlider } from './components/LengthSlider';
import { CharacterOptions } from './components/CharacterOptions';
import { usePasswordGenerator } from './hooks/usePasswordGenerator';

export default function PasswordGenerator() {
  const {
    password,
    options,
    strength,
    copied,
    regenerate,
    updateOptions,
    setLength,
    copyToClipboard,
  } = usePasswordGenerator();

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div
        className={cn(
          'flex flex-col gap-5 p-5',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 密码显示 */}
        <PasswordDisplay
          password={password}
          copied={copied}
          onCopy={copyToClipboard}
          onRegenerate={regenerate}
        />

        {/* 强度指示器 */}
        <StrengthIndicator strength={strength} />

        {/* 分隔线 */}
        <div className="h-px bg-zinc-200" />

        {/* 长度滑块 */}
        <LengthSlider length={options.length} onChange={setLength} />

        {/* 字符选项 */}
        <CharacterOptions options={options} onChange={updateOptions} />
      </div>
    </div>
  );
}
