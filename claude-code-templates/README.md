# Claude Code 项目模板

本目录包含新项目配置 Serena 和 Superpowers 的标准模板文件。

## 📁 文件说明

| 文件 | 说明 | 目标位置 |
|-----|------|---------|
| `settings.local.json` | Claude Code 权限和插件配置 | `.claude/settings.local.json` |
| `project.yml` | Serena 项目配置 | `.serena/project.yml` |
| `QUICK_START.md` | 快速启动指南 | 阅读参考 |
| `SERENA_SETUP_GUIDE.md` | 完整配置指南 | 阅读参考 |

## 🚀 快速开始

### 选项 1: 复制文件

```bash
# 创建配置目录
mkdir -p .claude .serena

# 复制模板
cp templates/settings.local.json .claude/
cp templates/project.yml .serena/

# 编辑配置
vim .serena/project.yml  # 修改项目名称和初始提示
```

### 选项 2: 使用 Claude Code

复制 `QUICK_START.md` 中的提示词模板到 Claude Code，填入你的项目信息。

## 📖 文档

- **QUICK_START.md**: 快速启动，包含一键提示词模板
- **SERENA_SETUP_GUIDE.md**: 完整的配置指南，包含详细说明

## 🎯 常见项目配置

文档中包含以下项目类型的预设配置：

- Next.js 项目
- FastAPI 项目
- Rust CLI 项目
- 全栈项目

## ✅ 验证配置

配置完成后，在 Claude Code 中运行：

```
请检查 Serena 配置状态
```

预期输出：
- ✅ 项目已激活
- ✅ Onboarding 已完成
- ✅ 记忆文件已创建
- ✅ 语言服务器正常运行

## 🔧 配置选项

### settings.local.json 主要选项

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",      // npm 命令
      "Bash(pnpm:*)",     // pnpm 命令
      "Bash(yarn:*)",     // yarn 命令
      "Bash(python:*)",   // python 命令
      "Bash(poetry:*)",   // poetry 命令
      "Bash(cargo:*)",    // cargo 命令
      "Bash(docker:*)",   // docker 命令
      "Bash(git:*)"       // git 命令
    ]
  },
  "enabledPlugins": {
    "superpowers@superpowers-marketplace": true,
    "frontend-design@claude-plugins-official": true
  }
}
```

### project.yml 主要选项

```yaml
project_name: "your-project"    # 项目名称
languages:                       # 编程语言
  - typescript
encoding: "utf-8"               # 文件编码
ignore_all_files_in_gitignore: true
read_only: false
excluded_tools: []              # 保持空以获得完整功能
initial_prompt: "项目描述"      # 项目简介
```

## 💡 使用提示

1. **首次使用**: 阅读 `QUICK_START.md`
2. **详细配置**: 参考 `SERENA_SETUP_GUIDE.md`
3. **遇到问题**: 检查配置文件语法和权限设置

## 📚 相关资源

- [Serena 文档](https://oraios.github.io/serena/)
- [Superpowers 技能系统](https://github.com/anthropics/claude-code-superpowers)
- [Claude Code 文档](https://docs.anthropic.com/claude-code)
