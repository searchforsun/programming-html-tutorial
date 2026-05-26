# 交互式课程

静态 HTML 教程集合：分阶段大纲、章节正文、测验与 Demo 实验。从**课程中心**选择课程进入学习。

## 启动方式

在 **`courses/` 目录**启动本地静态服务（不要只 serve 单个课程子目录，否则无法打开课程选择页）：

```powershell
cd courses
npx --yes serve .
```

浏览器打开终端提示的地址（通常为 **http://localhost:3000**），进入课程选择页即可。

| 方式 | 说明 |
|------|------|
| **推荐** | 在 `courses/` 根目录运行 `npx serve`，进度与明暗主题可正常保存 |
| **备选** | 直接双击 `courses/index.html`（`file://`），部分浏览器可能限制 localStorage |

### PowerShell 注意

PowerShell 不支持 `cd xxx && npx serve`，请分两步执行，或使用：

```powershell
Set-Location courses; npx --yes serve .
```

指定端口示例：

```powershell
Set-Location courses; npx --yes serve . -l 3456
```

## 目录结构

```text
courses/
├── index.html          # 课程选择页（含主题切换脚本）
├── courses.json        # 课程目录（新增课程在此注册）
├── README.md           # 本文件
└── <slug>/             # 单门课程
    ├── index.html      # 教程主页面（assemble 生成）
    ├── course.json     # 大纲、术语、测验元数据
    ├── chapters/       # 章节源稿
    ├── theme.css       # 课程主题色
    └── demos/          # 可选：章节配套练习
```

## 功能说明

- **课程中心**：`index.html` 展示所有已注册课程，显示学习进度，点击进入对应教程。
- **返回导航**：课程顶栏与侧栏均有「← 全部课程」，可回到选择页。
- **全局主题**：明暗偏好在所有课程间同步（键名 `study-self_theme`）；在任一页切换后，其他页面刷新即生效。

## 已注册课程

| 课程 | 目录 | 说明 |
|------|------|------|
| Java 分布式架构设计入门到进阶 | [java-distributed-architecture](./java-distributed-architecture/) | 15 章 · 3 阶段 · Spring Cloud 微服务 |

各课程详情见子目录 `README.md`。

## 新增课程

1. 在 `courses/<slug>/` 按教程技能包规范创建课程（`course.json`、章节等）。
2. 在 [`courses.json`](./courses.json) 的 `courses` 数组中追加条目（`slug`、`title`、`path`、`summary` 等）。
3. 从 `courses/` 根目录启动服务，在课程中心确认卡片与链接正常。
