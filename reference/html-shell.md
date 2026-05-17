# index.html 骨架与内联资源

> 生成 `index.html` 请用 [assembly.md](assembly.md)。壳实现以 `templates/shell.base.css`、`templates/shell.app.js` 为准。

页面须包含 Toast、标记完成切换、术语弹窗等交互（由 assemble 注入）。

## 生成顺序（必须）

1. 读 [course-data-schema.md](course-data-schema.md) → 填写 `COURSE_DATA`
2. 读 [theme-colors.md](theme-colors.md) → 根据**本课领域**设计一组主题 CSS
3. 复制 [shell-styles.md](shell-styles.md) → `<style>` 前半
4. 追加本课 `[data-theme-preset="..."]` 亮/暗变量块 → `<style>` 后半
5. 按 [shell-app.js.md](shell-app.js.md) 实现完整 `<script>`
6. 章节按 [chapter-template.md](chapter-template.md) 插入 `#content`

## CDN（版本 pin 到 minor）

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
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
  <!-- CDN + <style>：shell-styles + 本课 theme-colors 块 -->
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
    </div>
  </div>
  <dialog id="term-modal">
    <div class="term-modal-header">
      <h3 id="term-title"></h3>
      <button type="button" class="btn-icon-close" id="btn-close-term-x" aria-label="关闭">×</button>
    </div>
    <div class="term-modal-body">
      <pre id="term-prompt"></pre>
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

- `.layout`：侧栏 + 主区；`.main-area` 内 `#main-content` max-width 900px 居中
- 移动端 `@media (max-width: 768px)` 单列

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
