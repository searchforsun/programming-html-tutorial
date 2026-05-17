# index.html 骨架与内联资源

> 生成 `index.html` 请用 [assembly.md](assembly.md)。壳实现以 `templates/shell.base.css`、`templates/shell.app.js` 为准。

页面须包含 Toast、标记完成切换、术语弹窗等交互（由 assemble 注入）。

## 生成顺序（必须）

1. 读 [course-data-schema.md](course-data-schema.md) → 填写 `COURSE_DATA`
2. 读 [theme-colors.md](theme-colors.md) → 根据**本课领域**设计一组主题 CSS
3. 壳样式由 assemble 注入 `templates/shell.base.css`（架构见 [shell-styles.md](shell-styles.md)）
4. 追加本课 `[data-theme-preset="..."]` 亮/暗变量块 → `<style>` 后半
5. 按 [shell-app.js.md](shell-app.js.md) 实现完整 `<script>`
6. 章节按 [chapter-template.md](chapter-template.md) 插入 `#content`

## CDN（版本 pin 到 minor）

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" id="hljs-light">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" id="hljs-dark" disabled>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<!-- 按课程语言追加 highlight.js languages/*.min.js -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
```

## 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title><!-- COURSE_DATA.meta.title --></title>
  <!-- CDN + <style>：shell.base.css + 本课 theme-colors 块 -->
</head>
<body>
  <div id="toast" role="status" aria-live="polite" aria-atomic="true"></div>
  <header class="topbar">...</header>
  <div class="layout">
    <aside id="sidebar" aria-label="课程大纲"></aside>
    <div class="main-area">
      <main id="main-content">
        <div id="welcome" class="welcome"></div>
        <div id="content"></div>
        <div id="quiz-panel"></div>
      </main>
      <aside id="chapter-toc" class="chapter-toc" aria-label="本章大纲" hidden>...</aside>
    </div>
  </div>
  <button type="button" id="chapter-toc-fab" class="chapter-toc-fab" hidden>大纲</button>
  <dialog id="term-modal">
    <div class="term-modal-header">
      <h3 id="term-title"></h3>
      <button type="button" class="btn-icon-close" id="btn-close-term-x" aria-label="关闭">×</button>
    </div>
    <div class="term-modal-body">
      <div id="term-prompt" class="term-prompt" role="document"></div>
      <div class="term-actions">
        <button type="button" id="btn-copy-prompt" class="btn-term" aria-label="复制 AI 提示词">复制提示词</button>
        <a class="btn-term btn-term-link" href="https://www.doubao.com/chat/" target="_blank" rel="noopener">豆包 ↗</a>
        <a class="btn-term btn-term-link" href="https://chat.deepseek.com/" target="_blank" rel="noopener">DeepSeek ↗</a>
        <a class="btn-term btn-term-link" href="https://tongyi.aliyun.com/qianwen/" target="_blank" rel="noopener">通义 ↗</a>
        <button type="button" id="btn-close-term" class="btn-term" aria-label="关闭对话框">关闭</button>
      </div>
    </div>
  </dialog>
  <script id="course-data" type="application/json">{ ... }</script>
  <script>/* shell-app.js 全部能力 */</script>
</body>
</html>
```

生成 HTML 时：`welcome`、`#content`、`quiz-panel`、toast 均使用 `<div>`。

## 布局要点

| 区域 | 说明 |
|------|------|
| `#sidebar` | 左：三阶段 `details`，显示 `phaseTitle`；`renderOutlineSummary` 与侧栏独立 |
| `.main-area` | 中：正文 max-width 900px 居中；打开右栏时 `padding-right` 过渡留白 |
| `#chapter-toc` | 右：宽 = 左栏（`--sidebar-width`）；收录本章 `h3`/`h4` + 有测验时末条「章节测验」 |
| `#quiz-panel` | 正文下：按 `data-chapter` 显示当前章测验 |

### 右侧大纲行为

- 收录 `.concept` 等处的 `h3`/`h4`（排除 `.chapter-header`、`.code-toolbar`）
- **第一项**点击 → 滚到章首（`.chapter-header`），非第一个 `h3`
- 欢迎页 / 无标题时隐藏；&lt; 1280px 隐藏，可用 FAB 展开
- 字体：侧栏/右栏用 `--font-sans`（Noto Sans SC 等）；右栏字色略浅于正文

### 字体与滚动条

- 正文：`--font-sans`；代码：`--font-mono`
- 术语弹窗 `#term-prompt`：无衬线中文排版（**非**等宽）
- 侧栏、右栏、代码横向滚动、暗色模式滚动条：`--scrollbar-thumb`（见 `shell.base.css`）

### 欢迎页大纲表

片段：`h3` + `div.outline-table-wrap` > `table.outline-table`（可见 `thead`：阶段 / 章节 / 小节概要）+ `tbody#outline-summary-body`。

`renderOutlineSummary()` 填入：`outline-phase`（`phase-tag` + `phaseGoal`）、`outline-ch-index` + `outline-chapter-title`、`.outline-section-list`；阶段列 `rowspan`。

### 其它

- 打开右栏大纲时 `html.chapter-toc-open`，正文居中基准平滑变化
- 移动端 `@media (max-width: 768px)` 侧栏与右栏大纲隐藏

## 领域主题色

见 [theme-colors.md](theme-colors.md)。由 Agent 按本课领域判断色值，**每课一组** CSS，不写死全局预设库。

## 交互（必须）

| 交互 | 实现 |
|------|------|
| 复制代码 | `.btn-copy` → Toast + 「已复制 ✓」 |
| 复制提示词 | `#btn-copy-prompt` → 同上 |
| 标记完成 | ↔「取消标记」+ Toast |
| 术语弹窗 | × / 关闭 / Esc → `closeTermModal()` |
| 亮暗 | `data-theme` + hljs 样式表 |

详见 [shell-app.js.md](shell-app.js.md)。

## 章节块

`.chapter-header`、`.content-section`、`.code-block`（含 `.btn-copy`）、`.steps`、`.demo-box`。

## 欢迎页

外壳已有 `<div id="welcome">`；片段写 `welcome.partial.html`，**勿**在片段内再用 `id="welcome"`。

必填：`tbody#outline-summary-body`（`renderOutlineSummary` 依赖，缺失会导致复制/术语/标记完成等壳交互全部失效）。模板见 [welcome-partial-template.md](welcome-partial-template.md)；交付前见 [delivery-review.md](delivery-review.md)。

## 文件体积

单文件建议 &lt; 500KB；过大可拆页，须保留 `COURSE_DATA` 与进度导入机制。
