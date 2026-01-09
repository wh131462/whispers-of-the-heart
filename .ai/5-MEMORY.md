# 会话记忆存储

> **用途**: AI自动记录会话中的重要决策、发现的问题、待办事项
> **更新方式**: AI在每次会话结束时自动追加
> **原则**: 只记录关键信息，避免冗余

---

## 📝 会话日志

### 2026-01-09 - BlockNote FormattingToolbar 自定义与 MarkdownRenderer 图片预览

**任务概览**:
优化 BlockNote 编辑器的 FormattingToolbar，以及将图片预览功能从页面组件移至 MarkdownRenderer 组件。

**实施内容**:

#### 1. FormattingToolbar 完整自定义 ✅

**修改文件**: `packages/ui/src/components/editor/BlockNoteEditor.tsx`

**问题**: 选中文本后只显示 AI 编辑按钮，缺少默认的格式化工具栏按钮

**原因**: BlockNote 的 FormattingToolbar 子元素会完全替换默认按钮，需要手动列出所有需要的按钮

**解决方案**: 创建 CustomFormattingToolbar 组件，手动添加所有按钮

```typescript
import {
  FormattingToolbar,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
  useSelectedBlocks,
} from '@blocknote/react';
import { AIToolbarButton } from '@blocknote/xl-ai';

const CustomFormattingToolbar: React.FC<{
  blockTypeSelectItems: ReturnType<typeof blockTypeSelectItems>;
  showAIButton: boolean;
}> = ({ blockTypeSelectItems: items, showAIButton }) => {
  const selectedBlocks = useSelectedBlocks();
  const isMediaBlockSelected = selectedBlocks.some(block =>
    MEDIA_BLOCK_TYPES.includes(block.type)
  );
  const shouldShowAIButton = showAIButton && !isMediaBlockSelected;

  return (
    <FormattingToolbar>
      {shouldShowAIButton && <AIToolbarButton />}
      <BlockTypeSelect items={items} />
      <BasicTextStyleButton basicTextStyle="bold" />
      <BasicTextStyleButton basicTextStyle="italic" />
      <BasicTextStyleButton basicTextStyle="underline" />
      <BasicTextStyleButton basicTextStyle="strike" />
      <TextAlignButton textAlignment="left" />
      <TextAlignButton textAlignment="center" />
      <TextAlignButton textAlignment="right" />
      <ColorStyleButton />
      <NestBlockButton />
      <UnnestBlockButton />
      <CreateLinkButton />
      {isMediaBlockSelected && (
        <>
          <MediaReplaceButton />
          <MediaDeleteButton />
        </>
      )}
    </FormattingToolbar>
  );
};
```

**关键点**:

- AI 按钮放在最前面（仅文本块显示）
- 媒体块选中时隐藏 AI 按钮，显示替换/删除按钮
- 使用 `useSelectedBlocks()` 检测当前选中的块类型

#### 2. MarkdownRenderer 图片预览功能 ✅

**修改文件**: `packages/ui/src/components/markdown-renderer/MarkdownRenderer.tsx`

**功能**: 点击 Markdown 渲染内容中的图片，打开预览模态框

**实现**:

```typescript
import {
  FilePreviewModal,
  type PreviewFileLink,
} from '@eternalheart/react-file-preview';

// 图片预览状态
const [previewFiles, setPreviewFiles] = useState<PreviewFileLink[]>([]);
const [previewIndex, setPreviewIndex] = useState(0);
const [isPreviewOpen, setIsPreviewOpen] = useState(false);

// 收集内容中的所有图片
const collectImages = useCallback((): PreviewFileLink[] => {
  const files: PreviewFileLink[] = [];
  if (!containerRef.current) return files;
  const images = containerRef.current.querySelectorAll('img');
  images.forEach((img, index) => {
    files.push({
      id: `img-${index}`,
      name: img.alt || `图片 ${index + 1}`,
      url: img.src,
      type: getMimeType(img.src),
    });
  });
  return files;
}, []);

// 处理图片点击
const handleContentClick = useCallback(
  (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      const img = target as HTMLImageElement;
      const files = collectImages();
      const clickedIndex = files.findIndex(f => f.url === img.src);
      setPreviewFiles(files);
      setPreviewIndex(clickedIndex >= 0 ? clickedIndex : 0);
      setIsPreviewOpen(true);
    }
  },
  [collectImages]
);
```

