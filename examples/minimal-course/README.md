# Apache RocketMQ 入门到进阶

## 三步开始学习

```bash
cd courses/rocketmq
npx --yes serve .
```

在浏览器打开 **http://localhost:3000**（或终端提示的端口），进入 [index.html](index.html) 即可学习。

| 方式 | 说明 |
|------|------|
| **推荐** | 本地静态服务（`npx serve`），进度与主题可正常保存到 localStorage |
| **备选** | 直接双击 `index.html`（`file://`），部分浏览器可能限制 localStorage |

**学习入口**：[index.html](index.html)

## 这门课是什么

面向 **Apache RocketMQ 5.4.0** 的交互式 HTML 教程，共 **11 章**、**3 阶段**：消息模型与本地跑通 → 业务集成与可靠投递 → 集群高可用与生产治理。适合有 Java 与 Maven 基础、希望系统掌握消息中间件的开发者。

- 官方文档：[Quick Start](https://rocketmq.apache.org/docs/quickStart/01quickstart/)
- 当前状态：已生成 **1/11** 章正文（`basics-01-overview`），其余章为目录占位

## Demo

```bash
cd demos/basics-01-overview-arch-lab
docker compose up -d
docker exec rmq-broker sh mqadmin clusterList -n namesrv:9876
```

详见 [demos/basics-01-overview-arch-lab/README.md](demos/basics-01-overview-arch-lab/README.md)。

## 文件是干什么的

| 文件 | 你要不要碰 | 说明 |
|------|------------|------|
| `index.html` | 只打开阅读 | 浏览器入口（由脚本组装生成） |
| `course.json` | 一般不用 | 大纲、术语、测验元数据 |
| `chapters/` | 只读学习 | 各章 HTML 片段（生成后出现） |
| `theme.css` | 不用 | 本课主题色 |
| `demos/` | 按需运行 | 章节配套 Demo（生成后出现） |

<details>
<summary>维护信息（生成者与贡献者）</summary>

重新组装页面：

```bash
node .claude/skills/programming-html-tutorial/scripts/assemble-index.mjs --dir courses/rocketmq
node .claude/skills/programming-html-tutorial/scripts/validate-tutorial.mjs --dir courses/rocketmq
```

可配置项：

- `course.json` → `meta.version`：对齐官方稳定版
- `meta.hljsLanguages`：代码高亮语言列表
- `outline`：三阶段章节结构
- `terms`：术语 AI 探索提示词
- `theme.css`：`--accent` 等主题变量

</details>
