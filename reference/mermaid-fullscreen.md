# Mermaid 全屏（壳层）

实现位于 `templates/shell.base.css` + `templates/shell.app.js`。

## 章节作者

- 使用 `.mermaid-wrap`：`h5`（可选）→ `pre.mermaid` / `div.mermaid` → `p.diagram-caption`（可选）。
- **不要**手写 `.mermaid-toolbar`、`.mermaid-diagram` 或全屏按钮（壳在渲染后注入）。

## DOM 与全屏范围

| 区域 | 是否进入全屏 |
|------|----------------|
| `h5` 图题、`.diagram-caption` | 否（留在正文流） |
| `.mermaid-diagram`（含 SVG + 全屏按钮） | **是** |

全屏目标为 **`.mermaid-diagram`**，不是整块 `.mermaid-wrap`。

## 行为

| 步骤 | 说明 |
|------|------|
| 打开 | 点击图表区右上角「全屏」 |
| 原生 | `diagram.requestFullscreen()` |
| 回退 | 失败 → `diagram.is-pseudo-fullscreen`（`fixed; inset:0; z-index:10000`） |
| 关闭 | 「退出全屏」、`Esc`、或退出原生全屏 |
| 主题 | 切换主题时关闭全屏并 `rerenderActiveMermaid()` |

## 维护

改样式 → `shell.base.css`；改逻辑 → `shell.app.js`。改完后对课程执行 `assemble-index.mjs`。
