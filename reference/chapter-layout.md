# 章节正文布局（图文并茂、按内容编排）

生成 `chapters/{chapterId}.html` 时**不要**套用固定章节模板顺序（概念 → 链接 → 代码 → 图 → 步骤 → Demo → 资源）。  
校验只要求**块存在**（见 [chapter-blocks-policy.md](chapter-blocks-policy.md)），**块内结构与先后顺序由本章知识点决定**。

## 原则

| 原则 | 说明 |
|------|------|
| **先读后做** | 概念讲清 → 必要时配图/表 → 代码印证 → 动手步骤 → Demo |
| **分点优先** | 用 `ul`/`ol`、`.notice` 要点框、`.role-cards` 卡片，避免连续 3 段以上大段纯文字 |
| **图随文走** | Mermaid / 表格放在**刚提到该结构**的小节旁，不要全部堆在章末 |
| **一屏一主题** | 用 `h4` 小标题切分（① ② ③ 或问句式），每节只讲一件事 |
| **术语可点** | 首次出现的专有名词用 `.term` + `data-term-id`（与 `course.json` 的 `terms` 一致） |

## 必读块 vs 自由编排

以下选择器**必须出现**（`domainType` 放宽项除外），但**可嵌套在 `.concept` 内、可交错出现**：

| 块 | 选择器 | 编排提示 |
|----|--------|----------|
| 概念 | `.concept` | 主战场：摘要框、分节、卡片、内嵌图/表/代码引用 |
| 官方链接 | `.official-links` | 通常靠后；概念复杂时可拆「延伸阅读」 |
| 代码 | `.code-block` | 紧跟所印证的 `h4` 小节之后 |
| 架构图 | `.mermaid-wrap` | 流程/拓扑用 flowchart；交互用时序图；附 1 句读图提示 |
| 实操 | `.steps` | 可与概念内步骤合并：章末总步骤 + 概念内 4 步清单二选一，**至少一处** `ol.steps` |
| Demo | `.demo-box` | 动手章必备；纯概念章可简短指向 demo 目录 |
| 资源 | `.resources` | 章末延伸；勿与 official-links 完全重复 |

## 推荐内容模式（按需组合）

### 1. 章首摘要 `.notice`

```html
<div class="notice">
  <strong>本章先记住 N 件事</strong>
  <ul>
    <li><strong>关键词</strong>：一句话。</li>
  </ul>
</div>
```

### 2. 分节小标题 `h4`

在 `.concept` 内用 `h4`（壳已统一样式），例如：`① 解决什么问题？`、`② 核心组件`。

### 3. 角色/概念卡片 `.role-cards`

并列 2–4 个概念时用卡片（见 `shell.base.css`），**不要**用 `.meta-card`（那是欢迎页用的）。

### 4. 图 + 说明 `.mermaid-wrap`

```html
<div class="mermaid-wrap">
  <h4>架构总览</h4>
  <pre class="mermaid">flowchart TB …</pre>
  <p class="diagram-caption">看图记忆：…</p>
</div>
```

勿手写 `.mermaid-toolbar`（壳注入全屏按钮）。

### 5. 对比表

复用 `.outline-table`（与欢迎页大纲表同款），放在「对比/选型」类 `h4` 下。

### 6. 章末小结 `.notice`

```html
<div class="notice">
  <strong>本章小结</strong>：过关标准 + 下一章预告。
</div>
```

## 章节类型 → 布局侧重

| 类型 | 侧重 |
|------|------|
| **概念/架构** | 摘要 → 分点 → 卡片/图 → 对比表 → 短代码印证 → 复习步骤 |
| **环境/安装** | 前置条件 notice → `ol.steps` 逐步命令 → demo-box |
| **API/编码** | 最小概念 → code-block → 常见坑 notice → steps 练习 |
| **原理/进阶** | 问题驱动 h4 → 图或序列 → 深入段落 → 官方链接 |

以 `course.json` 该章 `sections` 为骨架，**每节至少一种**呈现形式（列表 / 图 / 表 / 代码 / 步骤），避免清一色段落。

## 禁止

- 固定顺序粘贴 [chapter-template.md](chapter-template.md) 旧版「七段式」而不改结构
- 概念区仅 2–4 段长文、无列表无图
- 所有 Mermaid 堆在章末、与正文脱节
- 在章节里写 `style="..."` 大量内联样式（优先用语义 class；临时可少量 inline，但应逐步迁入壳 CSS）
- 手写 `.mermaid-toolbar` 或全屏遮罩 DOM


生成新章前：读该章 `outline` 中 `sections`，列出「需要图 / 表 / 代码 / 步骤」的清单，再写 HTML。
