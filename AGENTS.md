# Codex 项目协作规则

本文件是 Codex 在本仓库中的项目入口。`CLAUDE.md` 继续服务 Claude Code；两者共享 `.ai/` 与 `openspec/`，避免维护两套项目知识。

## 输出规则

- 使用简体中文，结论优先，表达简洁、技术化、准确。
- 明确区分已确认事实、合理推断和待验证信息。
- 不输出套话、表扬或无关解释。
- 不要求输出模型名称；Codex 客户端已展示运行模型。

## 会话初始化流程

开始处理每个新会话时，按任务范围加载上下文：

1. 必读 `.ai/0-INDEX.md`，确认知识库与 OpenSpec 的使用边界。
2. 必读 `.ai/1-PROJECT-CONTEXT.md`，了解项目结构、命令和端口。
3. 读取 `.ai/5-MEMORY.md` 的“当前上下文”及与任务相关的最近记录。
4. 写代码前完整读取 `.ai/3-CODING-RULES.md`。
5. 实现功能时按需读取 `.ai/4-PATTERNS.md` 和 `.ai/2-TECH-STACK.md`。
6. 涉及已有领域能力时，先检查 `openspec/specs/`；涉及进行中变更时，读取对应 `openspec/changes/<change>/`。

不要要求用户在提示词中重复上述初始化指令。

## 核心行为

- 正确性优先，采用最小、安全、可审查的变更。
- 不擅自改变业务逻辑，不引入未获授权的新依赖，不重构无关代码。
- 信息不足但可通过仓库内容确认时，先自行检查；无法安全推断且会实质改变结果时再询问用户。
- 尊重工作区中已有未提交修改，不覆盖或回退不属于当前任务的变更。
- 遵循项目 ESLint、Prettier、TypeScript 和测试规范；验证范围与改动风险匹配。
- 不创建示例文件、测试文件或总结文档，除非任务明确需要。
- 不随意重启持续运行的项目服务。
- HTML 标签内的特殊字符使用对应 HTML 实体。

## Codex 工具适配

- 文件检索优先使用 `rg` / `rg --files`。
- 修改文本文件使用补丁方式，避免覆盖式写入。
- 需要浏览器或真实网络行为时，使用 Codex 的应用内浏览器能力，并以真实页面和 Network 记录为准。
- 不伪造请求、响应、接口参数或运行结果；无法获得真实数据时明确说明。
- Claude Code 的工具名（如 `Read`、`Edit`、`Bash`、`Glob`、`Grep`、`AskUserQuestion`）仅表达能力类别，Codex 应映射到自身等价能力，不照搬工具名。

## 项目技能兼容

`.claude/skills/*/SKILL.md` 是本项目现有的共享技能源。Codex 遇到与某个技能 `description` 明确匹配的任务时：

1. 先完整读取对应 `SKILL.md`。
2. 遵循其中与当前用户要求、Codex 上级规则兼容的工作流。
3. 将 `allowed-tools` 视为能力提示，不视为 Codex 工具名称。
4. 不复制技能到另一目录；直接复用源文件，避免 Claude/Codex 两套内容漂移。

常用映射：

| 任务                         | 技能                                              |
| ---------------------------- | ------------------------------------------------- |
| 错误、异常、Bug 排查         | `.claude/skills/error-analyzer/SKILL.md`          |
| 性能、重构、代码优化         | `.claude/skills/code-optimizer/SKILL.md`          |
| React 页面或组件             | `.claude/skills/react-component-creator/SKILL.md` |
| NestJS 模块或 API            | `.claude/skills/nestjs-module-generator/SKILL.md` |
| Prisma Schema                | `.claude/skills/prisma-schema-helper/SKILL.md`    |
| Docker、部署、CI/CD          | `.claude/skills/docker-helper/SKILL.md`           |
| OpenSpec 探索/提案/实施/归档 | 对应 `.claude/skills/openspec-*/SKILL.md`         |
| 提交或分组提交               | `.claude/skills/smart-commit/SKILL.md`            |

其余技能根据 `.claude/skills/*/SKILL.md` 的 `description` 动态匹配。

## 文档维护

完成有意义的代码或配置工作后，在会话结束前更新 `.ai/5-MEMORY.md`：

- 记录日期、主题、关键修改、决策依据、验证结果和未完成事项。
- 只保留最近 5 次重要会话；更早内容可压缩。
- “当前上下文”只保留最近 3 项。
- 可复用结论加入“常见问题及解决方案”，关键路径加入索引。
- 不记录例行 CRUD、微小样式调整或临时调试信息。

项目结构、依赖、规则或稳定模式发生变化时，分别同步更新 `.ai/1-PROJECT-CONTEXT.md`、`.ai/2-TECH-STACK.md`、`.ai/3-CODING-RULES.md` 或 `.ai/4-PATTERNS.md`。

## 规则优先级

用户当前请求和 Codex 系统/开发者规则优先于本文件；本文件优先于通用项目习惯。若本文件与 `.ai/` 中的规则冲突，采用更具体、更新日期更近且不违反上级规则的一项，并在确有影响时向用户说明。
