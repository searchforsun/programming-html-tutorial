# scripts 索引

Node.js 18+。`<skill-root>` = 本技能包根目录。

## 日常（Agent / 维护者）

| 脚本 | 用途 |
|------|------|
| `assemble-index.mjs --dir <courses>/<slug>` | 生成单课 `index.html`（含 build-style-sheets + Gate 0 完整性校验） |
| `validate-tutorial.mjs --dir <courses>/<slug>` | Gate 1 校验（含术语引用顺序检测） |
| `review-chapter.mjs` | Gate 2 章节质量审查（含友好化错误输出） |
| `sync-portal-shell.mjs` | 更新 `templates/portal.index.html` 的 shared/surfaces/风格包 |
| `sync-courses-index.mjs <workspace>/courses/index.html` | portal 模板 → 工作区课程中心（目录仅维护 `courses.json`） |
| `build-style-sheets.mjs` | presets + pages → `templates/styles/*.css` + `shell.style-sheets.html` |
| `lib/ui-styles.mjs` | 从 `defaults.json` 生成风格菜单 / `UI_STYLE_IDS`（assemble & portal sync 共用） |

## 扩展工具（v2.10.1+）

| 脚本 | 用途 | 阶段 |
|------|------|------|
| `fix-encoding.mjs --dir <slug> [--dry-run] [--all]` | 扫描并修复源文件 BOM/编码异常 | P1 |
| `generate-chapter-skeleton.mjs --dir <slug> --chapter <id> [--all]` | 根据 course.json 大纲生成章节 HTML 骨架 | P2 |
| `sync-ui-style-config.mjs [--fix] [--default-ui-style <id>]` | 校验/同步 defaults.json ↔ portal 的 UI 风格配置 | P2 |
| `check-term-prompts.mjs --dir <slug> [--json]` | 术语 prompt 4 维度质量审查 | P3 |
| `verify-docs.mjs` | 文档与代码一致性交叉校验（7 项检查） | P4 |
| `package-offline.mjs --dir <slug> [--no-zip] [--out <dir>]` | 下载 CDN 资源，生成离线 ZIP 包 | P7 |
| `lib/build-cache.mjs` | 增量构建 mtime 三级缓存（assemble 内置） | P6 |
| `lib/error-help.mjs` | 错误信息友好化引擎（validate/review 内置） | P6 |
| `lib/*.test.mjs`（5 个文件） | 125 条单元测试（node:test，零外部依赖） | P2 |

**单元测试**：`npm test` 或 `node --test scripts/lib/*.test.mjs`。

**CI**：`.github/workflows/ci.yml` 在 push/PR 时运行语法检查 → 单元测试 → 文档验证。

**改壳层 CSS 后推荐顺序**：bump `shellVersion` → `build-style-sheets`（assemble 内含）→ `sync-portal-shell` → `sync-courses-index` → 对各 slug `assemble-index`。

**增删 UI 风格 id**：只改 `config/defaults.json` → `uiStyles` 与风格 CSS 源文件；菜单与 `UI_STYLE_IDS` 由 assemble / sync 自动生成。详见 [reference/shell-ui-styles.md §风格注册点](../reference/shell-ui-styles.md#风格注册点增删风格时)。

## 逆向 / 修复

| 脚本 | 用途 |
|------|------|
| `extract-from-index.mjs` | 从 `index.html` 拆回 partial |
| `extract-chapter-from-index.mjs` | 单章从 index 恢复 |
| `fix-invalid-html-tags.mjs` | 修复非法标签 |
| `bootstrap-templates.mjs` | 初始化模板文件 |
