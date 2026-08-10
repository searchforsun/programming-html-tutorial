# DECISION_LOG.md

> `programming-html-tutorial` 重大技术决策记录（按时间倒序）

---

## 2025-07 — P4 迭代：文档即代码 + CI 自动化

### DL-020: GitHub Actions CI 集成（`node:test` + verify-docs）

- **背景**：项目无 CI 流水线，代码风格退化、文档不同步、回归只能在本地手工检查。
- **方案**：创建 `.github/workflows/ci.yml`，对 `push` 和 `pull_request` 到 `main` 分支触发。矩阵测试 Node.js 18/20/22。步骤：(1) 语法检查所有 `scripts/*.mjs` 和 `scripts/lib/*.mjs`；(2) `npm test`（`node --test scripts/lib/*.test.mjs`，125 条用例）；(3) `node scripts/verify-docs.mjs` 文档即代码一致性验证。
- **备选方案**：使用 GitHub Actions 市场中的现成 Node CI Action。被否决：社区 Action 可能引入不必要的权限和依赖，手写工作流更透明可控。
- **影响范围**：`.github/workflows/ci.yml`。

### DL-019: 文档即代码验证（`verify-docs.mjs`）

- **背景**：Markdown 文档中的脚本命令、文件路径引用、npm 脚本表格可能与代码实际不一致，且容易随迭代漂移。
- **方案**：创建 `scripts/verify-docs.mjs`，7 项检查：(1) ARCHITECTURE.md §11 npm 脚本表格 ↔ `package.json` scripts；(2) 文档 shell 代码块命令 ↔ 脚本 `--help` 参数；(3) SKILL.md 引用的 `reference/*.md` 文件存在性；(4) DECISION_LOG.md 引用的文件路径存在性（跳过 glob 通配符）；(5) README.md 脚本命令 ↔ 实际文件；(6) ARCHITECTURE.md §10 依赖图中脚本/库文件存在性；(7) 配置字段引用（如 `cdn.base.*`）实际存在。不一致以 `process.exit(1)` 退出。
- **备选方案**：使用 markdownlint 或 remark-lint 插件。被否决：通用 linter 无法验证脚本参数、npm 脚本列表、文件引用等特定领域规则，自建校验器更精准。
- **影响范围**：`scripts/verify-docs.mjs`。同时发现并修复 `package.json` 中过期的 jest 测试脚本（改为 `node:test`）。

---

## 2025-07 — P3 迭代：CDN 统一管理 + Shell JS 按需分割 + 术语质量审查

### DL-018: CDN URL 集中管理（`config/defaults.json` → `cdn.base`）

- **背景**：`index.shell.html` 和 `shell.app.js`（`loadHljsScripts`）中各有 CDN 硬编码 URL。版本升级需改多处，切换国内镜像更是灾难。
- **方案**：在 `config/defaults.json` 中新增 `cdn.base` 对象，三个键：`highlightJs`、`mermaid`、`fonts`。模板占位符化为 `{{CDN_HLJS_BASE}}`、`{{CDN_MERMAID_BASE}}`、`{{CDN_FONTS_BASE}}`。`loadHljsScripts` 接收入参 `cdnHljsBase`。
- **备选方案**：继续硬编码 URL，仅将版本号集中到配置。被否决：版本升级后仍需全局搜索替换 BASE URL。
- **影响范围**：`config/defaults.json`、`templates/index.shell.html`、`scripts/assemble-index.mjs`。

### DL-017: Shell JS 按需分割（`loadOptionalModules`）

- **背景**：`shell.app.js` 体积大，其中 Mermaid 全屏（~220 行）和划词 AI 解释（~125 行）两项功能在简单教程中可能完全用不到，却始终加载。
- **方案**：提取为独立文件 `templates/shell.mermaid-fullscreen.js` 和 `templates/shell.selection-prompt.js`。`assemble-index.mjs` → `loadOptionalModules()` 检测章节 HTML 中是否有 `.mermaid-wrap`（决定注入 Mermaid 模块），以及 `course.meta.selectionPromptEnabled`（决定注入划词模块）。
- **备选方案**：Webpack/Rollup tree-shaking。被否决：引入构建工具链太重，与静态 HTML 定位冲突。
- **影响范围**：`templates/shell.mermaid-fullscreen.js`、`templates/shell.selection-prompt.js`、`templates/index.shell.html`、`scripts/assemble-index.mjs`。