**优势**: 图片预览逻辑封装在 MarkdownRenderer 内部，使用该组件的页面无需额外处理

#### 3. PostDetailPage 简化 ✅

**修改文件**: `apps/web/src/pages/PostDetailPage.tsx`

**移除内容**:

- 图片预览相关状态 (previewFiles, previewIndex, isPreviewOpen)
- collectMediaFiles 函数
- handleContentClick 函数
- FilePreviewModal 组件
- 相关导入 (useRef, useCallback, FilePreviewModal, PreviewFileLink)

**关键代码位置**:

- FormattingToolbar 自定义: `BlockNoteEditor.tsx:440-492`
- 图片预览: `MarkdownRenderer.tsx:186-225`

---

### 2026-01-07 - 应用中心模块开发

**任务概览**:
新增应用中心模块，用于存放独立的小工具应用。首个应用为 108 键键盘检测器。

**实施内容**:

#### 1. 应用中心架构 ✅

**新建文件**:

- `apps/web/src/apps/types.ts` - 应用元数据类型定义
- `apps/web/src/apps/index.ts` - 应用注册表
- `apps/web/src/pages/apps/AppsPage.tsx` - 应用列表页
- `apps/web/src/pages/apps/AppDetailPage.tsx` - 应用详情/运行页

**架构设计**:

```typescript
// 应用注册机制
export type AppMeta = {
  id: string; // 路由标识
  name: string; // 应用名称
  description: string; // 应用描述
  icon: string; // lucide-react 图标名
  tags?: string[]; // 标签分类
  component: LazyExoticComponent<ComponentType>; // 懒加载组件
};

// 新增应用只需在 appRegistry 添加配置
export const appRegistry: AppMeta[] = [
  {
    id: 'keyboard-tester',
    name: '键盘检测器',
    icon: 'Keyboard',
    tags: ['工具', '硬件'],
    component: lazy(() => import('./keyboard-tester')),
  },
];
```

#### 2. 路由配置 ✅

**修改文件**: `apps/web/src/App.tsx`

```typescript
<Route path="apps" element={<AppsPage />} />
<Route path="apps/:appId" element={<AppDetailPage />} />
```

#### 3. 导航入口 ✅

**修改文件**: `apps/web/src/layouts/MainLayout.tsx`

- 在顶部导航栏右侧添加应用中心入口
- 位置：主题切换按钮左侧
- 图标：LayoutGrid (lucide-react)

#### 4. 键盘检测器应用 ✅

**新建文件**: `apps/web/src/apps/keyboard-tester/index.tsx`

**功能特性**:

- 完整 108 键键盘布局（主键盘 + 系统键 + 编辑键 + 方向键 + 数字小键盘）
- 实时检测按键按下/释放状态
- 已测试按键显示为绿色
- 检测进度显示（已测试/总数 + 百分比）
- 按键详细信息面板（key, code, keyCode, location）
- 重置功能

**布局细节**:

- 使用固定宽度容器确保各行对齐
- 跨多行/列的按键自动补偿 gap 宽度
- 数字小键盘 + 和 Enter 键跨两行

**关键代码位置**:

- 应用注册: `apps/web/src/apps/index.ts`
- 键盘检测器: `apps/web/src/apps/keyboard-tester/index.tsx`
- 应用列表页: `apps/web/src/pages/apps/AppsPage.tsx`
- 应用详情页: `apps/web/src/pages/apps/AppDetailPage.tsx`
- 导航入口: `apps/web/src/layouts/MainLayout.tsx:315-328`

**扩展新应用**:

1. 在 `apps/web/src/apps/` 下创建应用目录
2. 在 `apps/web/src/apps/index.ts` 的 `appRegistry` 添加配置
3. 无需修改路由或其他文件

---

### 2025-12-26 - BlockNote编辑器优化与功能扩展

**任务概览**:
完成对BlockNote编辑器的全面优化，包括代码块删除、媒体权限管理、视频/音频播放器升级、思维导图功能开发等五大模块。

**实施内容**:

#### 1. 代码块删除优化 ✅

