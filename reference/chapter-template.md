# 章节 HTML 片段

替换 `{chapterId}`、`{title}`。  
**布局不按固定顺序**：先读 [chapter-layout.md](chapter-layout.md)，再按本章 `sections` 编排块的位置与 `.concept` 内结构。

## 最小骨架（仅结构约束）

```html
<section id="ch-{chapterId}" class="chapter" data-chapter="{chapterId}">
  <header class="chapter-header">
    <h2><span class="chapter-done-badge">已完成</span>{title}</h2>
    <button type="button" class="btn-mark-done" data-chapter="{chapterId}" aria-label="标记本章完成">标记完成</button>
  </header>

  <div class="concept content-section">…</div>
  <div class="official-links content-section">…</div>
  <div class="code-block">…</div>
  <div class="mermaid-wrap">…</div>
  <ol class="steps">…</ol>
  <div class="demo-box">…</div>
  <div class="resources content-section">…</div>
</section>
```

## 概念区片段示例（可复用）

```html
<div class="concept content-section">
  <h3>概念</h3>

  <div class="notice">
    <strong>本章先记住 3 件事</strong>
    <ul>
      <li><strong>要点 A</strong>：一句话。</li>
    </ul>
  </div>

  <h4>① 小节标题</h4>
  <ul>
    <li><strong>术语</strong> — 说明。<span class="term" data-term-id="term-id" tabindex="0">可点术语</span></li>
  </ul>

  <div class="role-cards">
    <div class="role-card">
      <span class="role-card-title">组件名</span>
      <p class="role-card-desc">职责一句话。</p>
    </div>
  </div>

  <div class="mermaid-wrap">
    <h4>架构示意</h4>
    <pre class="mermaid">flowchart LR
  A --> B</pre>
    <p class="diagram-caption">读图提示：…</p>
  </div>

  <div class="notice">
    <strong>本章小结</strong>：过关标准；下一章预告。
  </div>
</div>
```

## 代码块 / Demo / 链接

`code-block` 含 `code-toolbar` + `btn-copy`；`demo-box` 指向 `demos/{chapterId}-{name}/`；`official-links` / `resources` 用 `ul > li > a`。

## Demo 目录

```
demos/{chapterId}-{demo-name}/
├── README.md
└── （最小可运行源码）
```

## 金标准范例

`courses/rocketmq/chapters/basics-01-overview.html` — 摘要、分点、卡片、双图、表、代码、步骤。
