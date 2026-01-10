---
name: i18n-helper
description: 管理国际化翻译。当添加新文案、支持新语言、或用户提到"国际化"、"i18n"、"翻译"、"多语言"时使用。
allowed-tools: Read, Write, Edit, Glob
---

# 国际化助手

帮助管理 Whispers of the Heart 项目的多语言支持。

## i18n 配置位置

`apps/web/src/i18n/`

## 文件结构

```
i18n/
├── index.ts          # i18n 配置入口
├── locales/
│   ├── zh-CN.json    # 简体中文
│   ├── en-US.json    # 英语
│   └── ...           # 其他语言
```

## 翻译文件格式

```json
{
  "common": {
    "confirm": "确认",
    "cancel": "取消",
    "save": "保存",
    "delete": "删除"
  },
  "auth": {
    "login": "登录",
    "register": "注册",
    "logout": "退出登录"
  },
  "post": {
    "title": "标题",
    "content": "内容",
    "publish": "发布"
  }
}
```

## 使用方式

### 在组件中使用

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <button>{t('common.confirm')}</button>
  );
};
```

### 带参数的翻译

```json
{
  "greeting": "你好，{{name}}！"
}
```

```typescript
t('greeting', { name: '用户' });
```

### 复数形式

```json
{
  "items_one": "{{count}} 个项目",
  "items_other": "{{count}} 个项目"
}
```

```typescript
t('items', { count: 5 });
```

## 添加新文案流程

1. 在所有语言文件中添加对应的 key
2. 保持 key 的层级结构一致
3. 在组件中使用 `t()` 函数调用

## 添加新语言流程

1. 在 `locales/` 下创建新语言文件（如 `ja-JP.json`）
2. 复制现有语言文件内容并翻译
3. 在 `index.ts` 中注册新语言
4. 在语言切换组件中添加选项

## 命名规范

| 分类 | 前缀       | 示例              |
| ---- | ---------- | ----------------- |
| 通用 | `common.`  | `common.confirm`  |
| 认证 | `auth.`    | `auth.login`      |
| 文章 | `post.`    | `post.title`      |
| 评论 | `comment.` | `comment.reply`   |
| 错误 | `error.`   | `error.notFound`  |
| 提示 | `message.` | `message.success` |

## 注意事项

- 所有用户可见文本都应使用 i18n
- 保持各语言文件的 key 同步
- 避免在翻译中硬编码 HTML
- 日期/数字格式化使用 i18n 库功能
