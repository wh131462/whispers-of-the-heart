# 文件管理模块

这是一个功能完整的文件管理模块，支持权限管理、目录结构和文件操作。

## 🚀 核心功能

### 1. 目录结构
- **用户根目录**：每个用户都有自己的私有根目录（路径：`/{userId}`）
- **公共目录**：所有用户共享的公共文件目录（路径：`/public`）
- **子目录**：支持无限级嵌套的子目录结构

### 2. 权限管理
- **普通用户**：只能访问和管理自己的文件夹
- **编辑者**：除普通用户权限外，还可以管理公共目录
- **管理员**：拥有所有权限，可以访问和管理任何文件夹

### 3. 文件操作
- ✅ 文件上传（支持描述、标签、公开/私有设置）
- ✅ 文件下载
- ✅ 文件预览
- ✅ 文件重命名
- ✅ 文件移动
- ✅ 文件删除

### 4. 文件夹操作
- ✅ 创建文件夹
- ✅ 重命名文件夹
- ✅ 删除文件夹（仅限空文件夹）
- ✅ 文件夹权限控制

## 🎨 界面特性

### 树状目录展示
- 📁 普通文件夹：灰色文件夹图标
- 🏠 用户根目录：蓝色房屋图标，特殊样式
- 🌐 公共目录：绿色地球图标，特殊样式
- 🛡️ 权限提示：显示用户对文件夹的权限状态

### 右键菜单
根据用户权限动态显示不同的操作选项：
- **打开**：所有用户都可以
- **上传文件**：仅限有管理权限的文件夹
- **新建文件夹**：仅限有管理权限的文件夹
- **重命名/编辑描述**：仅限有管理权限的文件夹
- **删除**：仅限非系统文件夹且有管理权限

### 上传弹窗
- 📂 智能文件夹选择器（仅显示有权限的文件夹）
- 📝 文件描述（可选）
- 🏷️ 文件标签（支持逗号分隔）
- 🔓 公开/私有设置

## 🔧 技术实现

### 后端 (NestJS + Prisma)

#### 数据库模型
```prisma
model Folder {
  id          String      @id @default(cuid())
  name        String
  path        String      @unique
  parentId    String?
  description String?
  isSystem    Boolean     @default(false)  // 系统文件夹
  isPublic    Boolean     @default(false)  // 公共目录
  ownerId     String?     // 所有者ID
  
  owner       User?       @relation("UserFolders")
  parent      Folder?     @relation("FolderHierarchy")
  children    Folder[]    @relation("FolderHierarchy")
  files       File[]
}
```

#### API 接口
- `GET /file-management/folders` - 获取文件夹列表
- `GET /file-management/folders/tree` - 获取文件夹树
- `POST /file-management/folders` - 创建文件夹
- `PUT /file-management/folders/:id` - 更新文件夹
- `DELETE /file-management/folders/:id` - 删除文件夹
- `POST /file-management/files/upload` - 上传文件
- `GET /file-management/files` - 获取文件列表
- `PUT /file-management/files/:id` - 更新文件
- `DELETE /file-management/files/:id` - 删除文件

#### 权限控制
```typescript
// 权限检查示例
private async checkFolderPermission(folderId: string, userId: string, userRole: string): Promise<boolean> {
  const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
  
  // 管理员有所有权限
  if (userRole === 'ADMIN') return true;
  
  // 公共目录需要编辑权限
  if (folder.isPublic) {
    return userRole === 'EDITOR' || userRole === 'ADMIN';
  }
  
  // 用户只能访问自己的文件夹
  return folder.ownerId === userId || folder.path.startsWith(`/${userId}`);
}
```

### 前端 (React + TypeScript)

#### 组件结构
- `FileManagementPage.tsx` - 主页面组件
- 文件夹列表（网格展示）
- 文件列表（列表/网格切换）
- 上传弹窗
- 新建文件夹弹窗
- 编辑/移动弹窗

#### 权限逻辑
```typescript
// 文件夹类型判断
const getFolderType = (folder: Folder) => {
  if (folder.isPublic || folder.path === '/public') return 'public'
  if (user && folder.path === `/${user.id}`) return 'user-root'
  if (folder.path.startsWith(`/${user?.id}/`) || folder.ownerId === user?.id) return 'user-subfolder'
  return 'other'
}

// 权限检查
const canManageFolder = (folder: Folder) => {
  const type = getFolderType(folder)
  if (type === 'public') return canManagePublicFolder()
  if (type === 'user-root' || type === 'user-subfolder') return true
  return user?.role === 'ADMIN'
}
```

## 📋 系统初始化

项目包含自动初始化脚本，会在首次运行时：

1. 创建公共目录 (`/public`)
2. 为所有现有用户创建个人根目录 (`/{userId}`)
3. 设置正确的权限和所有者关系

## 🎯 使用说明

### 管理员操作流程
1. 登录管理后台
2. 进入"文件管理"页面
3. 查看权限说明和当前用户权限
4. 可以访问和管理所有文件夹
5. 可以在公共目录上传共享文件

### 普通用户操作流程
1. 登录后进入文件管理
2. 只能看到自己的根目录和公共目录
3. 可以在自己的目录中创建子文件夹
4. 可以上传、管理自己的文件
5. 只能浏览公共目录（无法修改）

### 编辑者特权
- 除了普通用户的所有权限外
- 还可以管理公共目录
- 可以在公共目录上传文件
- 可以在公共目录创建子文件夹

## 🔒 安全特性

1. **路径验证**：严格的文件路径验证，防止目录遍历攻击
2. **权限隔离**：用户只能访问有权限的文件夹
3. **系统文件夹保护**：系统文件夹不能删除或重命名
4. **文件大小限制**：默认50MB文件大小限制
5. **文件类型检查**：支持MIME类型验证

## 🚦 状态指示

- ✅ 绿色：公共目录，有管理权限
- 🔵 蓝色：用户根目录
- 🟠 橙色：仅浏览权限
- 🟪 紫色：其他用户拥有的文件夹
- 🔴 红色：管理员专用功能

这个文件管理模块提供了完整的企业级文件管理功能，支持多用户、权限控制和安全的文件操作。
