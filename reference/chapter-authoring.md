# 章节写作指南

生成 `<workspace>/courses/<slug>/chapters/{chapterId}.html` 时，以 `course.json` 该章的 **`sections[]` 为骨架**。

**工作流 B 入口**：[workflow-b-checklist.md](workflow-b-checklist.md)（单页顺序；本文 §1–§4 + 附录为写作细则，§5 编码与恢复按需查阅）。

| 关联主题 | 文档（勿在本文重复细则） |
|----------|--------------------------|
| 必填 DOM 块 | [chapter-blocks-policy.md](chapter-blocks-policy.md) |
| 术语 AI 拓展 | [terms-policy.md](terms-policy.md) |
| 章节测验 | [quiz-template.md](quiz-template.md) |
| Gate 挂载 | [workflows.md](workflows.md) §Gate 总表 |
| Gate 命令 | [delivery-review.md](delivery-review.md) |
| Gate 3 语义 | [chapter-quality-rubric.md](chapter-quality-rubric.md) |

**工作流 B 须读本文 §1–§4 + 附录**（§5 按需）；勿通读整个 `reference/`。术语写法见 [terms-policy.md](terms-policy.md)，量化阈值见 `config/chapter-quality.json`。

---

## 1. 编排原则

| 原则 | 说明 |
|------|------|
| **先读后做** | 概念 → 图/表 → 代码 → 步骤 → Demo → **章节测验** |
| **分点优先** | `.notice`、`ul`/`ol`、`.role-cards`；避免连续 3 段以上纯文字 |
| **图随文走** | Mermaid / 表放在刚提到该结构的小节旁 |
| **术语可点** | `.term` + `data-term-id`；密度见 [terms-policy.md](terms-policy.md) |
| **分区清晰** | 每个 `sections[]` 对应 `.section-block`，勿整章单一大卡片 |

### 标题与右侧大纲

| 标签 | 用途 |
|------|------|
| `h2` | 章标题（仅 `.chapter-header`） |
| `h3` | 与 `sections[]` **逐条对应**；可加「复习与自检」「动手练习」 |
| `h4` | 二级小节；**每个** `.code-block` 前 |
| `h5` | **仅** `.mermaid-wrap` 内图题 |
| `.learn-compare-heading` 等 | 对比列标题，**不用 h5** |

### 章末块顺序（`.concept` 外）

`.official-links.content-section` → `.chapter-practice` → `.resources.content-section`

### 禁止项

- 整章正文只有一个 `.concept.content-section` 包住所有 `h3`。
- 每个 `.section-block` 末尾再插「本节结论」（改由章末统一「本章结论」）。
- `demo-box` 内使用 `h3`（用 `h4.demo-box-title`）。
- 非法 HTML 标签（如非标准自定义标签）；Gate 2 会拦截。
- 手改 `index.html` 正文（只改 `chapters/*.html`，再 assemble）。
- 正文跨章只写 `chapterId` 或 `<code>basics-02</code>`，而不链中文章名（见 §跨章引用）。

### 跨章引用

正文指向本课其他章（`.resources`「下一章」、`.chapter-review-next`、正文前瞻、测验解析等）：

| 项 | 约定 |
|----|------|
| 锚点 | `href="#ch-{chapterId}"`（与 `section id="ch-{chapterId}"`、侧栏一致） |
| 链接文字 | `course.json` → `outline[].chapters[].title`，**勿**用 slug 或裸 id |
| HTML | 裸 `<a href="#ch-…">`，**勿**加 `class` |
| 样式 | 与 `.official-links` / `.resources` 外链一致，由壳层 `shell.base.css` 按 `a[href^="#ch-"]` 着色（`var(--accent)`）；**勿**在 `theme.css` 重复 |
| 补充 | 链后可跟冒号写一句场景，如「：Docker 启动集群…」 |
| 未生成章节 | 由壳层 `navigateToChapter` 弹出 Toast（**非** `alert`）：`「{outline 章标题}」尚未生成，请从左侧目录打开已发布章节`；`showToast(message)` 单参、课程主色，**无** error/success 分色（见 [theme-colors.md](theme-colors.md) §7） |

```html
<li><a href="#ch-basics-02-env-setup">环境搭建与第一个 Topic</a>：Docker 启动集群并创建 Topic</li>
```

口语「下一章将讲 CAP」且无需跳转时可不链。`demos/`、文件路径仍用 `<code>`。

壳层拦截正文/测验内 `a[href^="#ch-"]` 并调用 `navigateToChapter`（非浏览器锚点）；侧栏目录同逻辑。见 [shell-maintenance.md](shell-maintenance.md) §章节导航。