### DL-016: 术语 prompt 质量静态审查（`check-term-prompts.mjs`）

- **背景**：Gate 2 仅检查术语密度，不检查 prompt 内容质量。实际发现大量术语 prompt 缺乏示例、误区、领域上下文。
- **方案**：新增独立脚本 `scripts/check-term-prompts.mjs`，4 维度评分（长度、关键词覆盖、上下文关联、结构性），输出表格或 JSON。
- **备选方案**：扩展 `review-chapter.mjs` 内嵌检查。被否决：术语审查与章节审查职责不同（术语是全局的，章节是 per-chapter），合在一起会增加 `review-chapter` 复杂度，且术语审查需要可选运行。
- **影响范围**：`scripts/check-term-prompts.mjs`、`config/chapter-quality.json`（增加 `terms.minPromptChars` 等字段）。

---

## 2025-07 — P2 迭代：开发体验 + 单元测试

### DL-015: 选择 `node:test` 而非 Jest

- **背景**：需要为 `scripts/lib/` 模块引入单元测试，降低回归风险。
- **方案**：使用 Node.js 18+ 内置的 `node:test` 模块。零外部依赖，语法类 Jest（`describe`/`it`），已有 `ui-styles.test.mjs` 作为先例。
- **备选方案**：Jest。被否决：Jest 需要额外依赖（`jest`、`@babel/preset-env`、`babel-jest`），与项目"零依赖构建"哲学冲突，且 ESM 支持配置复杂。
- **影响范围**：`scripts/lib/*.test.mjs`（5 个文件，125 条用例）。

### DL-014: UI 风格配置同步工具（`sync-ui-style-config.mjs`）

- **背景**：新增 UI 风格需手动修改 `defaults.json`、`shell.app.js`、`portal.index.html` 三处，标记注释 `<!-- ui-style-config:start -->` 容易因手误损坏。
- **方案**：创建 `sync-ui-style-config.mjs`，以 `config/defaults.json` 为唯一真源，检查与 `portal.index.html` 标记块的一致性，`--fix` 调用 `lib/ui-styles.mjs` 渲染函数重写全部标记区间。
- **备选方案**：在 assemble 时动态生成 portal HTML。被否决：portal 是课程中心页，独立于单课 assemble 流程，且需要静态部署。
- **影响范围**：`scripts/sync-ui-style-config.mjs`。

### DL-013: 章节骨架生成器（`generate-chapter-skeleton.mjs`）

- **背景**：作者需手动计算动手步骤数、判断题数，确保与大纲节数匹配，并记住所有必填 DOM 块（`notice-why-learn`、`notice-outcome`、`chapter-conclusions-block`、`learn-review-block`、`chapter-practice`、`official-links`、`resources`）。经常遗漏导致 Gate 2 驳回。
- **方案**：创建 `scripts/generate-chapter-skeleton.mjs`，输入 `course.json` 和 `chapterId`，自动生成符合 Gate 2 规则的 HTML 骨架。步骤数自动推导：`ceil(sections × 0.6)` 夹在 3–8 之间；判断题数：≥5 节 2 道，否则 1 道。
- **备选方案**：VS Code 代码片段。被否决：片段无法根据大纲内容动态计算步骤数和判断题数。
- **影响范围**：`scripts/generate-chapter-skeleton.mjs`。

---

## 2025-07 — P1 迭代：工程健壮性基础

### DL-012: Gate 0 产物完整性校验（`verifyAssembledHtml`）

- **背景**：`assemble-index.mjs` 成功后不验证产物，缺失占位符替换会导致用户拿到半成品页面（如 `{{CHAPTERS_HTML}}` 残留）。
- **方案**：在 `assemble()` 末尾内置 `verifyAssembledHtml()`，检查 10 项关键 DOM 元素（`#toast`、`#sidebar`、`#quiz-panel` 等）和 18+ 个壳占位符残留。任何缺失 `process.exit(1)`。
- **备选方案**：将校验合并到 Gate 1 `validate-tutorial.mjs`。被否决：Gate 0 是 assemble 自身的原子性保证——生成失败不如不生成；Gate 1 是外部结构化校验，时机和语义不同。
- **影响范围**：`scripts/assemble-index.mjs`。顺带发现并修复 `lib/ui-styles.mjs` 遗漏 `{{GLOBAL_THEME_KEY}}` 替换的 Bug。

