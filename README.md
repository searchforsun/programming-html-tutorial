# programming-html-tutorial

[![Agent Skills](https://img.shields.io/badge/Agent_Skills-compatible-6e47ff?logo=openai)](https://agentskills.io/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-ready-d97757)](https://docs.anthropic.com/en/docs/claude-code/skills)
[![Cursor](https://img.shields.io/badge/Cursor-ready-00b27e)](https://cursor.com/docs/skills)

将指定技术领域生成为**静态 HTML 交互式教程站**：三阶段大纲、分章正文、测验、进度追踪、术语 AI 探索、亮暗主题与 **12 套 UI 风格**（含主题中性结构风与 accent 驱动赛博风）。

**Agent 与维护者以 [`SKILL.md`](SKILL.md) 为唯一入口**（工作流、文档真源、Gate 命令）；下文仅说明安装与仓库结构。

**当前壳版本**：`2.10.1`（见 `config/defaults.json` → `shellVersion`）

---

## 安装（Claude Code / Cursor / Codex）

### 方式 A：agentskill.sh（推荐，可搜索与更新）

1. 一次性安装 `/learn` 命令（见 [agentskill.sh/install](https://agentskill.sh/install)）
2. 在对话中执行：

```text
/learn @<你的GitHub用户名>/programming-html-tutorial
```

或浏览技能页后安装（发布成功后）：`https://agentskill.sh/skills/<你的GitHub用户名>/programming-html-tutorial`

更新已安装技能：`/learn update`

### 方式 B：Git 克隆

**Claude Code（全局）**

```bash
git clone https://github.com/<你的GitHub用户名>/programming-html-tutorial.git ~/.claude/skills/programming-html-tutorial
```

**Cursor（全局）**

```bash
git clone https://github.com/<你的GitHub用户名>/programming-html-tutorial.git ~/.cursor/skills/programming-html-tutorial
```

Windows PowerShell 示例：

```powershell
git clone https://github.com/<你的GitHub用户名>/programming-html-tutorial.git $env:USERPROFILE\.cursor\skills\programming-html-tutorial
```

**项目级**：将上述路径中的 `~/.claude/skills/` 或 `~/.cursor/skills/` 换成项目内的 `.claude/skills/` 或 `.cursor/skills/`。

安装后新开一次 Agent 会话，然后说：

```text
用 programming-html-tutorial 生成 Spring Boot HTML 教程，先出三阶段大纲
```

---

## 新建一门课

**环境**：Node.js 18+（组装/校验脚本；浏览器打开课程无需 Node）。

在用户**当前工作目录**下创建 `<workspace>/courses/<slug>/`（结构见 [SKILL.md](SKILL.md) §目录结构），由 Agent 按技能生成内容后组装。命令见 [reference/delivery-review.md](reference/delivery-review.md)。

**预览**

- **课程中心**：在 `<workspace>/courses/` 根目录 `npx serve .`，打开 `index.html`；目录由 `courses.json` 动态加载。
- **单课**：同上服务下打开 `<slug>/index.html`，或 `file://` 打开单课（进度/主题可能受限）。

**注册新课程**：assemble 完成后，仅在 `courses/courses.json` 的 `courses[]` 追加条目，无需改 `index.html` 内嵌数据。

---

## 仓库结构

| 路径 | 说明 |
|------|------|
| [SKILL.md](SKILL.md) | Agent 技能主文档 |
| [reference/shell-ui-styles.md](reference/shell-ui-styles.md) | 壳层 **12 套 UI 风格**、CSS 分层与发布流程（2.10+） |
| [reference/portal-maintenance.md](reference/portal-maintenance.md) | 课程中心 portal 与 `courses.json` |
| [scripts/README.md](scripts/README.md) | assemble / sync / build 脚本索引 |
| [templates/](templates/) | 页面壳 CSS/JS（源文件 + `styles/*.css` 生成物） |
| [config/defaults.json](config/defaults.json) | 壳版本、CDN、`uiStyles` 注册表 |
| [reference/](reference/) | 章节、测验、组装规范 |
| [example/](example/) | 只读样例：**仅** `java-distributed-architecture` 一门课；portal 与生产工作区同构（`fetch('courses.json')`） |

### UI 风格（壳 2.10+）

| 类型 | id 示例 | 说明 |
|------|---------|------|
| 配色风 | minimal, tech, vibrant, nord, paper, glass, terminal, sakura | 自带完整色板 |
| 结构风 | compact, outline, soft | 主题中性，accent 来自各课 `theme.css` |
| accent 驱动 | cyber | 霓虹 HUD / 扫描网格，accent 来自 `theme.css` |

风格菜单为 **3 列 × 4 行**网格；注册与菜单由 `config/defaults.json` → `uiStyles` 驱动，assemble / sync 自动生成。

### 改壳层后发布顺序

```powershell
# bump shellVersion + templates/SHELL_VERSION 后：
node scripts/build-style-sheets.mjs
node scripts/sync-portal-shell.mjs
node scripts/sync-courses-index.mjs <workspace>/courses/index.html
node scripts/assemble-index.mjs --dir <workspace>/courses/<slug>
```

PowerShell 用 `;` 串联，勿用 `&&`。

---

## 发布到 agentskill.sh（维护者）

仓库需为 **GitHub 公开仓库**，且根目录含 `SKILL.md`（本仓库已满足）。

| 步骤 | 操作 |
|------|------|
| 1 | 推送代码到 `https://github.com/<用户名>/programming-html-tutorial` |
| 2 | 打开 [agentskill.sh/submit](https://agentskill.sh/submit)，选择 **GitHub Repository**，填入仓库 URL |
| 3 | 点击 **Analyze & Import**，等待扫描根目录 `SKILL.md` |
| 4 | 在 [agentskill.sh/settings](https://agentskill.sh/settings) **连接 GitHub**，获得作者认证徽章 |
| 5 | （可选）仓库 **Settings → Webhooks** 添加 `https://agentskill.sh/api/webhooks/github`，事件选 **push**，实现推送后即时同步 |

收录后，他人可通过 `/learn @<用户名>/programming-html-tutorial` 安装；你可在 [Dashboard](https://agentskill.sh/dashboard) 查看安装量与评分。

---

## 发布到 GitHub（首次）

```bash
cd programming-html-tutorial
git add .
git commit -m "Prepare for agentskill.sh"
git remote add origin https://github.com/<你的GitHub用户名>/programming-html-tutorial.git
git branch -M main
git push -u origin main
```

## License

[MIT](LICENSE)
