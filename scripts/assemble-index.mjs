#!/usr/bin/env node
/**
 * Assemble courses/<slug>/index.html from course.json + partials + templates.
 *
 * Usage:
 *   node scripts/assemble-index.mjs --dir courses/my-course
 *   node scripts/assemble-index.mjs --dir examples/minimal-course
 *   node scripts/assemble-index.mjs --dir courses/my-course --out courses/my-course/index.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');
const SHELL_VERSION = '2.1.3';

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

  const shellHtml = fs.readFileSync(path.join(SKILL_ROOT, 'templates/index.shell.html'), 'utf8');
  const baseCss = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.base.css'), 'utf8');
  const themeCss = readIf(path.join(dir, 'theme.css'));
  const welcomeInner = readIf(path.join(dir, 'welcome.partial.html'));
  const shellJs = fs.readFileSync(path.join(SKILL_ROOT, 'templates/shell.app.js'), 'utf8');

  const chaptersDir = path.join(dir, 'chapters');
  let chaptersHtml = '';
  if (fs.existsSync(chaptersDir)) {
    const files = fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.html')).sort();
    chaptersHtml = files.map((f) => fs.readFileSync(path.join(chaptersDir, f), 'utf8').trim()).join('\n');
  }

  const quizHtml = readIf(path.join(dir, 'quiz.partial.html'));

  const defaults = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'config/defaults.json'), 'utf8'));
  const hljsVer = defaults.cdn.highlightJs;
  const mermaidVer = defaults.cdn.mermaid;

  let html = shellHtml
    .replace(/\{\{TITLE\}\}/g, course.meta.title || course.meta.domain || 'Tutorial')
    .replace(/\{\{HLJS_LANG_SCRIPTS\}\}/g, loadHljsScripts(course.meta, hljsVer))
    .replace(/\{\{TERM_PLATFORM_LINKS\}\}/g, loadTermPlatformLinks())
    .replace(/\{\{SHELL_BASE_CSS\}\}/g, baseCss)
    .replace(/\{\{THEME_CSS\}\}/g, themeCss)
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
