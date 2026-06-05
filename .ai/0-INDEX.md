# AI 知识体系导航

> **用途**: 统一指引 AI 何时读 `.ai/`、何时读 `openspec/`,避免上下文混淆
> **更新频率**: 体系结构变更时

## 两套体系的定位

| 体系        | 定位                   | 时间维度                | AI 加载方式    |
| ----------- | ---------------------- | ----------------------- | -------------- |
| `.ai/`      | **工作背景层**(描述性) | 当前快照                | 会话启动时加载 |
| `openspec/` | **规格演进层**(规范性) | 变更流(propose→archive) | 任务触发时加载 |

一句话:`.ai/` 描述"现在是什么样",`openspec/` 驱动"接下来要变成什么样"。

## 决策树:AI 该读哪里?

```
任务类型?
├─ 日常 CRUD / Bug 修复 / 小调整
│   └─ 读 .ai/1, .ai/3, 必要时 .ai/4
│
├─ 实现新功能 / 大型重构
│   ├─ 已有 openspec change?
│   │   └─ 走 openspec-apply 流程,读对应 change/
│   └─ 无变更提案?
│       └─ 先 openspec-propose 建立提案,再 apply
│
├─ 查询项目现状 / 历史决策
│   └─ 读 .ai/1, .ai/5 (memory)
│
└─ 规范/约束类问题
    ├─ 编码风格、命名 → .ai/3-CODING-RULES.md
    └─ 领域能力规格 → openspec/specs/<capability>/
```

## 文档矩阵

### `.ai/` —— 工作背景层

| 文件                   | 内容                 | 何时读           |
| ---------------------- | -------------------- | ---------------- |
| `0-INDEX.md`           | 本文件,导航          | 不确定该读哪个时 |
| `1-PROJECT-CONTEXT.md` | 项目结构、端口、命令 | 每次会话启动     |
| `2-TECH-STACK.md`      | 技术栈与依赖版本     | 涉及技术选型时   |
| `3-CODING-RULES.md`    | 编码约束             | 写代码前         |
| `4-PATTERNS.md`        | 复用代码模板         | 实现新功能时     |
| `5-MEMORY.md`          | 会话记忆             | 会话开始、结束   |

### `openspec/` —— 规格演进层

| 路径                        | 内容             | 何时读              |
| --------------------------- | ---------------- | ------------------- |
| `openspec/specs/`           | 已沉淀的领域规格 | 实现/修改该领域能力 |
| `openspec/changes/`         | 进行中的变更提案 | 跟进具体变更        |
| `openspec/changes/archive/` | 已归档的变更     | 回溯历史决策        |
| `openspec/config.yaml`      | 全局规格配置     | 不需主动读          |

## 协同��则

### 1. 信息分层

- **`.ai/4-PATTERNS.md`** 收录的是"已稳定的代码模板"(命名、目录、骨架)
- **`openspec/specs/`** 收录的是"领域能力的契约规格"(行为、输入输出、约束)
- 一个模式如果已经在 spec 中规范化,`4-PATTERNS.md` 中应改为**链接到 spec**,不重复内容

### 2. 反向同步

完成一个 `openspec` 变更并归档后,如果涉及:

- **全局编码规则变更** → 同步更新 `.ai/3-CODING-RULES.md`
- **项目结构/端口变更** → 同步更新 `.ai/1-PROJECT-CONTEXT.md`
- **依赖/技术栈变更** → 同步更新 `.ai/2-TECH-STACK.md`
- **重大决策** → 在 `.ai/5-MEMORY.md` 添加一条引用

### 3. 提升路径(.ai → openspec)

`.ai/4-PATTERNS.md` 中的某个模式被使用 3+ 次,且形成了稳定的领域契约时,通过 `openspec-propose` 提升为正式 spec。

### 4. AI 加载策略

- **每次会话启动**: 自动加载 `.ai/0-INDEX.md` + `.ai/1-PROJECT-CONTEXT.md` + `.ai/5-MEMORY.md` 的"当前上下文"部分
- **写代码前**: 加载 `.ai/3-CODING-RULES.md`
- **涉及具体领域**: 检查 `openspec/specs/<capability>/` 是否存在对应规格
- **跟进变更**: 通过 openspec skill 加载对应 change 目录

## 已沉淀的 Specs 索引

> 当 `openspec/specs/` 下新增规格时,在此处补充链接

(暂无;首批提案归档后,以下两项会从"进行中"迁入此节)

预计首批沉淀:

| Spec                    | 描述                             | 对应 change(进行中)               |
| ----------------------- | -------------------------------- | --------------------------------- |
| `rest-resource-api`     | NestJS REST 资源端点统一行为契约 | `formalize-rest-resource-api`     |
| `persistent-auth-state` | 前端持久化认证状态的生命周期契约 | `formalize-persistent-auth-state` |

## 进行中的 Changes

> 查看 `openspec/changes/` 获取实时状态

| 变更名                            | 状态   | 目标 spec                                |
| --------------------------------- | ------ | ---------------------------------------- |
| `comprehensive-screen-detector`   | 进行中 | `screen-detector` (新增能力)             |
| `formalize-rest-resource-api`     | 进行中 | `rest-resource-api` (形式化已有实践)     |
| `formalize-persistent-auth-state` | 进行中 | `persistent-auth-state` (形式化已有实践) |

---

**最后更新**: 2026-06-05
**维护者**: AI + wh131462