- **文件**: `packages/ui/src/components/editor/customSchema.tsx`
- **功能**: 空代码块按Backspace/Delete可删除
- **实现**: 添加键盘事件监听，检测空内容并调用`editor.removeBlocks()`

#### 2. 后端媒体权限控制 ✅

**修改文件**:

- `apps/api/src/media/media.service.ts`
- `apps/api/src/media/media.controller.ts`

**权限控制**:

- 普通用户只能删除自己上传的文件
- 管理员可以删除所有文件
- 强制删除(force)仅管理员可用
- 删除前检查文件是否被引用

**友好提示**:

- 被引用文件删除时显示详细引用位置
- 格式：`文章《标题》中的内容/封面`

**API增强**:

```typescript
GET /api/v1/media
Response: {
  data: {
    items: [...],
    canDelete: boolean,      // 登录用户可删除自己的文件
    canForceDelete: boolean  // 只有管理员可强制删除
  }
}
```

#### 3. 视频播放器升级 ✅

**文件**: `packages/ui/src/components/VideoPlayer.tsx`

- **技术栈**: 从原生HTML5升级到video.js v8.23.4
- **主题**: 自定义`vjs-theme-whispers`紫色渐变主题
- **特性**:
  - 支持HLS/DASH流媒体
  - 自适应播放器(fluid + responsive)
  - 毛玻璃控制栏
  - 渐变进度条和音量条
  - 完整的播放控制和快捷键

#### 4. 音频播放器保留 ✅

**文件**: `packages/ui/src/components/AudioPlayer.tsx`

- **技术**: react-howler
- **设计**: 已具备优秀的内嵌设计，符合产品调性
- **特性**: 紫色渐变背景、封面显示、进度条、音量/速度控制、键盘快捷键

#### 5. 思维导图功能 ✅

**新建文件**:

- `packages/ui/src/components/editor/blocks/MindMapBlock.tsx`
- `packages/ui/src/components/MindMapRenderer.tsx`

**依赖**: markmap-lib, markmap-view, markmap-toolbar v0.18.12

**功能**:

- 编辑模式：CodeMirror Markdown编辑器
- 预览模式：Markmap思维导图实时渲染
- 全屏支持
- 紫色系节点配色
- 自动展开/折叠

**数据格式**:

````markdown
```markmap
# 根节点
## 子节点1
### 子主题
```
````

````

#### 6. 自定义媒体块集成 ✅ (2025-12-26 继续会话)
**新建文件**:
- `packages/ui/src/components/editor/blocks/ImageBlock.tsx` - 自定义图片块
- `packages/ui/src/components/editor/blocks/VideoBlock.tsx` - 自定义视频块
- `packages/ui/src/components/editor/blocks/AudioBlock.tsx` - 自定义音频块
- `packages/ui/src/components/editor/blocks/index.ts` - 块导出索引

