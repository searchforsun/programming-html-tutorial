# Mermaid 全屏（§6b，可复用）

实现位于 `templates/shell.base.css` + `templates/shell.app.js`。与 technical-doc-to-html 评审页同构。

## 章节作者

- 仅用 `.mermaid-wrap` 包裹 `<pre class="mermaid">`（或 `div.mermaid`）。
- **不要**手写 `.mermaid-toolbar`、全屏按钮或独立遮罩层 DOM。
- 图表渲染完成后，壳会自动 `injectMermaidFullscreenUi` + `bindMermaidFullscreen`。

## 行为

| 步骤 | 说明 |
|------|------|
| 打开 | 点击右上角「全屏」 |
| 原生 | `wrap.requestFullscreen()`，背景 `var(--bg)`，SVG `max-width/min(96vw,1400px)` |
| 回退 | 不支持或用户拒绝 → `wrap.classList.add('is-pseudo-fullscreen')`，`position:fixed; inset:0; z-index:10000` |
| 关闭 | 再点「退出全屏」、`Esc`（伪全屏）、或退出原生全屏 |
| 主题 | `applyTheme` 先 `closeAllMermaidFullscreen()`，再 `rerenderActiveMermaid()` |

## 壳版本

`SHELL_VERSION` ≥ `2.1.0`（`templates/SHELL_VERSION`、`assemble-index.mjs`）。

## 维护

改样式 → `shell.base.css`；改逻辑 → `shell.app.js`。改完后对已有课程执行：

```bash
node .claude/skills/programming-html-tutorial/scripts/assemble-index.mjs --dir courses/<slug>
```
