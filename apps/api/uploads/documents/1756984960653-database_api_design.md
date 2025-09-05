# 博客系统数据库结构和API接口设计

## 项目概述

本文档详细描述了基于参考网站 https://blog.tomys.top/ 的博客系统的数据库结构设计和RESTful API接口规范。该系统旨在提供一个完整的博客解决方案，包括前端展示、管理后台和API服务，确保内容可配置且易于复制部署。

## 数据库设计

### 数据库选择

考虑到项目的复杂性和数据关系的重要性，我们选择PostgreSQL作为主数据库。PostgreSQL提供了强大的关系型数据库功能，支持JSON数据类型，具有良好的性能和可扩展性，非常适合博客系统的需求。

### 核心数据表设计

#### 1. 用户表 (users)

用户表存储系统管理员和作者的信息。虽然当前系统主要面向单用户博客，但设计时考虑了多用户扩展的可能性。

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'author' CHECK (role IN ('admin', 'author', 'editor')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

用户表的设计考虑了以下关键因素：
- 使用SERIAL类型的主键确保唯一性和自增特性
- username和email字段设置为UNIQUE约束，防止重复注册
- password_hash存储加密后的密码，确保安全性
- role字段使用CHECK约束限制角色类型，支持权限管理
- 时间戳字段使用WITH TIME ZONE确保时区信息的准确性

#### 2. 分类表 (categories)

分类表用于组织博客文章的主要分类，支持层级结构设计。

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

分类表的特点包括：
- slug字段用于生成SEO友好的URL
- parent_id支持分类的层级结构，可以创建子分类
- sort_order字段用于控制分类的显示顺序
- 自引用外键关系支持无限层级的分类嵌套

#### 3. 标签表 (tags)

标签表提供更细粒度的内容分类，支持多对多关系。

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

标签表设计要点：
- color字段存储十六进制颜色值，用于前端显示
- usage_count字段记录标签的使用频率，便于热门标签统计
- 相比分类，标签更加灵活，不需要层级结构

#### 4. 文章表 (posts)

文章表是系统的核心，存储所有博客文章的主要信息。

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    content_html TEXT,
    featured_image VARCHAR(255),
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

文章表的详细设计说明：
- content字段存储原始内容（如Markdown格式）
- content_html字段存储渲染后的HTML内容，提高前端显示性能
- status字段支持草稿、已发布、已归档三种状态
- is_featured标记特色文章，用于首页推荐
- view_count和like_count支持文章统计功能
- meta_title和meta_description用于SEO优化
- published_at字段独立于created_at，支持定时发布功能

#### 5. 文章标签关联表 (post_tags)

实现文章和标签的多对多关系。

```sql
CREATE TABLE post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id)
);
```

#### 6. 评论表 (comments)

支持文章评论功能，包括嵌套回复。

```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(100) NOT NULL,
    author_website VARCHAR(255),
    content TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'trash')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

评论表设计考虑：
- parent_id支持评论的嵌套回复功能
- 存储访客信息而非强制用户注册
- ip_address和user_agent用于反垃圾评论
- status字段支持评论审核机制

#### 7. 系统配置表 (settings)

存储博客的全局配置信息，支持动态配置。

```sql
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

系统配置表的用途：
- 存储站点标题、描述、关键词等基本信息
- 配置主题设置、社交媒体链接等
- 支持不同数据类型的配置项
- is_public字段控制配置是否对外公开

#### 8. 媒体文件表 (media)

管理上传的图片、文档等媒体文件。

```sql
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 数据库索引优化

为了提高查询性能，需要创建适当的索引：

```sql
-- 文章相关索引
CREATE INDEX idx_posts_status_published_at ON posts(status, published_at DESC);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_slug ON posts(slug);

-- 评论相关索引
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);

-- 标签关联索引
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- 分类层级索引
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

## API接口设计

### API架构原则

本博客系统采用RESTful API设计原则，遵循以下规范：

1. **资源导向**：每个URL代表一种资源
2. **HTTP动词**：使用标准HTTP方法（GET、POST、PUT、DELETE）
3. **状态码**：返回标准HTTP状态码
4. **JSON格式**：统一使用JSON作为数据交换格式
5. **版本控制**：API路径包含版本号（/api/v1/）
6. **认证授权**：使用JWT Token进行身份验证

