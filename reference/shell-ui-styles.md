# 壳层 UI 风格（2.10+）

> **交互 / DOM / 大纲 spy** 见 [shell-maintenance.md](shell-maintenance.md)。  
> **本文档**：十二套 UI 风格、CSS 分层、构建与发布流程的唯一真源。

---

## 设计原则

1. **风格互斥**：运行时只启用一份风格包（`<style data-ui-style-sheet="…" disabled>`），避免 `[data-ui-style="X"]` 在同一文件里互相覆盖。
2. **职责分层**：布局在 `shell.base.css`；形状与卡片 hover 在 `shell.surfaces.css`；颜色与装饰在风格包。
3. **课程 accent 独立**：`theme.css` 只写 `--accent*`；明暗用 `data-theme`；风格用 `data-ui-style` + localStorage（`config/defaults.json` → `globalUiStyleKey`）。

---

## CSS 加载顺序（单课 `index.shell.html`）

```text
shell.shared.css      # 与风格无关的共享 token（如 font-mono）
shell.base.css        # 布局、组件、导航、交互样式
theme.css             # 本课 accent（+ 可选 enrichment.base.css）
shell.surfaces.css    # 全局圆角；卡片 hover；不覆盖 notice/章首 left bar
<style data-ui-style-sheet="minimal" disabled> … </style>
<style data-ui-style-sheet="tech" disabled> … </style>
<style data-ui-style-sheet="vibrant"> … </style>   # 默认启用 vibrant
<style data-ui-style-sheet="nord" disabled> … </style>
<style data-ui-style-sheet="paper" disabled> … </style>
<style data-ui-style-sheet="glass" disabled> … </style>
<style data-ui-style-sheet="terminal" disabled> … </style>
<style data-ui-style-sheet="sakura" disabled> … </style>
<style data-ui-style-sheet="compact" disabled> … </style>
<style data-ui-style-sheet="outline" disabled> … </style>
<style data-ui-style-sheet="soft" disabled> … </style>
<style data-ui-style-sheet="cyber" disabled> … </style>
```

| id | 中文 | 特点 |
|----|------|------|
| minimal | 简约 | 小圆角、扁平、无阴影 |
| tech | 科技 | 直角切角、霓虹描边 |
| vibrant | 活力 | 大圆角、玻璃（**默认**） |
| nord | 北欧 | 左侧色条、胶囊标签 |
| paper | 纸感 | 直角、叠影、虚线 |
| glass | 玻璃 | 磨砂半透明、冰蓝光晕 |
| terminal | 终端 | 等宽字体、磷光绿、网格底 |
| sakura | 樱粉 | 柔粉配色、渐变标题 |
| compact | 紧凑 | **主题中性** · 小圆角、高密度、无阴影 |
| outline | 线框 | **主题中性** · 粗边框、透明阴影 |
| soft | 柔圆 | **主题中性** · 大圆角、胶囊小节标题 |
| cyber | 赛博 | **accent 驱动** · 切角 HUD、霓虹 glow、扫描网格底 |

**主题中性风**（compact / outline / soft）：中性灰底与 `shell.shared.css` 提供，**不覆盖 `--accent*`**，课程 `theme.css` 主色始终生效。装饰仅用 `var(--accent)` 作边框/标签，不改色相。

**赛博风**（cyber）：暗色中性底与 `--accent*` 无关的 surface/code token 在 `shell.shared.css`；**不覆盖 `--accent*`**，霓虹描边与 glow 随课程 `theme.css` 主色变化（如 Redis 课呈红色赛博）。

其余风格会自带完整色板（与课程 accent 可能叠加，以风格包为准）。

