# 术语（AI 关键词拓展）

**术语写法、Agent 自检与 Gate 2 中 `terms.*` 字段含义的真源。** 量化数值由 `config/chapter-quality.json` → `terms` 提供，脚本读取 JSON；其他文件只链接本文与 JSON。

## 机制

可点击 `.term` + `data-term-id` → 弹出 `course.json` → `terms[id].prompt` 供复制到外部 AI。理论/架构章（`basics` / `advanced`）是拓展重点。

## Gate 2 阈值（`review-chapter.mjs`）

字段见 `config/chapter-quality.json` → `terms`：

| 字段 | 含义 |
|------|------|
| `minSpansConcept` / `minUniqueIdsConcept` | 理论阶段（`theoryPhaseIds`）正文 `.term` 处数 / 不同 id 数下限 |
| `minSpansPractice` / `minUniqueIdsPractice` | `practice` 阶段同上 |
| `minPromptChars` | `prompt` 不足则 warning |
| `theoryPhaseIds` | 视为「概念/理论章」的 `phaseId` 列表 |

- 未知 `data-term-id` → **error**
- `--strict` 时 warning 视为 error

## Agent / Gate 3 自检（脚本不扫）

| 项 | 约定 |
|----|------|
| 工作流 **A** | 初始化词表 **8～12** 条 |
| 工作流 **B** | 理论章每章新增约 **2** 条、实践章约 **1** 条 `terms`（与正文 `.term` 同次交付） |
| 每个知识 `h3` | 至少 **1** 处 `.term`（可复用 id） |
| 每知识 `h3` 呈现 | 建议至少 2 种（图/表/代码/enrichment 等），见 [chapter-quality-rubric.md](chapter-quality-rubric.md) |

**禁止**：仅章头堆术语；`data-term-id` 未写入 `terms`；空泛占位 `prompt`。

## `terms` 字段

```json
"terms": {
  "eventual-consistency": {
    "label": "最终一致",
    "prompt": "完整中文提问（长度须满足 minPromptChars）…"
  }
}
```

`prompt` 建议含：学习背景 → 要解释什么 → **本课示例业务** 一例 → 常见误区或易混概念对比。

## 工作流

| 工作流 | 动作 |
|--------|------|
| **A** | 初始化 8～12 条核心词 |
| **B** | 达标 Gate 2 `terms.*` + 新增词条；与测验同次交付 |
| **B-修订** | 同步改 `terms` 与正文 `.term` |
| **C** | 一般不改正文术语 |

## HTML

```html
<span class="term" data-term-id="eventual-consistency" tabindex="0">最终一致</span>
```

同一 id 可多处出现；显示文案可与 `label` 略有不同。
