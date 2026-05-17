# 教程站组件样式（参考）

**唯一实现源**：`templates/shell.base.css`（assemble 注入 `{{SHELL_BASE_CSS}}`）。  
**勿**在本文件维护完整 CSS 副本；改样式请直接编辑 `shell.base.css`，再对课程执行 assemble。

页面 DOM 与交互见 [html-shell.md](html-shell.md)；Mermaid 全屏见 [mermaid-fullscreen.md](mermaid-fullscreen.md)。

---

## 主题变量（每课 `theme.css` + `index.shell.html` 亮/暗块）

组件样式只使用 CSS 变量，领域色写入 `courses/<slug>/theme.css` 或 `[data-theme-preset]`，见 [theme-colors.md](theme-colors.md)。

### 壳层共用（`index.shell.html` 内联，各课一致）

| 变量 | 用途 |
|------|------|
| `--font-sans` | 正文、侧栏、右栏大纲、术语提示词（Noto Sans SC 等） |
| `--font-mono` | 代码块、行内 `code` |
| `--scrollbar-thumb` | 侧栏 / 右栏 / 代码区 / `#term-prompt` 滚动条（亮暗各一套） |

Google Fonts 建议同时加载：`JetBrains Mono` + `Noto Sans SC`。

### 每课覆盖（示例键名）

| 变量 | 用途 |
|------|------|
| `--bg` / `--bg-accent` | 页面背景 |
| `--surface` / `--text` / `--muted` / `--border` | 表面与文字 |
| `--accent` / `--accent-soft` / `--accent-hover` / `--accent-glow` | 强调色 |
| `--code-bg` / `--code-header` | 代码区 |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | 阴影 |
| `--radius` / `--radius-sm` | 圆角 |
| `--success` / `--danger` | 测验反馈、Toast |

---

## 布局变量（`.layout`，定义于 `shell.base.css`）

| 变量 | 默认语义 |
|------|----------|
| `--sidebar-width` | 左栏宽度（300px） |
| `--chapter-toc-width` | 右栏宽度（= 左栏） |
| `--nav-panel-heading-size` | 左阶段标题、右栏「大纲」、右栏 toc-l1 |
| `--nav-panel-section-size` | 左章链接、右栏一级条目 |
| `--nav-panel-subsection-size` | 右栏 toc-l2、隐藏按钮 |
| `--nav-panel-line-height` | 侧栏行高 |
| `--layout-duration` / `--layout-ease` | 右栏开合、正文 `padding-right` 过渡 |

打开右栏时：`html.chapter-toc-open` → `.main-area { padding-right: var(--chapter-toc-width) }`。

---

## 区域与选择器索引

### 顶栏与全局

| 选择器 | 说明 |
|--------|------|
| `.topbar` / `.course-title` | 粘性顶栏；标题可点击回欢迎页 |
| `#toast` | 复制、标记完成等反馈 |
| `body` | `var(--font-sans)`，`line-height: 1.7` |

### 左侧 `#sidebar`

| 选择器 | 说明 |
|--------|------|
| `#sidebar summary` | 阶段标题：`--nav-panel-heading-size`，字重 600，**无**全大写 |
| `#sidebar a` | 章节链接；`.active-ch` 高亮；`.done` 行尾 `.ch-done-icon`（实心圆 + ✓） |
| `.chapter-done-badge` | 章首「已完成」；暗色为浅底弱对比 |
| `.sidebar-home-nav` | 「课程首页」入口 |
| `::-webkit-scrollbar` + `scrollbar-color` | 细滚动条，`--scrollbar-thumb` |

侧栏显示 `phaseTitle`。

### 中间 `#main-content`

| 选择器 | 说明 |
|--------|------|
| `section[data-chapter]` | 默认 `display:none`；`.active` 显示 |
| `.chapter-header` | `scroll-margin-top: 4.5rem`（顶栏下锚点） |
| `.concept > .notice:first-child + h3` | 摘要与首个 `h3` 间距 |
| `.chapter h3` / `h4` | `scroll-margin-top` 供右栏锚点滚动 |

