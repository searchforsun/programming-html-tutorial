#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(
  path.join(__dirname, '../examples/minimal-course/index.html'),
  'utf8'
);
const tpl = path.join(__dirname, '../templates');
fs.mkdirSync(tpl, { recursive: true });

const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const end = css.indexOf('/* theme presets */');
let c = css.slice(0, end).trim();
const i = c.indexOf('*, *::before');
fs.writeFileSync(path.join(tpl, 'shell.base.css'), c.slice(i) + '\n');

const js = html.match(/<script>\s*\(function \(\) \{[\s\S]*?\}\)\(\);\s*<\/script>/)[0];
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

fs.writeFileSync(
  path.join(tpl, 'theme.placeholder.css'),
  `[data-theme-preset="{{THEME_PRESET}}"][data-theme="light"] {
  --accent: #0969da;
  --accent-hover: #0550ae;
  --accent-soft: #ddf4ff;
  --accent-glow: rgba(9,105,218,.25);
  --accent-alt: #58a6ff;
  --bg-accent: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(9,105,218,.1), transparent);
  --phase-basics: #0969da;
}
[data-theme-preset="{{THEME_PRESET}}"][data-theme="dark"] {
  --accent: #58a6ff;
  --accent-hover: #79b8ff;
  --accent-soft: #132d4a;
  --accent-glow: rgba(88,166,255,.2);
  --accent-alt: #a371f7;
  --bg-accent: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(88,166,255,.08), transparent);
  --phase-basics: #58a6ff;
}
`
);

console.log('templates ready');
