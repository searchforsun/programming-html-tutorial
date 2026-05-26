# COURSE_DATA 内嵌 JSON 结构

在 `index.html` 的 `<script id="course-data" type="application/json">` 中放置，页面加载时 `JSON.parse` 赋给 `window.COURSE_DATA`。

```json
{
  "meta": {
    "title": "{领域} 入门到进阶",
    "slug": "{kebab-case}",
    "domain": "{领域显示名}",
    "themePreset": "{kebab-case}",
    "version": "{当前稳定版}",
    "generatedAt": "2026-05-17",
    "officialDocs": "{官方文档 URL}",
    "selectionPromptEnabled": true,
    "selectionPromptTemplate": "我在学习{domain}，请解释一下「{selection}」，并结合示例说明。",
    "domainType": "B",
    "learningNotes": {
      "assumptions": ["假设有 Java 17 基础"],
      "phaseGoals": {
        "basics": "能创建并理解最小 Spring Boot 应用",
        "practice": "能完成典型 REST 与数据访问",
        "advanced": "理解自动配置与生产观测要点"
      }
    }
  },
  "outline": [
    {
      "phaseId": "basics",
      "phaseTitle": "起步：自动配置与 Web 骨架",
      "phaseGoal": "能创建并理解最小 Spring Boot 应用",
      "chapters": [
        {
          "id": "basics-01-env",
          "title": "环境搭建与第一个应用",
          "sections": ["JDK 与构建工具", "创建项目", "启动与调试"]
        }
      ]
    },
    {
      "phaseId": "practice",
      "phaseTitle": "实践",
      "chapters": []
    },
    {
      "phaseId": "advanced",
      "phaseTitle": "进阶",
      "chapters": []
    }
  ],
  "chapters": {
    "basics-01-env": {
      "title": "环境搭建与第一个应用",
      "summary": "一句话摘要",
      "html": ""
    }
  },
  "terms": {
    "ioc": {
      "label": "控制反转 IoC",
      "prompt": "我在学习 Spring Boot，已了解 Java 基础。请用通俗语言解释 IoC 容器是什么、解决了什么问题，并给一个最小 Java 配置示例与常见误区。"
    }
  },
  "quizzes": {
    "basics-01-quiz": {
      "chapterId": "basics-01-env",
      "questions": [
        {
          "id": "q1",
          "type": "single",
          "stem": "Spring Boot 默认内嵌的 Web 容器是？",
          "options": ["Tomcat", "Jetty", "Undertow", "Netty"],
          "answer": "Tomcat",
          "hint": "Starter 默认依赖"
        }
      ]
    }
  }
}
```

## 字段说明

| 路径 | 说明 |
|------|------|
| `meta.slug` | localStorage 前缀、目录名 |
| `meta.themePreset` | 与本课 `[data-theme-preset]` CSS 一致，通常等于 `slug`；见 [theme-colors.md](theme-colors.md) |
| `meta.domainType` | 可选，`A`–`F`，见 [phase-design-prompts.md](phase-design-prompts.md) |
| `meta.learningNotes` | 可选，`assumptions`、`phaseGoals`；欢迎页可展示摘要 |
| `meta.selectionPromptEnabled` | 可选，默认 `true`；`false` 关闭正文选中「AI 解释」 |
| `meta.selectionPromptTemplate` | 可选；占位符 `{domain}` `{selection}` `{title}`；默认见 `shell.app.js` |
| `meta.portalHref` | 可选；返回课程中心 URL，默认 `../index.html` |
| `outline[].phaseGoal` | 可选，本阶段结束时可检验的能力一句话 |
| `outline[].chapters[].id` | 全局唯一，建议 `{phaseId}-{序号}-{简称}` |
| `chapters[id].html` | 可选：缓存章节 innerHTML，便于导出；与 DOM 二选一为主源 |
| `terms` | 全课共享 id → `{ label, prompt }`；密度与写法见 [terms-policy.md](terms-policy.md) |

## 渲染侧栏与欢迎页表

- **侧栏**：`renderSidebar()` 生成 `details.phase` → `summary`（仅 `phaseTitle`）→ `ul` → `a[href="#ch-{id}"]`；完成 `.done`、当前章 `.active-ch`。
- **欢迎页表**：`renderOutlineSummary()` 读 `outline`；`outline-table-wrap` + 可见 `thead`；阶段列 `rowspan`（`outline-phase-inner`）；章节列含 `outline-ch-index`；小节为 `outline-section-list`。
