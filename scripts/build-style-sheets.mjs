#!/usr/bin/env node
/**
 * 从 shell.style-presets.css + shell.style-pages.css 生成独立风格包。
 * 每份仅含单一风格规则，切换时通过 <style disabled> 互斥加载，避免交叉覆盖。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const skillRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const templates = path.join(skillRoot, 'templates');
const outDir = path.join(templates, 'styles');
const defaults = JSON.parse(
  fs.readFileSync(path.join(skillRoot, 'config/defaults.json'), 'utf8')
);
const STYLES = defaults.uiStyles.map((s) => s.id);

const HOVER_TOKENS = {
  minimal: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.012)',
    '--style-hover-shadow': 'var(--shadow-md)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 22%, var(--border))',
    '--style-hover-duration': '0.2s',
    '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tech: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.018)',
    '--style-hover-shadow': 'var(--shadow-md), 0 0 24px var(--accent-glow)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 55%, var(--border))',
    '--style-hover-duration': '0.18s',
    '--style-hover-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  vibrant: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.04)',
    '--style-hover-shadow': 'var(--shadow-lg)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 35%, var(--border))',
    '--style-hover-duration': '0.24s',
    '--style-hover-ease': 'cubic-bezier(0.34, 1.2, 0.64, 1)',
  },
  nord: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.015)',
    '--style-hover-shadow': 'var(--shadow-md)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent-alt) 40%, var(--border))',
    '--style-hover-duration': '0.22s',
    '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  paper: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'translate(-3px, -3px)',
    '--style-hover-shadow': '7px 7px 0 color-mix(in srgb, var(--border) 70%, transparent)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 35%, var(--border))',
    '--style-hover-duration': '0.16s',
    '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  glass: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.035)',
    '--style-hover-shadow': 'var(--shadow-lg), inset 0 1px 0 color-mix(in srgb, #ffffff 40%, transparent)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 30%, var(--border))',
    '--style-hover-duration': '0.22s',
    '--style-hover-ease': 'cubic-bezier(0.34, 1.1, 0.64, 1)',
  },
  terminal: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1)',
    '--style-hover-shadow': 'var(--shadow-md), 0 0 20px var(--accent-glow)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 65%, var(--border))',
    '--style-hover-duration': '0.14s',
    '--style-hover-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  sakura: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.03)',
    '--style-hover-shadow': 'var(--shadow-md), 0 4px 20px color-mix(in srgb, var(--accent) 18%, transparent)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 35%, var(--border))',
    '--style-hover-duration': '0.22s',
    '--style-hover-ease': 'cubic-bezier(0.34, 1.15, 0.64, 1)',
  },
  compact: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.008)',
    '--style-hover-shadow': 'var(--shadow-sm)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 30%, var(--border))',
    '--style-hover-duration': '0.16s',
    '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  outline: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'translate(-2px, -2px)',
    '--style-hover-shadow': 'none',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 55%, var(--border))',
    '--style-hover-duration': '0.14s',
    '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  soft: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.02)',
    '--style-hover-shadow': 'var(--shadow-md)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 22%, var(--border))',
    '--style-hover-duration': '0.2s',
    '--style-hover-ease': 'cubic-bezier(0.34, 1.1, 0.64, 1)',
  },
  cyber: {
    '--style-hover-rest': 'none',
    '--style-hover-transform': 'scale(1.015)',
    '--style-hover-shadow': 'var(--shadow-md), 0 0 28px var(--accent-glow)',
    '--style-hover-border': 'color-mix(in srgb, var(--accent) 65%, var(--border))',
    '--style-hover-duration': '0.16s',
    '--style-hover-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
};

function extractCssBlocks(source) {
  const blocks = [];
  let i = 0;
  while (i < source.length) {
    if (source[i] === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (source[i] !== '.' && source[i] !== '#' && source[i] !== '[' && source[i] !== ':' && source[i] !== '@') {
      i += 1;
      continue;
    }
    const selStart = i;
    let depth = 0;
    let j = i;
    let inBlock = false;
    while (j < source.length) {
      const ch = source[j];
      if (ch === '{') {
        depth += 1;
        inBlock = true;
      } else if (ch === '}') {
        depth -= 1;
        if (inBlock && depth === 0) {
          j += 1;
          break;
        }
      }
      j += 1;
    }
    const chunk = source.slice(selStart, j);
    const brace = chunk.indexOf('{');
    if (brace === -1) {
      i += 1;
      continue;
    }
    blocks.push({
      selector: chunk.slice(0, brace).trim(),
      body: chunk.slice(brace + 1, -1).trim(),
    });
    i = j;
  }
  return blocks;
}

function hasForeignStyle(selector, style) {
  const re = /\[data-ui-style="([^"]+)"\]/g;
  let m;
  while ((m = re.exec(selector)) !== null) {
    if (m[1] !== style) return true;
  }
  return false;
}

function belongsToStyle(selector, style) {
  if (!/\[data-ui-style=/.test(selector)) return false;
  if (!selector.includes(`data-ui-style="${style}"`)) return false;
  if (hasForeignStyle(selector, style)) return false;
  return true;
}

function rewriteSelector(selector, style) {
  let sel = selector
    .replace(new RegExp(`html\\[data-ui-style="${style}"\\]\\s*`, 'g'), '')
    .replace(new RegExp(`\\[data-ui-style="${style}"\\]\\[data-theme=`, 'g'), '[data-theme=')
    .replace(new RegExp(`\\[data-ui-style="${style}"\\]\\s*`, 'g'), '')
    .replace(/\s*!important/g, '')
    .trim();
  if (sel === '' || sel === ':root') return ':root';
  return sel;
}

function injectHoverTokens(body, style) {
  const tokens = HOVER_TOKENS[style];
  if (!tokens) return body;
  const extra = Object.entries(tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${body}\n${extra}`;
}

function buildStyleSheet(style, presets, pages) {
  const combined = `${presets}\n${pages}`;
  const blocks = extractCssBlocks(combined);
  const out = [`/* UI 风格包 · ${style}（独立加载，互斥启用） */`, ''];

  for (const block of blocks) {
    const { selector, body } = block;
    if (!belongsToStyle(selector, style)) continue;

    if (/^\[data-ui-style="/.test(selector) && selector.includes(`"${style}"`) && !selector.includes('[data-theme')) {
      const rewritten = rewriteSelector(selector, style);
      const finalBody =
        rewritten === ':root' ? injectHoverTokens(body, style) : body;
      out.push(`${rewritten} {`);
      out.push(finalBody);
      out.push('}', '');
      continue;
    }

    const rewritten = rewriteSelector(selector, style);
    if (!rewritten) continue;
    out.push(`${rewritten} {`);
    out.push(body);
    out.push('}', '');
  }

  return `${out.join('\n').trim()}\n`;
}

function buildStyleSheetsHtml(stylesDir) {
  const defaultStyle = defaults.defaultUiStyle || 'vibrant';
  return STYLES.map((style) => {
    const css = fs.readFileSync(path.join(stylesDir, `${style}.css`), 'utf8');
    const disabled = style === defaultStyle ? '' : ' disabled';
    return `<style data-ui-style-sheet="${style}"${disabled}>\n${css}</style>`;
  }).join('\n');
}

function main() {
  const presets = fs.readFileSync(path.join(templates, 'shell.style-presets.css'), 'utf8');
  const pages = fs.readFileSync(path.join(templates, 'shell.style-pages.css'), 'utf8');
  fs.mkdirSync(outDir, { recursive: true });

  for (const style of STYLES) {
    const sheet = buildStyleSheet(style, presets, pages);
    fs.writeFileSync(path.join(outDir, `${style}.css`), sheet, 'utf8');
    console.log(`Built styles/${style}.css`);
  }

  const html = buildStyleSheetsHtml(outDir);
  fs.writeFileSync(path.join(templates, 'shell.style-sheets.html'), html, 'utf8');
  console.log('Built shell.style-sheets.html');
}

main();
