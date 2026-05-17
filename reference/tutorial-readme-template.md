# 教程目录 README 模板

在 `courses/<slug>/README.md` 生成**短文档**：重点置顶，全文建议 **80 行以内**。

## 结构（必须按此顺序）

### 1. 标题

`# {meta.title}`

### 2. 「三步开始学习」（第一节，最重要）

- 一条 `cd` + 一条启动命令（优先 `npx --yes serve .`）
- 写明浏览器打开的 URL（如 localhost:3000）
- **表格两行**：推荐（本地服务）vs 备选（双击 index.html + 进度可能丢失）
- 一行：**学习入口** = `index.html`（相对链接）

### 3. 「这门课是什么」（3–5 行）

版本、章数、三阶段一句、前置一句、官方文档链接、当前已生成章节概况。

### 4. 「Demo」（有则写，无则省略）

一条命令块 + 访问 URL + 链到 demo 内 README。

### 5. 「文件是干什么的」（小表，≤6 行）

| 文件 | 你要不要碰 | 说明 |

只列学习者关心的：`index.html`、`course.json`、`chapters/`、`theme.css`、`demos/`。  
**不要**在此节展开 meta 字段全集。

### 6. 维护信息（用 `<details>` 折叠）

- 重新 assemble 命令
- 可配置项 3–5 条 bullet 即可

## 禁止

- 长目录树 ASCII 图占半页
- 可配置项大表放在正文前部
- 与「三步开始」重复的「快速链接」章节

## Agent 占位符

`{slug}` `{meta.title}` `{meta.version}` `{章节总数}` `{官方文档 URL}` `{demo 命令}` — 从 `course.json` 与已有 `demos/` 读取。