### 右侧 `#chapter-toc`

| 选择器 | 说明 |
|--------|------|
| `#chapter-toc` | `position:fixed` 右栏；`--chapter-toc-fg*` 字色略浅 |
| `.chapter-toc-title` | 「大纲」小标题 |
| `#chapter-toc-nav a.toc-l1` / `.toc-l2` | 一级 / 二级大纲 |
| `.chapter-toc-fab` | &lt;1280px 时 FAB 唤出 |
| `html.chapter-toc-open` | 与 `.main-area` 联动 |

行为（JS）：第一项滚章首；有测验时末条「章节测验」；见 `shell.app.js`。

### 代码与 Mermaid

| 选择器 | 说明 |
|--------|------|
| `.code-block` / `.btn-copy` | 工具栏 + 复制 |
| `.code-block pre` | 横向滚动条 `--scrollbar-thumb` |
| `.mermaid-wrap` | 外层无边框 |
| `.mermaid-wrap > h5` | **图外**图题 |
| `.mermaid-diagram` | 壳注入；**仅此处**有边框 + 全屏按钮 |
| `.mermaid-wrap > .diagram-caption` | **图外**说明 |
| `.mermaid-diagram:fullscreen` / `.is-pseudo-fullscreen` | 全屏仅图表区 |

章节作者勿手写 `.mermaid-toolbar` / `.mermaid-diagram`。

### 测验 `#quiz-panel`

| 选择器 | 说明 |
|--------|------|
| `.quiz-section` | 按 `data-chapter` 切换显示 |
| `.quiz-section h3` | 唯一可见标题「章节测验」 |
| `.quiz-section .quiz-panel-lead` | 标题**下方**说明 |
| `.quiz-item` / `.btn-check` / `.btn-hint` / `.btn-answer` | 题目与交互 |

### 术语 `#term-modal`

| 选择器 | 说明 |
|--------|------|
| `#term-prompt` | `.term-prompt`（`div`）；`var(--font-sans)`，非等宽 |
| `#btn-copy-prompt` | 主按钮样式 |

### 欢迎页

| 选择器 | 说明 |
|--------|------|
| `.outline-table-wrap` | 欢迎页大纲表外框（圆角、阴影） |
| `.outline-table thead th` | 表头（`code-header` 底） |
| `.outline-table` | 三阶段摘要表 |
| `.outline-phase` / `.outline-phase-inner` / `.phase-tag` | 阶段列（浅灰纯色底） |
| `.outline-ch-index` / `.outline-chapter-title` | 章节序号与标题 |
| `.outline-section-list` | 小节列表（accent 圆点） |

### 暗色模式（`[data-theme="dark"]`）

| 选择器 | 说明 |
|--------|------|
| `.btn-mark-done:not(.is-done)` 等 | 标记完成 / 检查 / Toast 成功 / 复制提示词：浅底描边，非亮色实心 |
| `.btn-copy.copied` | 代码复制已反馈；与 `:hover:not(.copied)` 区分 |

---

## 响应式

| 断点 | 行为 |
|------|------|
| `max-width: 1280px` | 隐藏 `#chapter-toc`，保留 FAB |
| `max-width: 768px` | 左栏非 fixed；右栏 FAB 隐藏；正文全宽 |

---

## 维护流程

1. 修改 `templates/shell.base.css` 和/或 `templates/shell.app.js`。
2. 若新增全局 CSS 变量 → 同步 `templates/index.shell.html` 亮/暗块。
3. 更新本文件「索引」与 [html-shell.md](html-shell.md)（架构级）。
4. 对各课程执行：

```bash
node programming-html-tutorial/scripts/assemble-index.mjs --dir courses/<slug>
```

