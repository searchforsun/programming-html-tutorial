# courses.json 目录结构

路径：`<workspace>/courses/courses.json`。课程选择页通过 `fetch('courses.json')` 动态加载目录；**勿**在 `index.html` 内重复嵌入课程 JSON。

```json
{
  "title": "课程中心",
  "globalThemeKey": "study-self_theme",
  "courses": [
    {
      "slug": "java-distributed-architecture",
      "title": "Java 分布式架构设计入门到进阶",
      "domain": "Java 分布式架构设计",
      "summary": "一句话课程简介，展示在卡片上。",
      "path": "java-distributed-architecture/index.html",
      "themePreset": "java-distributed-architecture",
      "accent": { "light": "#2e7d32", "dark": "#66bb6a" },
      "stats": { "phases": 3, "chapters": 15, "publishedChapters": 7 },
      "tags": ["Java", "Spring Cloud"]
    }
  ]
}
```

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 门户标题（页面 `<title>` 与顶栏） |
| `globalThemeKey` | 否 | 见 `config/defaults.json`，与壳层一致 |
| `courses[].slug` | 是 | 与 `course.json` → `meta.slug` 一致；用于读取 `{slug}_completed` 进度 |
| `courses[].title` | 是 | 卡片主标题 |
| `courses[].domain` | 推荐 | 卡片领域副标题 |
| `courses[].summary` | 推荐 | 卡片摘要（约 3 行截断） |
| `courses[].path` | 是 | 相对 `courses/` 的入口 HTML |
| `courses[].accent` | 否 | 卡片强调色 `{ light, dark }`；缺省用 portal 默认 `--accent` |
| `courses[].stats` | 推荐 | `phases`、`chapters`、`publishedChapters` |
| `courses[].tags` | 否 | 字符串数组，卡片标签 |

`accent.light` / `dark` 取值见 [theme-colors.md](theme-colors.md)。
