# Gate 3：章节语义评审（Agent）

在 **Gate 1**（`validate-tutorial`）与 **Gate 2**（`review-chapter`）通过后执行。输出 JSON，**不替代**脚本校验。

## 何时执行

- 工作流 **B / B-修订** 生成或修改 `chapters/*.html`、`quiz.partial.html` 后
- 告知用户「已生成」之前
- 若 `mustFixBeforeDelivery: true`，修复后重跑 Gate 1～2 与本清单

## 检查维度

1. **大纲覆盖**：每个 `outline.sections[]` 是否讲透、有无跑题或大面积重复。**不以字数衡量概念章**，看信息密度是否配得上大纲。
2. **先读后做**：概念 → 图/表 → 代码 → 步骤 → Demo → **章节测验** 顺序是否合理。
3. **可检验**：学习目标能否用**本章测验**（单选/多选/填空）+ Demo + 自检清单验证。
4. **内容是否空泛**：是否堆砌定义无场景、无图无表无对比；能否用一句话说明「学完能做什么」。
5. **准确性**：技术表述、版本号、官方链接描述是否与 `course.json.meta` 一致。
6. **反例与取舍**（概念/架构章）：是否含误区、双栏对比或场景决策表（至少其一）；各知识 `h3` 是否具备足够呈现形式（建议每节至少 2 种：图/表/代码/enrichment 等）。
7. **教学法检查项（7 项）**（见 [chapter-authoring.md](chapter-authoring.md) §教学法检查项）：动机、章末结论覆盖各节、微自检、判断练习、测验是否偏场景而非纯识记。
8. **章间一致**（多章时）：术语、示例线、命名是否与前后章冲突；跨章链接是否为 `outline.title` + `#ch-{id}`（见 [chapter-authoring.md](chapter-authoring.md) §跨章引用）。
9. **术语拓展**：按 [terms-policy.md](terms-policy.md) 与 Gate 2；`prompt` 是否含本课示例与误区，而非空泛定义。

## 输出格式

```json
{
  "chapterId": "<id>",
  "mustFixBeforeDelivery": false,
  "scores": {
    "outlineCoverage": 4,
    "readability": 4,
    "verifiability": 5,
    "accuracy": 5
  },
  "errors": [],
  "suggestions": ["可选改进一句"]
}
```

| 字段 | 说明 |
|------|------|
| `mustFixBeforeDelivery` | `true` 时必须改稿并重跑 Gate 1～2 |
| `errors` | 事实错误、大纲遗漏、测验无法覆盖正文等 |
| `suggestions` | 可选优化，可写入交付摘要 |

## 与 Gate 2 的分工

| Gate 2（脚本） | Gate 3（Agent） |
|----------------|-----------------|
| 测验是否存在、题型齐全 | 题目是否切中正文 |
| h3 与大纲标题模糊匹配 | 每节是否讲透 |
| 非法标签、h5 位置 | 表述是否准确、是否空泛 |
| 不限字数 | 信息密度、教学节奏 |

## 返工上限

对同一章自动返工建议 **最多 2 轮**（Gate 1～3 循环），避免死循环。
