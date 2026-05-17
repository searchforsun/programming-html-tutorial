# programming-html-tutorial

[![Agent Skills](https://img.shields.io/badge/Agent_Skills-compatible-6e47ff?logo=openai)](https://agentskills.io/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-ready-d97757)](https://docs.anthropic.com/en/docs/claude-code/skills)
[![Cursor](https://img.shields.io/badge/Cursor-ready-00b27e)](https://cursor.com/docs/skills)

将指定技术领域生成为**静态 HTML 交互式教程站**：三阶段大纲、分章正文、测验、进度追踪、术语 AI 探索、亮暗主题。技能定义见 [`SKILL.md`](SKILL.md)。

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
git clone https://github.com/<你的GitHub用户名>/programming-html-tutorial.git $env:USERPROFILE\.claude\skills\programming-html-tutorial
```

**项目级**：将上述路径中的 `~/.claude/skills/` 或 `~/.cursor/skills/` 换成项目内的 `.claude/skills/` 或 `.cursor/skills/`。

安装后新开一次 Agent 会话，然后说：

```text
用 programming-html-tutorial 生成 Spring Boot HTML 教程，先出三阶段大纲
```

---

## 快速开始（预览示例课）

**环境**：Node.js 18+（组装/校验脚本；浏览器打开课程无需 Node）。

```bash
git clone https://github.com/<你的GitHub用户名>/programming-html-tutorial.git
cd programming-html-tutorial
node scripts/assemble-index.mjs --dir examples/minimal-course
cd examples/minimal-course
npx --yes serve .
```

浏览器打开终端中的地址（一般为 http://localhost:3000/），进入 `index.html`。

---

## 新建一门课

在**你的项目**中创建 `courses/<slug>/`（结构见 [courses/README.md](courses/README.md)），由 Agent 按技能生成内容后组装：

```bash
node scripts/assemble-index.mjs --dir courses/<slug>
node scripts/validate-tutorial.mjs --dir courses/<slug>
```

或使用 npm 脚本（示例课）：

```bash
npm run assemble:example
npm run validate:example
```

---

## 仓库结构

| 路径 | 说明 |
|------|------|
| [SKILL.md](SKILL.md) | Agent 技能主文档 |
| [templates/](templates/) | 页面壳 CSS/JS |
| [scripts/](scripts/) | assemble / validate / extract |
| [config/](config/) | CDN 与默认配置 |
| [reference/](reference/) | 章节、测验、组装规范 |
| [examples/minimal-course/](examples/minimal-course/) | 最小可运行样例 |
| [courses/](courses/) | 你的课程目录（初始为空） |

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

---

## 文档索引

| 文件 | 说明 |
|------|------|
| [reference/assembly.md](reference/assembly.md) | 组装 `index.html` |
| [reference/phase-design-prompts.md](reference/phase-design-prompts.md) | 领域化三阶段大纲 |
| [reference/chapter-template.md](reference/chapter-template.md) | 章节 HTML 模板 |
| [reference/tutorial-readme-template.md](reference/tutorial-readme-template.md) | 课程目录 README 模板 |

## License

[MIT](LICENSE)
