import React, { useState, useRef } from 'react'
import { Save, Eye, Edit3, Image, Video, Music, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import MDEditor from '@uiw/react-md-editor'
import { MarkdownRenderer } from '@whispers/ui'
import { useToast } from '../contexts/ToastContext'

interface EditorState {
  title: string
  content: string
  excerpt: string
  tags: string[]
  category: string
  isPublished: boolean
}

const EditorPage: React.FC = () => {
  const [editorMode, setEditorMode] = useState<'markdown' | 'rich-text'>('markdown')
  const [editorState, setEditorState] = useState<EditorState>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    category: 'none',
    isPublished: false
  })
  const [newTag, setNewTag] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const categories = [
    { id: 'tech', name: '技术' },
    { id: 'design', name: '设计' },
    { id: 'life', name: '生活' },
    { id: 'tutorial', name: '教程' },
    { id: 'news', name: '新闻' }
  ]

  const handleSave = () => {
    // 保存文章逻辑
    const saveData = {
      ...editorState,
      category: editorState.category === 'none' ? '' : editorState.category
    }
    console.log('保存文章:', saveData)
    addToast({
      title: '保存成功',
      description: '文章草稿已保存',
      variant: 'success'
    })
  }

  const handlePublish = () => {
    if (!editorState.title.trim()) {
      addToast({
        title: '缺少标题',
        description: '请输入文章标题',
        variant: 'warning'
      })
      return
    }
    if (!editorState.content.trim()) {
      addToast({
        title: '缺少内容',
        description: '请输入文章内容',
        variant: 'warning'
      })
      return
    }
    
    setEditorState(prev => ({ ...prev, isPublished: true }))
    const publishData = {
      ...editorState,
      category: editorState.category === 'none' ? '' : editorState.category
    }
    console.log('发布文章:', publishData)
    addToast({
      title: '发布成功',
      description: '文章已成功发布',
      variant: 'success'
    })
  }

  const handleAddTag = () => {
    if (newTag.trim() && !editorState.tags.includes(newTag.trim())) {
      setEditorState(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditorState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 这里应该上传文件到服务器
      const imageUrl = URL.createObjectURL(file)
      const imageMarkdown = `![${file.name}](${imageUrl})`
      
      if (editorMode === 'markdown') {
        setEditorState(prev => ({
          ...prev,
          content: prev.content + '\n' + imageMarkdown
        }))
      }
      
      // 清理文件输入
      event.target.value = ''
    }
  }

  const insertMedia = (type: 'video' | 'audio', url: string) => {
    const mediaMarkdown = type === 'video' 
      ? `\n<video controls>\n  <source src="${url}" type="video/mp4">\n</video>\n`
      : `\n<audio controls>\n  <source src="${url}" type="audio/mpeg">\n</audio>\n`
    
    setEditorState(prev => ({
      ...prev,
      content: prev.content + mediaMarkdown
    }))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">文章编辑器</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {isPreview ? '编辑' : '预览'}
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            保存草稿
          </Button>
          <Button onClick={handlePublish}>
            <FileText className="h-4 w-4 mr-2" />
            发布文章
          </Button>
        </div>
      </div>

      {/* 编辑器工具栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>编辑器设置</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={editorMode === 'markdown' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditorMode('markdown')}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Markdown
              </Button>
              <Button
                variant={editorMode === 'rich-text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditorMode('rich-text')}
              >
                <FileText className="h-4 w-4 mr-2" />
                富文本
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 文章标题 */}
          <div>
            <label className="block text-sm font-medium mb-2">文章标题</label>
            <Input
              placeholder="输入文章标题..."
              value={editorState.title}
              onChange={(e) => setEditorState(prev => ({ ...prev, title: e.target.value }))}
              className="text-lg"
            />
          </div>

          {/* 文章摘要 */}
          <div>
            <label className="block text-sm font-medium mb-2">文章摘要</label>
            <Input
              placeholder="输入文章摘要..."
              value={editorState.excerpt}
              onChange={(e) => setEditorState(prev => ({ ...prev, excerpt: e.target.value }))}
            />
          </div>

          {/* 分类选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">文章分类</label>
            <Select
              value={editorState.category}
              onValueChange={(value) => setEditorState(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">选择分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 标签管理 */}
          <div>
            <label className="block text-sm font-medium mb-2">文章标签</label>
            <div className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="输入标签..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1"
              />
              <Button onClick={handleAddTag} size="sm">
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editorState.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-secondary text-secondary-foreground"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 媒体插入工具栏 */}
      <Card>
        <CardHeader>
          <CardTitle>插入媒体</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleImageUpload}>
              <Image className="h-4 w-4 mr-2" />
              插入图片
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const url = prompt('请输入视频链接:')
                if (url) insertMedia('video', url)
              }}
            >
              <Video className="h-4 w-4 mr-2" />
              插入视频
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const url = prompt('请输入音频链接:')
                if (url) insertMedia('audio', url)
              }}
            >
              <Music className="h-4 w-4 mr-2" />
              插入音频
            </Button>
          </div>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* 编辑器主体 */}
      <Card className="min-h-[600px]">
        <CardContent className="p-0">
          {editorMode === 'markdown' ? (
            <div className="h-full">
              <MDEditor
                value={editorState.content}
                onChange={(value) => setEditorState(prev => ({ ...prev, content: value || '' }))}
                height={600}
                preview={isPreview ? 'preview' : 'edit'}
                className="h-full"
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="border rounded-md p-4 min-h-[600px]">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="outline-none min-h-[580px] prose prose-lg max-w-none"
                  onInput={(e) => {
                    const content = e.currentTarget.innerHTML
                    setEditorState(prev => ({ ...prev, content }))
                  }}
                  dangerouslySetInnerHTML={{ __html: editorState.content }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览区域 */}
      {isPreview && (
        <Card>
          <CardHeader>
            <CardTitle>文章预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none">
              <h1>{editorState.title || '无标题'}</h1>
              <p className="text-muted-foreground">{editorState.excerpt || '无摘要'}</p>
              <MarkdownRenderer content={editorState.content} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 发布状态 */}
      {editorState.isPublished && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center text-green-800">
              <FileText className="h-5 w-5 mr-2" />
              <span className="font-medium">文章已发布</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EditorPage
