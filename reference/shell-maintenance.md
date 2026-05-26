# 壳层维护指南（templates）

> **日常路径**：用 [assembly.md](assembly.md) 从 `course.json` + partial 生成 `index.html`，勿手写整页。  
> **UI 八风格 / CSS 分层 / build 流程**：见 [shell-ui-styles.md](shell-ui-styles.md)（**唯一真源**，本文不重复）。  
> **本文档**：DOM、交互、`shell.app.js` 模块；布局 CSS 索引。

章节片段见 [chapter-authoring.md](chapter-authoring.md)；领域 accent 见 [theme-colors.md](theme-colors.md)。

---

## 维护顺序

1. 改 `templates/shell.base.css` / `shell.app.js` / 风格源文件（见 [shell-ui-styles.md](shell-ui-styles.md)）
2. 同步 bump `config/defaults.json` → `shellVersion` 与 `templates/SHELL_VERSION`
3. 按 [shell-ui-styles.md §发布流程](shell-ui-styles.md#发布流程改壳层-css-后) 执行 build → sync portal → assemble 各课
4. 课程侧只维护 `theme.css`（仅 accent）、`welcome.partial.html`、`chapters/*.html`、`quiz.partial.html`
5. 新 shell 字段时同步 [course-data-schema.md](course-data-schema.md)

脚本清单见 [scripts/README.md](../scripts/README.md)。

---

## 页面结构（assemble 产出）

- `#toast`、`header.topbar`（`#btn-portal` 左 · 居中 `.course-title` · 右 `.topbar-actions`）、`#sidebar`（三阶段 `details` + `phaseTitle`；**无**侧栏「全部课程」）
- `#main-content`：`#welcome`、`#content`（章节）、`#quiz-panel`
- `#chapter-toc` + `#chapter-toc-fab`（≥1280px 右栏大纲）
- `#term-modal`（术语 / 选中文本 AI 提示词）
- `#selection-term-toolbar`（选中文本后「AI 解释」，由 JS 注入）
- `<script id="course-data">` + 内联 `shell.app.js`

`welcome`、`#content`、`quiz-panel`、toast 均使用 `<div>`。

欢迎片段写 `welcome.partial.html`，**勿**在片段内再用 `id="welcome"`。必填 `tbody#outline-summary-body`。

---

## CDN（版本见 `config/defaults.json`）

highlight.js、Mermaid 10.x、Google Fonts（JetBrains Mono + Noto Sans SC）。课程按语言追加 hljs language 包。

---

## shell.app.js 模块清单（不得删减）

| 函数 | 说明 |
|------|------|
| `applyThemePreset()` | `data-theme-preset` 来自 `meta.themePreset` / `slug` |
| `getCompleted` / `setCompleted` / `toggleComplete` | 章节完成 localStorage |
| `syncMarkDoneButtons` / `syncSidebarDone` | 标记完成 UI |
| `showWelcome` / `showChapter` / `navigateToChapter` | 切换页；正文/侧栏 `#ch-` 链接须走 `navigateToChapter`（章节默认 `display:none`，浏览器锚点无效） |
| `getScrollRoot` / `scrollRootToTop` / `scrollRootToElement` | 正文滚动容器为 `.layout`（`body` 不滚）；切章/回欢迎页用 `'smooth'`，章内大纲点击用 `'auto'` 瞬间跳转 |
| `bindInContentChapterLinks` / `chapterIdFromHash` | 拦截 `main-content` 内 `a[href^="#ch-"]`；`hashchange` 同步 |
| `renderSidebar` / `renderOutlineSummary` / `updateProgressBar` | 侧栏与欢迎页表 |
| `renderChapterToc` / `bindChapterTocNav` / `initChapterTocSpy` / `initChapterTocControls` | 右栏大纲；点击瞬间跳转；滚动 spy 高亮；首项滚章首 |
| `initQuiz` / `syncQuizVisibility` / `checkQuizAnswer` | 章节测验 |
| `showToast` / `copyText` / `copyFromButton` / `flashCopyButton` | 复制与反馈 |
| `openTermModal` / `initTermModal` / `closeTermModal` | 术语弹窗（预置 `.term`） |
| `initSelectionPrompt` / `buildSelectionPrompt` | 正文选中 → 浮动「AI 解释」→ 复用 `#term-modal` |
| `applyTheme` / `applyHljsTheme` / `initThemeToggle` | 明暗；键见 `globalThemeKey` |
| `applyUiStyle` / `initUiStyleMenu` | 八套 UI 风格；互斥 `<style data-ui-style-sheet>`；见 [shell-ui-styles.md](shell-ui-styles.md) |
| `syncPageViewClass` | `body.page-welcome` / `page-chapter` |
| `initMermaid` / `renderMermaidIn` / `rerenderActiveMermaid` | Mermaid；章节可见后再渲染 |
| `getPortalHref` / `initPortalNav` | 顶栏 `#btn-portal` 链到课程中心（默认 `../index.html`，可 `meta.portalHref`） |
| `exportProgress` / `importProgress` | 进度 JSON |
| `afterChapterInserted` | 动态插入章后回调 |

`initCourse` 顺序：`applyThemePreset` → `initPortalNav` → 主题（读 `GLOBAL_THEME_KEY`，迁移旧 `{slug}_theme`）→ 侧栏 → `bindInContentChapterLinks` → 大纲 → 绑定事件 → Mermaid/hljs → 按 `location.hash` 或 `KEY_SCROLL` 进章，否则 `showWelcome()`。

### 课程中心与全局主题

- Portal 见 [portal-maintenance.md](portal-maintenance.md)；壳层 `#btn-portal` 与 `applyTheme` 见上文模块清单。
- 顶栏 `.topbar` 为 `grid-template-columns: minmax(0,1fr) auto minmax(0,1fr)`；`.btn-import` 用 `inline-flex` + `line-height:1.2` 与按钮等高。

### 章节导航（跨章链接）

- 非当前章 `section[data-chapter]` 为 `display:none`；点击 `<a href="#ch-{id}">` **不会**仅靠浏览器改 hash 显示目标章。
- `navigateToChapter(id)`：`showChapter` + 更新 `location.hash`；正文、测验、侧栏 `#sidebar` 内 `#ch-` 链均走此函数（`bindInContentChapterLinks`）。
- **未生成章节**（无 `section#ch-{id}`）：`showToast('「' + getChapterTitle(id) + '」尚未生成，请从左侧目录打开已发布章节')`；`showToast` 仅接受 `message`，勿传 `type`，样式见 `shell.base.css` `#toast`（主色底，无 toast-error）。
- 作者写法见 [chapter-authoring.md](chapter-authoring.md) §跨章引用。

### 正文滚动与本章大纲

- **滚动容器**：`body { overflow: hidden }`，`.layout { overflow-y: auto; flex: 1 }`；`getScrollRoot()` 返回 `.layout`。`IntersectionObserver`、章内跳转、读进度提示均以此为准，**勿**对 `window` 滚动。
- **切章 / 回欢迎页**：`showChapter` / `showWelcome` → `scrollRootToTop('smooth')`，正文平滑回到顶部。
- **本章大纲点击**：`bindChapterTocNav` → `scrollRootToElement(target, 'auto')`（首项 → `scrollChapterToTop` 同样 `'auto'`），正文**瞬间跳转**，不做平滑动画；`e.preventDefault()` 拦截默认 `#` 锚点。
- **大纲跟随正文（spy）**：`initChapterTocSpy` 以 `.layout` 为 `root` 观察章内 `h3`/`h4`（及测验锚点）；`chapterTocTopObserver` 观察 `.chapter-header`，章首可见且首标题未进 spy 区时高亮首项。
- **大纲面板滚动**：`ensureChapterTocLinkVisible` 在 spy 高亮时把当前项滚入 `#chapter-toc-nav` 可视区；正文回到章首（`isChapterContentAtTop`：章头 `top` 对齐视口顶）时 `#chapter-toc-nav.scrollTop = 0`，与高亮复位配合。
- **禁止**：用 scroll 监听强制覆盖 spy 高亮；在章内大纲点击使用 `'smooth'`（与产品约定不符）。

暴露：`window.toggleComplete`、`window.afterChapterInserted`。

### Mermaid 要点

- `startOnLoad: false`；**章节可见后**再 `mermaid.run`（勿在 `display:none` 上渲染）。
- 章节作者：`.mermaid-wrap` = `h5`（可选）→ `pre.mermaid` → `p.diagram-caption`（可选）。
- **勿**手写 `.mermaid-toolbar` / `.mermaid-diagram`（壳在渲染后注入）。
- 全屏目标为 **`.mermaid-diagram`**（非整块 `.mermaid-wrap`）；`h5` / caption 留在外。
- 原生 `requestFullscreen` 失败 → `.is-pseudo-fullscreen`；`Esc` / 主题切换时关闭并重绘。

### hljs 亮暗

用 `<link id="hljs-light">` / `hljs-dark` 的 `disabled` 切换，**勿**用 CSS `display` 隐藏 link。

---

## shell.base.css 索引

**改样式请直接编辑 `templates/shell.base.css`**，本文仅索引。

| 区域 | 关键选择器 |
|------|------------|
| 布局 | `body`（`overflow: hidden`）、`.layout`（正文滚动、`--topbar-height`）、`--sidebar-width`、`html.chapter-toc-open` |
| 顶栏 | `.topbar`（三列 grid）、`.btn-portal`、`.course-title`（居中）、`.btn-import` |
| 侧栏 | `#sidebar summary`、`.active-ch`、`.done` |
| 本章大纲 | `#chapter-toc`、`#chapter-toc-nav`、`.is-active`、`#chapter-toc-fab` |
| 正文 | `section[data-chapter].active`、`scroll-margin-top` |
| 代码 | `.code-block`、`.btn-copy` |
| Mermaid | `.mermaid-wrap > h5`、`.mermaid-diagram`（边框+全屏钮） |
| 测验 | `.quiz-section[data-chapter]` |
| 术语 | `#term-prompt`（无衬线，非等宽） |
| 外链 / 跨章 | `.official-links a`、`.resources a`、正文 `a[href^="#ch-"]`（见 [chapter-authoring.md](chapter-authoring.md) §跨章引用） |
| Enrichment | `templates/enrichment.base.css`（含 `.learn-tabs` 等，**勿**写进 `theme.css`） |
| 选中解释 | `.selection-term-toolbar`、`.btn-selection-term` |
| 欢迎表 | `.outline-table`、`#outline-summary-body` |
| 暗色 | `[data-theme="dark"]` 下按钮对比度 |

每课变量写在 `theme.css`：`--accent`、`--bg`、`--font-sans` 等（见 theme-colors）。

响应式：`<1280px` 隐藏右栏保留 FAB；`<768px` 侧栏非 fixed。

---

## 交互必须项

| 交互 | 实现 |
|------|------|
| 复制代码 | `.btn-copy` → Toast |
| 复制提示词 | `#btn-copy-prompt` |
| 标记完成 | 文案切换 + Toast |
| 术语弹窗 | × / 关闭 / Esc；点击 `.term` 或选中后「AI 解释」 |
| 本章大纲点击 | 正文瞬间跳转（`'auto'`）；首项回章首 |
| 本章大纲 spy | 随正文滚动高亮当前小节 |
| 亮暗 | `data-theme` + hljs |

---

## 禁止

- 删减上述 shell 能力
- 在壳 CSS 写死某技术品牌色（用 CSS 变量 + 本课 `theme.css`）
- 复制/标记完成无 Toast 或按钮反馈

单文件 `index.html` 建议 < 500KB。
