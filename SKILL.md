---
name: programming-html-tutorial
description: Generate static HTML interactive programming tutorial sites (phased outline, chapters, quizzes, progress, AI term explorer). Use when the user wants to learn a tech topic as a web course, build an HTML tutorial site, generate/revise chapters or quizzes, or says 生成教程、HTML学习站、编程教程网页、帮我学X做成网页、生成第N章. Requires Node.js 18+ for assemble/validate/review scripts.
license: MIT
metadata:
  version: "2.0.1"
---

# programming-html-tutorial

将技术领域生成为**静态 HTML 教程站**（壳层 CSS/JS 内联；CDN：highlight.js、Mermaid）。三阶段 id：`basics` / `practice` / `advanced`；阶段标题与章节按领域设计（见 [reference/phase-design-prompts.md](reference/phase-design-prompts.md)）。

## 课程路径（必读）

单课生成、修改、assemble、validate 的写入位置：

```text
<workspace>/courses/<slug>/
```

多课工作区在 **`courses/` 根目录**另有课程选择页（portal），见 [portal-maintenance.md](reference/portal-maintenance.md)。

| 项 | 约定 |
|----|------|
| `<workspace>` | 当前 Agent **工作目录**（用户打开的项目根，如 `d:/project/study-self`） |
| `<slug>` | `course.json` → `meta.slug`（kebab-case） |
| 技能包内 | **无写入目标**课程目录；含 `templates/`、`scripts/`、`reference/`；`example/` 为只读样例（Agent 勿改）；portal 模板见 `templates/portal.index.html` |

用户指定其他路径时，以用户为准并在对话中说明实际 `--dir`。

## 触发与工作流

| 用户表述 | 工作流 |
|----------|--------|
| 学习 / 教程 + 技术名 | **A**：初始化大纲 |
| 调整大纲 / 某阶段 | A-修订 |
| 生成某章 / 某阶段 / 继续下一阶段 | **B**：生成章节（含测验） |
| 修订本章 | B-修订 |
| 仅改测验 / 补测验 | **C** |
| 导出 / 导入进度 | 说明用法（见 [reference/workflows.md](reference/workflows.md) 附录） |

**不触发**：纯 Markdown 文档、单次答疑、非教程类页面。

| 工作流 | 入口文档 |
|--------|----------|
| **A / A-修订 / C** | [workflows.md](reference/workflows.md) |
| **B / B-修订** | [workflow-b-checklist.md](reference/workflow-b-checklist.md) |
| **交付 Gate（1–3）** | [delivery-review.md](reference/delivery-review.md)；Gate 3 语义见 [chapter-quality-rubric.md](reference/chapter-quality-rubric.md) |

**禁止**通读整个 `reference/` 目录；按上表与下方索引按需打开。

## 文档索引（按场景打开）

| 场景 | 详述 |
|------|------|
| 章节写作与测验 | [chapter-authoring.md](reference/chapter-authoring.md)、[quiz-template.md](reference/quiz-template.md) |
| 术语写法与 Agent 自检 | [terms-policy.md](reference/terms-policy.md) |
| 初始化大纲 | [phase-design-prompts.md](reference/phase-design-prompts.md)、[course-data-schema.md](reference/course-data-schema.md)、[welcome-partial-template.md](reference/welcome-partial-template.md)、[theme-colors.md](reference/theme-colors.md) |
| 必填 DOM 块 | [chapter-blocks-policy.md](reference/chapter-blocks-policy.md) |
| 组装占位符 / 逆向拆分 | [assembly.md](reference/assembly.md) |
| 改壳层 / 交互排查 | [shell-maintenance.md](reference/shell-maintenance.md) |
| **UI 八风格 / CSS 分层 / build** | [shell-ui-styles.md](reference/shell-ui-styles.md) |
| 脚本一览 | [scripts/README.md](scripts/README.md) |
| 课程中心 / courses.json | [portal-maintenance.md](reference/portal-maintenance.md)、[courses-catalog-schema.md](reference/courses-catalog-schema.md) |
| Gate 2 量化阈值 | `config/chapter-quality.json`（字段含义见 [delivery-review.md](reference/delivery-review.md) §Gate 2） |

---

## 目录结构

```text
<workspace>/courses/
├── index.html              # 课程选择页（templates/portal.index.html）
├── courses.json            # 已注册课程目录
├── README.md               # 启动方式（templates/courses-README.template.md）
└── <slug>/                 # 单门课程根（--dir 指向此处）
    ├── course.json
    ├── theme.css
    ├── welcome.partial.html
    ├── quiz.partial.html
    ├── chapters/<chapter-id>.html
    ├── README.md
    ├── demos/              # 可选
    └── index.html          # assemble 生成；源文件为主，index 可不提交 git
```

在 **`courses/` 根目录**启动静态服务（见 `courses/README.md`）；`file://` 下 localStorage 可能受限。

---

## 技术约束（速查）

细则以各 reference 为准；此处仅列 Agent 最常触犯的硬约束：

1. **只改源文件**：正文改 `chapters/*.html`，再 assemble；勿手改 `index.html` 正文。
2. **UTF-8、无 assets/**：见 [chapter-authoring.md](reference/chapter-authoring.md) §5、[assembly.md](reference/assembly.md)。
3. **无障碍与合法 HTML**：保留 `aria-label`、键盘可操作；禁止非法标签（Gate 2 拦截）。
4. **配置真源**：CDN / 壳版本 / 全局主题与 UI 风格键 → `config/defaults.json`；壳交互 → [shell-maintenance.md](reference/shell-maintenance.md)；UI 风格 CSS → [shell-ui-styles.md](reference/shell-ui-styles.md)。