### 通用响应格式

所有API响应都遵循统一的格式：

```json
{
    "success": true,
    "data": {},
    "message": "操作成功",
    "code": 200,
    "timestamp": "2025-09-04T02:00:00Z"
}
```

错误响应格式：

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "请求参数验证失败",
        "details": []
    },
    "timestamp": "2025-09-04T02:00:00Z"
}
```

### 核心API端点设计

#### 1. 认证相关API

**POST /api/v1/auth/login**
- 功能：用户登录
- 请求体：
```json
{
    "username": "admin",
    "password": "password123"
}
```
- 响应：
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "username": "admin",
            "display_name": "管理员",
            "role": "admin"
        }
    }
}
```

**POST /api/v1/auth/logout**
- 功能：用户登出
- 请求头：Authorization: Bearer {token}

**GET /api/v1/auth/me**
- 功能：获取当前用户信息
- 请求头：Authorization: Bearer {token}

#### 2. 文章相关API

**GET /api/v1/posts**
- 功能：获取文章列表
- 查询参数：
  - page: 页码（默认1）
  - limit: 每页数量（默认10）
  - category: 分类ID
  - tag: 标签ID
  - status: 文章状态
  - search: 搜索关键词
- 响应：
```json
{
    "success": true,
    "data": {
        "posts": [
            {
                "id": 1,
                "title": "文章标题",
                "slug": "article-slug",
                "excerpt": "文章摘要",
                "featured_image": "/uploads/image.jpg",
                "author": {
                    "id": 1,
                    "display_name": "作者名"
                },
                "category": {
                    "id": 1,
                    "name": "分类名",
                    "slug": "category-slug"
                },
                "tags": [
                    {
                        "id": 1,
                        "name": "标签名",
                        "slug": "tag-slug"
                    }
                ],
                "view_count": 100,
                "like_count": 5,
                "published_at": "2025-09-04T02:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "total_pages": 10,
            "total_count": 100,
            "has_next": true,
            "has_prev": false
        }
    }
}
```

**GET /api/v1/posts/{id}**
- 功能：获取单篇文章详情
- 路径参数：id（文章ID）
- 响应：包含完整文章内容和评论

**POST /api/v1/posts**
- 功能：创建新文章（需要认证）
- 请求体：
```json
{
    "title": "新文章标题",
    "content": "文章内容（Markdown格式）",
    "excerpt": "文章摘要",
    "category_id": 1,
    "tag_ids": [1, 2, 3],
    "featured_image": "/uploads/featured.jpg",
    "status": "published",
    "meta_title": "SEO标题",
    "meta_description": "SEO描述"
}
```

**PUT /api/v1/posts/{id}**
- 功能：更新文章（需要认证）
- 请求体：同创建文章

**DELETE /api/v1/posts/{id}**
- 功能：删除文章（需要认证）

#### 3. 分类相关API

**GET /api/v1/categories**
- 功能：获取分类列表
- 查询参数：
  - include_count: 是否包含文章数量
  - parent_id: 父分类ID（获取子分类）
