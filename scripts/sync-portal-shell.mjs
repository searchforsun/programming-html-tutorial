#!/usr/bin/env node
/**
 * 同步 portal 壳层：shared + surfaces + 八风格包 → templates/portal.index.html
 *
 * Usage:
 *   node scripts/sync-portal-shell.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { loadDefaults, applyPortalUiStyleFragments } from './lib/ui-styles.mjs';

const skillRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const templates = path.join(skillRoot, 'templates');
const portalPath = path.join(templates, 'portal.index.html');
const defaults = loadDefaults(skillRoot);

execSync('node scripts/build-style-sheets.mjs', { cwd: skillRoot, stdio: 'inherit' });

const indent = (text) => text.split('\n').map((line) => (line ? '    ' + line : '')).join('\n');

function read(name) {
  return fs.readFileSync(path.join(templates, name), 'utf8');
}

let html = fs.readFileSync(portalPath, 'utf8');

const sharedStart = html.indexOf('    /* 壳层共享常量');
const btnStart = html.indexOf('    .btn-topbar-icon {');
if (sharedStart === -1 || btnStart === -1) {
  throw new Error('portal layout markers not found (shared / .btn-topbar-icon)');
}
html =
  html.slice(0, sharedStart) +
  indent(read('shell.shared.css')) +
  '\n\n' +
  html.slice(btnStart);

const surfacesStart = html.indexOf('    /* 全局表面形状');
const styleClose = html.indexOf('  </style>', surfacesStart);
if (surfacesStart === -1 || styleClose === -1) {
  throw new Error('portal surfaces block not found');
}
html = html.slice(0, surfacesStart) + indent(read('shell.surfaces.css')) + '\n' + html.slice(styleClose);

const sheetsStart = html.indexOf('<style data-ui-style-sheet="minimal"');
const sheetsEnd = html.indexOf('</head>', sheetsStart);
if (sheetsStart === -1 || sheetsEnd === -1) {
  throw new Error('portal style sheets block not found');
}
const headInner = html.slice(sheetsStart, sheetsEnd);
const enableScriptMatch = headInner.match(/\n\s*<script>[\s\S]*?data-ui-style-sheet[\s\S]*?<\/script>/);
const enableScript = enableScriptMatch ? enableScriptMatch[0] : '';
html =
  html.slice(0, sheetsStart) +
  read('shell.style-sheets.html') +
  enableScript +
  '\n' +
  html.slice(sheetsEnd);

html = applyPortalUiStyleFragments(html, defaults);

html = html.replace(
  /function applyUiStyle\(style\) \{[\s\S]*?syncUiStyleMenu\(style\);\s*\}/,
  `function applyUiStyle(style) {
    if (UI_STYLE_IDS.indexOf(style) === -1) style = 'vibrant';
    document.documentElement.setAttribute('data-ui-style', style);
    document.querySelectorAll('[data-ui-style-sheet]').forEach(function (el) {
      el.disabled = el.getAttribute('data-ui-style-sheet') !== style;
    });
    storageSet(GLOBAL_UI_STYLE_KEY, style);
    syncUiStyleMenu(style);
  }`
);

fs.writeFileSync(portalPath, html, 'utf8');
console.log('Updated portal.index.html (sync-portal-shell)');