### DL-011: 编码一键修复工具（`fix-encoding.mjs`）

- **背景**：PowerShell `Out-File` 和部分 Windows 编辑器可能在 UTF-8 文件头部写入 BOM，导致 CSS 首字符异常和 `validate-tutorial` 报错。用户缺少快速修复手段。
- **方案**：创建 `scripts/fix-encoding.mjs`，自动去除所有源文件的 UTF-8 BOM，检测 `U+FFFD` 替换符和连续问号（报告但不会自动修复——已损坏无法恢复）。
- **备选方案**：在 assemble 时静默处理 BOM。被否决：BOM 是源文件污染问题，应在源文件层面修复而非在 build 时隐藏。
- **影响范围**：`scripts/fix-encoding.mjs`（独立脚本，零库依赖）。

### DL-010: 创建 `ARCHITECTURE.md`

- **背景**：项目设计决策分散在 `SKILL.md`、`reference/` 文档和脚本注释中，新成员上手成本高。
- **方案**：创建统一架构文档，含 Mermaid 依赖图、CSS 五层分层模型、JS 运行时模块交互、assemble 流程时序图、Gate 0-3 体系、决策记录和 npm 速查表。
- **影响范围**：`ARCHITECTURE.md`（333 行）。

---

## 历史决策（现有架构设计）

### DL-009: UI 风格菜单标记采用注释而非占位符

- **背景**：portal 模板中的 UI 风格配置块（12 套风格菜单按钮、bootstrap 脚本）需要精确替换，同时保留模板其余手写代码不变。
- **方案**：`<!-- ui-style-menu:start -->` / `<!-- ui-style-menu:end -->` 等注释标记，`applyPortalUiStyleFragments` 精确匹配并替换块内容。
- **备选方案**：`{{PLACEHOLDER}}` 占位符。被否决：占位符替换是一次性的，无法支持增量更新（修改 `defaults.json` 不需要重新生成整个 portal）。
- **影响范围**：`templates/portal.index.html`、`scripts/lib/ui-styles.mjs`。

### DL-008: 章节测验与正文同一次写入

- **背景**：测验 prompt 必须引用正文中的术语 ID 和概念，分离写入容易导致 ID 不同步。
- **方案**：工作流 B 中同次写入 `chapters/*.html` + `quiz.partial.html` + `course.json.quizzes`，Agent 在生成章节时同步更新测验数据。
- **备选方案**：先写章节，再单独触发生成测验。被否决：术语 ID 可能在两次生成间不一致（Agent 的随机性），导致测验 prompt 引用不存在的术语。
- **影响范围**：`reference/workflow-b-checklist.md`。

### DL-007: Assemble 时内联所有 CSS/JS（CDN 外部库除外）

- **背景**：教程站需要支持 `file://` 直接打开，零服务器部署。
- **方案**：所有壳层 CSS（shared/base/surfaces/presets/pages/theme/enrichment）和 JS（app/mermaid-fullscreen/selection-prompt）在 assemble 时内联到 `index.html`。仅 highlight.js 和 Mermaid 通过 CDN 加载。
- **备选方案**：外部 CSS/JS 文件 + 相对路径引用。被否决：`file://` 下浏览器可能因 CORS 或路径解析问题拒绝加载外部文件。
- **影响范围**：`scripts/assemble-index.mjs`、`templates/index.shell.html`。

### DL-006: CSS 变量与 `[data-ui-style]` 嵌套选择器

