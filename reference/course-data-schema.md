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
| `outline[].phaseGoal` | 可选，本阶段结束时可检验的能力一句话 |
| `outline[].chapters[].id` | 全局唯一，建议 `{phaseId}-{序号}-{简称}` |
| `chapters[id].html` | 可选：缓存章节 innerHTML，便于导出；与 DOM 二选一为主源 |
| `terms` | 全课程术语表，多章共享 id |

## 渲染侧栏

遍历 `outline` → 阶段标题 + `ul.chapter-list` → 每章 `a[href="#ch-{id}"]`，未完成加 `.pending`，完成加 `.done`。
