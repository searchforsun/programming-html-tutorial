---
name: programming-html-tutorial
description: Generate static HTML interactive programming tutorial sites (phased outline, chapters, quizzes, progress, AI term explorer). Use when the user wants to learn a tech topic as a web course, build an HTML tutorial site, generate/revise chapters or quizzes, or says 生成教程、HTML学习站、编程教程网页、帮我学X做成网页、生成第N章. Requires Node.js 18+ for assemble/validate scripts.
license: MIT
metadata:
  version: "1.2.0"
---

# programming-html-tutorial

将用户指定的技术领域生成为**静态 HTML 教程站点**（CSS/JS 内联，CDN：highlight.js、Mermaid）。三阶段 id 为 `basics` / `practice` / `advanced`；**阶段标题与章节按领域设计**（见 [reference/phase-design-prompts.md](reference/phase-design-prompts.md)）。

## 触发短语

生成 X 教程 · 帮我学 X 做成网页 · HTML 学习站 · 生成第 N 章 · 生成测验 · 修订本章 · 导出进度

## 何时调用

| 用户表述 | 工作流 |
|----------|--------|
| 学习 / 教程 + 技术名 | A：初始化大纲 |
| 调整大纲 / 某阶段 | A-修订 |
| 生成某章 / 某阶段 | B：生成章节 |
| 修订本章 | B-修订 |
| 生成测验 | C |
| 导出 / 固化进度 | D |
| 继续下一阶段 | B |

**不触发**：仅需纯 Markdown 文档、单次代码答疑、与非教程类页面。

---

## 输出目录

```
courses/<技术简称-kebab-case>/
├── course.json
├── theme.css
├── welcome.partial.html
├── quiz.partial.html       # 可选；按章 data-chapter 切换
├── chapters/<chapter-id>.html
├── README.md
├── index.html            # assemble 生成
├── demos/<chapter-id>-<name>/
└── assets/               # 可选
```

组装见 [reference/assembly.md](reference/assembly.md)。

**脚本**（`scripts/` 相对本技能根目录）：

```bash
node <skill-root>/scripts/assemble-index.mjs --dir <project>/courses/<slug>
node <skill-root>/scripts/validate-tutorial.mjs --dir <project>/courses/<slug>
```

---

## 交付前 Review

每次修改 `welcome.partial.html`、`chapters/*.html` 或影响组装的 `course.json` 后：**assemble → validate（0 error）**，再回复「已生成」。清单见 [reference/delivery-review.md](reference/delivery-review.md)。

用户在工作流 A 写完大纲后审阅方向，**再**生成正文章节。

---

## 工作流 A：初始化三阶段大纲

1. 确认领域、是否含测验/demo。
2. **WebSearch** → `course.json` 的 `meta`（版本、官方文档）。
3. **主题色**：[reference/theme-colors.md](reference/theme-colors.md) → `theme.css`。
4. **大纲**（必读 [phase-design-prompts.md](reference/phase-design-prompts.md)）：
   - `outline` 三阶段；每章 2–5 个 `sections`
   - `phaseTitle` 须领域化
   - 章数与块策略见 [config/defaults.json](config/defaults.json)
5. 初始化 `course.json`、`theme.css`、`welcome.partial.html`（含 `#outline-summary-body`）、`README.md` → assemble → validate。
6. **暂停**，用户确认大纲后再生成章节。

### A-修订

更新 `outline` 后 assemble；保留已有 `chapters/*.html`。

---

## 工作流 B：生成章节

每次只生成用户指定的一章。生成前**必读** [reference/chapter-layout.md](reference/chapter-layout.md)。

| 要点 | 说明 |
|------|------|
| 骨架 | `sections[]` → 各一个 `h3`；子节与代码标题用 `h4`；图内标签用 `h5` |
| 主内容 | `.concept` 内：notice 摘要 → 知识节 → 小结 |
| 必填块 | 见 [chapter-blocks-policy.md](reference/chapter-blocks-policy.md) |
| HTML 片段 | [chapter-template.md](reference/chapter-template.md) |

章末：**assemble → validate** → 可选写 `course.json` 的 `chapters[id].summary`。

```text
「{章标题}」已生成。可回复：修订 / 生成测验 / 继续下一章（建议：{下一章}）
```

