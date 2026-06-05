## 设计动机

本变更**不引入新行为**,只是把已经在多个模块中事实存在的契约文字化。设计的关键选择是:**spec 的颗粒度**与**契约的强约束度**。

## 关键决策

### 决策 1: spec 描述的是"行为契约"而非"代码模板"

- **选择**: spec 中描述端点的"输入/输出/状态码/错误形状",代码模板留在 `.ai/4-PATTERNS.md`
- **理由**: spec 应当能被独立验证(只看响应就能判断是否符合),而代码模板会随 NestJS 版本、TypeScript 特性、目录习惯演化,放进 spec 反而让 spec 老化
- **后果**: 代码骨架仍在 `.ai/`,spec 与代码风格解耦,可独立演化

### 决策 2: 响应包装统一为 `{ success, data, message?, error? }`

- **选择**: 沿用现状(`api.interceptors` 已假定此格式),不重新设计
- **理由**: 改包装格式会导致前端 50+ 处调用代码改动,远超本次"形式化"的目标
- **后果**: spec 等于把现状"封存",未来如需替换格式,需走独立 change

### 决策 3: 分页字段命名锁定 `items` / `total` / `page` / `limit` / `totalPages` / `hasNext` / `hasPrev`

- **选择**: 沿用 `blog.service.ts` 的命名
- **理由**: 这是已在前端管理后台多个列表页使用的字段
- **后果**: 如果其他模块用了 `list` / `count` 等不同命名,本变更归档后会产生"已知违规",通过单独 change 修齐

### 决策 4: 权限模型 spec 不锁定具体 Guard 实现

- **选择**: spec 说"修改/删除操作 MUST 验证作者或管理员",不写"必须用 `JwtAuthGuard`"
- **理由**: 留出未来引入更细粒度 RBAC / Casbin 的空间
- **后果**: 实现时仍按现状用 `JwtAuthGuard` + service 内权限检查;未来换实现不需要改 spec

### 决策 5: 错误用 HTTP 语义状态码 + NestJS 内置异常

- **选择**: `NotFoundException` (404) / `ForbiddenException` (403) / `ConflictException` (409) / `BadRequestException` (400) / `UnauthorizedException` (401)
- **理由**: 现状如此,且符合 REST 通用约定
- **后果**: 自定义业务错误码作为 `error` 字段而非 HTTP 状态码

## 不做的事(防止 scope 蔓延)

- 不规定每个端点的 URL 路径形态(资源命名归 `.ai/3-CODING-RULES.md`)
- 不规定 DTO 必须用 `class-validator`(实现选择,未来可能换 Zod)
- 不规定批量操作(`bulkCreate` / `bulkDelete`)的形状(尚未稳定使用 3 次)
- 不规定文件上传端点(媒体模块特殊,值得独立 spec)
