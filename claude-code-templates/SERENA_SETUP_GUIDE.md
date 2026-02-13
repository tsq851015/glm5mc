# Serena + Superpowers 项目配置指南

## 快速开始

### 方法 1: 复制模板文件

```bash
# 1. 进入新项目目录
cd /path/to/your/new-project

# 2. 创建配置目录
mkdir -p .claude .serena

# 3. 复制配置模板
cp templates/settings.local.json .claude/
cp templates/project.yml .serena/

# 4. 编辑 .serena/project.yml
# 修改 project_name 和 initial_prompt
```

### 方法 2: 在 Claude Code 中操作

复制以下提示词到 Claude Code：

```
请为新项目配置 Serena 和 Superpowers：

项目信息：
- 项目名称: [你的项目名]
- 编程语言: [TypeScript/Python/Rust/Go 等]
- 技术栈: [Next.js/FastAPI/Axum 等]
- 特殊注意事项: [如时区、安全要求等]

请执行：
1. 创建 .claude/settings.local.json
2. 创建 .serena/project.yml
3. 激活 Serena 项目
4. 执行 onboarding
```

## 配置文件说明

### 1. settings.local.json

Claude Code 的权限和插件配置。

**必需配置项：**
- `permissions.allow`: 允许执行的命令
- `enabledPlugins`: 启用的插件

### 2. project.yml

Serena 项目配置文件。

**必需配置项：**
- `project_name`: 项目名称
- `languages`: 编程语言
- `encoding`: 文件编码（通常为 utf-8）

**推荐配置项：**
- `ignore_all_files_in_gitignore`: true
- `read_only`: false
- `excluded_tools`: []（空列表）

## 常见项目配置预设

### Next.js 项目

```yaml
# .serena/project.yml
project_name: "my-nextjs-app"
languages:
- typescript
encoding: "utf-8"
ignore_all_files_in_gitignore: true
read_only: false
excluded_tools: []
initial_prompt: "Next.js 16 项目，使用 App Router + Turbopack，注意使用 UTC 时间"
```

### FastAPI 项目

```yaml
# .serena/project.yml
project_name: "my-fastapi-app"
languages:
- python
encoding: "utf-8"
ignore_all_files_in_gitignore: true
read_only: false
excluded_tools: []
initial_prompt: "FastAPI 项目，使用 Pydantic v2，注意异步函数的正确使用"
```

### Rust CLI 项目

```yaml
# .serena/project.yml
project_name: "my-rust-cli"
languages:
- rust
encoding: "utf-8"
ignore_all_files_in_gitignore: true
read_only: false
excluded_tools: []
initial_prompt: "Rust CLI 项目，使用 Clap 4.x，注意错误处理"
```

## Serena Onboarding

Onboarding 过程会创建项目记忆文件，帮助 AI 理解项目结构。

### 在 Claude Code 中执行：

```
请执行 Serena onboarding，创建以下记忆文件：
- project_purpose.md: 项目目的
- tech_stack.md: 技术栈
- code_style_conventions.md: 代码风格
- suggested_commands.md: 常用命令
- task_completion_checklist.md: 完成检查清单
- codebase_structure.md: 代码结构
```

### 记忆文件模板

#### project_purpose.md

```markdown
# [项目名称] 项目目的

## 核心功能

1. 功能一
2. 功能二
3. 功能三

## 技术定位

- 目标用户: ...
- 部署方式: ...
- 核心价值: ...
```

#### tech_stack.md

```markdown
# [项目名称] 技术栈

## 核心框架

| 分类 | 技术 | 版本 |
|------|------|------|
| **Framework** | ... | ... |
| **Language** | ... | ... |
```

#### code_style_conventions.md

```markdown
# [项目名称] 代码风格和约定

## 命名约定

- **组件**: PascalCase
- **函数**: camelCase
- **常量**: UPPER_SNAKE_CASE
```

#### suggested_commands.md

```markdown
# [项目名称] 常用命令

## 开发命令

\`\`\`bash
npm run dev
\`\`\`
```

#### task_completion_checklist.md

```markdown
# [项目名称] 任务完成检查清单

## 代码编写完成后

1. 类型检查
2. 代码检查
3. 构建测试
```

#### codebase_structure.md

```markdown
# [项目名称] 代码结构

## 目录结构

\`\`\`
project/
├── src/
│   ├── lib/
│   └── components/
\`\`\`
```

## 验证配置

配置完成后，在 Claude Code 中运行：

```
请检查 Serena 配置状态，确认：
1. 项目已激活
2. Onboarding 已完成
3. 记忆文件已创建
4. 语言服务器正常运行
```

## 常见问题

### Q: Onboarding 失败怎么办？

检查：
1. 项目路径是否正确
2. 是否有文件读取权限
3. Serena MCP 服务器是否正常运行

### Q: 需要添加额外权限吗？

根据项目需要在 `permissions.allow` 中添加：
- 数据库: `Bash(sqlite3:*)`, `Bash(psql:*)`
- 容器: `Bash(docker:*)`, `Bash(docker compose:*)`
- 部署: `Bash(ssh:*)`, `Bash(rsync:*)`

### Q: 什么时候需要排除工具？

一般不需要。Serena 推荐保持 `excluded_tools: []`。

## 与 Claude Code 的对话示例

### 初次配置

```
用户: 帮我配置 Serena 和 Superpowers

Claude:
1. 检查当前配置状态...
2. 创建必要的配置文件...
3. 执行 Serena onboarding...
4. 创建项目记忆文件...

配置完成！
```

### 日常开发

```
用户: 帮我添加用户认证功能

Claude:
1. 使用 Serena 查找现有认证代码...
2. 使用 find_symbol 定位认证模块...
3. 使用 find_referencing_symbols 找到所有引用...
4. 建议修改方案...
```

## 配置文件对比

| 文件 | 用途 | 是否必需 |
|-----|------|---------|
| `.claude/settings.local.json` | Claude Code 权限和插件配置 | 推荐 |
| `.serena/project.yml` | Serena 项目配置 | 必需 |
| `.serena/memories/*.md` | 项目知识库 | 推荐 |

## 语言配置参考

| 语言 | 配置值 |
|------|--------|
| TypeScript/JavaScript | `typescript` |
| Python | `python` 或 `python_jedi` |
| Rust | `rust` |
| Go | `go` |
| Java | `java` |
| C/C++ | `cpp` |
| Ruby | `ruby` 或 `ruby_solargraph` |
| PHP | `php` |
| Dart | `dart` |
| Kotlin | `kotlin` |
| Swift | `swift` |

完整列表: https://github.com/oraios/serena/blob/main/src/solidlsp/ls_config.py
