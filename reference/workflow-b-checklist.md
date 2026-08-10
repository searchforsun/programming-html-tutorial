# 工作流 B 单页清单（生成 / 修订单章）

每次只处理**一章**。细则在各链接文档；本文只列顺序与检查点，**不复制**条文。

## 0. 前置

- 课程根目录与文件树：[SKILL.md](../SKILL.md) §课程路径、§目录结构
- Gate 挂载（B / B-修订）：[workflows.md](workflows.md) §Gate 总表

## 1. 读规范（按序打开，勿通读 `reference/`）

| # | 文档 | 用途 |
|---|------|------|
| 1 | [chapter-authoring.md](chapter-authoring.md) §1–§4 + 附录 | 编排、DOM、教学法、`.learn-*`、内部提示 |
| 2 | [chapter-blocks-policy.md](chapter-blocks-policy.md) | 必填 DOM 块 |
| 3 | [terms-policy.md](terms-policy.md) | `.term` 写法（Gate 2 量化见 `config/chapter-quality.json`） |
| 4 | [quiz-template.md](quiz-template.md) | 本章测验 HTML + `course.json.quizzes` |

## 2. 写稿

1. 用 [chapter-authoring.md](chapter-authoring.md) **附录「工作流 B 内部提示」** 替换 `{chapterId}` 等占位，先列「呈现清单」再写 HTML。
2. 写入 `chapters/<chapterId>.html`。
3. 同次更新 `quiz.partial.html` 对应节 + `course.json.quizzes`（用户**明确**免测验时可省略）。
4. 可选：更新 `course.json` → `chapters[id].summary`。
5. UTF-8 保存与源文件恢复：[chapter-authoring.md](chapter-authoring.md) §5 → [assembly.md](assembly.md) §逆向拆分。

## 3. Gate（告知用户「已生成」之前）

按 [workflows.md](workflows.md) §Gate 总表 执行 B / B-修订 闸门：**Gate 1–2** 见 [delivery-review.md](delivery-review.md)，**Gate 3** 见 [chapter-quality-rubric.md](chapter-quality-rubric.md)。返工后重跑 Gate 1～2；同一章建议最多 **2 轮**。

## 4. 交付

通过 Gate 后使用 [delivery-review.md](delivery-review.md) §通过时话术。

**阶段闸门**：当前阶段章节全部完成（或用户跳过）后，再建议下一阶段。
