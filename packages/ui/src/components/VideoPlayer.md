# VideoPlayer 组件

基于 `@videojs/react` 实现的视频播放器组件。

## 特性

- ✅ 支持多种视频格式 (MP4, WebM, OGG, HLS, DASH)
- ✅ 响应式设计
- ✅ 自定义标题显示
- ✅ 自动播放和循环播放
- ✅ 海报图支持
- ✅ 完整的事件回调
- ✅ 移动端友好

## 安装依赖

```bash
pnpm add @videojs/react video.js
```

## 基本用法

```tsx
import { VideoPlayer } from '@whispers/ui'

function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      title="示例视频"
      poster="https://example.com/poster.jpg"
      autoPlay={false}
      loop={false}
    />
  )
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | `string` | - | 视频源地址 (必填) |
| `title` | `string` | - | 视频标题 |
| `className` | `string` | - | 自定义样式类名 |
| `autoPlay` | `boolean` | `false` | 是否自动播放 |
| `loop` | `boolean` | `false` | 是否循环播放 |
| `poster` | `string` | - | 海报图地址 |
| `qualities` | `Array<{label: string, src: string}>` | - | 多画质选项 |
| `onError` | `(error: string) => void` | - | 错误回调 |
| `onLoadStart` | `() => void` | - | 开始加载回调 |
| `onLoadedData` | `() => void` | - | 数据加载完成回调 |
| `onPlay` | `() => void` | - | 播放回调 |
| `onPause` | `() => void` | - | 暂停回调 |
| `onEnded` | `() => void` | - | 播放结束回调 |

## 示例

### 基础播放器

```tsx
<VideoPlayer
  src="/videos/sample.mp4"
  title="我的视频"
/>
```

### 带海报图和自动播放

```tsx
<VideoPlayer
  src="/videos/sample.mp4"
  poster="/images/poster.jpg"
  autoPlay
  loop
/>
```

### 带事件回调

```tsx
<VideoPlayer
  src="/videos/sample.mp4"
  onPlay={() => console.log('视频开始播放')}
  onPause={() => console.log('视频暂停')}
  onEnded={() => console.log('视频播放结束')}
  onError={(error) => console.error('播放错误:', error)}
/>
```

### 多画质选项

```tsx
<VideoPlayer
  src="/videos/sample-720p.mp4"
  qualities={[
    { label: '1080p', src: '/videos/sample-1080p.mp4' },
    { label: '720p', src: '/videos/sample-720p.mp4' },
    { label: '480p', src: '/videos/sample-480p.mp4' }
  ]}
/>
```

## 支持的视频格式

- **MP4**: `.mp4` (推荐)
- **WebM**: `.webm`
- **OGG**: `.ogg`
- **HLS**: `.m3u8` (HTTP Live Streaming)
- **DASH**: `.mpd` (Dynamic Adaptive Streaming)

## 样式定制

组件使用 Tailwind CSS 和自定义 CSS 变量,可以通过 `className` 属性进行样式覆盖:

```tsx
<VideoPlayer
  src="/videos/sample.mp4"
  className="max-w-4xl mx-auto shadow-2xl"
/>
```

## 注意事项

1. **自动播放限制**: 大多数浏览器限制自动播放带声音的视频,建议配合静音使用
2. **移动端支持**: 组件已优化移动端体验,支持 `playsInline` 属性
3. **性能优化**: 建议使用适当的视频编码和分辨率以获得最佳性能

## 技术栈

- [@videojs/react](https://github.com/videojs/videojs-react) - Video.js 的 React 封装
- [Video.js](https://videojs.com/) - 强大的 HTML5 视频播放器

## 更新日志

### v1.0.0
- 使用 `@videojs/react` 重新实现
- 支持现代化的 React Hooks API
- 改进的类型定义
- 更好的移动端支持