**核心功能**:
- **MediaPicker 集成**: 所有块支持从媒体库选择或URL输入
- **空状态设计**: "从媒体库选择" + "通过URL添加" 双按钮
- **自定义事件**: 使用 `window.dispatchEvent` 触发 MediaPicker
  ```typescript
  window.dispatchEvent(new CustomEvent('blocknote:openMediaPicker', {
    detail: { type: 'image|video|audio', blockId: block.id }
  }))
````

- **元数据支持**:
  - 图片: caption (标题)
  - 视频: title (标题)
  - 音频: title (标题) + artist (艺术家)
- **HTML导出**: 所有块导出为标准 `<figure>` 结构
- **HTML解析**: 支持从HTML导入回编辑器

**Schema集成**:

- `customSchema.tsx` 新增三个块类型:
  - `customImage: CustomImageBlock`
  - `customVideo: CustomVideoBlock`
  - `customAudio: CustomAudioBlock`

**公共API导出**:

- `packages/ui/src/index.ts` 导出所有自定义块

#### 7. MarkdownRenderer全面升级 ✅

**文件**: `packages/ui/src/components/MarkdownRenderer.tsx`

- **新增渲染支持**:
  1. 思维导图块 (`pre code.language-markmap`)
  2. 视频块 (`figure:has(video)`) - 使用VideoPlayer组件
  3. 音频块 (`figure:has(audio)`) - 使用AudioPlayer组件
- **实现**: 使用React createRoot动态替换HTML元素
- **清理机制**: useEffect cleanup 确保所有React根被正确卸载

#### 8. 样式更新 ✅

**文件**: `packages/ui/src/styles/markdown.css`

- 添加思维导图容器样式
- 优化视频/音频播放器响应式布局
- 确保所有媒体元素正确显示

**架构更新**:

- `customSchema.tsx` 新增四个自定义块类型: mindMap, customImage, customVideo, customAudio
- `packages/ui/src/index.ts` 导出所有自定义块和渲染组件
- `packages/ui/src/components/editor/blocks/index.ts` 统一导出所有块

**关键代码位置**:

- 代码块删除: `customSchema.tsx:144-153`
- 媒体权限: `media.service.ts:286-342`
- Video.js播放器: `VideoPlayer.tsx:41-136`
- 思维导图编辑: `MindMapBlock.tsx`
- 思维导图渲染: `MindMapRenderer.tsx`
- 自定义图片块: `ImageBlock.tsx`
- 自定义视频块: `VideoBlock.tsx`
- 自定义音频块: `AudioBlock.tsx`
- Markdown渲染: `MarkdownRenderer.tsx:52-122`

**技术栈新增**:

- video.js v8.23.4 (视频播放器)
- markmap-lib/view/toolbar v0.18.12 (思维导图)

**遇到并解决的技术问题**:

1. **TypeScript错误: Toolbar.detach() 方法不存在**
   - 问题: markmap-toolbar 类型定义不完整
   - 解决: 使用 `// @ts-ignore` 注释绕过类型检查
   - 位置: `MindMapBlock.tsx:65,86`

2. **TypeScript错误: markdown() 不可调用**
   - 问题: 导入的 `markdown` 与组件 prop `markdown` 命名冲突
   - 解决: 重命名导入 `import { markdown as mdLang }`
   - 位置: `MindMapBlock.tsx:4,158`

#### 9. MediaPicker 事件集成 ✅ (2025-12-26 继续会话)

**修改文件**:

- `packages/ui/src/components/editor/BlockNoteEditor.tsx`
- `packages/ui/src/components/editor/CommentEditor.tsx`
- `apps/web/src/pages/admin/PostEditPage.tsx`

**核心功能**:

- **BlockNoteEditor 新增 prop**: `onOpenMediaPicker`
  - 当自定义媒体块触发 MediaPicker 事件时调用
  - 父组件提供回调函数来打开 MediaPickerDialog
  - 选择完成后通过回调更新对应 block

- **事件监听机制**:

  ```typescript
  window.addEventListener('blocknote:openMediaPicker', (e: CustomEvent) => {
    const { type, blockId } = e.detail;
    onOpenMediaPicker(type, url => {
      // 查找block并更新url
      const block = editor.document.find(b => b.id === blockId);
      editor.updateBlock(block, { props: { ...block.props, url } });
    });
  });
  ```

- **PostEditPage 集成**:
  - 添加 `showEditorMediaPicker` 状态管理
  - 添加第二个 MediaPickerDialog 专门用于编辑器媒体块
  - 根据 `editorMediaType` 动态设置 filterType 和 title

- **CommentEditor 支持**:
  - 同样添加 `onOpenMediaPicker` prop
  - 监听相同的自定义事件
  - 支持在评论中插入媒体块

#### 10. Slash Menu 自定义集成 ✅ (2025-12-26 继续会话)

**修改文件**:

- `packages/ui/src/components/editor/BlockNoteEditor.tsx`
- `packages/ui/src/components/editor/CommentEditor.tsx`

**核心功能**:

- **替换默认 slash menu**: 使用 `SuggestionMenuController` 自定义菜单
  - 禁用默认 slash menu: `slashMenu={false}`
  - 过滤掉默认的 image/video/audio 项
  - 添加自定义媒体块项 (🖼️ 图片、🎬 视频、🎵 音频)
  - 添加思维导图项 (🧠 思维导图)

- **自定义菜单项配置**:

  ```typescript
  {
    title: '图片',
    onItemClick: () => {
      editor.insertBlocks(
        [{ type: 'customImage', props: { url: '', caption: '' } }],
        currentBlock,
        'after'
      )
    },
    aliases: ['image', 'img', 'picture', 'photo', 'tupian'],
    group: 'Media',
    icon: <span>🖼️</span>
  }
  ```