### 正文表格

| 用途 | 写法 |
|------|------|
| 对比 / 数据表 | 外层 `outline-table-wrap` + 内层 `table.outline-table`，每张表单独包裹并闭合 |
| 场景决策表 | 类写在 `<table>` 上：`<table class="outline-table learn-decision-table">`；标题用前置 `h4`，**勿** `<div class="learn-decision-table">` 包裸 `<table>` |

欢迎页大纲表专用样式见 [course-data-schema.md](course-data-schema.md)；正文表勿省略 `outline-table`。

---

## 2. DOM 骨架与 HTML 片段

```html
<section id="ch-{chapterId}" class="chapter" data-chapter="{chapterId}">
  <header class="chapter-header">
    <h2><span class="chapter-done-badge">已完成</span>{title}</h2>
    <button type="button" class="btn-mark-done" data-chapter="{chapterId}" aria-label="标记本章完成">标记完成</button>
  </header>
  <div class="concept">
    <div class="chapter-intro content-section">
      <p class="chapter-meta">约 <strong>25 分钟</strong> · 阶段：<strong>{阶段名}</strong> · 能力：{动词短语}</p>
      <div class="notice notice-why-learn"><strong>为什么要学本章</strong><p>…</p></div>
      <div class="notice notice-outcome"><strong>学完你能</strong><ul><li>…</li></ul></div>
      <div class="notice"><strong>本章先记住 N 件事</strong><ul>…</ul></div>
    </div>
    <div class="section-block"><h3>{sections[0] 标题}</h3></div>
    <div class="section-block chapter-conclusions-block notice">
      <h3>本章结论</h3>
      <ul class="chapter-conclusions-list"><li><strong>…</strong>：…</li></ul>
    </div>
    <div class="section-block learn-review-block">
      <h3>复习与自检</h3>
      <p class="chapter-review-next">下一步：过关清单、章节测验、Demo…</p>
    </div>
  </div>
</section>
```

同时将测验写入 `quiz.partial.html` 与 `course.json.quizzes`。

要点：`mermaid-wrap` 用 `h5` → `pre.mermaid` → `.diagram-caption`；`.learn-code-compare` **上下**排列。

---

## 3. 教学法检查项（7 项）

样式由 assemble 注入 `templates/enrichment.base.css`。Gate 2 校验加粗项；Gate 3 评审全部。

| # | 检查项 | 必填 DOM / 类 |
|---|--------|----------------|
| 1 | 学习负担可见 | `.chapter-meta`（约 X 分钟 · 阶段 · 能力） |
| 2 | 学习动机 | `.notice-why-learn` |
| 3 | 学习产出 | `.notice-outcome` + 「本章先记住 N 件事」 |
| 4 | 与大纲对齐 | 每节 `.section-block` + `h3` |
| 5 | 章末串讲 | `.chapter-conclusions-block`，`ul.chapter-conclusions-list` **N 条 = sections 条数** |
| 6 | 微自检 | ≥1 处 `.learn-micro-check` |
| 7 | 判断与迁移 | `.chapter-practice` 内 `ol.steps.steps-operate` + `ol.steps-judgment-list`（每题 `.learn-practice-answer` 折叠参考答案）；`.learn-review-block` 含 `.chapter-review-next` |

### 本章结论（写法）

- `h3` 固定文案：**本章结论**。
- 每条：`<strong>{与某节 h3 同主题的短语}</strong>：{一句可复述的 takeaway}`。
- 容器：`section-block chapter-conclusions-block notice`。
- **禁止**复习区再写重复「本章小结」notice（用 `p.chapter-review-next`）。

### 动手练习

**壳层必填**（Gate 2）：`.chapter-practice` 内操作步骤 + 判断练习（含下拉参考答案）+ `demo-box`。

```html
<div class="chapter-practice">
  <h3>动手练习</h3>
  <p class="steps-intro">…本章具体产出…</p>
  <h4 class="practice-section-title">操作步骤</h4>
  <ol class="steps steps-operate">
    <li>步骤正文（壳层 CSS 自动渲染 1、2、3… 圆形序号）</li>
  </ol>
  <h4 class="practice-section-title">判断练习</h4>
  <ol class="steps-judgment-list">
    <li>
      <p class="judgment-stem">题干…</p>
      <div class="learn-practice-answer">
        <details>
          <summary>参考答案</summary>
          <div class="learn-practice-answer-body"><p>…</p></div>
        </details>
      </div>
    </li>
  </ol>
  <div class="demo-box"><h4 class="demo-box-title">Demo：…</h4><p>验收标准…</p></div>
</div>
```

样式见 `enrichment.base.css`（`.steps-operate`、`.steps-judgment-list`、`.learn-practice-answer`）。兼容旧版 `ol.steps` + `ol.steps.steps-judgment`，新章请用上述 DOM。

#### 内容与形式（禁止套模板）

| 项 | 要求 |
|----|------|
| `steps-intro` | 写**本章**要完成的产出（改哪份配置、填哪张表、跑哪条命令），**禁止**每章抄写「先完成理解步骤，再用判断检验…」 |
| `h4.practice-section-title` | 固定两节小标题：**操作步骤**、**判断练习**（壳层 CSS 分区） |
| `ol.steps.steps-operate` | ≥2 条须**点名正文素材**（表/图题/配置键/API/代码块）；圆形序号由 CSS 自动生成；「完成 demos/xxx」最多 1 条且放在末位 |
| `ol.steps-judgment-list` | ≥1 题；每题 `p.judgment-stem` + `.learn-practice-answer` 内 `<details><summary>参考答案</summary>`；**形式轮换**：A/B 权衡、找错配置、排障顺序、补全 yaml 等；**禁止**每章复制「方案 A/B 各写 1 条支持/反对」 |
| `demo-box` | 除目录外须写**验收标准**（命令 + 期望输出/截图要点） |
| 与大纲 | 操作步骤宜覆盖 `sections[]` 中 ≥2 节的具体技能点 |

判断题至少 1 道；每道须写**可展开的参考答案正文**（非仅题干）。支持/反对各 1 条或选 A/B 并说明场景仅为**可选**题型之一。

#### 动态条数（写章前必算）

**DOM 骨架固定**（`practice-section-title` ×2 + `steps-operate` + `steps-judgment-list` + `demo-box`）；变的是**条数与题型**，由 `outline.sections[]` 与阶段决定。Gate 2 会按 `config/chapter-quality.json` → `practice` 校验。

| 输入 | 规则 |
|------|------|
| 大纲节数 **N** | 理解步骤 ideal ≈ `ceil(N × ratio)`，clamp 3～8；`ratio` 理论章 0.5、practice 阶段 0.6 |
| 判断题 | N≤4 → 1 题；N≥5 → 建议 2 题（排障 + 找错/权衡） |
| 每节映射 | 优先从正文已有素材出题：该节 **表/Mermaid/代码块/配置** → 1 条理解步骤 |
| 末位 | 最多 1 条「可选：demos/…」；不得全部步骤只写 demo |

**写章前「动手练习清单」（Agent 内部，写在 HTML 前）**

```text
本章 N={sections.length}，ideal 理解步骤={ideal}，判断={1|2}
节1「{sections[0]}」→ 步骤：{填表|画图|改配置|…，点名正文元素}
节2「{sections[1]}」→ …
判断1 形式：{排障顺序|找错 yaml|A/B 权衡|…}，考点：{某节 h3}
demo 验收：{命令 + 期望输出}
```

**阶段差异**

| 阶段 | 理解步骤侧重 | 判断侧重 |
|------|--------------|----------|
| basics / advanced | 填表、画序列/Mermaid、纸面标注 | 概念权衡、找错设计 |
| practice | `mvn`/`curl`/改 yaml、对照正文代码块 | 排障顺序、配置找错、模块边界 |

**题型轮换（避免每章同一套）**

| 轮换池 | 示例 |
|--------|------|
| 排障顺序 | 「Gateway 先于 Eureka 启动会怎样？」 |
| 找错 | 「下列 API/配置哪条违反本章契约？」 |
| 补全 | 「缺哪段 yaml 键导致 lb:// 不生效？」 |
| 权衡 | 「单模块 vs 多模块，ShopFlow 为何选 B？」（**勿每章都用**） |
| 口头 | 「用三句话向同事解释 Outbox」 |

### 测验（场景与判断）

- 建议 ≥1 题标注「（场景）」或「（判断）」。
- 题量满足 [quiz-template.md](quiz-template.md)。

---

## 4. 加深理解组件（`.learn-*`）

`meta.useEnrichment !== false` 时注入样式。交互脚本内联在 `welcome.partial.html`（函数体 `templates/chapter-enrichment.js`）。**勿**建 `<workspace>/courses/<slug>/assets/` 外链 JS。

| 类名 | JS | 用途 |
|------|-----|------|
| `.learn-scenario` | 否 | 情境条；放在相关 `h3` 小节开头 |
| `.learn-compare` | 否 | 双栏反例/推荐 |
| `.learn-code-compare` | 否 | 上下堆叠代码对比 |
| `.learn-tabs` | 否 | 标签页；DOM 与选中态见下节，样式在 `enrichment.base.css` |
| `.learn-faq` | 否 | `<details>` FAQ |
| `.learn-param-slider` | 是 | 参数滑块 |
| `.learn-checklist` | 是 | 自检清单 + `data-storage-key` |
| `.learn-cheat-sheet` | 否 | 速查卡 |
| `.learn-interview` | 否 | 答辩题 |
| `.learn-decision-table` | 否 | 场景决策表（类在 `<table>`，见 §正文表格） |
| `.learn-micro-check` | 否 | 先想 10 秒；每章 ≥1 |

对比列标题用 `<span class="learn-compare-heading">`，**勿用 h5**。

### 标签页 DOM（`.learn-tabs`）

双标签纯 CSS 切换，**勿**在 `theme.css` 写按章 `id` 的选中态。DOM 顺序固定：`input` × N → `label` × N → `.learn-tab-panel` × N。

```html
<div class="learn-tabs" role="tablist" aria-label="…">
  <input type="radio" name="{unique}" id="{prefix}-tab-a" class="learn-tab-input" checked />
  <input type="radio" name="{unique}" id="{prefix}-tab-b" class="learn-tab-input" />
  <label for="{prefix}-tab-a">标签 A</label>
  <label for="{prefix}-tab-b">标签 B</label>
  <div class="learn-tab-panel" id="{prefix}-panel-a" role="tabpanel">…</div>
  <div class="learn-tab-panel" id="{prefix}-panel-b" role="tabpanel">…</div>
</div>
```

`name` 同一组内唯一；当前壳层支持 **2** 个标签，三标签以上须扩展 `enrichment.base.css`（勿写进 `theme.css`）。

### 章节类型建议（Gate 3 判断，非强制 error）

| 类型 | 建议 enrichment 种类数 |
|------|------------------------|
| 概念/架构 | ≥2 |
| 环境/安装 | ≥1（checklist） |
| 编码/API | ≥1（code-compare 或 tabs） |
| 原理/进阶 | ≥2 |

---

## 5. 编码、组装与恢复

- 只改 `chapters/*.html`，**UTF-8** 保存；改后按 [delivery-review.md](delivery-review.md) §Gate 1 执行 assemble。
- **勿**用 PowerShell 重定向写含中文 HTML；用编辑器 UTF-8 或 Python `Path.write_text(..., encoding="utf-8")`。
- Gate 1 会检测连续 `????`、`U+FFFD` 及 index 与章节源文件不同步；报错后修源文件并 **reassemble**。
- 源文件损坏、从 `index.html` 恢复：见 [assembly.md](assembly.md) §逆向拆分（恢复后重跑 Gate 1～2）。

---

## 附录：工作流 B 内部提示

将 `{chapterId}`、`{title}`、`{sections}`、`{domain}` 替换后，先列「呈现清单」再写 `chapters/{chapterId}.html` 与同章测验：

```text
【角色】技术教程作者，输出静态 HTML 片段（无 html/head/body）。

【硬约束】
- 必填块见 chapter-blocks-policy.md；.mermaid-wrap 内勿写 .mermaid-toolbar；术语见 terms-policy.md。
- 跨章引用、正文表格见本文 §跨章引用、§正文表格。
- 每个 outline section → 独立 .section-block + h3；禁止整章单一大 .concept.content-section 包住所有 h3。

【本章】
- id：{chapterId}
- 标题：{title}
- 大纲节：{sections}

【步骤】
1. 呈现清单：每节至少 2 种呈现（列表/表/图/代码/enrichment）；每节对应 .section-block + h3。
2. **动手练习清单**（见本文 §动手练习·动态条数）：按 sections 条数算 ideal 步骤与判断题形式，每节至少 1 条步骤点名正文表/图/配置。
3. DOM：.chapter-intro（meta + 为什么要学 + 学完你能 + 先记住）→ .section-block × N → .chapter-conclusions-block → .learn-review-block → .official-links → .chapter-practice（h4 操作步骤 + ol.steps-operate；h4 判断练习 + ol.steps-judgment-list 含 details 参考答案 + demo-box h4）→ .resources。
4. 标题：h4 在每个 code-block 前；h5 仅 .mermaid-wrap 内图题。
5. 同步 quiz.partial + course.json.quizzes（单选/多选/填空各 ≥1），考点对齐正文；见 quiz-template.md。
6. Gate 与交付：见 [workflow-b-checklist.md](workflow-b-checklist.md) §3–§4。

【输出】仅输出 <section id="ch-...">…</section> 完整片段，不要 markdown 包裹。
```