风格 id 注册：`config/defaults.json` → `uiStyles`。菜单与 `UI_STYLE_IDS` 由 assemble / sync 自动生成，见 [§风格注册点](#风格注册点增删风格时)。

切换风格：`shell.app.js` → `applyUiStyle()` 设置 `data-ui-style` 并 toggle 上述 `<style disabled>`。

---

## 风格注册点（增删风格时）

**真源**：`config/defaults.json` → `uiStyles`（id + label）。

| 步骤 | 文件 | 说明 |
|------|------|------|
| 1 | `config/defaults.json` | 增删 `uiStyles` 条目 |
| 2 | `scripts/build-style-sheets.mjs` → `HOVER_TOKENS` | 每风格卡片 hover |
| 3 | `templates/shell.style-presets.css` | token、明暗色、装饰 |
| 4 | `templates/shell.style-pages.css` | 分页面签名；clip-path 清除列表 |
| 5 | `templates/shell.base.css` | `.ui-style-swatch[data-style-swatch="…"]` 预览色 |

**自动生成**（勿手改输出）：

- `assemble-index` → 从 defaults 注入 `index.shell.html` 菜单、`shell.app.js` 的 `UI_STYLE_IDS` / storage 键
- `sync-portal-shell` → 刷新 portal 内 `<!-- ui-style-menu -->` / `// ui-style-config` 标记块

然后：`build-style-sheets` → `sync-portal-shell` → `sync-courses-index` → 各课 `assemble-index`。

### 终端风 · 亮色专用 token（勿复用 `--code-bg` 给表单）

| Token | 用途 |
|-------|------|
| `--code-inline-*` | 行内 `code` |
| `--code-toolbar-*` | 代码块顶栏 |
| `--table-head-*` | `.outline-table thead th` |
| `--input-*` | 测验 `.fill-input` |
| `--term-prompt` | 顶栏 `>`、`$` 提示符 |

亮色终端：正文/表头/输入框用浅底 + `--text`；代码块 pre 仍可用深色 + hljs。

---

## 源文件 vs 生成物

| 类型 | 路径 | 说明 |
|------|------|------|
| **可编辑源** | `templates/shell.style-presets.css` | 八风格 token、明暗色、装饰规则 |
| **可编辑源** | `templates/shell.style-pages.css` | 分页面微调（portal / welcome / chapter） |
| **构建脚本** | `scripts/build-style-sheets.mjs` | 从上面两份生成风格包 |
| **生成物（勿手改）** | `templates/styles/{minimal,tech,vibrant,nord,paper,glass,terminal,sakura,compact,outline,soft,cyber}.css` | 单风格完整包 |
| **生成物（勿手改）** | `templates/shell.style-sheets.html` | 十二个 `<style>` 标签片段 |

改风格装饰：**只改 presets/pages → 跑 build → assemble/sync**。

---

## 卡片 hover 范围

仅在 `shell.surfaces.css` 对以下选择器做放大/抬升（token：`--style-hover-*`）：

- `.course-card`、`.meta-card`、`.role-card`
- `.learn-scenario`、`.learn-compare-col`

**不做 hover 放大**：正文 `.section-block`、`.code-block`、`.quiz-item`、`.notice`、折叠 `.learn-faq details` 等（见 surfaces 内注释）。

---

## 导航选中行

左栏 `#sidebar li.active-ch a` 与右栏 `#chapter-toc-nav a.is-active` **共用**一套规则（`shell.base.css`）：

- 背景 `accent-soft`、字色 accent、字重 700
- **无左侧渐变竖条**（与圆角风格统一）
- 结构块（`.notice`、`.chapter-header`）在 surfaces 中**只统一圆角**，不强制 `border-width`，保留章首状态 left bar

---

## 发布流程（改壳层 CSS 后）

```bash
# 1. bump 版本（须两处一致）
#    config/defaults.json → shellVersion
#    templates/SHELL_VERSION

# 2. 生成风格包（assemble 会自动调用；也可单独跑）
node <skill-root>/scripts/build-style-sheets.mjs

# 3. 同步 portal 模板并写入工作区课程中心
node <skill-root>/scripts/sync-portal-shell.mjs
node <skill-root>/scripts/sync-courses-index.mjs <workspace>/courses/index.html

# 4. 重新 assemble 各课程
node <skill-root>/scripts/assemble-index.mjs --dir <workspace>/courses/<slug>
```

PowerShell 用 `;` 串联命令，勿用 `&&`。

---

## 禁止

- 手改 `templates/styles/*.css` 或已 assemble 的 `index.html` 内风格块
- 在 `theme.css` 写 `--bg-accent` 或整页背景（会盖风格包）
- 对 `.notice` / `.chapter-header` 在 surfaces 层强制统一 `border-width`（会破坏章首 left bar）
