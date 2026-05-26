# 领域自适应分阶段提示词

工作流 A 第 4 步**必须**先执行本文件，再写入 `course.json` 的 `outline`。

## 硬约束（不可违反）

| 保留 | 可适配 |
|------|--------|
| 恰好 3 个阶段，`phaseId` 为 `basics` / `practice` / `advanced` | `phaseTitle`、`phaseGoal`、各章标题与 sections |
| 默认每阶段 3–6 章，每章 2–5 节 | 窄专题（分型 E）经用户确认可 2–3 章/阶段 |
| 章节 id：`{phaseId}-{两位序号}-{kebab简称}` | 章节主题完全按领域设计 |

**禁止**：三阶段 `phaseTitle` 全部使用「基础 / 实践 / 进阶」且无领域含义。

---

## 主提示词（内部编排，不展示给用户）

将 `{domain}`、`{level}`、`{goal}`、`{webSearchSummary}` 替换为实际值后执行：

```text
【角色】你是该技术领域的课程架构师，熟悉官方学习路径、认证大纲与社区共识路线。

【输入】
- 技术领域：{domain}
- 用户基础（可选）：{level: 零基础|有编程基础|有同类栈经验|仅复习|未说明}
- 学习目标（可选）：{goal: 入门|求职|项目上手|原理深入|考证|未说明}
- WebSearch 摘要：{webSearchSummary}

【任务】为静态 HTML 教程设计三阶段大纲。UI 固定三阶段 id：basics / practice / advanced，但 phaseTitle 与章节必须贴合 {domain}。

【步骤】
1. 判定领域类型（只选一类主型，可注副型）：
   A 语言/运行时  B 框架/库  C 平台/中间件  D 运维/云原生  E 窄专题  F 横切能力
2. 从官方 Getting Started / Learn / 认证大纲提取学习脊线：必须先会 → 再做项目 → 再深入原理/生产/生态。
3. 为每个 phaseId 填写 phaseTitle、phaseGoal、chapters（默认 3–6 章，每章 sections 2–5 条）。
4. 自检：章间少重复；后章不依赖未铺垫的专有概念；practice 或 advanced 至少 1 章可对应 demo；basics 无纯生产级内容。
5. 仅输出下方 JSON schema，不要输出讲义正文。

【默认映射（仅当想不出更好标题时参考）】
- basics → 环境与核心模型
- practice → 典型应用与项目化
- advanced → 原理、性能、生产与生态

【输出 schema】
{
  "domainType": "B",
  "domainTypeReason": "一句话",
  "metaLearningNotes": {
    "assumptions": ["..."],
    "phaseGoals": {
      "basics": "...",
      "practice": "...",
      "advanced": "..."
    }
  },
  "outline": [
    {
      "phaseId": "basics",
      "phaseTitle": "...",
      "phaseGoal": "...",
      "chapters": [
        { "id": "basics-01-xxx", "title": "...", "sections": ["...", "..."] }
      ]
    },
    { "phaseId": "practice", "phaseTitle": "...", "phaseGoal": "...", "chapters": [] },
    { "phaseId": "advanced", "phaseTitle": "...", "phaseGoal": "...", "chapters": [] }
  ],
  "risks": ["可能过难/过浅的章节及建议"]
}
```

执行后：将 `outline` 写入 `COURSE_DATA.outline`；`domainType`、`metaLearningNotes` 写入 `meta`（见 [course-data-schema.md](course-data-schema.md)）。

---

## 领域分型子提示词

主提示词第 1 步判定类型后，**追加一条**对应子提示。

### A — 语言 / 运行时（Java、Go、Rust…）

```text
【分阶段侧重】
- basics：工具链、词法与类型、控制流、核心库、第一个可运行程序
- practice：常用标准库、包管理、小项目、测试与调试
- advanced：内存/并发(若有)、性能、生态互操作、生产要点
章名须具体（如「泛型与集合」），禁止空洞的「语法基础」。
```

