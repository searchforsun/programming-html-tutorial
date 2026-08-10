#!/usr/bin/env node
/**
 * Assemble courses/<slug>/index.html from course.json + partials + templates.
 *
 * Usage:
 *   node scripts/assemble-index.mjs --dir <project>/courses/<slug>
 *   node scripts/assemble-index.mjs --dir <project>/courses/<slug> --out <path>/index.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  loadDefaults,
  applyShellTemplatePlaceholders,
  applyShellAppPlaceholders,
} from './lib/ui-styles.mjs';
import { BuildCache } from './lib/build-cache.mjs';
import { isMmdcAvailable, prerenderAllChapters } from './lib/mermaid-prerender.mjs';
import { info, warn, error, success, plain } from './lib/log.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');
const defaults = JSON.parse(
  fs.readFileSync(path.join(SKILL_ROOT, 'config', 'defaults.json'), 'utf8')
);
const SHELL_VERSION = defaults.shellVersion;
const shellVersionFile = fs
  .readFileSync(path.join(SKILL_ROOT, 'templates', 'SHELL_VERSION'), 'utf8')
  .trim();
if (shellVersionFile !== SHELL_VERSION) {
  warn('templates/SHELL_VERSION (%s) !== config/defaults.json shellVersion (%s)', shellVersionFile, SHELL_VERSION);
}

function parseArgs(argv) {
  const opts = { dir: null, out: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = argv[++i];
    else if (argv[i] === '--out') opts.out = argv[++i];
  }
  if (!opts.dir) {
    error('Usage: node assemble-index.mjs --dir <tutorial-dir> [--out index.html]');
    process.exit(1);
  }
  opts.dir = path.resolve(opts.dir);
  opts.out = opts.out ? path.resolve(opts.out) : path.join(opts.dir, 'index.html');
  return opts;
}

function readIf(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
}

/**
 * 根据课程 features 按需加载可选 JS 模块。
 * - mermaid-fullscreen：chapters/*.html 中是否含 .mermaid-wrap
 * - selection-prompt：course.meta.selectionPromptEnabled !== false
 */
function loadOptionalModules(course, chaptersHtml, skillRoot) {
  const modules = [];
  const meta = course.meta || {};

  // Mermaid 全屏模块：仅在章节含 .mermaid-wrap 时注入
  const hasMermaid = /mermaid-wrap/.test(chaptersHtml);
  if (hasMermaid) {
    const mfPath = path.join(skillRoot, 'templates/shell.mermaid-fullscreen.js');
    if (fs.existsSync(mfPath)) {
      modules.push(fs.readFileSync(mfPath, 'utf8'));
    }
  }

  // 划词 AI 解释模块：仅在 selectionPromptEnabled !== false 时注入
  if (meta.selectionPromptEnabled !== false) {
    const spPath = path.join(skillRoot, 'templates/shell.selection-prompt.js');
    if (fs.existsSync(spPath)) {
      modules.push(fs.readFileSync(spPath, 'utf8'));
    }
  }

  return modules.join('\n');
}

function loadHljsScripts(meta, hljsVer, cdnHljsBase) {
  const langs = meta.hljsLanguages || ['java'];
  const base = cdnHljsBase || 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js';
  return langs
    .map(
      (lang) =>
        `  <script src="${base}/${hljsVer}/languages/${lang}.min.js"></script>`
    )
    .join('\n');
}

function loadEnrichmentScriptBody(skillRoot) {
  const tpl = path.join(skillRoot, 'templates/chapter-enrichment.js');
  if (!fs.existsSync(tpl)) return '';
  return fs
    .readFileSync(tpl, 'utf8')
    .replace(/^\/\*\*[\s\S]*?\*\/\s*/, '')
    .trim();
}

