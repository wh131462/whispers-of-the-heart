/**
 * MathBlock - 数学公式块组件
 * 使用 KaTeX 渲染 LaTeX 数学公式
 */
import React, { useState, useRef, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import katex from 'katex';
import 'katex/dist/katex.css';

interface MathBlockRendererProps {
  content: string;
  onUpdate?: (content: string) => void;
}

const MathBlockRenderer: React.FC<MathBlockRendererProps> = ({
  content,
  onUpdate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [error, setError] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 渲染数学公式
  useEffect(() => {
    if (!containerRef.current || showModal) return;
    try {
      containerRef.current.innerHTML = '';
      setError('');
      if (content.trim()) {
        katex.render(content, containerRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('KaTeX 渲染失败:', err);
      containerRef.current.innerHTML = `<span class="text-red-500 text-sm">公式错误</span>`;
    }
  }, [content, showModal]);

  // 验证公式
  const validateFormula = (formula: string): boolean => {
    try {
      katex.render(formula, document.createElement('div'), {
        throwOnError: true,
        displayMode: true,
      });
      setError('');
      return true;
    } catch (err) {
      setError(`公式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      return false;
    }
  };

  const handleSave = () => {
    if (validateFormula(editContent)) {
      onUpdate?.(editContent);
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setError('');
    setShowModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 自动调整 textarea 高度
  useEffect(() => {
    if (inputRef.current && showModal) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height =
        Math.max(100, inputRef.current.scrollHeight) + 'px';
      inputRef.current.focus();
    }
  }, [showModal, editContent]);

  return (
    <>
      {/* 公式展示 */}
      <div
        className="math-block-container w-full flex justify-center items-center py-4 cursor-pointer hover:bg-gray-50 transition-colors rounded border border-transparent hover:border-gray-200"
        onClick={() => {
          setEditContent(content);
          setShowModal(true);
        }}
      >
        {!content && (
          <span className="text-gray-400 text-sm">点击插入 LaTeX 公式</span>
        )}
        <div ref={containerRef} className="math-content min-h-[2rem]" />
      </div>

      {/* 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[480px] max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">编辑数学公式</h3>
            <textarea
              ref={inputRef}
              value={editContent}
              onChange={e => {
                setEditContent(e.target.value);
                if (e.target.value.trim()) {
                  validateFormula(e.target.value);
                } else {
                  setError('');
                }
              }}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="输入 LaTeX 公式，例如：\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
              style={{ minHeight: '100px' }}
            />

            {/* 错误提示 */}
            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 预览 */}
            {editContent.trim() && !error && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs text-gray-600 mb-2">预览：</p>
                <div
                  className="text-center overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(editContent, {
                      throwOnError: false,
                      displayMode: true,
                    }),
                  }}
                />
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!!error}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                保存
              </button>
            </div>

            {/* 帮助提示 */}
            <div className="mt-4 text-xs text-gray-500 border-t pt-3">
              <p className="font-semibold mb-1">快捷键：</p>
              <ul className="space-y-1">
                <li>&bull; Ctrl/Cmd + Enter: 保存</li>
                <li>&bull; Esc: 取消</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * 创建数学公式块规格
 */
const createMathBlock = createReactBlockSpec(
  {
    type: 'mathBlock',
    propSchema: {
      formula: {
        default: '',
      },
    },
    content: 'none',
  },
  {
    render: props => (
      <MathBlockRenderer
        content={props.block.props.formula || ''}
        onUpdate={formula => {
          props.editor.updateBlock(props.block, {
            props: { formula },
          });
        }}
      />
    ),
  }
);

export const MathBlock = createMathBlock();

export default MathBlock;
