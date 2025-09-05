-- 初始化数据库脚本
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建文章表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建文章标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建站点配置表
CREATE TABLE IF NOT EXISTS site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建媒体文件表
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    path VARCHAR(500) NOT NULL,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    uploader_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_title_search ON posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- 插入默认数据
-- 插入默认用户（管理员）
INSERT INTO users (id, username, email, password_hash, role, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@whispers.local', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8LiPX/XGGF/O.0XYLWz8Cx.9iZzpKS', 'admin', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'author', 'author@whispers.local', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8LiPX/XGGF/O.0XYLWz8Cx.9iZzpKS', 'user', true, true)
ON CONFLICT (username) DO NOTHING;

-- 插入默认分类
INSERT INTO categories (id, name, slug, description, color) VALUES
('550e8400-e29b-41d4-a716-446655440011', '前端开发', 'frontend', '前端技术相关文章', '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440012', '后端开发', 'backend', '后端技术相关文章', '#10B981'),
('550e8400-e29b-41d4-a716-446655440013', '编程语言', 'programming', '编程语言学习和实践', '#8B5CF6'),
('550e8400-e29b-41d4-a716-446655440014', 'DevOps', 'devops', '运维和部署相关', '#F59E0B'),
('550e8400-e29b-41d4-a716-446655440015', '生活感悟', 'life', '生活和思考分享', '#EF4444')
ON CONFLICT (slug) DO NOTHING;

-- 插入默认标签
INSERT INTO tags (id, name, slug, color) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'React', 'react', '#61DAFB'),
('550e8400-e29b-41d4-a716-446655440022', 'TypeScript', 'typescript', '#3178C6'),
('550e8400-e29b-41d4-a716-446655440023', 'JavaScript', 'javascript', '#F7DF1E'),
('550e8400-e29b-41d4-a716-446655440024', 'NestJS', 'nestjs', '#E0234E'),
('550e8400-e29b-41d4-a716-446655440025', 'Node.js', 'nodejs', '#339933'),
('550e8400-e29b-41d4-a716-446655440026', 'Docker', 'docker', '#2496ED'),
('550e8400-e29b-41d4-a716-446655440027', 'PostgreSQL', 'postgresql', '#336791')
ON CONFLICT (slug) DO NOTHING;

-- 插入站点配置
INSERT INTO site_config (key, value, description) VALUES
('site_basic', '{
  "siteName": "Whispers of the Heart",
  "siteDescription": "专注于分享知识和灵感的平台",
  "siteLogo": "",
  "siteIcon": "",
  "aboutMe": "热爱技术，热爱生活，希望通过文字传递正能量。",
  "contactEmail": "contact@whispers.local"
}', '站点基本信息'),
('social_links', '{
  "github": "https://github.com/yourusername",
  "twitter": "https://twitter.com/yourusername",
  "linkedin": "https://linkedin.com/in/yourusername"
}', '社交媒体链接'),
('seo_settings', '{
  "metaTitle": "Whispers of the Heart - 知识分享平台",
  "metaDescription": "专注于分享技术和生活感悟的平台",
  "keywords": "技术,生活,感悟,分享,博客"
}', 'SEO 设置'),
('oss_config', '{
  "provider": "local",
  "accessKeyId": "",
  "accessKeySecret": "",
  "bucket": "",
  "region": "",
  "endpoint": "",
  "cdnDomain": ""
}', '对象存储配置')
ON CONFLICT (key) DO NOTHING;

-- 插入示例文章
INSERT INTO posts (id, title, slug, excerpt, content, cover_image, status, category_id, author_id, views, likes, published_at) VALUES
('550e8400-e29b-41d4-a716-446655440031', 'React 18 新特性详解', 'react-18-new-features', '深入探讨 React 18 的新特性和改进，包括并发特性、自动批处理等。', '# React 18 新特性详解

React 18 带来了许多激动人心的新特性，本文将深入探讨这些特性的实现原理和使用方法。

## 并发渲染 (Concurrent Rendering)

并发渲染是 React 18 最重要的新特性之一...', 'https://via.placeholder.com/800x400', 'published', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 1250, 89, NOW()),

('550e8400-e29b-41d4-a716-446655440032', 'TypeScript 高级类型技巧', 'typescript-advanced-types', '掌握 TypeScript 的高级类型系统，提升代码的类型安全性。', '# TypeScript 高级类型技巧

TypeScript 的类型系统非常强大，条件类型和映射类型是其中最重要的概念之一...', 'https://via.placeholder.com/800x400', 'published', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 890, 67, NOW()),

('550e8400-e29b-41d4-a716-446655440033', 'NestJS 微服务架构实践', 'nestjs-microservices', '使用 NestJS 构建可扩展的微服务架构，包含实际项目经验分享。', '# NestJS 微服务架构实践

本文将分享使用 NestJS 构建微服务架构的实践经验...', 'https://via.placeholder.com/800x400', 'draft', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 756, 45, NULL)
ON CONFLICT (slug) DO NOTHING;

-- 插入文章标签关联
INSERT INTO post_tags (post_id, tag_id) VALUES
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440023'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440023'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440024'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440025')
ON CONFLICT (post_id, tag_id) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表创建更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();