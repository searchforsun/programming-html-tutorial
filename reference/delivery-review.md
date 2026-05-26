# 交付前 Review（Agent 必做）

与用户「大纲审阅闸门」不同：这是 **Agent 在告知用户「已生成」之前** 的强制自检。

工作流与 Gate 挂载见 [workflows.md](workflows.md) §Gate 总表（**不在本文重复**）。

## `--dir` 路径

所有命令的 `--dir` 指向 [SKILL.md](../SKILL.md) §课程路径 中的课程根目录。

示例：`node <skill-root>/scripts/assemble-index.mjs --dir d:/project/study-self/courses/java-distributed-architecture`

## Gate 1 命令

```bash
node <skill-root>/scripts/assemble-index.mjs --dir <workspace>/courses/<slug>
node <skill-root>/scripts/validate-tutorial.mjs --dir <workspace>/courses/<slug>
```

## Gate 2 命令

```bash
node <skill-root>/scripts/review-chapter.mjs --dir <workspace>/courses/<slug>
# 仅评一章：
node <skill-root>/scripts/review-chapter.mjs --dir <workspace>/courses/<slug> --chapter <chapterId>
```

默认**仅终端输出**；`reviews/` 为临时目录，脚本结束后自动删除。调试可加 `--write-json`。

### Gate 2 量化阈值（`config/chapter-quality.json`）

脚本读取 JSON；**数值以 JSON 为准**，勿在文档中硬编码副本。

| JSON 键 | 含义 |
|---------|------|
| `quiz.*` | 测验必带、题型、每章最少题数 |
| `terms.*` | 各阶段 `.term` 处数、不同 id 数、`minPromptChars`；理论阶段 id 见 `theoryPhaseIds` |
| `mermaid.*` | 概念章最少 Mermaid 数 |
| `code.*` | 实践章最少代码块数 |
| `steps.*` / `practice.*` | 动手步骤条数、与大纲节比例、模板化 intro/判断题 warning |
| `pedagogy.*` | 概念章教学法块（如最少结论条数） |

术语 **写法**与 Agent **自检**（脚本不扫的部分）见 [terms-policy.md](terms-policy.md)。

## Gate 1 清单（validate 之外）

| # | 检查项 |
|---|--------|
| 1 | `welcome.partial.html` 含 `#outline-summary-body` |
| 2 | 欢迎片段勿用 `id="welcome"` |
| 3 | 无非法 HTML 标签 |
| 4 | 术语：见 [terms-policy.md](terms-policy.md)；Gate 2 报告为准 |
| 5 | 使用 checklist/slider 时 `welcome.partial.html` 已内联 enrichment 脚本（`initChapterEnrichment`） |
| 6 | `outline` 与侧栏一致；`phaseTitle` 已领域化；`themePreset` 与 `theme.css` 一致 |
| 7 | 官方链接经 WebSearch；demo README 含运行命令（若有） |
| 8 | **UTF-8 / 乱码**：`validate-tutorial.mjs` 检测连续 `????`、`U+FFFD`、index 与 `chapters/*.html` 不同步（见 `scripts/lib/encoding-quality.mjs`）；从 `index.html` 恢复源文件见 [assembly.md](assembly.md) §逆向拆分 |
| 9 | 壳交互冒烟（有浏览器时）：侧栏、标记完成、`.term` 术语弹窗、复制、正文选中「AI 解释」 |

进度导出/导入见 [workflows.md](workflows.md) 附录（**非工作流**，Agent 不改文件，无 Gate）。

## 失败时回复

说明未通过的闸门、已修复项；**不得**仅说「已生成」。

## 通过时话术

```text
「{章标题}」已生成，并通过结构校验与章节质量检查。
- 含章节测验（单选/多选/填空）
- 可选改进：{suggestions}
可回复：修订 / 继续下一章（建议：{下一章 title}，`#ch-{id}`）
```
