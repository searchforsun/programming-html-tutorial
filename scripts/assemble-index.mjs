#!/usr/bin/env node
/**
 * Assemble courses/<slug>/index.html from course.json + partials + templates.
 *
 * Usage:
 *   node scripts/assemble-index.mjs --dir <project>/courses/<slug>
 *   node scripts/assemble-index.mjs --dir <project>/courses/<slug> --out <path>/index.html
 *
 * Now uses Handlebars for template rendering — replaces fragile string substitution
 * with compiled templates and compile-time missing-key detection.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  applyShellAppPlaceholders,
  renderUiStyleBootstrapScript,
  renderUiStyleMenuHtml,
} from './lib/ui-styles.mjs';
import { renderTemplate, validateContext } from './lib/template-helpers.mjs';

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
        `  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${hljsVer}/languages/${lang}.min.js"></script>`
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

  // Step 1: Build CSS artifacts (merged + style-data)
  execSync('node scripts/build-merged-css.mjs', { cwd: SKILL_ROOT, stdio: 'inherit' });

  // Step 2: Read shell template source + shell JS
  const templateSource = fs.readFileSync(
    path.join(SKILL_ROOT, 'templates', 'index.shell.hbs'),
    'utf8'
  );
  const shellAppJsRaw = fs.readFileSync(
    path.join(SKILL_ROOT, 'templates', 'shell.app.js'),
    'utf8'
  );

  // Step 3: Read / compute all content fragments
  const mergedCss = fs.readFileSync(
    path.join(SKILL_ROOT, 'templates', 'shell.merged.css'),
    'utf8'
  );
  const styleDataJson = readIf(path.join(SKILL_ROOT, 'templates', 'shell.style-data.json')) || '{}';

  let themeCss = readIf(path.join(dir, 'theme.css'));
  const useEnrichment = course.meta.useEnrichment !== false;
  if (useEnrichment) {
    const enrichPath = path.join(SKILL_ROOT, 'templates', 'enrichment.base.css');
    if (fs.existsSync(enrichPath)) {
      const enrichCss = fs.readFileSync(enrichPath, 'utf8');
      themeCss = themeCss ? `${themeCss}\n\n${enrichCss}` : enrichCss;
    }
  }

  let welcomeInner = readIf(path.join(dir, 'welcome.partial.html'));
  welcomeInner = applyWelcomeEnrichment(welcomeInner, SKILL_ROOT, useEnrichment);

  const chaptersDir = path.join(dir, 'chapters');
  let chaptersHtml = '';
  if (fs.existsSync(chaptersDir)) {
    const files = fs
      .readdirSync(chaptersDir)
      .filter((f) => f.endsWith('.html'))
      .sort();
    chaptersHtml = files
      .map((f) => fs.readFileSync(path.join(chaptersDir, f), 'utf8').trim())
      .join('\n');
  }

  const quizHtml = readIf(path.join(dir, 'quiz.partial.html'));

  const hljsVer = defaults.cdn.highlightJs;
  const mermaidVer = defaults.cdn.mermaid;

  // Step 4: Pre-process shell.app.js (its own placeholders are independent of Handlebars)
  const shellAppJs = applyShellAppPlaceholders(shellAppJsRaw, defaults);

  // Step 5: Build render context (single object → Handlebars)
  const defStyle = defaults.defaultUiStyle || 'vibrant';
  const context = {
    // Simple string values (double-brace {{ }} — auto-escaped)
    defaultUiStyle: defStyle,
    title: course.meta.title || course.meta.domain || 'Tutorial',
    hljsVersion: hljsVer,
    mermaidVersion: mermaidVer,

    // Raw HTML/CSS/JS content (triple-brace {{{ }}} — no escaping)
    uiStyleBootstrapScript: renderUiStyleBootstrapScript(defaults),
    uiStyleMenuHtml: renderUiStyleMenuHtml(defaults),
    hljsLangScripts: loadHljsScripts(course.meta, hljsVer),
    termPlatformLinks: loadTermPlatformLinks(),
    mergedCss: mergedCss,
    themeCss: themeCss,
    styleDataJson: styleDataJson,
    welcomeHtml: welcomeInner,
    chaptersHtml: chaptersHtml,
    quizHtml: quizHtml,
    shellAppJs: shellAppJs,

    // Complex objects for {{json}} helper
    courseData: course,
  };

  // Step 6: Validate context completeness
  const requiredKeys = [
    'defaultUiStyle', 'title', 'hljsVersion', 'mermaidVersion',
    'uiStyleBootstrapScript', 'uiStyleMenuHtml', 'hljsLangScripts',
    'termPlatformLinks', 'mergedCss', 'styleDataJson',
    'shellAppJs', 'courseData',
  ];
  const optionalKeys = ['themeCss', 'welcomeHtml', 'chaptersHtml', 'quizHtml'];
  const warnings = validateContext(context, requiredKeys, optionalKeys);
  if (warnings.length > 0) {
    console.warn('Template variable warnings:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  // Step 7: Render
  const html = renderTemplate(templateSource, context);

  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`Assembled ${outFile} (shell ${SHELL_VERSION}, ${course.meta.slug})`);
}

const opts = parseArgs(process.argv);
assemble(opts.dir, opts.out);
