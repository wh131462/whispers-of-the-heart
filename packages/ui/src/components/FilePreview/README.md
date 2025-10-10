# FilePreview 组件更新说明

## 主要变更

### 1. 布局结构优化
- **移除底部文件信息展示**：原来的底部文件信息区域已被移除
- **新增信息对话框**：在文件名旁边添加信息图标，点击可查看详细文件信息
- **简化布局**：现在只有头部和内容区两个主要部分

### 2. 头部设计改进
- **文件名显示**：主标题显示文件名
- **副标题信息**：根据文件类型显示相关附加信息
  - 文本文件：显示字符数和行数
  - 图片文件：显示尺寸、缩放比例、旋转角度等
  - 视频/音频：显示时长和文件大小
  - 其他文件：显示文件大小和类型

### 3. 操作按钮优化
- **信息按钮**：使用线性图标，点击查看文件详细信息
- **关闭按钮**：使用线性图标，减少视觉干扰
- **组件工具栏**：各预览组件的工具栏现在可选显示

### 4. 组件功能增强
- **TextPreview**：支持统计信息回调，可在头部显示字符数和行数
- **AdvancedImagePreview**：支持变换状态回调，可在头部显示缩放和旋转信息
- **FileInfoDialog**：新的对话框组件，用于显示详细文件信息

## 使用方式

### 基本使用
```tsx
import { FilePreview } from '@/components/FilePreview'

<FilePreview
  file={{
    id: '1',
    name: 'example.txt',
    url: '/path/to/file',
    type: 'text/plain',
    size: 1024
  }}
  onClose={() => console.log('关闭')}
/>
```

### 模态框使用
```tsx
import { FilePreviewModal } from '@/components/FilePreview'

<FilePreviewModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  file={{
    id: '1',
    name: 'example.jpg',
    url: '/path/to/image',
    type: 'image/jpeg',
    size: 2048,
    dimensions: { width: 1920, height: 1080 }
  }}
/>
```

## 新增功能

### 文件信息对话框
- 显示完整的文件元数据
- 支持暗色主题
- 响应式设计
- 包含文件类型、大小、尺寸、时长、创建时间等信息

### 动态副标题
- 文本文件：实时显示字符数和行数
- 图片文件：显示当前缩放比例和旋转角度
- 其他文件：显示基本文件信息

## 样式特点

- **简约设计**：减少视觉干扰，突出内容
- **线性图标**：使用简洁的线性图标
- **响应式布局**：适配不同屏幕尺寸
- **主题支持**：支持明暗主题切换
- **毛玻璃效果**：头部使用半透明背景和毛玻璃效果
