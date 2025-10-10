import React, { useState } from 'react'
import { FilePreviewModal } from '@whispers/ui'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import ProtectedPage from '../components/ProtectedPage'

const FilePreviewTestPage: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false)
  const [currentFile, setCurrentFile] = useState<any>(null)

  const testFiles = [
    {
      id: '1',
      name: 'sample-image.jpg',
      url: 'https://picsum.photos/800/600',
      type: 'image/jpeg',
      size: 1024000,
      originalName: 'sample-image.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'sample-video.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video/mp4',
      size: 15728640,
      originalName: 'sample-video.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'sample-audio.mp3',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      type: 'audio/wav',
      size: 512000,
      originalName: 'sample-audio.mp3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'sample-text.txt',
      url: 'data:text/plain;base64,' + btoa('这是一个测试文本文件\n包含多行内容\n用于测试文本预览功能'),
      type: 'text/plain',
      size: 1024,
      originalName: 'sample-text.txt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '5',
      name: 'sample-markdown.md',
      url: 'data:text/markdown;base64,' + btoa('# 测试Markdown文件\n\n这是一个**测试**Markdown文件。\n\n## 功能特性\n\n- 支持标题\n- 支持**粗体**\n- 支持*斜体*\n- 支持列表\n\n```javascript\nconsole.log("Hello, World!");\n```'),
      type: 'text/markdown',
      size: 2048,
      originalName: 'sample-markdown.md',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const handlePreviewFile = (file: any) => {
    setCurrentFile(file)
    setShowPreview(true)
  }

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">文件预览测试页面</h1>
          <p className="text-gray-600">测试新的增强版文件预览组件功能</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>测试文件列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm truncate">{file.name}</h3>
                    <span className="text-xs text-gray-500">
                      {Math.round(file.size / 1024)}KB
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{file.type}</p>
                  <Button
                    onClick={() => handlePreviewFile(file)}
                    size="sm"
                    className="w-full"
                  >
                    预览文件
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 文件预览模态框 */}
        {currentFile && (
          <FilePreviewModal
            file={currentFile}
            isOpen={showPreview}
            onClose={() => {
              setShowPreview(false)
              setCurrentFile(null)
            }}
            showFileName={true}
            showFileSize={true}
            showFileInfo={true}
            theme="auto"
          />
        )}
      </div>
    </ProtectedPage>
  )
}

export default FilePreviewTestPage
