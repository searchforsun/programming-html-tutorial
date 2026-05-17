# 交付前 Review（Agent 必做）

与用户「大纲审阅闸门」不同：这是 **Agent 在 assemble 之后、告知用户「已生成」之前** 的强制自检，不通过不得交付。

## 原则

| 类型 | 谁做 | 何时 |
|------|------|------|
| **大纲审阅** | 用户 | 工作流 A 写完 `course.json` 后，生成章节前 |
| **交付 Review** | Agent | 每次写完/改文件 → assemble → **validate 0 error** 后 |

交付 Review ≠ 让用户再点一遍确认；而是 Agent 用脚本 + 清单保证壳交互不被静默破坏。

## 命令（必跑）

在告知用户「本章/本课已生成」之前，**在同一轮对话内**执行：

```bash
node <skill-root>/scripts/assemble-index.mjs --dir <project>/courses/<slug>
node <skill-root>/scripts/validate-tutorial.mjs --dir <project>/courses/<slug>
```

- 若 `validate` 有 **error**：修复源文件后重新 assemble + validate，**不得**先回复用户「已完成」。
- **warning** 可记录；未生成章节缺失属正常 warning，但 welcome / 壳 DOM 类 error 必须清零。

## 清单（validate 之外）

| # | 检查项 | 如何验证 |
|---|--------|----------|
| 1 | `welcome.partial.html` 含 `id="outline-summary-body"` | validate 或肉眼 |
| 2 | 欢迎片段**勿**再写 `id="welcome"`（外壳 `#welcome` 已存在） | validate |
| 3 | 已生成章节 HTML 无非法标签（如误写的非 HTML 标签导致 DOM 断裂） | 浏览器或 grep |
| 4 | 术语 `data-term-id` 均在 `course.json` → `terms` 中有定义 | 对章 grep `.term` |
| 5 | 壳交互冒烟（有浏览器/Playwright 时） | 见下表 |

### 壳交互冒烟（建议，有环境则必做）

打开 assemble 后的 `index.html`（`npx serve`），确认 **Console 无 error**，且：

| 操作 | 预期 |
|------|------|
| 侧栏点一章 | 正文显示，URL/hash 或章节 `active` |
| 章首「标记完成」 | 文案变「取消标记」，进度条变化 |
| 点击 `.term` | `#term-modal` 打开 |
| 代码块「复制」 | Toast 或按钮 `copied` 态 |

无浏览器时：至少确认 Console 不会因 `renderOutlineSummary` 等对 `null` 赋值而报错（历史上多因缺 `#outline-summary-body`）。

## 工作流挂载点

| 工作流 | 交付 Review 时机 |
|--------|------------------|
| **A** 初始化 | 写完 `welcome.partial.html` + 首次 assemble 后（给用户看大纲前） |
| **B** 生成章节 | 每章 `chapters/*.html` + assemble 后 |
| **B-修订** | 同 B |
| **C** 测验 | 改 `quiz.partial.html` 或章节内测验 + assemble 后 |

## 失败时回复用户

勿只说「已生成」。应说明：校验未通过、已修复项、请用户硬刷新后再试。
