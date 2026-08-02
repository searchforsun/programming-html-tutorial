# welcome.partial.html 模板

写入 `<workspace>/courses/<slug>/welcome.partial.html`，由 assemble 注入 `index.shell.html` 中外层 `#welcome` 容器内。

**禁止**在片段根节点使用 `id="welcome"`（与 `index.shell.html` 外层 `#welcome` 重复）。

## 必填 DOM

| 选择器 | 用途 |
|--------|------|
| `#outline-summary-body` | `renderOutlineSummary()` 填充三阶段大纲表 |
| 勿重复 `id="welcome"` | 仅用 `class="welcome-panel"` 等 |

## 加深理解脚本（内联，勿用独立 .js）

章节含 `.learn-checklist`、`.learn-param-slider` 时，在片段**末尾**内联（从 `templates/chapter-enrichment.js` 复制函数体）：

```html
<script>
(function () {
  /* …见 templates/chapter-enrichment.js … */
  window.initChapterEnrichment = initEnrichment;
})();
</script>
```

- **不要**使用 `<script src="assets/...">`；课程目录不出现 `assets/*.js`。
- `meta.useEnrichment === false` 时可省略；assemble 亦不会在缺失时注入。

## 生成后

工作流 A 完成后跑 Gate 1（见 [delivery-review.md](delivery-review.md)）。
