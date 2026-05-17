# Apache Flink 流处理入门到进阶

## 三步开始学习

```bash
cd courses/apache-flink
npx --yes serve .
```

浏览器打开 **http://localhost:3000**（或终端提示的端口），学习入口为 [index.html](./index.html)。

| 方式 | 说明 |
|------|------|
| **推荐** | 本地静态服务（`npx serve`），进度与主题可正常保存 |
| 备选 | 直接双击 `index.html`（`file://`），部分浏览器可能限制 localStorage |

## 这门课是什么

面向 **Apache Flink 2.2 Stable**（生产可参考 **1.20 LTS**）的静态 HTML 交互教程，共 **15 章 / 三阶段**：流处理入门 → 状态与时间实战 → 容错与生产生态。前置：Java + Maven 基础。官方文档：[Flink Docs Stable](https://nightlies.apache.org/flink/flink-docs-stable/)。已生成正文：**第 1–3 章**（`basics-01-overview`～`basics-03-datastream`）。

## 文件是干什么的

| 文件 | 你要不要碰 | 说明 |
|------|------------|------|
| `index.html` | 只打开 | 浏览器入口（由脚本组装生成） |
| `course.json` | 一般不用 | 大纲、术语表、测验元数据 |
| `chapters/` | 阅读 | 各章 HTML 片段（生成后才有） |
| `theme.css` | 不用 | Flink 主题色 |
| `demos/` | 动手时 | 章节配套示例（生成后才有） |

<details>
<summary>维护信息（生成/更新教程时）</summary>

重新组装：

```bash
node programming-html-tutorial/scripts/assemble-index.mjs --dir courses/apache-flink
node programming-html-tutorial/scripts/validate-tutorial.mjs --dir courses/apache-flink
```

可配置项：

- `course.json` → `meta.hljsLanguages`：代码高亮语言
- `course.json` → `outline`：章节目录
- `theme.css`：`--accent` 等 CSS 变量
- `welcome.partial.html`：欢迎页内容

</details>