/** 交互脚本内联进 welcome，不生成 courses/<slug>/assets/*.js */
function applyWelcomeEnrichment(welcomeHtml, skillRoot, useEnrichment) {
  if (!welcomeHtml) return welcomeHtml;
  let html = welcomeHtml.replace(
    /<script\s+src=["']assets\/chapter-enrichment\.js["'][^>]*>\s*<\/script>\s*/gi,
    ''
  );
  if (!useEnrichment || /initChapterEnrichment/.test(html)) return html;
  const body = loadEnrichmentScriptBody(skillRoot);
  if (!body) return html;
  const tag = `<script>\n${body}\n</script>`;
  if (/<\/section>\s*$/i.test(html)) {
    return html.replace(/<\/section>\s*$/i, `${tag}\n</section>`);
  }
  return `${html}\n${tag}`;
}

function loadTermPlatformLinks() {
  const platforms = JSON.parse(
    fs.readFileSync(path.join(SKILL_ROOT, 'config/term-platforms.json'), 'utf8')
  );
  return platforms
    .map(
      (p) =>
        `        <a class="btn-term btn-term-link" href="${p.url}" target="_blank" rel="noopener">${p.label}</a>`
    )
    .join('\n');
}

async function assemble(dir, outFile) {
  const coursePath = path.join(dir, 'course.json');
  if (!fs.existsSync(coursePath)) {
    throw new Error(`Missing ${coursePath}`);
  }
  const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));

  // ── 增量构建缓存 ──
  const cache = new BuildCache(dir, SKILL_ROOT);
  if (cache.shouldSkipAll()) {
    info('⏭  跳过构建 %s（所有源文件未变更）', outFile);
    return;
  }
  info('  📋 %s', cache.diffSummary());

  const skipStyleBuild = cache.shouldSkipStyleBuild();
  const skipDataReRead = cache.shouldSkipDataReRead();
  const skipChaptersReRead = cache.shouldSkipChaptersReRead();
  course.meta = course.meta || {};
  course.meta.shellVersion = SHELL_VERSION;
  if (!course.meta.themePreset) {
    course.meta.themePreset = course.meta.slug || 'default';
  }

  if (skipStyleBuild) {
    info('  ⏭  跳过 build-style-sheets（壳层未变更）');
  } else {
    execSync('node scripts/build-style-sheets.mjs', { cwd: SKILL_ROOT, stdio: 'inherit' });
  }

  let shellHtml = fs.readFileSync(path.join(SKILL_ROOT, 'templates/index.shell.html'), 'utf8');
  shellHtml = applyShellTemplatePlaceholders(shellHtml, defaults);
  const sharedCss = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.shared.css'), 'utf8');
  const baseCss = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.base.css'), 'utf8');
  const surfacesCss = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.surfaces.css'), 'utf8');
  const printCss = readIf(path.join(SKILL_ROOT, 'templates/shell.print.css')) || '';
  const styleSheetsHtml = fs.readFileSync(
    path.join(SKILL_ROOT, 'templates/shell.style-sheets.html'),
    'utf8'
  );
  let themeCss = readIf(path.join(dir, 'theme.css'));
  const useEnrichment = course.meta.useEnrichment !== false;
  if (useEnrichment) {
    const enrichPath = path.join(SKILL_ROOT, 'templates/enrichment.base.css');
    if (fs.existsSync(enrichPath)) {
      const enrichCss = fs.readFileSync(enrichPath, 'utf8');
      themeCss = themeCss ? `${themeCss}\n\n${enrichCss}` : enrichCss;
    }
  }
  let welcomeInner = readIf(path.join(dir, 'welcome.partial.html'));
  welcomeInner = applyWelcomeEnrichment(welcomeInner, SKILL_ROOT, useEnrichment);
  const shellJs = applyShellAppPlaceholders(
    fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.app.js'), 'utf8'),
    defaults
  );

  const chaptersDir = path.join(dir, 'chapters');
  let chaptersHtml = '';
  if (fs.existsSync(chaptersDir)) {
    const files = fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.html')).sort();
    chaptersHtml = files.map((f) => fs.readFileSync(path.join(chaptersDir, f), 'utf8').trim()).join('\n');
  }

  // Mermaid 构建时预渲染：mmdc 可用时将图表预渲染为静态 SVG
  let prerenderStats = { total: 0, success: 0, failed: 0 };
  if (chaptersHtml && (await isMmdcAvailable())) {
    const result = await prerenderAllChapters(chaptersHtml);
    chaptersHtml = result.html;
    prerenderStats = result.stats;
    if (prerenderStats.success > 0) {
      info(`  Mermaid 预渲染: ${prerenderStats.success}/${prerenderStats.total} 成功` +
        (prerenderStats.failed > 0 ? `, ${prerenderStats.failed} 失败` : ''));
    }
  }

  const quizHtml = readIf(path.join(dir, 'quiz.partial.html'));

  const optionalModulesJs = loadOptionalModules(course, chaptersHtml, SKILL_ROOT);

  const hljsVer = defaults.cdn.highlightJs;
  const mermaidVer = defaults.cdn.mermaid;
  const cdnBase = defaults.cdn.base || {};
  const cdnHljsBase = cdnBase.highlightJs || 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js';
  const cdnMermaidBase = cdnBase.mermaid || 'https://cdn.jsdelivr.net/npm/mermaid';
  const cdnFontsBase = cdnBase.fonts || 'https://fonts.googleapis.com';

  let html = shellHtml
    .replace(/\{\{TITLE\}\}/g, course.meta.title || course.meta.domain || 'Tutorial')
    .replace(/\{\{HLJS_LANG_SCRIPTS\}\}/g, loadHljsScripts(course.meta, hljsVer, cdnHljsBase))
    .replace(/\{\{TERM_PLATFORM_LINKS\}\}/g, loadTermPlatformLinks())
    .replace(/\{\{SHELL_SHARED_CSS\}\}/g, sharedCss)
    .replace(/\{\{SHELL_BASE_CSS\}\}/g, baseCss)
    .replace(/\{\{THEME_CSS\}\}/g, themeCss)
    .replace(/\{\{SHELL_SURFACES_CSS\}\}/g, surfacesCss)
    .replace(/\{\{SHELL_PRINT_CSS\}\}/g, printCss)
    .replace(/\{\{SHELL_STYLE_SHEETS_HTML\}\}/g, styleSheetsHtml)
    .replace(/\{\{WELCOME_HTML\}\}/g, welcomeInner)
    .replace(/\{\{CHAPTERS_HTML\}\}/g, chaptersHtml)
    .replace(/\{\{QUIZ_HTML\}\}/g, quizHtml)
    .replace(/\{\{TERM_INDEX_HTML\}\}/g, renderTermIndex(course.terms))
    .replace(/\{\{COURSE_DATA_JSON\}\}/g, JSON.stringify(course, null, 2))
    .replace(/\{\{SHELL_APP_JS\}\}/g, shellJs)
    .replace(/\{\{OPTIONAL_MODULES_JS\}\}/g, optionalModulesJs)
    .replace(/\{\{HLJS_VERSION\}\}/g, hljsVer)
    .replace(/\{\{MERMAID_VERSION\}\}/g, mermaidVer)
    .replace(/\{\{CDN_HLJS_BASE\}\}/g, cdnHljsBase)
    .replace(/\{\{CDN_MERMAID_BASE\}\}/g, cdnMermaidBase)
    .replace(/\{\{CDN_FONTS_BASE\}\}/g, cdnFontsBase);

  fs.writeFileSync(outFile, html, 'utf8');
  success(`Assembled ${outFile} (shell ${SHELL_VERSION}, ${course.meta.slug})`);

  // Gate 0：组装后完整性校验，防止生成半成品 index.html
  verifyAssembledHtml(outFile, html);

  // ── 构建统计仪表盘 ──
  gatherBuildStats({
    html,
    course,
    outFile,
    chaptersDir,
    quizHtml,
    skipStyleBuild,
    cacheDir: path.join(dir, '.cache'),
  });

  // 写入缓存（构建成功后）
  cache.save();
  info(`  ✓ 构建缓存已更新`);
}