### B-修订

只改目标章与对应 demo，重新 assemble。

### 阶段闸门

当前阶段章节完成（或用户跳过）后，再建议下一阶段。

---

## 工作流 C：测验

写入 `quiz.partial.html`（assemble 注入 `#quiz-panel`）。模板与壳行为见 [reference/quiz-template.md](reference/quiz-template.md)：

- 每章一个 `section.quiz-section`，`data-chapter` 与 `chapterId` 一致
- 章内 `h3`「章节测验」+ `p.quiz-panel-lead` + 题目列表
- 单选、多选、填空各 ≥1；含「检查 / 提示 / 答案」按钮
- 元数据写入 `course.json` 的 `quizzes`；壳自动把「章节测验」收入右侧大纲

---

## 工作流 D：进度

| localStorage 键 | 内容 |
|-----------------|------|
| `{slug}_completed` | 已完成 chapterId[] |
| `{slug}_theme` | `light` / `dark` |
| `{slug}_scroll` | 上次阅读 chapterId |

---

## 术语深度探索

每章 ≥3 条，写入 `course.json` 的 `terms`：

```json
{ "label": "显示名", "prompt": "发给外部 AI 的完整中文提问" }
```

---

## 技术约束

1. 打开 `index.html` 即可用（`file://` 或静态服务）。
2. CDN 版本见 `config/defaults.json`。
3. 教程壳禁止外链独立 `.css` / `.js`（demo 源码除外）。
4. 动态插章后调用 `highlightIn`、`renderMermaidIn`（见 `templates/shell.app.js`）。
5. **壳层 UI 架构**见 [reference/html-shell.md](reference/html-shell.md)；Mermaid 全屏见 [reference/mermaid-fullscreen.md](reference/mermaid-fullscreen.md)。
6. 保留 `aria-label` 与键盘可操作。

---

## 质量自检

| # | 项 |
|---|-----|
| 0 | assemble + validate 0 error（[delivery-review.md](reference/delivery-review.md)） |
| 1 | `outline` 与侧栏一致 |
| 2 | `phaseTitle` 已领域化 |
| 3 | 章节布局符合 [chapter-layout.md](reference/chapter-layout.md) |
| 4 | 官方链接经 WebSearch |
| 5 | demo README 含运行命令（若有） |
| 6 | 术语 ≥3 |
| 7 | `welcome.partial.html` 含 `#outline-summary-body` |
| 8 | `themePreset` 与 `theme.css` 一致 |

---

## 参考文件

| 文件 | 用途 |
|------|------|
| [reference/chapter-layout.md](reference/chapter-layout.md) | **章节正文编排（工作流 B 主文档）** |
| [reference/chapter-template.md](reference/chapter-template.md) | 章节 HTML 片段 |
| [reference/chapter-blocks-policy.md](reference/chapter-blocks-policy.md) | 必填块与 domainType |
| [reference/phase-design-prompts.md](reference/phase-design-prompts.md) | 工作流 A 大纲 |
| [reference/assembly.md](reference/assembly.md) | 组装 index.html |
| [reference/delivery-review.md](reference/delivery-review.md) | 交付前 Review |
| [reference/course-data-schema.md](reference/course-data-schema.md) | course.json 字段 |
| [reference/welcome-partial-template.md](reference/welcome-partial-template.md) | 欢迎页 |
| [reference/quiz-template.md](reference/quiz-template.md) | 测验 |
| [reference/theme-colors.md](reference/theme-colors.md) | 主题色 |
| [reference/html-shell.md](reference/html-shell.md) | 页面 DOM |
| [reference/shell-app.js.md](reference/shell-app.js.md) | 壳脚本能力 |
| [reference/shell-styles.md](reference/shell-styles.md) | 壳样式索引 |
| [reference/mermaid-fullscreen.md](reference/mermaid-fullscreen.md) | Mermaid 结构与全屏 |
| [reference/tutorial-readme-template.md](reference/tutorial-readme-template.md) | 课程 README |
| [templates/](templates/) | 壳实现 |
| [config/defaults.json](config/defaults.json) | CDN、章数、块配置 |
| [examples/minimal-course/](examples/minimal-course/) | 可组装示例课 |

生成或修改教程前，先读对应 reference，再写文件。