- 响应：
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "技术分享",
            "slug": "tech",
            "description": "技术相关文章",
            "post_count": 15,
            "children": [
                {
                    "id": 2,
                    "name": "前端开发",
                    "slug": "frontend",
                    "post_count": 8
                }
            ]
        }
    ]
}
```

**POST /api/v1/categories**
- 功能：创建分类（需要认证）

**PUT /api/v1/categories/{id}**
- 功能：更新分类（需要认证）

**DELETE /api/v1/categories/{id}**
- 功能：删除分类（需要认证）

#### 4. 标签相关API

**GET /api/v1/tags**
- 功能：获取标签列表
- 查询参数：
  - popular: 是否按使用频率排序
  - limit: 返回数量限制

**POST /api/v1/tags**
- 功能：创建标签（需要认证）

#### 5. 评论相关API

**GET /api/v1/posts/{post_id}/comments**
- 功能：获取文章评论列表
- 查询参数：
  - page: 页码
  - limit: 每页数量

**POST /api/v1/posts/{post_id}/comments**
- 功能：创建评论
- 请求体：
```json
{
    "content": "评论内容",
    "author_name": "评论者姓名",
    "author_email": "email@example.com",
    "author_website": "https://example.com",
    "parent_id": null
}
```

#### 6. 媒体文件API

**POST /api/v1/media/upload**
- 功能：上传媒体文件（需要认证）
- 请求：multipart/form-data
- 响应：
```json
{
    "success": true,
    "data": {
        "id": 1,
        "filename": "image_20250904.jpg",
        "file_path": "/uploads/2025/09/image_20250904.jpg",
        "file_size": 102400,
        "mime_type": "image/jpeg",
        "url": "https://blog.example.com/uploads/2025/09/image_20250904.jpg"
    }
}
```

#### 7. 系统配置API

**GET /api/v1/settings**
- 功能：获取公开配置信息
- 响应：
```json
{
    "success": true,
    "data": {
        "site_title": "我的博客",
        "site_description": "分享技术与生活",
        "site_keywords": "博客,技术,分享",
        "social_links": {
            "github": "https://github.com/username",
            "twitter": "https://twitter.com/username"
        }
    }
}
```

**PUT /api/v1/settings**
- 功能：更新系统配置（需要认证）

#### 8. 统计相关API

**GET /api/v1/stats/overview**
- 功能：获取博客统计概览（需要认证）
- 响应：
```json
{
    "success": true,
    "data": {
        "total_posts": 50,
        "total_comments": 200,
        "total_views": 10000,
        "total_categories": 8,
        "total_tags": 25,
        "recent_posts": 5,
        "pending_comments": 3
    }
}
```

### API安全性设计

#### 1. 身份认证

使用JWT（JSON Web Token）进行身份认证：
- 登录成功后返回JWT token
- 后续请求在Authorization头中携带token
- Token包含用户ID、角色等信息
- 设置合理的过期时间（如24小时）

#### 2. 权限控制

基于角色的访问控制（RBAC）：
- admin：完全权限
- author：可以管理自己的文章
- editor：可以编辑所有文章但不能删除

#### 3. 输入验证

所有API输入都需要进行严格验证：
- 参数类型检查
- 长度限制
- 格式验证（如邮箱格式）
- SQL注入防护
- XSS攻击防护

#### 4. 速率限制

实现API调用频率限制：
- 普通用户：每分钟100次请求
- 认证用户：每分钟500次请求
- 管理员：每分钟1000次请求

### API文档和测试

#### 1. 接口文档

使用Swagger/OpenAPI规范生成API文档：
- 自动生成交互式文档
- 包含请求/响应示例
- 支持在线测试功能

#### 2. 单元测试

为每个API端点编写单元测试：
- 正常情况测试
- 异常情况测试
- 边界条件测试
- 权限验证测试

## 数据模型关系图

```
Users (1) -----> (N) Posts
Posts (N) -----> (1) Categories
Posts (N) -----> (N) Tags (through post_tags)
Posts (1) -----> (N) Comments
Comments (1) -----> (N) Comments (self-reference)
Users (1) -----> (N) Media
Categories (1) -----> (N) Categories (self-reference)
```

## 性能优化策略

### 1. 数据库优化

- 合理使用索引提高查询性能
- 实现数据库连接池
- 使用查询缓存减少重复查询
- 定期分析和优化慢查询

### 2. 缓存策略

- Redis缓存热门文章和分类数据
- 实现页面级缓存
- 使用CDN加速静态资源

### 3. 分页和懒加载

- 文章列表分页加载
- 评论懒加载
- 图片懒加载

## 扩展性考虑

### 1. 微服务架构

当系统规模扩大时，可以考虑拆分为微服务：
- 用户服务
- 内容服务
- 评论服务
- 媒体服务

### 2. 多语言支持

数据库设计预留多语言支持：
- 内容表增加language字段
- 支持多语言URL路由

### 3. 主题系统

支持动态主题切换：
- 主题配置存储在settings表
- 前端根据配置动态加载样式

## 总结

本设计文档详细描述了博客系统的数据库结构和API接口规范。数据库设计考虑了数据完整性、性能优化和扩展性，API设计遵循RESTful原则，提供了完整的博客功能支持。通过这个设计，可以构建一个功能完善、性能优良、易于维护和扩展的博客系统。

下一阶段将基于这个设计开始实际的代码开发工作，首先实现后端API服务，然后开发前端界面和管理后台。

