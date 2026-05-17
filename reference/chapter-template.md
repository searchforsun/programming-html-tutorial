# 章节 HTML 片段

生成前必读 [chapter-layout.md](chapter-layout.md)。替换 `{chapterId}`、`{title}`，按该章 `sections[]` 编排。

## 最小骨架

```html
<section id="ch-{chapterId}" class="chapter" data-chapter="{chapterId}">
  <header class="chapter-header">
    <h2><span class="chapter-done-badge">已完成</span>{title}</h2>
    <button type="button" class="btn-mark-done" data-chapter="{chapterId}" aria-label="标记本章完成">标记完成</button>
  </header>

  <div class="concept content-section">
    <!-- notice → 各 h3 知识节（可含 code-block / mermaid-wrap）→ 本章小结 notice -->
  </div>

  <div class="official-links content-section">
    <h3>官方文档</h3>
    <ul><li><a href="…" target="_blank" rel="noopener">…</a></li></ul>
  </div>

  <h3>动手练习</h3>
  <p class="steps-intro">…</p>
  <ol class="steps">…</ol>

  <div class="demo-box">
    <h3>Demo：…</h3>
    <p>目录：<code>demos/{chapterId}-…/</code></p>
  </div>

  <div class="resources content-section">
    <h3>延伸学习</h3>
    <ul>…</ul>
  </div>
</section>
```

## 片段要点

- `code-block`：`code-toolbar` + `btn-copy` + `pre>code`；**上方**必有 `h4` 标题。
- `mermaid-wrap`：`h5` 图题 → `pre.mermaid` → `p.diagram-caption`（图题/说明在边框外，由壳包 `.mermaid-diagram`）。
- Demo 目录：`demos/{chapterId}-{name}/README.md` + 可运行源码。

范例：`examples/minimal-course/chapters/basics-01-overview.html`。
