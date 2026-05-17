# 示例教程

本目录存放**可独立预览**的教程样例，用于验证 `assemble-index.mjs` / `validate-tutorial.mjs` 与 Shell 能力。

| 目录 | 说明 |
|------|------|
| [minimal-course/](minimal-course/) | 最小可运行样例：`course.json` + 欢迎页 + 1 章正文 + 1 套测验 |

在仓库根目录重新组装示例：

```bash
node scripts/assemble-index.mjs --dir examples/minimal-course
node scripts/validate-tutorial.mjs --dir examples/minimal-course
```

或使用：`npm run assemble:example` / `npm run validate:example`。

正式课程请放在 [courses/](../courses/) 下，结构与本示例相同。
