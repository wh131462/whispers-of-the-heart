---
name: api-doc-generator
description: 为 NestJS 端点生成 API 文档。当需要文档化 API、生成接口说明、或用户提到"API 文档"、"接口文档"时使用。
allowed-tools: Read, Glob, Grep
---

# API 文档生成器

为 Whispers of the Heart 项目的 NestJS API 生成文档。

## API 基础信息

- **Base URL**: `http://localhost:7777/api/v1`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

## 文档格式

### 端点文档模板

````markdown
## {模块名}

### {操作名}

**端点**: `{METHOD} /api/v1/{path}`

**描述**: {功能描述}

**认证**: {是否需要 / 可选 / 不需要}

**请求参数**:

| 参数 | 位置  | 类型   | 必填 | 描述         |
| ---- | ----- | ------ | ---- | ------------ |
| id   | path  | string | 是   | 资源 ID      |
| page | query | number | 否   | 页码，默认 1 |

**请求体**:

```json
{
  "field": "value"
}
```
````

**响应**:

成功 (200):

```json
{
  "data": {},
  "message": "success"
}
```

错误 (4xx/5xx):

```json
{
  "statusCode": 400,
  "message": "错误信息",
  "error": "Bad Request"
}
```

```

## 现有 API 模块

| 模块 | 路径前缀 | 描述 |
|------|----------|------|
| Auth | `/auth` | 认证（登录、注册、令牌刷新） |
| User | `/users` | 用户管理 |
| Blog | `/posts` | 文章 CRUD |
| Comment | `/comments` | 评论管理 |
| Media | `/media` | 媒体文件上传下载 |
| Feedback | `/feedback` | 用户反馈 |
| Admin | `/admin` | 管理后台接口 |
| SiteConfig | `/site-config` | 站点配置 |

## 生成步骤

1. 读取目标 Controller 文件
2. 解析路由装饰器和方法
3. 提取 DTO 定义获取请求/响应结构
4. 生成 Markdown 格式文档

## 常见响应码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 注意事项

- 从 Controller 装饰器提取路由信息
- 从 DTO 类提取字段验证规则
- 标注需要认证的接口
- 说明分页参数和返回格式
```
