# 应用脚本（参考）

实现源文件：`templates/shell.app.js`。与 [html-shell.md](html-shell.md) 配套。assemble 时注入完整脚本；**不得**删减下文列出的交互能力。

## 主题 preset 绑定

仅将 `html` 上的 `data-theme-preset` 设为与本课 CSS 一致（见 [theme-colors.md](theme-colors.md)）：

```javascript
function applyThemePreset() {
  var id = COURSE_DATA.meta.themePreset || COURSE_DATA.meta.slug || 'default';
  id = String(id).toLowerCase().replace(/[^a-z0-9-]/g, '');
  document.documentElement.setAttribute('data-theme-preset', id);
}
```

`initCourse()` 中在 `applyTheme(...)` **之前**调用 `applyThemePreset()`。  
**不要**维护 `THEME_KEYWORDS` 或跨课程预设映射表。

## 模块清单（必须实现）

| 函数 | 说明 |
|------|------|
| `applyThemePreset()` | 设置 `data-theme-preset` |
| `getCompleted` / `setCompleted` / `toggleComplete` | 章节完成 localStorage |
| `syncMarkDoneButtons()` | 「标记完成」↔「取消标记」+ `.is-done` |
| `syncSidebarDone()` | 侧栏 done/pending |
| `showWelcome()` | 显示欢迎页、隐藏章节、侧栏「课程首页」高亮、清除 `KEY_SCROLL` |
| `showChapter(id)` | 切换章节、`.active-ch`、隐藏 welcome |
| `updateProgressBar` / `totalChapters` / `renderSidebar` / `renderOutlineSummary` | 进度与侧栏 |
| `showToast(msg, type)` | 底部 Toast，`success` / `error` |
| `flashCopyButton(btn, state)` | 复制钮「已复制 ✓」/「复制失败」，2s 后恢复 `data-label` |
| `copyText(text, btn, okMsg, failMsg)` | `clipboard` + `execCommand` 降级 |
| `copyFromButton(btn)` | `.code-block` 内代码复制 |
| `resetCopyPromptButton()` | 术语弹窗复制钮复位 |
| `closeTermModal()` | 关闭 dialog + 复位 |
| `initTermModal()` | `.term` 点击、复制提示词、×/关闭/Esc |
| `bindCopyButtons()` | 事件委托 `.btn-copy`、`.btn-mark-done` |
| `applyHljsTheme` / `applyTheme` / `initMermaid` / `renderMermaidIn` / `rerenderActiveMermaid` / `highlightIn` | 亮暗、hljs、Mermaid 与高亮 |
| `exportProgress` / `importProgress` | 进度 JSON |
| `afterChapterInserted(el)` | 新章高亮、Mermaid、进度、syncMarkDoneButtons |

## 实现要点

### localStorage 键

`{meta.slug}_completed`、`{meta.slug}_theme`、`{meta.slug}_scroll`（可选）。

### 标记完成

`toggleComplete` 后调用 `syncMarkDoneButtons()`；按钮文案：未完成「标记完成」，已完成「取消标记」+ class `is-done`；Toast 提示已标记/已取消。

### 复制反馈

- `.btn-copy`：`copyFromButton` → Toast「代码已复制到剪贴板」
- `#btn-copy-prompt`：`copyText(..., '提示词已复制到剪贴板', ...)`
- 失败时 Toast 错误样式 + 按钮「复制失败」

### 术语弹窗

打开时 `resetCopyPromptButton()`；`#btn-close-term` 与 `#btn-close-term-x` 均走 `closeTermModal()`；支持 Esc（`dialog` 的 `cancel` 事件）。

### highlight.js 亮暗切换

`<link id="hljs-dark" disabled>` 初始禁用暗色表。`applyHljsTheme(theme)` 在 `applyTheme` 内调用：

```javascript
function applyHljsTheme(theme) {
  var light = document.getElementById('hljs-light');
  var dark = document.getElementById('hljs-dark');
  if (!light || !dark) return;
  var isDark = theme === 'dark';
  light.disabled = isDark;
  dark.disabled = !isDark;
}
```

**不要**用 CSS `display` 切换 `<link>`——无法停用已加载的样式表。

### Mermaid（必须）

