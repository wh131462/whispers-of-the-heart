---
name: blocknote-extension
description: 扩展 BlockNote 编辑器功能。当需要添加新的编辑器块、自定义编辑器功能、或用户提到"编辑器"、"BlockNote"、"富文本"时使用。
allowed-tools: Read, Write, Glob, Grep
---

# BlockNote 编辑器扩展指南

帮助扩展 Whispers of the Heart 项目的 BlockNote 富文本编辑器。

## 编辑器位置

- 主编辑器组件：`packages/ui/src/components/editor/`
- BlockNote 配置：`packages/ui/src/components/editor/BlockNoteEditor.tsx`

## BlockNote 核心概念

### Block 结构

```typescript
interface Block {
  id: string;
  type: string;
  props: Record<string, any>;
  content: InlineContent[];
  children: Block[];
}
```

### 内置 Block 类型

- `paragraph` - 段落
- `heading` - 标题（h1-h6）
- `bulletListItem` - 无序列表
- `numberedListItem` - 有序列表
- `checkListItem` - 复选框列表
- `image` - 图片
- `video` - 视频
- `audio` - 音频
- `file` - 文件
- `table` - 表格
- `codeBlock` - 代码块

## 自定义 Block 创建

### 定义 Block Schema

```typescript
import { createReactBlockSpec } from '@blocknote/react';

const MyCustomBlock = createReactBlockSpec(
  {
    type: 'myCustomBlock',
    propSchema: {
      customProp: {
        default: 'defaultValue',
      },
    },
    content: 'inline', // 或 'none'
  },
  {
    render: (props) => {
      return (
        <div className="my-custom-block">
          {props.block.props.customProp}
          <props.contentRef /> {/* 如果 content: 'inline' */}
        </div>
      );
    },
  }
);
```

### 注册自定义 Block

```typescript
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    myCustomBlock: MyCustomBlock,
  },
});
```

## 自定义 Slash Menu 命令

```typescript
const customSlashMenuItems = [
  {
    title: 'My Block',
    subtext: '插入自定义块',
    onItemClick: (editor) => {
      editor.insertBlocks(
        [{ type: 'myCustomBlock', props: {} }],
        editor.getTextCursorPosition().block,
        'after'
      );
    },
    aliases: ['custom', 'my'],
    group: 'Other',
    icon: <MyIcon />,
  },
];
```

## 项目现有扩展

查看 `packages/ui/src/components/editor/` 目录了解现有扩展：

- 媒体上传组件
- AI 辅助功能
- Markdown 渲染器

## 开发流程

1. 在 `packages/ui/src/components/editor/blocks/` 创建新 Block
2. 定义 Block Schema 和渲染组件
3. 在编辑器配置中注册
4. 添加 Slash Menu 项（可选）
5. 添加工具栏按钮（可选）

## 注意事项

- 自定义 Block 需要处理序列化/反序列化
- 考虑 Markdown 导出兼容性
- 移动端适配
- 保持与现有样式一致