- **搜索支持**: 支持中英文别名搜索
  - 图片: image, img, picture, photo, tupian
  - 视频: video, movie, shipin
  - 音频: audio, music, sound, yinpin
  - 思维导图: mindmap, mind map, siwei, siweidaotu

**技术细节**:

- 使用 `@ts-ignore` 绕过 BlockNote 复杂的类型定义
- 保留所有标准块类型 (标题、列表、表格、代码块等)
- CommentEditor 额外过滤掉 toggle 类型块

**待办事项**:

- [x] 在 slash menu 中集成自定义媒体块 ✅
- [x] 在 slash menu 中添加思维导图 ✅
- [ ] 测试编辑器所有新功能:
  - [ ] 输入 `/图片` 或 `/image` 插入自定义图片块
  - [ ] 输入 `/视频` 或 `/video` 插入自定义视频块
  - [ ] 输入 `/音频` 或 `/audio` 插入自定义音频块
  - [ ] 输入 `/思维导图` 或 `/mindmap` 插入思维导图块
  - [ ] 点击 "从媒体库选择" 按钮打开 MediaPicker
  - [ ] 选择媒体后自动更新块内容
  - [ ] 空代码块删除功能
- [ ] 验证媒体权限控制是否正常工作
- [ ] 检查思维导图在不同设备的显示效果
- [ ] 测试 MarkdownRenderer 是否正确渲染所有自定义块
- [ ] 构建并部署新版本

**注意事项**:

- VideoPlayer.tsx 需要导入 `video.js/dist/video-js.css`
- MindMapBlock 需要导入 `markmap-toolbar/dist/style.css`
- MarkdownRenderer 使用 createRoot 动态渲染，需要正确清理
- **关键**: 父应用需要监听 `blocknote:openMediaPicker` 自定义事件来打开MediaPicker
  ```typescript
  window.addEventListener('blocknote:openMediaPicker', (e: CustomEvent) => {
    const { type, blockId } = e.detail;
    // 打开MediaPicker，选择完成后更新对应block
  });
  ```

---

### 2025-12-25 - 修复点赞/收藏状态反显功能

**发现的问题**:

- ❌ 后端可选认证接口缺少 Guard，导致无法解析 JWT token
- ❌ 前端登录状态变化时不重新获取用户状态
- 原因: 没有 Guard 时 Passport 不会自动解析 token，`req.user` 永远是 `undefined`

**解决方案**:

1. **创建 OptionalJwtAuthGuard** (optional-jwt-auth.guard.ts)
   - 继承 `AuthGuard('jwt')`
   - 重写 `handleRequest`，token 无效时返回 `undefined` 而非抛出异常
   - 允许请求通过但会尝试解析 token

2. **更新 Controller 使用可选认证**
   - BlogController: `GET /post/:id/like-status`, `GET /post/:id/favorite-status`
   - CommentController: `GET /post/:postId`, `GET /:id/like-status`
   - 添加 `@UseGuards(OptionalJwtAuthGuard)` 装饰器

3. **前端监听登录状态变化**
   - PostDetailPage: 添加 `useEffect` 监听 `isAuthenticated` 变化
   - CommentList: 添加 `useEffect` 监听登录状态并重新加载评论

**已修复的功能**:

- ✅ 登录后自动获取文章点赞/收藏状态
- ✅ 登录后自动刷新评论区点赞状态
- ✅ 退出登录时自动重置状态
- ✅ 后端正确解析 JWT token 并返回用户点赞状态

**关键代码**:

- `apps/api/src/auth/guards/optional-jwt-auth.guard.ts` (新建)
- `apps/api/src/blog/blog.controller.ts:273,297`
- `apps/api/src/comment/comment.controller.ts:49,142`
- `apps/web/src/pages/PostDetailPage.tsx:238-260`
- `apps/web/src/components/CommentList.tsx:62-70`

**待办事项**:

- 重启 API 服务使更改生效

---

### 2025-12-25 - 完善AI协作文档体系

**决策**:

