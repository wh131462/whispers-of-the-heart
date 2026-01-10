---
name: nestjs-module-generator
description: 生成符合项目规范的 NestJS 模块。当需要创建新的 API 模块、添加新功能模块、或用户提到"创建模块"、"新增 API"时使用。
allowed-tools: Read, Write, Glob, Grep
---

# NestJS 模块生成器

为 Whispers of the Heart 项目生成符合规范的 NestJS 模块。

## 项目结构

模块位置：`apps/api/src/{module-name}/`

每个模块应包含：

```
{module-name}/
├── {module-name}.module.ts      # 模块定义
├── {module-name}.controller.ts  # 控制器
├── {module-name}.service.ts     # 服务层
└── dto/                         # 数据传输对象
    ├── create-{name}.dto.ts
    └── update-{name}.dto.ts
```

## 代码规范

### Module 文件模板

```typescript
import { Module } from '@nestjs/common';
import { {Name}Service } from './{name}.service';
import { {Name}Controller } from './{name}.controller';

@Module({
  imports: [],
  controllers: [{Name}Controller],
  providers: [{Name}Service],
  exports: [{Name}Service],
})
export class {Name}Module {}
```

### Controller 规范

- 使用 `@Controller('api/v1/{name}')` 定义路由前缀
- 使用装饰器：`@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`
- 参数使用：`@Param()`, `@Query()`, `@Body()`
- 需要认证的接口使用 `@UseGuards(JwtAuthGuard)`

### Service 规范

- 注入 `PrismaService` 进行数据库操作
- 方法命名：`create`, `findAll`, `findOne`, `update`, `remove`
- 错误处理使用 NestJS 内置异常

### DTO 规范

- 使用 `class-validator` 装饰器进行验证
- 使用 `class-transformer` 进行数据转换
- 继承使用 `PartialType`, `PickType`, `OmitType`

## 生成步骤

1. 确认模块名称（使用 kebab-case）
2. 创建模块目录结构
3. 生成 module、controller、service 文件
4. 生成必要的 DTO 文件
5. 在 `app.module.ts` 中导入新模块

## 注意事项

- 遵循项目现有的代码风格
- 使用 PrismaService 而非直接使用 Prisma Client
- API 路由统一使用 `/api/v1/` 前缀
- 需要认证的接口记得添加 Guard