### B — 框架 / 库（Spring Boot、React、Vue…）

```text
【分阶段侧重】
- basics：框架定位、最小应用、核心抽象（IoC/组件/路由等）、配置约定
- practice：典型业务流（CRUD/REST、数据访问、鉴权）、与宿主栈协作
- advanced：自动配置/渲染原理、扩展点、观测、多环境、消息/云集成
在 assumptions 写明宿主技能前提（如 Java 17、HTTP 基础）。
```

### C — 平台 / 中间件（Redis、Kafka、PostgreSQL…）

```text
【分阶段侧重】
- basics：角色边界、安装连接、核心模型与基本命令/API
- practice：典型场景（缓存/队列/事务）、客户端集成、常见故障
- advanced：集群/高可用、一致性、调优、安全、架构模式
集群/HA 不放 basics；practice 禁止纯命令罗列无场景。
```

### D — 运维 / 云原生（Docker、K8s、Terraform…）

```text
【分阶段侧重】
- basics：问题域、核心对象、本地最小环境、日常 80% 操作
- practice：多服务编排、CI、配置与密钥、排错流程
- advanced：生产架构、策略与安全、可靠性、GitOps/多集群(若适用)
每章含「操作 + 为何这样做」。
```

### E — 窄专题（正则、Git 分支、HTTP 状态码…）

```text
【分阶段侧重】范围收窄，每阶段可 2–3 章（须在 assumptions 注明「窄专题」）：
- basics：最小可用子集与常见误用
- practice：组合用法与 1–2 个真实场景
- advanced：边界、性能/安全、与其他工具链衔接
```

### F — 横切能力（单元测试、API 设计、性能调优…）

```text
【分阶段侧重】
- basics：原则、术语、本栈工具选型
- practice：对同一示例项目持续施加该能力（测试/压测/重构）
- advanced：度量、门禁、团队流程、反模式
practice 各章应围绕同一示例项目递进。
```

---

## 用户基础适配（可选片段）

拼入主提示词【输入】之后：

```text
【用户基础 = 零基础】basics 增加环境与术语章；practice 项目宜小；advanced 避免未铺垫的源码剖析。
【用户基础 = 有编程基础】压缩 basics 语法；提早 idiomatic 用法与工具链。
【用户基础 = 有同类栈经验】basics 做差异对照；practice 直接上典型项目模式。
【用户基础 = 仅复习】basics 速览与易错点；advanced 加重生产与新版本特性。
```

---

## 审阅闸门文案（展示给用户）

替换 `{domain}`、`{t1}`、`{t2}`、`{t3}`、`{assumptions}`：

```text
已为「{domain}」生成三阶段大纲：
{t1} → {t2} → {t3}

学习假设：{assumptions}

请审阅左侧目录。可回复：
- 确认
- 调整某阶段章数或顺序
- 增删某章 / 修改难度侧重
- 补充你的基础与目标（便于重排）
```

---

## 输出示例（phaseTitle 领域化）

**Spring Boot（B）**

| phaseId | phaseTitle |
|---------|------------|
| basics | 起步：自动配置与 Web 骨架 |
| practice | 业务开发：数据、安全与 API |
| advanced | 生产就绪：观测、部署与扩展 |

**Kubernetes（D）**

| phaseId | phaseTitle |
|---------|------------|
| basics | 集群认知与工作负载入门 |
| practice | 服务暴露、配置与排错 |
| advanced | 生产治理：策略、弹性与 GitOps |

**正则表达式（E）**

| phaseId | phaseTitle |
|---------|------------|
| basics | 元字符与匹配模式 |
| practice | 提取、替换与文本流水线 |
| advanced | 引擎差异、性能与可读性 |

---

写单章 HTML：按 [workflow-b-checklist.md](workflow-b-checklist.md) 执行；内部提示模板见 [chapter-authoring.md](chapter-authoring.md) **附录「工作流 B 内部提示」**。