- **背景**：12 套 UI 风格需要不同的盒模型、字体栈、间距体系。
- **方案**：使用 `[data-ui-style="X"]` 属性选择器嵌套，确保每套风格规则完全隔离。结构风（compact/outline/soft）通过 `--accent` 变量继承课程主题色，但盒模型、字体、间距保持独立。
- **备选方案**：纯 CSS 自定义属性。被否决：12 套风格间的盒模型差异（如 `compact` 需要零圆角零间距，`soft` 需要大圆角宽间距）用变量覆盖链实现过于复杂，可维护性差。
- **影响范围**：`templates/shell.style-presets.css`、`templates/shell.style-pages.css`。

### DL-005: `data-ui-style` 属性 + `disabled` 互斥

- **背景**：需要在一份 HTML 中同时承载 12 套 UI 风格，但用户看到的只有一套。
- **方案**：`build-style-sheets.mjs` 将 `shell.style-presets.css` 拆为 12 个独立 `<style>` 标签，默认启用默认风格，其余 `disabled`。前端通过 `setAttribute('disabled', ...)` 切换。开发者工具中可看到所有风格规则。
- **备选方案**：类名切换（`<html class="ui-style-cyber">`）。被否决：类名切换时所有风格规则同时激活（优先级由选择器特异性决定），交叉覆盖问题难以调试。`disabled` 属性保证完全互斥。
- **影响范围**：`templates/shell.style-sheets.html`、`templates/shell.app.js`、`scripts/build-style-sheets.mjs`。

### DL-004: 源文件与产物分离（chapters → assemble → index.html）

- **背景**：需要 Agent 和人类作者编辑课程内容，但又需要一个单文件 HTML 产物。
- **方案**：内容编辑只改源文件（`course.json`、`theme.css`、`welcome.partial.html`、`quiz.partial.html`、`chapters/*.html`）。`index.html` 由 `assemble-index.mjs` 生成，不应手工编辑。同时提供 `extract-from-index.mjs` 和 `extract-chapter-from-index.mjs` 逆向恢复。
- **备选方案**：直接编辑 `index.html`。被否决：数千行内联 CSS/JS 与内容混在一起，编辑时极易误改壳层代码。
- **影响范围**：`scripts/assemble-index.mjs`、`scripts/extract-from-index.mjs`、`scripts/extract-chapter-from-index.mjs`。

### DL-003: CSS 五层分层模型

- **背景**：壳层 CSS 需要支持全局基础样式、12 套 UI 风格切换、主题色注入、交互组件样式，且需要清晰的覆盖顺序。
- **方案**：五层递进：
  1. `shared.css` — CSS 变量定义与常量
  2. `base.css` — 全局基础样式
  3. `surfaces.css` — 表面效果（圆角、hover）
  4. `presets.css` + `pages.css` — 12 套 UI 风格规则源
  5. `styles/{id}.css` — build 产物，12 个独立风格包
- **备选方案**：所有样式写在一个大文件中。被否决：风格切换需要互斥，单文件无法实现 `disabled` 机制。
- **影响范围**：`templates/shell.*.css`、`scripts/build-style-sheets.mjs`。

### DL-002: 三闸门质量控制体系

- **背景**：Agent 生成的 HTML 教程质量参差不齐（缺失 DOM 块、术语 ID 不一致、动手练习数与大纲不匹配）。
- **方案**：Gate 1（结构/编码） → Gate 2（章节质量/教学法） → Gate 3（人工语义审查），每道闸门 0 容错，不通过不允许交付。
- **备选方案**：仅人工审查。被否决：人工审查无法可靠检查 id 冲突、编码损坏、术语密度等量化指标。
- **影响范围**：`scripts/validate-tutorial.mjs`、`scripts/review-chapter.mjs`、`reference/chapter-quality-rubric.md`。

### DL-001: HTML 静态教程站而非 SPA/SSG

- **背景**：项目目标是"将技术领域生成为交互式 HTML 教程"，需要轻量、可离线分发、零服务器。
- **方案**：纯静态 HTML + 内联 CSS/JS，CDN 加载 highlight.js 和 Mermaid。用 `build-style-sheets.mjs` 和 `assemble-index.mjs` 在构建时处理风格拆分和内容注入，运行时零构建。
- **备选方案**：VitePress / Docusaurus SSG。被否决：引入 Node 服务端渲染和 npm 依赖，破坏 `file://` 直接打开和零依赖分发能力。
- **影响范围**：全局设计，所有模板和脚本。