/**
 * 根据 course.terms 生成术语索引页 HTML。
 * 按首字母（拼音/中文首字）分组，每术语含 label、prompt 与各章节锚点。
 */
function renderTermIndex(terms) {
  if (!terms || !Object.keys(terms).length) return '';

  const entries = Object.entries(terms).map(([id, t]) => ({
    id,
    label: t.label || id,
    prompt: t.prompt || '',
    letter: (t.label || id).charAt(0).toUpperCase(),
  }));
  entries.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

  const groups = {};
  for (const e of entries) {
    const l = /[a-zA-Z]/.test(e.letter) ? e.letter : '#';
    (groups[l] || (groups[l] = [])).push(e);
  }
  const letters = Object.keys(groups).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  let html = '<h2>术语索引</h2>\n';
  for (const letter of letters) {
    html += `<div class="term-index-section">\n`;
    html += `<div class="term-index-letter">${letter}</div>\n`;
    for (const e of groups[letter]) {
      const escapedPrompt = e.prompt
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      html += `<div class="term-index-entry">`;
      html += `<span class="term-label">${e.label}</span>`;
      html += `<span class="term-id">（${e.id}）</span>`;
      html += `<p class="term-prompt">${escapedPrompt}</p>`;
      html += `</div>\n`;
    }
    html += `</div>\n`;
  }
  return html;
}

