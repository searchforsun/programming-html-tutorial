# 教程目录 README 模板

在 `<workspace>/courses/<slug>/README.md` 生成**短文档**：重点置顶，全文建议 **80 行以内**。

**启动方式**写在 `<workspace>/courses/README.md`（见 `templates/courses-README.template.md`），单课 README **不要**重复 `npx serve` 说明。

## 结构（必须按此顺序）

### 1. 标题

`# {meta.title}`

### 2. 指向课程中心（一行）

> 启动本地服务、打开课程选择页等说明见上级目录 [courses/README.md](../README.md)。

### 3. 「这门课是什么」（3–5 行）

版本、章数、三阶段一句、前置一句、官方文档链接、当前已生成章节概况。

### 4. 「Demo」（有则写，无则省略）

一条命令块 + 访问 URL + 链到 demo 内 README。

### 5. 「文件是干什么的」（小表，≤6 行）

| 文件 | 你要不要碰 | 说明 |

只列学习者关心的：`index.html`、`course.json`、`chapters/`（标注「不用」）、`theme.css`、`demos/`。  
**不要**在此节展开 meta 字段全集；**不要**写 assemble 命令、skill 路径或「改完 chapters 后执行…」。

### 6. 维护信息

**学员 README 不写本节。** 组装、UTF-8、Gate 等仅见技能包 `reference/delivery-review.md` 与 `reference/assembly.md`（Agent 执行）。

## 禁止

- 长目录树 ASCII 图占半页
- 单课 README 内写「三步开始学习」或 `cd courses/<slug> && npx serve`（已移至 `courses/README.md`）
- 与上级 README 重复的启动表格
- 在 `<workspace>/courses/<slug>/README.md` 中出现 `assemble-index.mjs`、本机绝对路径、或维护者工作流说明

## Agent 占位符

`{slug}` `{meta.title}` `{meta.version}` `{章节总数}` `{官方文档 URL}` `{demo 命令}` — 从 `course.json` 与已有 `demos/` 读取。
