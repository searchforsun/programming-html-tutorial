# 章节 HTML 片段模板

替换 `{chapterId}`、`{title}` 后插入 `#content`（位于 `.main-area > #main-content` 内）。

```html
<section id="ch-{chapterId}" class="chapter" data-chapter="{chapterId}">
  <header class="chapter-header">
    <h2><span class="chapter-done-badge">已完成</span>{title}</h2>
    <button type="button" class="btn-mark-done" data-chapter="{chapterId}" aria-label="标记本章完成">标记完成</button>
    <!-- 完成后由 syncMarkDoneButtons() 切换为「取消标记」与 .is-done -->
  </header>

  <div class="concept content-section">
    <h3>概念</h3>
    <p>正文。<span class="term" data-term-id="term-id" tabindex="0">术语</span></p>
  </div>

  <div class="official-links content-section">
    <h3>官方文档</h3>
    <ul>
      <li><a href="https://example.com/docs" target="_blank" rel="noopener">官方 Reference</a></li>
    </ul>
  </div>

  <div class="code-block">
    <div class="code-toolbar">
      <span class="lang-tag">java</span>
      <button type="button" class="btn-copy" aria-label="复制代码">复制</button>
    </div>
    <pre><code id="code-{chapterId}-1" class="language-java">// 示例代码</code></pre>
  </div>

  <div class="mermaid-wrap">
    <h3>架构示意</h3>
    <pre class="mermaid">flowchart LR
  Controller --> Service
  Service --> Repository</pre>
  </div>

  <ol class="steps">
    <li>安装环境</li>
    <li>执行项目启动命令（如 <code>mvn spring-boot:run</code>、<code>npm run dev</code> 等，按本章技术栈填写）</li>
  </ol>

  <div class="demo-box">
    <h3>Demo 项目</h3>
    <p>目录：<code>demos/{chapterId}-hello/</code>，见该目录 README。</p>
  </div>

  <div class="resources content-section">
    <h3>延伸学习</h3>
    <ul>
      <li><a href="https://..." target="_blank" rel="noopener">资源标题</a> — 文档</li>
    </ul>
  </div>
</section>
```

## Demo 目录

```
demos/{chapterId}-{demo-name}/
├── README.md
└── （最小可运行源码）
```
