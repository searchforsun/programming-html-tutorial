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
  console.warn(
    `Warning: templates/SHELL_VERSION (${shellVersionFile}) !== config/defaults.json shellVersion (${SHELL_VERSION})`
  );
}

function parseArgs(argv) {
  const opts = { dir: null, out: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = argv[++i];
    else if (argv[i] === '--out') opts.out = argv[++i];
  }
  if (!opts.dir) {
    console.error('Usage: node assemble-index.mjs --dir <tutorial-dir> [--out index.html]');
    process.exit(1);
  }
  opts.dir = path.resolve(opts.dir);
  opts.out = opts.out ? path.resolve(opts.out) : path.join(opts.dir, 'index.html');
  return opts;
}

function readIf(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
}

function loadHljsScripts(meta, hljsVer) {
  const langs = meta.hljsLanguages || ['java'];
  return langs
    .map(
      (lang) =>
        `  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${hljsVer}/languages/${lang}.min.js"></script>`
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

function assemble(dir, outFile) {
  const coursePath = path.join(dir, 'course.json');
  if (!fs.existsSync(coursePath)) {
    throw new Error(`Missing ${coursePath}`);
  }
  const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
  course.meta = course.meta || {};
  course.meta.shellVersion = SHELL_VERSION;
  if (!course.meta.themePreset) {
    course.meta.themePreset = course.meta.slug || 'default';
  }

  execSync('node scripts/build-style-sheets.mjs', { cwd: SKILL_ROOT, stdio: 'inherit' });

  let shellHtml = fs.readFileSync(path.join(SKILL_ROOT, 'templates/index.shell.html'), 'utf8');
  shellHtml = applyShellTemplatePlaceholders(shellHtml, defaults);
  const sharedCss = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.shared.css'), 'utf8');
  const baseCss = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.base.css'), 'utf8');
  const surfacesCss = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.surfaces.css'), 'utf8');
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

  const quizHtml = readIf(path.join(dir, 'quiz.partial.html'));

  const hljsVer = defaults.cdn.highlightJs;
  const mermaidVer = defaults.cdn.mermaid;

  let html = shellHtml
    .replace(/\{\{TITLE\}\}/g, course.meta.title || course.meta.domain || 'Tutorial')
    .replace(/\{\{HLJS_LANG_SCRIPTS\}\}/g, loadHljsScripts(course.meta, hljsVer))
    .replace(/\{\{TERM_PLATFORM_LINKS\}\}/g, loadTermPlatformLinks())
    .replace(/\{\{SHELL_SHARED_CSS\}\}/g, sharedCss)
    .replace(/\{\{SHELL_BASE_CSS\}\}/g, baseCss)
    .replace(/\{\{THEME_CSS\}\}/g, themeCss)
    .replace(/\{\{SHELL_SURFACES_CSS\}\}/g, surfacesCss)
    .replace(/\{\{SHELL_STYLE_SHEETS_HTML\}\}/g, styleSheetsHtml)
    .replace(/\{\{WELCOME_HTML\}\}/g, welcomeInner)
    .replace(/\{\{CHAPTERS_HTML\}\}/g, chaptersHtml)
    .replace(/\{\{QUIZ_HTML\}\}/g, quizHtml)
    .replace(/\{\{COURSE_DATA_JSON\}\}/g, JSON.stringify(course, null, 2))
    .replace(/\{\{SHELL_APP_JS\}\}/g, shellJs)
    .replace(/\{\{HLJS_VERSION\}\}/g, hljsVer)
    .replace(/\{\{MERMAID_VERSION\}\}/g, mermaidVer);

  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`Assembled ${outFile} (shell ${SHELL_VERSION}, ${course.meta.slug})`);
}

const opts = parseArgs(process.argv);
assemble(opts.dir, opts.out);
