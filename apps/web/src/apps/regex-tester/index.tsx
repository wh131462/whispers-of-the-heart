import { cn } from '@/lib/utils';
import { PatternInput } from './components/PatternInput';
import { FlagsSelector } from './components/FlagsSelector';
import { TestStringInput } from './components/TestStringInput';
import { MatchHighlight } from './components/MatchHighlight';
import { MatchDetails } from './components/MatchDetails';
import { CheatSheet } from './components/CheatSheet';
import { useRegexTester } from './hooks/useRegexTester';

export default function RegexTester() {
  const {
    state,
    flagsString,
    highlightedSegments,
    setPattern,
    setTestString,
    setFlag,
    applyPattern,
  } = useRegexTester();

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
        {/* 正则表达式输入 */}
        <PatternInput
          pattern={state.pattern}
          flags={flagsString}
          error={state.error}
          onChange={setPattern}
        />

        {/* 标志选择 */}
        <FlagsSelector flags={state.flags} onChange={setFlag} />

        {/* 分隔线 */}
        <div className="h-px bg-zinc-200" />

        {/* 测试字符串 */}
        <TestStringInput value={state.testString} onChange={setTestString} />

        {/* 匹配高亮 */}
        <MatchHighlight segments={highlightedSegments} />

        {/* 匹配详情 */}
        <MatchDetails matches={state.matches} />

        {/* 常用正则 */}
        <CheatSheet onSelectPattern={applyPattern} />
      </div>
    </div>
  );
}