- 根据项目实际情况完善了5个核心文档
- 技术栈确认: Vite + React 19 (非Next.js) + NestJS 11 + Prisma 6
- 状态管理确认: Zustand + persist 中间件
- 存储方案确认: MinIO 对象存储

**已记录的关键信息**:

- 项目端口: API=7777, Web=8888, PostgreSQL=5432, MinIO=9000
- 共享包命名: @whispers/ui, @whispers/utils, @whispers/types, @whispers/hooks
- 评论系统采用抖音风格扁平化结构 (rootId + replyToId)

**待办事项**:

- [x] 完善 1-PROJECT-CONTEXT.md
- [x] 完善 2-TECH-STACK.md
- [x] 完善 3-CODING-RULES.md
- [x] 完善 4-PATTERNS.md
- [x] 完善 5-MEMORY.md

**发现的问题**:

- 暂无

---

## 🎯 当前上下文（最近3次会话）

### 会话 #3: 2026-01-09

**主题**: BlockNote FormattingToolbar 自定义与 MarkdownRenderer 图片预览
**关键文件**:

- `packages/ui/src/components/editor/BlockNoteEditor.tsx`
- `packages/ui/src/components/markdown-renderer/MarkdownRenderer.tsx`
- `apps/web/src/pages/PostDetailPage.tsx`
  **状态**: 已完成

### 会话 #2: 2026-01-07

**主题**: 应用中心模块开发
**关键文件**:

- `apps/web/src/apps/` (新建目录)
- `apps/web/src/pages/apps/` (新建目录)
- `apps/web/src/layouts/MainLayout.tsx`
  **状态**: 已完成

### 会话 #1: 2025-12-26

**主题**: BlockNote编辑器优化与功能扩展
**关键文件**:

- `packages/ui/src/components/editor/`
- `packages/ui/src/components/VideoPlayer.tsx`
- `packages/ui/src/components/MindMapRenderer.tsx`
  **状态**: 已完成

---

## 💡 重要发现（长期记忆）

### 架构决策

| 决策     | 选择                     | 原因                           |
| -------- | ------------------------ | ------------------------------ |
| 前端框架 | Vite + React (非Next.js) | SPA应用，无SSR需求             |
| 状态管理 | Zustand                  | 轻量、简单、支持持久化         |
| 后端框架 | NestJS                   | 企业级、模块化、TypeScript原生 |
| ORM      | Prisma                   | 类型安全、自动生成             |
| 文件存储 | MinIO                    | 兼容S3、自托管                 |
| 评论结构 | 扁平化(抖音风格)         | 便于分页、性能更好             |

### 常见问题及解决方案

| 问题                     | 解决方案                                                        |
| ------------------------ | --------------------------------------------------------------- |
| Zustand rehydration 竞态 | 使用 `_hasHydrated` 状态 + `queueMicrotask`                     |
| 跨包类型共享             | 使用 @whispers/types 包                                         |
| API Token 同步           | 同时存 Zustand + localStorage + axios header                    |
| 可选认证实现             | **必须使用 OptionalJwtAuthGuard**，否则 Passport 不会解析 token |
| 评论点赞状态批量查询     | 收集所有评论 ID,使用 `{ in: allCommentIds }` 一次性查询         |
| 登录后状态不更新         | 使用 `useEffect` 监听 `isAuthenticated` 变化并重新获取          |
| FormattingToolbar 自定义 | 子元素完全替换默认按钮，需手动列出所有需要的按钮组件            |
| 媒体块工具栏按钮         | 使用 `useSelectedBlocks()` 检测块类型，条件渲染对应按钮         |

### 性能优化记录

- **评论点赞状态查询优化** (comment.service.ts:462-518)
  - 收集所有顶级评论和回复的 ID
  - 使用单次批量查询获取用户的所有点赞记录
  - 避免 N+1 查询问题

---

## 🔗 关键代码位置（快速索引）