/**
 * Gate 0：校验组装产物 index.html 是否包含所有必需的关键 DOM 元素。
 * 若缺失则抛出错误，防止生成不可用的半成品页面。
 */
/**
 * gatherBuildStats：输出构建统计仪表盘（终端表格 + JSON 缓存写入）。
 * 统计术语数、章节数、测验题数、Mermaid 图数、代码块数、产物大小等。
 */
function gatherBuildStats({ html, course, outFile, chaptersDir, quizHtml, skipStyleBuild, cacheDir }) {
  const stats = {
    timestamp: new Date().toISOString(),
    shellVersion: course.meta?.shellVersion || '?',
    title: course.meta?.title || course.meta?.domain || '?',
    slug: course.meta?.slug || '?',
    domainType: course.meta?.domainType || '?',
    terms: Object.keys(course.terms || {}).length,
    outlinePhases: (course.outline || []).length,
    outlineChapters: (course.outline || []).reduce((n, p) => n + (p.chapters || []).length, 0),
    // 实际章节文件数（含未在大纲中声明的）
    actualChapterFiles: fs.existsSync(chaptersDir)
      ? fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.html')).length
      : 0,
    mermaidCount: (html.match(/class="mermaid-wrap"/g) || []).length,
    codeBlocks: (html.match(/<pre><code/g) || []).length,
    quizQuestions: quizHtml ? (quizHtml.match(/class="quiz-question"/g) || []).length : 0,
    quizTypes: quizHtml
      ? [...new Set([...(quizHtml.match(/data-type="([^"]+)"/g) || []).map((s) => s.replace(/^data-type="([^"]+)"$/, '$1'))])].join(', ')
      : '',
    hljsLanguages: course.meta?.hljsLanguages?.join(', ') || 'java',
    useMermaid: /mermaid-wrap/.test(html),
    useSelectionPrompt: course.meta?.selectionPromptEnabled !== false,
    skipStyleBuild: !!skipStyleBuild,
    fileSizeKB: (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1),
  };

  // ── 终端仪表盘 ──
  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 构建统计仪表盘');
  console.log('───────────────────────────────────────────');
  info(`  课程标题     ${stats.title}`);
  info(`  壳版本       ${stats.shellVersion}`);
  info(`  领域类型     ${stats.domainType} (${stats.domainType})`);
  info(`  大纲         ${stats.outlinePhases} 阶段 / ${stats.outlineChapters} 章 (实际 ${stats.actualChapterFiles} 文件)`);
  info(`  术语         ${stats.terms} 个`);
  info(`  Mermaid 图   ${stats.mermaidCount} 个`);
  info(`  代码块       ${stats.codeBlocks} 个`);
  info(`  测验题       ${stats.quizQuestions} 道 (${stats.quizTypes || '无'})`);
  info(`  HLJS 语言    ${stats.hljsLanguages}`);
  info(`  可选模块     Mermaid全屏:${stats.useMermaid ? '✓' : '✗'}  划词AI:${stats.useSelectionPrompt ? '✓' : '✗'}`);
  info(`  CSS 构建     ${stats.skipStyleBuild ? '⏭ 跳过' : '✓ 重建'}`);
  info(`  产物大小     ${stats.fileSizeKB} KB`);
  console.log('═══════════════════════════════════════════');

  // ── JSON 缓存写入（CI 可追踪趋势） ──
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    const statsPath = path.join(cacheDir, 'build-stats.json');
    // 读取历史记录并追加
    let history = [];
    if (fs.existsSync(statsPath)) {
      try { history = JSON.parse(fs.readFileSync(statsPath, 'utf8')); } catch (_) {}
    }
    if (!Array.isArray(history)) history = [];
    history.push(stats);
    // 只保留最近 50 条
    if (history.length > 50) history = history.slice(-50);
    fs.writeFileSync(statsPath, JSON.stringify(history, null, 2), 'utf8');
    info(`  📈 统计已写入 ${statsPath} (共 ${history.length} 条记录)`);
  } catch (_) {
    // 缓存写入失败不影响主流程
  }
}

