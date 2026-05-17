# welcome.partial.html 模板

写入 `courses/<slug>/welcome.partial.html`，由 assemble 注入外壳 `<div id="welcome">` 内。

**禁止**在片段根节点使用 `id="welcome"`（与 `index.shell.html` 外层 `#welcome` 重复，且易导致 `getElementById` 行为异常）。

## 必填 DOM（缺一则 `initCourse` 可能中断）

| 选择器 | 用途 |
|--------|------|
| `#outline-summary-body` | `renderOutlineSummary()` 填充三阶段大纲表 |
| 勿重复 `id="welcome"` | 仅用 `class="welcome-panel"` 等 |

## 推荐结构

对齐 `examples/minimal-course/welcome.partial.html`：

1. 标题 + lead 段落  
2. `meta-cards`（版本、章数、前置、官方文档等）  
3. `h3` + `table.outline-table` + **`tbody#outline-summary-body`**（空表体，由 JS 填）  
4. 可选 `notice` / `role-cards` 学习路径说明  

## 生成后

见 [delivery-review.md](delivery-review.md)：assemble → validate（welcome 相关项为 **error**）。