| 功能              | 文件路径                                                    | 备注                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------- |
| 认证Store         | `apps/web/src/stores/useAuthStore.ts`                       | JWT认证状态管理                  |
| JWT Guard         | `apps/api/src/auth/guards/jwt-auth.guard.ts`                | 强制JWT认证                      |
| 可选JWT Guard     | `apps/api/src/auth/guards/optional-jwt-auth.guard.ts`       | 可选JWT认证（已登录则解析）      |
| 博客Service       | `apps/api/src/blog/blog.service.ts`                         | 文章CRUD核心逻辑                 |
| 博客Controller    | `apps/api/src/blog/blog.controller.ts`                      | 文章API接口+点赞收藏状态         |
| 评论Service       | `apps/api/src/comment/comment.service.ts`                   | 评论CRUD+批量点赞状态查询        |
| 评论Controller    | `apps/api/src/comment/comment.controller.ts`                | 评论API接口+点赞状态             |
| 文章详情页        | `apps/web/src/pages/PostDetailPage.tsx`                     | 点赞/收藏状态获取+登录监听       |
| 评论列表          | `apps/web/src/components/CommentList.tsx`                   | 评论列表+登录监听                |
| 评论组件          | `apps/web/src/components/CommentItem.tsx`                   | 评论点赞状态展示                 |
| 评论API           | `apps/web/src/services/commentApi.ts`                       | 评论相关API调用                  |
| Prisma Schema     | `apps/api/prisma/schema.prisma`                             | 数据库模型定义                   |
| UI组件库          | `packages/ui/src/components/`                               | 共享UI组件                       |
| API工具           | `packages/utils/src/`                                       | API客户端等                      |
| 邮件模板          | `apps/api/src/mail/templates/`                              | Handlebars模板                   |
| 环境配置          | `configs/env.*`                                             | 环境变量配置                     |
| 应用注册表        | `apps/web/src/apps/index.ts`                                | 小工具应用注册                   |
| 键盘检测器        | `apps/web/src/apps/keyboard-tester/index.tsx`               | 108键键盘检测应用                |
| 应用列表页        | `apps/web/src/pages/apps/AppsPage.tsx`                      | 应用中心入口页                   |
| BlockNote编辑器   | `packages/ui/src/components/editor/BlockNoteEditor.tsx`     | 富文本编辑器+AI+自定义工具栏     |
| CommentEditor     | `packages/ui/src/components/editor/CommentEditor.tsx`       | 评论编辑器                       |
| FormattingToolbar | `packages/ui/src/components/editor/BlockNoteEditor.tsx:440` | 自定义格式化工具栏组件           |
| MarkdownRenderer  | `packages/ui/src/components/markdown-renderer/`             | Markdown渲染+图片预览            |
| 自定义媒体块      | `packages/ui/src/components/editor/blocks/`                 | ImageBlock/VideoBlock/AudioBlock |

---

## 📊 项目统计（AI自动更新）

**主要语言**: TypeScript
**前端框架**: Vite + React 19
**后端框架**: NestJS 11
**数据库**: PostgreSQL 14+
**最后分析时间**: 2025-12-25

### 核心模块

| 模块     | 状态    | 备注                    |
| -------- | ------- | ----------------------- |
| 用户认证 | ✅ 完成 | JWT + 刷新Token         |
| 博客文章 | ✅ 完成 | CRUD + 标签 + 搜索      |
| 评论系统 | ✅ 完成 | 抖音风格扁平化          |
| 媒体管理 | ✅ 完成 | MinIO存储               |
| 邮件通知 | ✅ 完成 | Nodemailer + Handlebars |
| 管理后台 | ✅ 完成 | 文章/评论/用户管理      |

---

## AI维护指南

### 何时更新此文件

✅ **应该记录**:

- 重要的架构决策（如：选择使用Zustand而非Redux）
- 发现的bug及修复方案
- 性能优化措施
- 用户提出的特殊需求或约束
- 复杂功能的实现思路
- 关键代码位置变更

❌ **不应记录**:

- 常规的增删改查操作
- 简单的样式调整
- 临时性的调试信息
- 过于细节的代码片段

### 更新格式

```markdown
### YYYY-MM-DD - 会话主题

**决策**:

- [做了什么重要决定]

**待办事项**:

- [ ] [需要后续完成的任务]

**发现的问题**:

- [遇到的bug或技术债务]
```

### 清理策略

- 保留最近5次会话日志
- 重要发现永久保留
- 每月清理过时的待办事项
- 已解决的问题移至历史记录

---

**最后更新**: 2026-01-09
**自动维护**: 由AI在每次会话结束时更新
