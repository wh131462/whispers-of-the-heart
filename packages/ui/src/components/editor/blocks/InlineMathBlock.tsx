/**
 * InlineMathBlock - 行内数学公式块组件
 * 用于在编辑器中渲染和编辑行内数学公式
 */
import React, { useState, useRef, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import katex from 'katex';
import 'katex/dist/katex.css';

interface InlineMathRendererProps {
  content: string;
  onUpdate?: (content: string) => void;
}

const InlineMathRenderer: React.FC<InlineMathRendererProps> = ({
  content,
  onUpdate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [error, setError] = useState<string>('');
  const containerRef = useRef<HTMLSpanElement>(null);
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
          displayMode: false, // 行内模式
        });
      } else {
        containerRef.current.innerHTML =
          '<span class="text-gray-400 text-xs">空公式</span>';
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('KaTeX 渲染失败:', err);
      containerRef.current.innerHTML =
        '<span class="text-red-500 text-xs">公式错误</span>';
    }
  }, [content, showModal]);

  // 验证公式
  const validateFormula = (formula: string): boolean => {
    try {
      katex.render(formula, document.createElement('div'), {
        throwOnError: true,
        displayMode: false,
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
        Math.max(60, inputRef.current.scrollHeight) + 'px';
      inputRef.current.focus();
    }
  }, [showModal, editContent]);

  return (
    <>
      {/* 行内公式显示 */}
      <span
        ref={containerRef}
        onClick={() => {
          setEditContent(content);
          setShowModal(true);
        }}
        className="inline-math-block inline-block px-1 py-0.5 rounded cursor-pointer hover:bg-blue-50 transition-colors"
        style={{
          minWidth: '20px',
          minHeight: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="点击编辑公式"
      />

      {/* 编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">编辑行内公式</h3>

            {/* 输入框 */}
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
              className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入 LaTeX 公式，例如：x^2 + y^2 = z^2"
              style={{ minHeight: '60px' }}
            />

            {/* 错误提示 */}
            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 预览 */}
            {editContent.trim() && !error && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs text-gray-600 mb-2">预览：</p>
                <div
                  className="text-center"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(editContent, {
                      throwOnError: false,
                      displayMode: false,
                    }),
                  }}
                />
              </div>
            )}

            {/* 按钮 */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editContent.trim() || !!error}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
 * 创建行内数学公式块规格
 */
const createInlineMathBlock = createReactBlockSpec(
  {
    type: 'inlineMathBlock',
    propSchema: {
      formula: {
        default: '',
      },
    },
    content: 'none',
  },
  {
    render: props => (
      <InlineMathRenderer
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

export const InlineMathBlock = createInlineMathBlock();

export default InlineMathBlock;
