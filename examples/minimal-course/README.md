# 示例 · 最小教程

## 三步开始预览

```bash
cd examples/minimal-course
npx --yes serve .
```

浏览器打开终端中的地址（一般为 **http://localhost:3000/**）。

| 方式 | 做法 | 注意 |
|------|------|------|
| **推荐** | 上表命令 + 浏览器访问 | 进度、主题可保存在 localStorage |
| 备选 | 双击 [index.html](index.html) | 无需命令行；部分能力在 `file://` 下可能受限 |

**学习入口**：[index.html](index.html)（请优先用本地静态服务打开）。

---

## 这门课是什么

本目录**不是**真实技术课程，而是 `programming-html-tutorial` 技能的**最小集成样例**。

- **Shell 版本**：2.0.0（与 `templates/` 一致）
- **domainType**：`E`（窄专题）— 章节可不写 Mermaid / Demo 块
- **大纲**：3 阶段、5 章（仅第 1 章有正文与测验，其余章仅侧栏占位）
- **用途**：验证组装脚本、侧栏导航、进度条、术语弹窗、章节测验联动

---

## 文件是干什么的

| 文件 / 目录 | 你要不要碰 | 说明 |
|-------------|------------|------|
| **index.html** | 只打开 | assemble 生成，勿手改 |
| **course.json** | 改大纲/测验元数据时 | 课程数据与 `quizzes` |
| **welcome.partial.html** | 改首页文案时 | 欢迎区 HTML 片段 |
| **chapters/*.html** | 改正文时 | 单章内容片段 |
| **quiz.partial.html** | 改测验时 | 注入 `#quiz-panel`，`data-chapter` 对齐章节 id |
| **theme.css** | 改主题色时 | `themePreset` 对应选择器 |
| **README.md** | 阅读 | 本说明 |

---

<details>
<summary>维护：改源文件后如何重新生成 index.html</summary>

在仓库根目录执行：

```bash
node scripts/assemble-index.mjs --dir examples/minimal-course
node scripts/validate-tutorial.mjs --dir examples/minimal-course
```

</details>

<details>
<summary>维护：与正式教程目录的差异</summary>

- 正式课程路径：`courses/<slug>/`（如 `courses/spring-boot/`）
- 本示例路径：`examples/minimal-course/`
- 二者目录结构相同；assemble / validate 命令仅 `--dir` 不同

</details>
