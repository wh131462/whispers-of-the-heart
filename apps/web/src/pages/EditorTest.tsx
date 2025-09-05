import React, { useState, useCallback } from 'react'
import {TiptapEditor,CommentEditor,MarkdownRenderer} from '@whispers/ui'

const EditorTest: React.FC = () => {
  const [content, setContent] = useState('<p>欢迎使用 Tiptap 编辑器！</p><p>这是一个基于 <strong>Simple template</strong> 的现代化富文本编辑器。</p>')
  const [readonlyContent, setReadonlyContent] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [autoHeight, setAutoHeight] = useState(true)

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  const handlePreview = useCallback(() => {
    console.log('更新预览，内容:', content)
    setReadonlyContent(content)
  }, [content])

  const handleCommentChange = useCallback((newContent: string) => {
    setCommentContent(newContent)
  }, [])

  const handleCommentSubmit = async () => {
    setSubmitting(true)
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('评论内容:', commentContent)
    // 注意：这里不需要手动清空 commentContent，因为 CommentEditor 会自动清空
    setSubmitting(false)
  }

  // 移除取消功能，评论编辑器不需要取消按钮

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tiptap 编辑器测试
          </h1>
          <p className="text-gray-600 mb-6">
            基于 Simple template 的现代化富文本编辑器，支持评论和文章编辑
          </p>
          
          <div className="space-y-6">
            {/* 编辑器 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">编辑器</h2>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoHeight}
                    onChange={(e) => {
                      console.log('切换自适应高度:', e.target.checked)
                      setAutoHeight(e.target.checked)
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">自适应高度</span>
                </label>
              </div>
              <TiptapEditor
                content={content}
                onChange={handleContentChange}
                placeholder="开始写作..."
                editable={true}
                showToolbar={true}
                autoHeight={autoHeight}
                className="mb-4"
              />
            </div>

            {/* 预览区域 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">预览</h2>
                <button
                  onClick={handlePreview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  更新预览
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-2 text-sm text-gray-500">
                  预览内容: {readonlyContent ? '已更新' : '未更新'} | 长度: {(readonlyContent || content).length} 字符
                </div>
                <MarkdownRenderer content={readonlyContent || content} />
              </div>
            </div>

            {/* 评论编辑器测试 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">评论编辑器（默认自适应高度）</h2>
              <CommentEditor
                content={commentContent}
                onChange={handleCommentChange}
                placeholder="写下你的评论..."
                onSubmit={handleCommentSubmit}
                submitting={submitting}
                autoHeight={true}
                clearOnSubmit={true}
                className="mb-4"
              />
            </div>

            {/* 功能说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">功能特性</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">文章编辑器</h4>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>• 支持粗体、斜体、下划线、删除线、高亮</li>
                    <li>• 多级标题（H1-H6）</li>
                    <li>• 有序列表、无序列表、任务列表</li>
                    <li>• 文本对齐（左、中、右、两端对齐）</li>
                    <li>• 代码块和行内代码</li>
                    <li>• 引用块</li>
                    <li>• 链接和图片插入</li>
                    <li>• 表格支持</li>
                    <li>• 撤销/重做功能</li>
                    <li>• 可选自适应高度</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">评论编辑器</h4>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>• 精简的工具栏</li>
                    <li>• 较小的标题（H3-H6）</li>
                    <li>• 基础文本格式</li>
                    <li>• 列表和引用</li>
                    <li>• 代码块支持</li>
                    <li>• 提交按钮</li>
                    <li>• 默认自适应高度</li>
                    <li>• 提交后自动清空</li>
                    <li>• 响应式设计</li>
                    <li>• 暗色模式支持</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorTest
