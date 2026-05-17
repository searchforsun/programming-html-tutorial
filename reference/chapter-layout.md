# 章节正文编排

生成 `chapters/{chapterId}.html` 时，以 `course.json` 该章的 **`sections[]` 为骨架**，块可嵌套、可交错；校验只要求**块存在**（见 [chapter-blocks-policy.md](chapter-blocks-policy.md)）。

## 原则

| 原则 | 说明 |
|------|------|
| **先读后做** | 讲清知识点 → 配图/表 → 代码印证 → 动手步骤 → Demo |
| **分点优先** | `.notice`、`ul`/`ol`、`.role-cards`；避免连续 3 段以上纯文字 |
| **图随文走** | Mermaid / 表放在刚提到该结构的小节旁 |
| **术语可点** | `.term` + `data-term-id`（与 `course.json` 的 `terms` 一致，每章 ≥3） |

## 标题与右侧大纲

壳层 `#chapter-toc` 只收录本章 **`h3` / `h4`**。标题须与知识内容一致，便于阅读与索引。

| 标签 | 用途 |
|------|------|
| `h2` | 章标题（仅 `.chapter-header`） |
| `h3` | 一级知识节，与 `sections[]` **逐条对应** |
| `h4` | 二级小节；**每个** `.code-block` 前的说明标题 |
| `h5` | **图外**图题（在 `.mermaid-wrap` 内、边框上方）；**不进**右侧大纲 |
| `.diagram-caption` | **图外**说明（在 `pre.mermaid` / 边框下方） |

- `.concept` 为内容容器；章首用 `.notice` 摘要（壳层会为摘要与首个 `h3` 留白）。
- **Mermaid 结构**：`h5` → 壳注入的 `.mermaid-diagram`（仅 SVG 区域有边框）→ `p.diagram-caption`；勿手写 `.mermaid-toolbar`。
- 代码块紧跟对应 `h3`/`h4`，每块前有 `h4` 标题。
- 全章 **一处** `ol.steps`，建议 `h3`「动手练习」+ `p.steps-intro`（说明与图中 A1/B1 等标签的对照关系）。
- 多图：外层 `h4` 分组，单图标题用 `h5`。
- 有 `quiz.partial.html` 时，壳在右侧大纲末条追加「章节测验」（锚点为各章 `h3`）。

## 必填块（位置自由）

| 选择器 | 说明 |
|--------|------|
| `.concept` | 主内容：摘要、各 `h3` 知识节、小结 |
| `.official-links` | ≥1 个经 WebSearch 的官方 URL |
| `.code-block` | `pre>code` + 复制按钮 |
| `.mermaid-wrap` | `pre.mermaid` + `diagram-caption` |
| `.steps` | `ol.steps`，≥3 条 |
| `.demo-box` | `demos/<chapterId>-<name>/` + README（`domainType` E/F 见块策略） |
| `.resources` | 延伸链接 |

`domainType` 放宽见 [chapter-blocks-policy.md](chapter-blocks-policy.md)。

## 推荐结构（`.concept` 内）

1. `.notice` — 「本章先记住 N 件事」
2. 每个 `sections[]` 一项 → `<h3>` + 列表/卡片/表/图/代码
3. `.notice` — 「本章小结」+ 下一章预告

章末常见顺序：`.official-links` → `h3` 动手练习 + `ol.steps` → `.demo-box` → `.resources`（代码块通常在 `.concept` 内对应节下，而非堆在章末）。

## 章节类型侧重

| 类型 | 侧重 |
|------|------|
| 概念/架构 | 摘要 → 卡片/图 → 表 → 短代码 |
| 环境/安装 | notice → 命令型 steps → demo-box |
| API/编码 | `h3` 知识节 → 带标题的 code-block → steps |
| 原理/进阶 | 图/序列 → 深入段落 → official-links |

每节至少一种呈现形式（列表 / 图 / 表 / 代码 / 步骤）。

## 生成前清单

1. 读该章 `sections`，列出每节用图/表/代码/steps 的呈现方式。
2. 为每个 section 写一个 `h3`；子主题与代码用 `h4`。
3. 自检：术语 ≥3；无无标题代码堆；仅一处 `ol.steps`。

## 参考范例

- 技能包内：`examples/minimal-course/chapters/basics-01-overview.html`
- 用户项目：`courses/<slug>/chapters/*.html`

HTML 片段见 [chapter-template.md](chapter-template.md)。
