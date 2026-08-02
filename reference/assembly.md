# 教程站组装

使用 `templates/` + `scripts/assemble-index.mjs` 生成 `index.html`。壳逻辑以 `templates/shell.app.js` 为准，勿手写重复实现。

课程根目录与文件树：[SKILL.md](../SKILL.md) §课程路径、§目录结构（**不在本文重复**）。交互脚本内联在 `welcome.partial.html`，**无** `assets/` 目录。

## Gate 与日常组装命令

assemble / validate / review-chapter 见 [delivery-review.md](delivery-review.md)（**不在本文重复**）。

### 逆向拆分（维护用）

从单文件 `index.html` 拆出源文件：

```bash
node <skill-root>/scripts/extract-from-index.mjs <workspace>/courses/<slug>/index.html
node <skill-root>/scripts/assemble-index.mjs --dir <workspace>/courses/<slug>
```

单章正文恢复（`chapters/<id>.html` 损坏但 `index.html` 仍完好时，UTF-8 安全）：

```bash
node <skill-root>/scripts/extract-chapter-from-index.mjs --dir <workspace>/courses/<slug> --chapter <chapter-id>
node <skill-root>/scripts/assemble-index.mjs --dir <workspace>/courses/<slug>
```

## 模板占位符

| 占位符 | 来源 |
|--------|------|
| `{{TITLE}}` | `course.meta.title` |
| `{{SHELL_SHARED_CSS}}` | `templates/shell.shared.css` |
| `{{SHELL_BASE_CSS}}` | `templates/shell.base.css` |
| `{{THEME_CSS}}` | `theme.css`（**仅 accent**）+ 可选 `enrichment.base.css` |
| `{{SHELL_SURFACES_CSS}}` | `templates/shell.surfaces.css`（圆角 + 卡片 hover） |
| `{{SHELL_STYLE_SHEETS_HTML}}` | `templates/shell.style-sheets.html`（由 build 生成，八风格互斥包） |
| `{{WELCOME_HTML}}` | `welcome.partial.html` |
| `{{CHAPTERS_HTML}}` | `chapters/*.html` |
| `{{QUIZ_HTML}}` | `quiz.partial.html`（缺则为空；默认每章应有内容） |
| enrichment 样式 | `templates/enrichment.base.css` 追加进 `{{THEME_CSS}}`（`meta.useEnrichment !== false`） |
| `{{COURSE_DATA_JSON}}` | `course.json` |
| `{{SHELL_APP_JS}}` | `templates/shell.app.js` |
| `{{TERM_PLATFORM_LINKS}}` | `config/term-platforms.json` |

UI 风格源文件与 build 流程见 [shell-ui-styles.md](shell-ui-styles.md)。

## shell 版本

壳版本维护：`config/defaults.json` → `shellVersion`（assemble 写入 `meta.shellVersion`；validate 对照此值）。维护时须与 `templates/SHELL_VERSION` 同步。更新 `templates/` 后对用户工作目录下的课程重新 assemble。