function verifyAssembledHtml(filePath, html) {
  const checks = [
    { id: 'toast', name: 'Toast 提示容器' },
    { id: 'term-modal', name: '术语弹窗' },
    { id: 'course-data', name: '课程数据脚本块' },
    { id: 'outline-summary-body', name: '课程大纲摘要容器（welcome）' },
    { id: 'sidebar', name: '侧栏导航' },
    { id: 'main-content', name: '主内容区' },
    { id: 'quiz-panel', name: '测验面板' },
    { id: 'progress-bar', name: '进度条' },
    { id: 'btn-theme', name: '明暗主题切换按钮' },
    { id: 'btn-ui-style', name: 'UI 风格切换按钮' },
  ];

  const missing = [];
  for (const { id, name } of checks) {
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      missing.push(`${name} (${id})`);
    }
  }

  // 检查是否残留已知壳模板占位符（未被替换）
  const shellPlaceholders = [
    'TITLE', 'HLJS_LANG_SCRIPTS', 'TERM_PLATFORM_LINKS',
    'SHELL_SHARED_CSS', 'SHELL_BASE_CSS', 'THEME_CSS',
    'SHELL_SURFACES_CSS', 'SHELL_PRINT_CSS', 'SHELL_STYLE_SHEETS_HTML',
    'WELCOME_HTML', 'CHAPTERS_HTML', 'QUIZ_HTML', 'TERM_INDEX_HTML',
    'COURSE_DATA_JSON', 'SHELL_APP_JS',
    'HLJS_VERSION', 'MERMAID_VERSION',
    'DEFAULT_UI_STYLE', 'UI_STYLE_BOOTSTRAP_SCRIPT',
    'UI_STYLE_MENU_HTML', 'UI_STYLE_SHEET_BOOTSTRAP_SCRIPT',
    'GLOBAL_THEME_KEY', 'OPTIONAL_MODULES_JS',
    'CDN_HLJS_BASE', 'CDN_MERMAID_BASE', 'CDN_FONTS_BASE',
  ];
  const leftover = [];
  for (const ph of shellPlaceholders) {
    if (html.includes(`{{${ph}}}`)) {
      leftover.push(`{{${ph}}}`);
    }
  }
  if (leftover.length > 0) {
    missing.push(`未替换占位符: ${leftover.join(', ')}`);
  }

  if (missing.length > 0) {
    error(`\n❌ 组装产物 ${filePath} 完整性校验失败，缺失以下关键元素：`);
    for (const m of missing) {
      error(`   - ${m}`);
    }
    error(`\n请检查模板文件 templates/index.shell.html 或 welcome.partial.html 是否完整。`);
    process.exit(1);
  }

  success(`✓ 组装产物完整性校验通过 (${checks.length} 项检查)`);
}

const opts = parseArgs(process.argv);
await assemble(opts.dir, opts.out);
