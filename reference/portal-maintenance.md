# 课程中心（Portal）维护

多课工作区在 `<workspace>/courses/` 根目录提供**课程选择页**，与单课壳层（`templates/index.shell.html`）配合：学员从 portal 选课，课内顶栏「← 全部课程」返回。

---

## 文件位置

| 工作区路径 | 技能包模板 |
|------------|------------|
| `courses/index.html` | `templates/portal.index.html` |
| `courses/courses.json` | `templates/courses-catalog.template.json` |
| `courses/README.md` | `templates/courses-README.template.md` |

**首次启用**：若工作区尚无 portal，将上述模板复制到 `<workspace>/courses/`，并在 `courses.json` 注册课程；页面运行时 fetch 该 JSON，无需在 `index.html` 内嵌目录。

---

## courses.json 结构

见 [courses-catalog-schema.md](courses-catalog-schema.md)。每增一门课，在 `courses[]` 追加一条，`path` 通常为 `{slug}/index.html`。

---

## 与单课壳层的关系

| 能力 | 实现 |
|------|------|
| 返回课程中心 | 壳层 `#btn-portal` → 默认 `../index.html`；可覆写 `course.json` → `meta.portalHref` |
| 全局明暗主题 | `config/defaults.json` → `globalThemeKey`；壳层 `applyTheme` 读写，并迁移旧 `{slug}_theme` |
| 顶栏布局 | 三列 grid：左 portal 链、中居中 `.course-title`、右进度与操作 |
| Portal 顶栏 | 左对齐 `.portal-title` + 右侧主题按钮；与课内居中 `.course-title` 不同 |
| Portal 滚动 | 全宽 `.portal-scroll`（滚动条贴视口右缘）；内层 `.portal-main` 居中 `max-width: 900px` |
| 侧栏 | **无**「全部课程」项（仅顶栏返回，避免重复） |

改 portal 样式/脚本：编辑 `templates/portal.index.html` 中 **portal 布局 CSS** 与内联 JS；风格层由脚本同步：

```bash
node <skill-root>/scripts/sync-portal-shell.mjs
node <skill-root>/scripts/sync-courses-index.mjs <workspace>/courses/index.html
```

（`sync-portal-shell` 会调用 `build-style-sheets`，注入 shared / surfaces / 八风格包，并按 `defaults.json` 刷新风格菜单与 `UI_STYLE_IDS` 标记块。）

改壳层 portal 链、主题或 UI 风格交互：见 [shell-maintenance.md](shell-maintenance.md)、[shell-ui-styles.md](shell-ui-styles.md)。

---

## 启动约定

- 学员在 **`courses/` 根目录** `npx serve .`，**不要**只 serve `<slug>/` 子目录。
- 启动说明写在 **`courses/README.md`**，单课 `<slug>/README.md` 链到上级（见 [tutorial-readme-template.md](tutorial-readme-template.md)）。

---

## Agent 工作流补充

**工作流 A（初始化首门课）**：若 `<workspace>/courses/index.html` 不存在，从模板创建 portal 三文件；assemble 后把该课注册进 `courses.json`。

**新增后续课**：assemble 新课程 + 在 `courses/courses.json` 的 `courses[]` 追加条目即可。

**禁止**：在 portal 中引用外链 JS（主题逻辑已内联于 `index.html`）。