- `initMermaid()`：`startOnLoad: false`，`theme` 随 `data-theme`（`dark` / `default`），可配 `themeVariables` 贴近本课 CSS。
- **首次渲染须在章节可见后**：`showChapter(id)` 末尾调用 `renderMermaidIn(section)`；**不要**在 `display:none` 的章节上先 `mermaid.run`。
- `renderMermaidIn(root)`：保存 `data-mermaid-src` → 清 SVG → `mermaid.run({ nodes })` → `injectMermaidFullscreenUi` + `bindMermaidFullscreen`。
- **Mermaid 全屏（§6b）**：脚本注入 `.mermaid-toolbar` / `.mermaid-fs-btn`（章节 **勿手写** 工具栏）。优先 `wrap.requestFullscreen()`，失败则 `.is-pseudo-fullscreen`（`z-index: 10000`）。`initMermaidFullscreen()` 处理 `fullscreenchange` / `Esc`；`applyTheme` 先 `closeAllMermaidFullscreen()`。
- `applyTheme` 内：`initMermaid()` 后 `rerenderActiveMermaid()`，使亮暗切换时图表重绘。
- `afterChapterInserted(el)`：仅当 `el.classList.contains('active')` 时调用 `renderMermaidIn`。
- `highlightIn` 选择器：`pre:not(.mermaid) > code`，避免误高亮 Mermaid 源码。

```javascript
function resetMermaidNode(el) {
  if (!el.getAttribute('data-mermaid-src')) {
    var src = (el.textContent || '').trim();
    if (src) el.setAttribute('data-mermaid-src', src);
  }
  var src = el.getAttribute('data-mermaid-src');
  if (!src) return false;
  el.removeAttribute('data-processed');
  el.querySelectorAll('svg, .mermaidContainer, [id^="dmermaid"]').forEach(function (n) { n.remove(); });
  el.textContent = src;
  return true;
}
```

### 初始化顺序（`initCourse`）

1. `applyThemePreset()`
2. 标题、`applyTheme(localStorage 或 light)`
3. `renderSidebar`、`renderOutlineSummary`、`updateProgressBar`
4. `bindCopyButtons`、`initTermModal`、`initMermaidFullscreen`、`injectMermaidFullscreenUi`、`bindMermaidFullscreen`、`initMermaid`、`highlightIn(document)`
5. `syncMarkDoneButtons()`
6. `syncAllProgressUI()`；有 `KEY_SCROLL` 则 `showChapter`，否则 `showWelcome()`（不再默认跳进第一章）
7. 顶栏 `.course-title` 点击/Enter/Space → `showWelcome()`；侧栏首项「课程首页」同效

暴露：`window.toggleComplete`、`window.afterChapterInserted`。

## 骨架示例（需补全注释处的函数体）

```javascript
(function () {
  var COURSE_DATA = JSON.parse(document.getElementById('course-data').textContent);
  window.COURSE_DATA = COURSE_DATA;
  var slug = COURSE_DATA.meta.slug;
  var KEY_DONE = slug + '_completed';
  var KEY_THEME = slug + '_theme';
  var KEY_SCROLL = slug + '_scroll';
  var copyResetTimer = null;

  function applyThemePreset() { /* 见上 */ }
  function getCompleted() { return JSON.parse(localStorage.getItem(KEY_DONE) || '[]'); }
  function setCompleted(ids) { localStorage.setItem(KEY_DONE, JSON.stringify(ids)); }
  function toggleComplete(chapterId) { /* set 切换 + updateProgressBar + syncSidebarDone + syncMarkDoneButtons */ }
  function syncMarkDoneButtons() { /* 见模块清单 */ }
  function showChapter(id) { /* 见模块清单 */ }
  function showToast(message, type) { /* ... */ }
  function flashCopyButton(btn, state) { /* ... */ }
  function copyText(text, btn, toastMsg, failMsg) { /* clipboard + fallbackCopy */ }
  function copyFromButton(btn) { /* ... */ }
  function resetCopyPromptButton() { /* data-label 默认「复制提示词」 */ }
  function fallbackCopy(text) { /* textarea + execCommand */ }
  function bindCopyButtons() { /* 委托 */ }
  function closeTermModal() { /* ... */ }
  function initTermModal() { /* ... */ }
  function initCourse() { /* 见初始化顺序 */ }

  window.toggleComplete = toggleComplete;
  window.afterChapterInserted = function (el) { /* highlightIn + mermaid.run + syncMarkDoneButtons */ };

  initCourse();
})();
```

## 禁止

- 无效 HTML 标签
- 复制/标记完成/复制提示词无视觉或 Toast 反馈
- 在组件 CSS 中写死某技术品牌色（应使用 CSS 变量 + 本课 theme 块）
- 引用某一已生成教程路径作为「金标准」；以本 reference 与 [shell-styles.md](shell-styles.md) 为准
