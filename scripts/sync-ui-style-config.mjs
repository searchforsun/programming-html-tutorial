#!/usr/bin/env node
/**
 * 检查 config/defaults.json 中的 uiStyles 与 templates 中的 UI 风格配置一致性。
 * 支持 --fix 自动修复 portal.index.html。
 *
 * 用法:
 *   node scripts/sync-ui-style-config.mjs              # 仅检查
 *   node scripts/sync-ui-style-config.mjs --fix        # 检查并自动修复
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  renderUiStyleMenuHtml,
  renderPortalUiStyleConfig,
  renderUiStyleBootstrapScript,
  renderUiStyleSheetBootstrapScript,
} from './lib/ui-styles.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');

function main() {
  const fix = process.argv.includes('--fix');
  const defaultsPath = path.join(SKILL_ROOT, 'config/defaults.json');
  const portalPath = path.join(SKILL_ROOT, 'templates/portal.index.html');
  const shellAppPath = path.join(SKILL_ROOT, 'templates/shell.app.js');

  const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
  const portalHtml = fs.readFileSync(portalPath, 'utf8');
  const shellAppJs = fs.readFileSync(shellAppPath, 'utf8');

  const issues = [];

  // ---- shell.app.js ----
  if (!shellAppJs.includes('{{UI_STYLE_IDS_JSON}}')) {
    issues.push('shell.app.js: 缺少 {{UI_STYLE_IDS_JSON}} 占位符');
  }
  if (!shellAppJs.includes('{{GLOBAL_UI_STYLE_KEY}}')) {
    issues.push('shell.app.js: 缺少 {{GLOBAL_UI_STYLE_KEY}} 占位符');
  }
  if (!shellAppJs.includes('{{GLOBAL_THEME_KEY}}')) {
    issues.push('shell.app.js: 缺少 {{GLOBAL_THEME_KEY}} 占位符');
  }
  if (!shellAppJs.includes('{{DEFAULT_UI_STYLE}}')) {
    issues.push('shell.app.js: 缺少 {{DEFAULT_UI_STYLE}} 占位符');
  }

  // ---- portal.index.html: data-ui-style on <html> ----
  const htmlTagMatch = portalHtml.match(/<html[^>]+data-ui-style="([^"]*)"/);
  if (htmlTagMatch && htmlTagMatch[1] !== defaults.defaultUiStyle) {
    issues.push(
      `portal.index.html <html> data-ui-style="${htmlTagMatch[1]}" 与 defaults.defaultUiStyle="${defaults.defaultUiStyle}" 不一致`
    );
  }

  // ---- portal.index.html: ui-style-config block ----
  const configStart = '// ui-style-config:start';
  const configEnd = '// ui-style-config:end';
  const configExpected = renderPortalUiStyleConfig(defaults).trim();
  const configActual = extractBetween(portalHtml, configStart, configEnd);
  if (configActual === null) {
    issues.push('portal.index.html: 缺少 ui-style-config:start/end 标记');
  } else if (configActual.trim() !== configExpected) {
    issues.push('portal.index.html: ui-style-config 块与 defaults.json 不一致');
  }

  // ---- portal.index.html: ui-style-menu block ----
  const menuStart = '<!-- ui-style-menu:start -->';
  const menuEnd = '<!-- ui-style-menu:end -->';
  const menuExpected = renderUiStyleMenuHtml(defaults);
  const menuActual = extractBetween(portalHtml, menuStart, menuEnd);
  if (menuActual === null) {
    issues.push('portal.index.html: 缺少 ui-style-menu:start/end 标记');
  } else if (menuActual.trim() !== menuExpected.trim()) {
    issues.push('portal.index.html: ui-style-menu 块与 defaults.json 不一致');
  }

  // ---- portal.index.html: ui-style-bootstrap block ----
  const bootStart = '// ui-style-bootstrap:start';
  const bootEnd = '// ui-style-bootstrap:end';
  const bootExpected = renderUiStyleBootstrapScript(defaults).trim();
  const bootActual = extractBetween(portalHtml, bootStart, bootEnd);
  if (bootActual === null) {
    issues.push('portal.index.html: 缺少 ui-style-bootstrap:start/end 标记');
  } else if (bootActual.trim() !== bootExpected) {
    issues.push('portal.index.html: ui-style-bootstrap 块与 defaults.json 不一致');
  }

  // ---- portal.index.html: ui-style-sheet-bootstrap block ----
  const sheetStart = '// ui-style-sheet-bootstrap:start';
  const sheetEnd = '// ui-style-sheet-bootstrap:end';
  const sheetExpected = renderUiStyleSheetBootstrapScript(defaults).trim();
  const sheetActual = extractBetween(portalHtml, sheetStart, sheetEnd);
  if (sheetActual === null) {
    issues.push('portal.index.html: 缺少 ui-style-sheet-bootstrap:start/end 标记');
  } else if (sheetActual.trim() !== sheetExpected) {
    issues.push('portal.index.html: ui-style-sheet-bootstrap 块与 defaults.json 不一致');
  }

  // ---- portal.index.html: 硬编码 defaultUiStyle ----
  const defStyle = defaults.defaultUiStyle;
  // 查找 applyUiStyle 相关的硬编码默认值
  const hardcodedPatterns = [
    { re: /if \(UI_STYLE_IDS\.indexOf\(style\) === -1\) style = '([^']+)';/, label: 'UI_STYLE_IDS.indexOf fallback' },
    { re: /applyUiStyle\(storageGet\(GLOBAL_UI_STYLE_KEY\)\) \|\| '([^']+)'\)/, label: 'applyUiStyle(storageGet(...) || ...)' },
    { re: /storageGet\(GLOBAL_UI_STYLE_KEY\) \|\| '([^']+)'/, label: 'storageGet(UI_STYLE_KEY) || ...' },
    { re: /document\.documentElement\.getAttribute\('data-ui-style'\) \|\| '([^']+)'/, label: 'getAttribute(data-ui-style) || ...' },
  ];

  for (const { re, label } of hardcodedPatterns) {
    const m = re.exec(portalHtml);
    if (m && m[1] !== defStyle) {
      issues.push(
        `portal.index.html: "${label}" 中默认值 "${m[1]}" 与 defaults.defaultUiStyle="${defStyle}" 不一致`
      );
    }
  }

  // ---- 输出结果 ----
  if (issues.length === 0) {
    log.success('✓ 所有 UI 风格配置一致');
    return;
  }

  log.error(`发现 ${issues.length} 处不一致:\n`);
  for (const issue of issues) {
    log.error(`  ✗ ${issue}`);
  }

  if (!fix) {
    log.warn(`\n提示: 使用 --fix 参数自动修复 portal.index.html`);
    process.exit(1);
  }

  // ---- --fix 模式 ----
  log.info('\n正在修复 portal.index.html ...');
  let updated = portalHtml;

  // 1. 修复 data-ui-style 属性
  updated = updated.replace(
    /(<html[^>]+data-ui-style=)"[^"]*"/,
    `$1"${defStyle}"`
  );

  // 2. 修复硬编码默认值
  // applyUiStyle 中的 fallback
  updated = updated.replace(
    /(if \(UI_STYLE_IDS\.indexOf\(style\) === -1\) style = )'[^']+';/,
    `$1'${defStyle}';`
  );
  updated = updated.replace(
    /(applyUiStyle\(storageGet\(GLOBAL_UI_STYLE_KEY\)\) \|\| )'[^']+'\)/,
    `$1'${defStyle}')`
  );

  // 3. 用 lib/ui-styles.mjs 的 applyPortalUiStyleFragments 重写所有四块
  // 但为了避免依赖该函数中的其他副作用，直接用精确替换
  if (configActual !== null) {
    updated = replaceBetween(updated, configStart, configEnd, renderPortalUiStyleConfig(defaults));
  }
  if (menuActual !== null) {
    updated = replaceBetween(updated, menuStart, menuEnd, renderUiStyleMenuHtml(defaults));
  }
  if (bootActual !== null) {
    updated = replaceBetween(updated, bootStart, bootEnd, renderUiStyleBootstrapScript(defaults).trim());
  }
  if (sheetActual !== null) {
    updated = replaceBetween(updated, sheetStart, sheetEnd, renderUiStyleSheetBootstrapScript(defaults).trim());
  }

  fs.writeFileSync(portalPath, updated, 'utf8');
  log.success('✓ portal.index.html 已修复');
  log.info('  修复项:');
  for (const issue of issues) {
    log.info(`    - ${issue}`);
  }
}

function extractBetween(text, start, end) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a === -1 || b === -1 || b < a) return null;
  return text.slice(a + start.length, b);
}

function replaceBetween(text, start, end, content) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(`替换失败: 找不到标记 ${start} … ${end}`);
  }
  return text.slice(0, a + start.length) + '\n' + content + '\n' + text.slice(b);
}

main();
