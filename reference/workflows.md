# 工作流（Agent 逐步清单）

课程路径与目录结构：[SKILL.md](../SKILL.md) §课程路径、§目录结构（**不在本文重复**）。

Gate **命令**与 Gate 1 **人工清单**：[delivery-review.md](delivery-review.md)。**勿通读**整个 `reference/` 目录。

## 产品约定

| 项 | 约定 |
|----|------|
| 章节测验 | **默认每章必带**（工作流 B 与正文同次写入 `quiz.partial.html` + `course.json.quizzes`）。仅当用户**明确**不要测验时可省略。 |
| 概念章篇幅 | **不设最少字数**。Gate 2 不扫字数；是否讲透由 Gate 3 判断。 |

## Gate 总表（工作流 × 闸门）

| 工作流 | 时机 | Gate 1 | Gate 2 | Gate 3 |
|--------|------|:------:|:------:|:------:|
| **A** | 首次 welcome + assemble | ✓ | — | — |
| **A-修订** | 只改 `outline` 后 assemble | ✓ | — | — |
| **B** | 每章 HTML + quiz + assemble | ✓ | ✓ | ✓ |
| **B-修订** | 改目标章 / quiz / demo | ✓ | ✓ | 正文大改时 ✓ |
| **C** | 仅改测验 | ✓ | ✓ | 正文未动可跳过 |

| 闸门 | 命令 / 动作 |
|------|-------------|
| **Gate 1** | `assemble-index.mjs` + `validate-tutorial.mjs` → **0 error** |
| **Gate 2** | `review-chapter.mjs` → **0 error**（`--strict` 时 warning 也算失败） |
| **Gate 3** | 读 [chapter-quality-rubric.md](chapter-quality-rubric.md)，输出语义 JSON；`mustFixBeforeDelivery` 则返工 |

返工后重跑 Gate 1～2，同一章建议最多 **2 轮**。命令见 [delivery-review.md](delivery-review.md)。

---

## 工作流 A：初始化大纲

1. 在 `<workspace>/courses/<slug>/` 创建课程目录（结构见 [SKILL.md](../SKILL.md) §目录结构）。
2. 若 `<workspace>/courses/index.html` 不存在，从 `templates/portal.index.html`、`courses-catalog.template.json`、`courses-README.template.md` 初始化课程中心（见 [portal-maintenance.md](portal-maintenance.md)）。
3. 确认领域、是否含 demo；**测验默认开启**（用户明确不要时可关）。
4. **WebSearch** → `course.json` 的 `meta`（版本、官方文档）。
5. [theme-colors.md](theme-colors.md) → `theme.css`。
6. 大纲：必读 [phase-design-prompts.md](phase-design-prompts.md)；章数见 `config/defaults.json`。
7. 初始化 `course.json`（`terms` 见 [terms-policy.md](terms-policy.md) 工作流表 **A**；可选 `meta.selectionPromptTemplate` / `selectionPromptEnabled`，见 [course-data-schema.md](course-data-schema.md)）、`theme.css`、`welcome.partial.html`（含 `#outline-summary-body`）、`README.md`（[tutorial-readme-template.md](tutorial-readme-template.md)）。
8. assemble → validate（Gate 1）。
9. 在 `courses/courses.json` 注册该课（[courses-catalog-schema.md](courses-catalog-schema.md)）。
10. **暂停**，用户确认大纲后再生成章节。

**A-修订**：只改 `course.json` → `outline` 后 assemble；保留已有 `chapters/*.html`。

---

## 工作流 B：生成单章（含测验）

按 [workflow-b-checklist.md](workflow-b-checklist.md) 逐步执行（每次一章）。

**B-修订**：改目标章 / quiz / demo 时同样走 checklist；正文大改时 Gate 3 不可跳过（见上表）。

---

## 工作流 C：仅改测验

正文不动，只改 `quiz.partial.html` 与 `course.json.quizzes`。参考 [quiz-template.md](quiz-template.md)。完成后 Gate 1 → 2（见上表）。

---

## 附录：进度导出 / 导入（非生产工作流）

进度由 `templates/shell.app.js` 维护，Agent **无需改文件**。

| 机制 | 说明 |
|------|------|
| `localStorage` | `{slug}_completed`（已完成）、`{slug}_visited`（已打开未学完）、全局明暗（`globalThemeKey`，见 `config/defaults.json`）、`{slug}_scroll`；过关清单勾选等为 `{slug}_*` 扩展键 |
| 侧栏状态 | **未读**（灰）→ **进行中**（圆点，打开过本章）→ **已完成**（✓，章首标记） |
| 页内「导出进度」 | 下载 `progress.json`（含完成章、进行中章、清单勾选、主题） |
| 页内「导入进度」 | 从 JSON 恢复上述状态 |

`progress.json` 字段：`courseId`、`exportedAt`、`completedChapters`、`visitedChapters`（可选）、`storage`（过关清单等，可选）、`theme`。旧版仅含 `completedChapters` 仍可导入。导入不校验 `courseId`，勿跨课混用。

用户询问时：说明在已组装的 `index.html` 侧栏底部操作即可。
