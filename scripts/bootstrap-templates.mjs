#!/usr/bin/env node
/**
 * 从已组装的 index.html 重新生成 templates/shell.base.css 与 shell.app.js。
 * 维护壳层时使用，非日常教程工作流。
 *
 *   node scripts/bootstrap-templates.mjs <path/to/assembled/index.html>
 */
import fs from 'fs';
import path from 'path';

import { SKILL_ROOT } from './lib/paths.mjs';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node bootstrap-templates.mjs <path/to/assembled/index.html>');
  process.exit(1);
}

const html = fs.readFileSync(path.resolve(htmlPath), 'utf8');
const tpl = path.join(SKILL_ROOT, 'templates');
fs.mkdirSync(tpl, { recursive: true });

// ---- shell.base.css ----
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) {
  console.error('bootstrap-templates: no <style> block found in index.html');
  process.exit(1);
}
const css = styleMatch[1];
const themeEnd = css.indexOf('/* theme presets */');
if (themeEnd < 0) {
  console.error('bootstrap-templates: marker "/* theme presets */" not found in <style>');
  process.exit(1);
}
let c = css.slice(0, themeEnd).trim();
const globalStart = c.indexOf('*, *::before');
if (globalStart < 0) {
  console.error('bootstrap-templates: global reset "*, *::before" not found in <style>');
  process.exit(1);
}
fs.writeFileSync(path.join(tpl, 'shell.base.css'), c.slice(globalStart) + '\n');

// ---- shell.app.js ----
const jsMatch = html.match(/<script>\s*\(function \(\) \{[\s\S]*?\}\)\(\);\s*<\/script>/);
if (!jsMatch) {
  console.error('bootstrap-templates: no matching IIFE <script> block found in index.html');
  process.exit(1);
}
const js = jsMatch[0];
let jsBody = js.replace(/^<script>\s*/, '').replace(/\s*<\/script>$/, '');
jsBody = jsBody.replace(
  /var THEME_KEYWORDS = \{[\s\S]*?\};\s*function resolveThemePreset\(meta\) \{[\s\S]*?\}\s*function applyThemePreset\(\) \{\s*document\.documentElement\.setAttribute\(\s*'data-theme-preset',\s*resolveThemePreset\(COURSE_DATA\.meta\)\s*\);\s*\}/,
  `function applyThemePreset() {
    var id = COURSE_DATA.meta.themePreset || COURSE_DATA.meta.slug || 'default';
    id = String(id).toLowerCase().replace(/[^a-z0-9-]/g, '');
    document.documentElement.setAttribute('data-theme-preset', id);
  }`
);
fs.writeFileSync(path.join(tpl, 'shell.app.js'), jsBody + '\n');

// ---- theme.placeholder.css ----
fs.writeFileSync(
  path.join(tpl, 'theme.placeholder.css'),
  `[data-theme-preset="{{THEME_PRESET}}"][data-theme="light"] {
  --accent: #0969da;
  --accent-hover: #0550ae;
  --accent-soft: #ddf4ff;
  --accent-glow: rgba(9,105,218,.25);
  --accent-alt: #58a6ff;
  --bg-accent: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(9,105,218,.1), transparent);
}
[data-theme-preset="{{THEME_PRESET}}"][data-theme="dark"] {
  --accent: #58a6ff;
  --accent-hover: #79b8ff;
  --accent-soft: #132d4a;
  --accent-glow: rgba(88,166,255,.2);
  --accent-alt: #a371f7;
  --bg-accent: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(88,166,255,.08), transparent);
}
`
);

console.log('templates ready');
