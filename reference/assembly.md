# 教程站组装

使用 `templates/` + `scripts/assemble-index.mjs` 生成 `index.html`。壳逻辑以 `templates/shell.app.js` 为准，勿手写重复实现。

## 教程目录结构

```
courses/<slug>/
├── course.json
├── theme.css
├── welcome.partial.html
├── chapters/
│   └── <chapter-id>.html
├── quiz.partial.html     # 可选
├── README.md             # 课程说明（人工维护，不 assemble）
└── index.html            # assemble 生成
```

## 命令

在仓库根目录执行：

```bash
node scripts/assemble-index.mjs --dir courses/<slug>
node scripts/validate-tutorial.mjs --dir courses/<slug>
```

可选：从单文件 `index.html` 拆出源文件

```bash
node scripts/extract-from-index.mjs courses/<slug>/index.html
node scripts/assemble-index.mjs --dir courses/<slug>
```

## 模板占位符

| 占位符 | 来源 |
|--------|------|
| `{{TITLE}}` | `course.meta.title` |
| `{{SHELL_BASE_CSS}}` | `templates/shell.base.css` |
| `{{THEME_CSS}}` | `theme.css` |
| `{{WELCOME_HTML}}` | `welcome.partial.html` |
| `{{CHAPTERS_HTML}}` | `chapters/*.html` |
| `{{QUIZ_HTML}}` | `quiz.partial.html`（可选，缺则为空） |
| `{{COURSE_DATA_JSON}}` | `course.json` |
| `{{SHELL_APP_JS}}` | `templates/shell.app.js` |
| `{{TERM_PLATFORM_LINKS}}` | `config/term-platforms.json` |

## shell 版本

`meta.shellVersion` 与 `templates/SHELL_VERSION`、`assemble-index.mjs` 内常量一致。更新 `templates/` 后对所有教程重新 assemble。

## Agent 工作流

| 步骤 | 动作 |
|------|------|
| A | 写 `course.json`、`theme.css`、`welcome.partial.html`、`README.md` → assemble |
| B | 写 `chapters/<id>.html` → assemble |
| 交付前 | `validate-tutorial.mjs` |

另见 [theme-colors.md](theme-colors.md)、[phase-design-prompts.md](phase-design-prompts.md)、[chapter-blocks-policy.md](chapter-blocks-policy.md)。
