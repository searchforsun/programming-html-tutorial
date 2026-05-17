# 教程站组件样式（参考）

实现源文件：`templates/shell.base.css`。每课主题变量见 [theme-colors.md](theme-colors.md)，写入 `theme.css` 后由 assemble 注入。

组件样式只使用 CSS 变量，不写死领域品牌色。

```css
    :root, [data-theme="light"] {
      --bg: #f0f4f8;
      --bg-accent: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(9,105,218,.1), transparent);
      --surface: #ffffff;
      --surface-elevated: #ffffff;
      --text: #1a2332;
      --muted: #5c6b7a;
      --accent: #0969da;
      --accent-hover: #0550ae;
      --accent-soft: #ddf4ff;
      --accent-glow: rgba(9,105,218,.25);
      --accent-alt: #58a6ff;
      --border: #dce3eb;
      --code-bg: #f8fafc;
      --code-header: #eef2f6;
      --shadow-sm: 0 1px 2px rgba(16,24,40,.06);
      --shadow-md: 0 4px 16px rgba(16,24,40,.08);
      --shadow-lg: 0 12px 40px rgba(16,24,40,.1);
      --radius: 12px;
      --radius-sm: 8px;
      --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Mono", "Cascadia Code", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      --success: #1a7f37;
      --danger: #cf222e;
      --phase-basics: #0969da;
      --phase-practice: #6f42c1;
      --phase-advanced: #bf8700;
    }
    [data-theme="dark"] {
      --bg: #0f1419;
      --bg-accent: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(88,166,255,.08), transparent);
      --surface: #1a222d;
      --surface-elevated: #222c3a;
      --text: #e8edf4;
      --muted: #9aa8b8;
      --accent: #58a6ff;
      --accent-hover: #79b8ff;
      --accent-soft: #132d4a;
      --accent-glow: rgba(88,166,255,.2);
      --accent-alt: #a371f7;
      --border: #2d3a4d;
      --code-bg: #151b24;
      --code-header: #1e2733;
      --shadow-sm: 0 1px 2px rgba(0,0,0,.2);
      --shadow-md: 0 4px 16px rgba(0,0,0,.25);
      --shadow-lg: 0 12px 40px rgba(0,0,0,.35);
      --success: #3fb950;
      --danger: #f85149;
      --phase-basics: #58a6ff;
      --phase-practice: #a371f7;
      --phase-advanced: #d29922;
    }
    /* highlight.js 亮/暗样式表由 applyHljsTheme() 切换 link.disabled，勿用 display */
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
      background: var(--bg);
      background-image: var(--bg-accent);
      color: var(--text);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .topbar {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: .85rem 1.5rem;
      background: color-mix(in srgb, var(--surface) 85%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      position: sticky; top: 0; z-index: 100;
    }
    .course-title {
      margin: 0; font-size: 1.15rem; font-weight: 700; letter-spacing: -.02em;
      display: flex; align-items: center; gap: .5rem;
    }
    .course-title::before {
      content: ""; width: 8px; height: 8px; border-radius: 50%;
      background: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .topbar-actions { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
    .progress-wrap { display: flex; align-items: center; gap: .5rem; min-width: 150px; }
    .progress-track {
      flex: 1; height: 6px; background: var(--border); border-radius: 99px;
      overflow: hidden; min-width: 88px;
    }
    #progress-bar {
      height: 100%; width: 0;
      background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 70%, var(--accent-alt)));
      transition: width .4s cubic-bezier(.4,0,.2,1); border-radius: 99px;
    }
    #progress-text { font-size: .78rem; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .btn, .topbar button, .btn-import {
      font-size: .82rem; padding: .4rem .75rem;
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      background: var(--surface); color: var(--text); cursor: pointer;
      transition: border-color .15s, background .15s, transform .1s, box-shadow .15s;
    }
    .btn:hover, .topbar button:hover, .btn-import:hover {
      border-color: var(--accent); background: var(--accent-soft);
    }
    .btn:active, .topbar button:active { transform: scale(.97); }
    .layout { display: grid; grid-template-columns: 272px 1fr; min-height: calc(100vh - 56px); }
    .main-area { display: flex; justify-content: center; min-width: 0; overflow-x: auto; }
    #sidebar {
      background: var(--surface); border-right: 1px solid var(--border);
      padding: 1.25rem 1rem; overflow-y: auto;
      position: sticky; top: 56px; height: calc(100vh - 56px);
      box-shadow: var(--shadow-sm);
    }
    #sidebar .phase { margin-bottom: .75rem; }
    #sidebar summary {
      font-weight: 600; font-size: .82rem; text-transform: uppercase; letter-spacing: .04em;
      color: var(--muted); cursor: pointer; padding: .4rem .5rem; list-style: none;
      border-radius: var(--radius-sm);
    }
    #sidebar summary:hover { background: var(--accent-soft); color: var(--accent); }
    #sidebar summary::-webkit-details-marker { display: none; }
    #sidebar summary::before { content: "▸ "; opacity: .6; }
    #sidebar details[open] summary::before { content: "▾ "; }
    #sidebar ul { list-style: none; margin: .25rem 0 0; padding: 0; }
    #sidebar li { margin: .2rem 0; }
    #sidebar a {
      color: var(--text); text-decoration: none; font-size: .88rem;
      display: block; padding: .45rem .65rem; border-radius: var(--radius-sm);
      transition: background .15s, color .15s, padding-left .15s;
    }
    #sidebar a:hover { background: var(--accent-soft); color: var(--accent); padding-left: .85rem; }
    #sidebar li.done a::after { content: " ✓"; color: var(--success); font-size: .72rem; }
    #sidebar li.pending a { color: var(--muted); }
    #sidebar li.active-ch a {
      background: var(--accent-soft); color: var(--accent); font-weight: 600;
      box-shadow: inset 3px 0 0 var(--accent);
    }
    #main-content {
      width: 100%; max-width: 900px; padding: 2rem 2.25rem 4rem; flex-shrink: 0;
    }
    .welcome h2 {
      margin-top: 0; font-size: 1.75rem; font-weight: 700; letter-spacing: -.03em;
      background: linear-gradient(135deg, var(--text), var(--accent));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .welcome .lead { font-size: 1.05rem; color: var(--muted); max-width: 42em; }
    .meta-cards {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem; margin: 1.75rem 0;
    }
    .meta-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 1.1rem 1.2rem;
      box-shadow: var(--shadow-sm);
      transition: transform .2s, box-shadow .2s;
    }
    .meta-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .meta-card strong {
      display: block; font-size: .7rem; text-transform: uppercase;
      letter-spacing: .06em; color: var(--muted); margin-bottom: .35rem;
    }
    .meta-card a { color: var(--accent); word-break: break-all; }
    .outline-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      margin: 1.5rem 0; font-size: .88rem; border-radius: var(--radius);
      overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    }
    .outline-table th, .outline-table td {
      border-bottom: 1px solid var(--border); padding: .65rem .85rem; text-align: left;
    }
    .outline-table tr:last-child td { border-bottom: none; }
    .outline-table th { background: var(--code-header); font-weight: 600; }
    .outline-table tr:hover td { background: var(--accent-soft); }
    .phase-tag {
      display: inline-block; padding: .2rem .55rem; border-radius: 99px;
      font-size: .72rem; font-weight: 600;
    }
    .phase-tag.basics { background: color-mix(in srgb, var(--phase-basics) 18%, transparent); color: var(--phase-basics); }
    .phase-tag.practice { background: color-mix(in srgb, var(--phase-practice) 18%, transparent); color: var(--phase-practice); }
    .phase-tag.advanced { background: color-mix(in srgb, var(--phase-advanced) 18%, transparent); color: var(--phase-advanced); }
    .notice {
      background: linear-gradient(135deg, var(--accent-soft), color-mix(in srgb, var(--surface) 80%, var(--accent-soft)));
      border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border));
      border-radius: var(--radius); padding: 1.1rem 1.35rem; margin-top: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .notice strong { color: var(--accent); }
    section[data-chapter] { display: none; }
    section[data-chapter].active {
      display: block;
      animation: fadeIn .35s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    section[data-chapter].done .chapter-header h2::after {
      content: " · 已完成"; font-size: .75rem; font-weight: 500; color: var(--success);
    }
    .chapter-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
      margin-bottom: 2rem; padding: 1.25rem 1.5rem;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow-md);
    }
    .chapter-header h2 { margin: 0; font-size: 1.55rem; font-weight: 700; letter-spacing: -.02em; }
    .chapter .content-section {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 1.25rem 1.5rem; margin: 1.25rem 0;
      box-shadow: var(--shadow-sm);
    }
    .chapter h3 {
      font-size: 1rem; font-weight: 600; margin: 0 0 .75rem;
      padding-left: .65rem; border-left: 3px solid var(--accent);
      color: var(--text);
    }
    .concept p { margin: .65rem 0; }
    .term {
      color: var(--accent); cursor: pointer; font-weight: 500;
      border-bottom: 1px dashed color-mix(in srgb, var(--accent) 60%, transparent);
      transition: background .15s, border-color .15s;
    }
    .term:hover { background: var(--accent-soft); border-bottom-style: solid; }
    .term:focus { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
    .official-links ul, .resources ul { padding-left: 1.2rem; margin: .5rem 0; }
    .official-links li, .resources li { margin: .4rem 0; }
    .official-links a, .resources a {
      color: var(--accent); text-decoration: none;
      border-bottom: 1px solid transparent; transition: border-color .15s;
    }
    .official-links a:hover, .resources a:hover { border-bottom-color: var(--accent); }
    .code-block {
      margin: 1.25rem 0; border: 1px solid var(--border); border-radius: var(--radius);
      overflow: hidden; box-shadow: var(--shadow-md);
    }
    .code-toolbar {
      display: grid; grid-template-columns: 50px 1fr auto; align-items: center;
      padding: .5rem .85rem; background: var(--code-header);
      border-bottom: 1px solid var(--border); font-size: .78rem;
    }
    .code-toolbar::before {
      content: ""; width: 42px; height: 10px; grid-column: 1;
      background: radial-gradient(circle, #ff5f57 4px, transparent 4px) 0 50%,
        radial-gradient(circle, #febc2e 4px, transparent 4px) 14px 50%,
        radial-gradient(circle, #28c840 4px, transparent 4px) 28px 50%;
      background-size: 10px 10px; background-repeat: no-repeat;
    }
    .code-toolbar .lang-tag { grid-column: 2; }
    .code-toolbar .btn-copy { grid-column: 3; }
    .lang-tag {
      color: var(--muted); text-transform: uppercase; font-weight: 600;
      letter-spacing: .05em; font-size: .7rem;
    }
    .btn-copy {
      font-size: .75rem; padding: .28rem .65rem;
      border: 1px solid var(--border); border-radius: 6px;
      background: var(--surface); color: var(--muted); cursor: pointer;
      transition: all .2s cubic-bezier(.4,0,.2,1);
      min-width: 4.5em; text-align: center;
    }
    .btn-copy:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
    .btn-copy.copied {
      border-color: var(--success); background: var(--success); color: #fff;
      transform: scale(1.05); box-shadow: 0 0 0 3px color-mix(in srgb, var(--success) 30%, transparent);
    }
    .btn-copy.copy-fail { border-color: var(--danger); color: var(--danger); background: color-mix(in srgb, var(--danger) 10%, transparent); }
    .code-block pre {
      margin: 0; overflow-x: auto; background: var(--code-bg) !important;
      tab-size: 2; -moz-tab-size: 2;
    }
    .code-block pre code,
    .code-block pre code.hljs {
      display: block; padding: 1.15rem 1.35rem;
      font-family: var(--font-mono) !important;
      font-size: 0.875rem; font-weight: 400; line-height: 1.7;
      letter-spacing: 0.02em;
      font-variant-ligatures: none;
      font-feature-settings: "liga" 0, "calt" 0;
      -webkit-font-smoothing: antialiased;
    }
    .chapter :not(pre) > code,
    .demo-box code,
    .steps code,
    .notice code {
      font-family: var(--font-mono);
      font-size: 0.88em; padding: 0.12em 0.4em; border-radius: 4px;
      background: var(--code-bg); border: 1px solid var(--border);
    }
    #term-prompt { font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.65; }
    .mermaid-wrap {
      margin: 1.25rem 0; padding: 1.25rem;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow-sm);
    }
    .mermaid-wrap h3 { width: 100%; }
    .mermaid-wrap pre.mermaid {
      display: flex; justify-content: center; align-items: center;
      margin: 0.75rem 0 0; padding: 0; width: 100%;
      background: transparent !important; border: none;
      overflow-x: auto;
    }
    .mermaid-wrap pre.mermaid svg {
      display: block; max-width: 100%; height: auto;
      margin: 0 auto;
    }
    .steps { padding-left: 0; list-style: none; counter-reset: step; }
    .steps li {
      counter-increment: step; margin: .65rem 0; padding: .65rem .85rem .65rem 2.75rem;
      position: relative; background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius-sm);
    }
    .steps li::before {
      content: counter(step); position: absolute; left: .75rem; top: .7rem;
      width: 1.35rem; height: 1.35rem; line-height: 1.35rem; text-align: center;
      font-size: .75rem; font-weight: 700; border-radius: 50%;
      background: var(--accent); color: #fff;
    }
    .demo-box {
      background: linear-gradient(135deg, var(--accent-soft), color-mix(in srgb, var(--surface) 60%, var(--accent-soft)));
      border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border));
      border-radius: var(--radius); padding: 1.2rem 1.4rem; margin: 1.5rem 0;
      box-shadow: var(--shadow-sm);
    }
    .btn-mark-done {
      padding: .5rem 1rem; border: none; border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--accent-alt)));
      color: #fff; cursor: pointer; font-size: .85rem; font-weight: 600;
      white-space: nowrap; box-shadow: 0 2px 8px var(--accent-glow);
      transition: transform .15s, box-shadow .15s;
    }
    .btn-mark-done:hover { transform: translateY(-1px); box-shadow: 0 4px 14px var(--accent-glow); }
    .btn-mark-done:active { transform: translateY(0); }
    .btn-mark-done.is-done {
      background: var(--surface); color: var(--muted);
      border: 1px solid var(--border); box-shadow: none;
    }
    .btn-mark-done.is-done:hover {
      color: var(--text); border-color: var(--muted);
      background: var(--code-header); transform: none;
    }
    #toast {
      position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%) translateY(120%);
      padding: .65rem 1.25rem; border-radius: 99px;
      background: var(--text); color: var(--surface);
      font-size: .88rem; font-weight: 500;
      box-shadow: var(--shadow-lg); z-index: 200;
      opacity: 0; pointer-events: none;
      transition: transform .35s cubic-bezier(.34,1.56,.64,1), opacity .25s;
    }
    #toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
    #toast.toast-error { background: var(--danger); color: #fff; }
    #toast.toast-success { background: var(--success); color: #fff; }
    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; }
      #sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
      .main-area { justify-content: stretch; }
      #main-content { padding: 1.25rem 1rem 3rem; max-width: none; }
      .chapter-header { flex-direction: column; }
    }
    #term-modal {
      border: none; border-radius: var(--radius); padding: 0;
      max-width: 560px; width: calc(100% - 2rem);
      background: var(--surface); color: var(--text);
      box-shadow: var(--shadow-lg); overflow: hidden;
    }
    #term-modal::backdrop { background: rgba(0,0,0,.45); backdrop-filter: blur(4px); }
    #term-modal .term-modal-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
      background: var(--code-header);
    }
    #term-modal #term-title { margin: 0; font-size: 1.05rem; font-weight: 600; }
    #term-modal .btn-icon-close {
      width: 2rem; height: 2rem; padding: 0; border: none; border-radius: var(--radius-sm);
      background: transparent; color: var(--muted); cursor: pointer; font-size: 1.25rem; line-height: 1;
      transition: background .15s, color .15s;
    }
    #term-modal .btn-icon-close:hover { background: var(--border); color: var(--text); }
    #term-modal .term-modal-body { padding: 1.25rem; }
    #term-prompt {
      white-space: pre-wrap; background: var(--code-bg); padding: 1rem;
      border-radius: var(--radius-sm); font-size: .85rem; margin: 0;
      max-height: 240px; overflow-y: auto; border: 1px solid var(--border);
    }
    .term-actions {
      display: flex; flex-wrap: wrap; align-items: center; gap: .5rem;
      margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);
    }
    .term-actions .btn-term {
      font-size: .82rem; padding: .42rem .85rem; border-radius: var(--radius-sm);
      cursor: pointer; transition: all .2s cubic-bezier(.4,0,.2,1);
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
      text-decoration: none; display: inline-flex; align-items: center; gap: .35rem;
    }
    .term-actions .btn-term:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
    #btn-copy-prompt {
      border: none; color: #fff;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--accent-alt)));
      box-shadow: 0 2px 6px var(--accent-glow);
    }
    #btn-copy-prompt:hover { filter: brightness(1.05); color: #fff; }
    #btn-copy-prompt.copied {
      background: var(--success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--success) 30%, transparent);
    }
    #btn-copy-prompt.copy-fail {
      background: color-mix(in srgb, var(--danger) 12%, transparent);
      color: var(--danger); border: 1px solid var(--danger);
    }
    .term-actions .btn-term-link { font-size: .78rem; padding: .35rem .7rem; }
    #btn-close-term { margin-left: auto; color: var(--muted); }
    #btn-close-term:hover { color: var(--text); background: var(--code-header); border-color: var(--muted); }
```
