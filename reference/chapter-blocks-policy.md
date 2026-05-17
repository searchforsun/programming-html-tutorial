# 章节块策略

由 `config/defaults.json` + `course.meta.domainType` 决定每章 HTML **必须**包含的块。

## 默认必填块（`chapterBlocks`）

| 块 id | 选择器 | 说明 |
|-------|--------|------|
| concept | `.concept` | 概念 |
| official-links | `.official-links` | 官方链接 |
| code-block | `.code-block` | 代码示例 |
| mermaid-wrap | `.mermaid-wrap` | 架构图 |
| steps | `.steps` | 实操步骤 |
| demo-box | `.demo-box` | Demo 目录说明 |
| resources | `.resources` | 延伸资源 |

## 按 `domainType` 放宽

| domainType | 可选（可不写） |
|------------|----------------|
| E 窄专题 | `mermaid-wrap`, `demo-box` |
| F 横切能力 | `demo-box` |
| A–D | 无（全部必填） |

Spring Boot 等为 **B（框架）**：全部块必填。

## 校验

```bash
node scripts/validate-tutorial.mjs --dir courses/<slug>
```

对已存在的 `chapters/<id>.html` 检查缺失块；未生成的章仅 warning（`--strict` 时为 error）。

实现：`scripts/lib/chapter-blocks.mjs`。
