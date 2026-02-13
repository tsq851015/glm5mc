# 新项目快速启动模板

## 一键启动提示词

复制以下内容到 Claude Code，替换括号中的内容：

```
请为新项目配置 Serena 和 Superpowers 环境：

项目信息：
- 项目名称: [PROJECT_NAME]
- 编程语言: [LANGUAGE]  # TypeScript/Python/Rust/Go 等
- 技术栈: [FRAMEWORK]   # Next.js/FastAPI/Axum 等
- 包管理器: [PACKAGE_MANAGER]  # npm/pnpm/yarn/poetry/cargo 等

请执行：
1. 创建 .claude/settings.local.json（包含必要的权限配置）
2. 创建 .serena/project.yml
3. 激活 Serena 项目
4. 执行 onboarding 并创建记忆文件：
   - project_purpose.md
   - tech_stack.md
   - code_style_conventions.md
   - suggested_commands.md
   - task_completion_checklist.md
   - codebase_structure.md
```

## 常用项目类型预设

### Web 前端项目

```
项目信息：
- 项目名称: my-web-app
- 编程语言: TypeScript
- 技术栈: Next.js 16 + React
- 包管理器: npm
```

生成的配置：
- `languages: [typescript]`
- `initial_prompt: "Next.js 16 项目，使用 App Router + Turbopack"`
- 权限包含: npm, npx, node, git

### Python 后端项目

```
项目信息：
- 项目名称: my-api
- 编程语言: Python
- 技术栈: FastAPI + Pydantic
- 包管理器: poetry
```

生成的配置：
- `languages: [python]`
- `initial_prompt: "FastAPI 项目，使用 Pydantic v2，注意异步函数"`
- 权限包含: python, poetry, pip, git

### Rust CLI 项目

```
项目信息：
- 项目名称: my-cli
- 编程语言: Rust
- 技术栈: Clap + Tokio
- 包管理器: cargo
```

生成的配置：
- `languages: [rust]`
- `initial_prompt: "Rust CLI 项目，使用 Clap 4.x"`
- 权限包含: cargo, git

### 全栈项目

```
项目信息：
- 项目名称: my-fullstack-app
- 编程语言: TypeScript, Python
- 技术栈: Next.js 前端 + FastAPI 后端
- 包管理器: npm (前端), poetry (后端)
```

生成的配置：
- `languages: [typescript, python]`
- `initial_prompt: "全栈项目：Next.js 前端 + FastAPI 后端"`
- 权限包含: npm, npx, node, python, poetry, git

## 验证配置

配置完成后运行：

```
请验证 Serena 配置：
1. 项目是否已激活
2. Onboarding 是否完成
3. 记忆文件是否创建
4. 语言服务器是否正常运行
```

## 下一步

配置完成后，你可以告诉 Claude：

- "使用 Serena 查找 [功能名] 相关的代码"
- "使用 find_symbol 搜索 [类名/函数名]"
- "使用 find_referencing_symbols 查找所有引用"
- "帮我重构 [文件名] 中的 [函数名]"
