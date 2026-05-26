# scripts 索引

Node.js 18+。`<skill-root>` = 本技能包根目录。

## 日常（Agent / 维护者）

| 脚本 | 用途 |
|------|------|
| `assemble-index.mjs --dir <courses>/<slug>` | 生成单课 `index.html`（含 build-style-sheets） |
| `validate-tutorial.mjs --dir <courses>/<slug>` | Gate 校验 |
| `review-chapter.mjs` | 章节质量审查 |
| `sync-portal-shell.mjs` | 更新 `templates/portal.index.html` 的 shared/surfaces/风格包 |
| `sync-courses-index.mjs <workspace>/courses/index.html` | portal 模板 → 工作区课程中心（目录仅维护 `courses.json`） |
| `build-style-sheets.mjs` | presets + pages → `templates/styles/*.css` + `shell.style-sheets.html` |
| `lib/ui-styles.mjs` | 从 `defaults.json` 生成风格菜单 / `UI_STYLE_IDS`（assemble & portal sync 共用） |

**改壳层 CSS 后推荐顺序**：bump `shellVersion` → `build-style-sheets`（assemble 内含）→ `sync-portal-shell` → `sync-courses-index` → 对各 slug `assemble-index`。

**增删 UI 风格 id**：只改 `config/defaults.json` → `uiStyles` 与风格 CSS 源文件；菜单与 `UI_STYLE_IDS` 由 assemble / sync 自动生成。详见 [reference/shell-ui-styles.md §风格注册点](../reference/shell-ui-styles.md#风格注册点增删风格时)。

## 逆向 / 修复

| 脚本 | 用途 |
|------|------|
| `extract-from-index.mjs` | 从 `index.html` 拆回 partial |
| `extract-chapter-from-index.mjs` | 单章从 index 恢复 |
| `fix-invalid-html-tags.mjs` | 修复非法标签 |
| `bootstrap-templates.mjs` | 初始化模板文件 |
