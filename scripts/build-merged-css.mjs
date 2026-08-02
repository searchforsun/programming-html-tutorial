#!/usr/bin/env node
/**
 * Build merged CSS with @layer organization + per-style JSON for on-demand injection.
 *
 * Layer order (low → high priority within layered styles):
 *   @layer tokens   → CSS custom properties only
 *   @layer base     → structural / layout / component styles
 *   @layer surfaces → border-radius / shape tokens
 *   @layer styles   → per-style decorative overrides
 *
 * Unlayered injected styles beat ALL layers — used for on-demand style switching.
 *
 * Outputs:
 *   templates/shell.merged.css      — @layer CSS (default style inlined)
 *   templates/shell.style-data.json — per-style CSS for on-demand injection
 *   templates/styles/{style}.css    — individual style sheets (backward compat)
 *   templates/shell.style-sheets.html — <style> tags (backward compat)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const skillRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const templates = path.join(skillRoot, 'templates');
const outDir = path.join(templates, 'styles');
const configPath = path.join(skillRoot, 'config', 'defaults.json');
const defaults = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const DEFAULT_STYLE = defaults.defaultUiStyle || 'vibrant';
const ALL_STYLES = defaults.uiStyles.map((s) => s.id);

// ── Hover tokens (from original build-style-sheets.mjs) ──
const HOVER_TOKENS = {
  minimal: { '--style-hover-transform': 'scale(1.012)', '--style-hover-shadow': 'var(--shadow-md)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 22%, var(--border))', '--style-hover-duration': '0.2s', '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)', '--style-hover-rest': 'none' },
  tech: { '--style-hover-transform': 'scale(1.018)', '--style-hover-shadow': 'var(--shadow-md), 0 0 24px var(--accent-glow)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 55%, var(--border))', '--style-hover-duration': '0.18s', '--style-hover-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)', '--style-hover-rest': 'none' },
  vibrant: { '--style-hover-transform': 'scale(1.04)', '--style-hover-shadow': 'var(--shadow-lg)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 35%, var(--border))', '--style-hover-duration': '0.24s', '--style-hover-ease': 'cubic-bezier(0.34, 1.2, 0.64, 1)', '--style-hover-rest': 'none' },
  nord: { '--style-hover-transform': 'scale(1.015)', '--style-hover-shadow': 'var(--shadow-md)', '--style-hover-border': 'color-mix(in srgb, var(--accent-alt) 40%, var(--border))', '--style-hover-duration': '0.22s', '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)', '--style-hover-rest': 'none' },
  paper: { '--style-hover-transform': 'translate(-3px, -3px)', '--style-hover-shadow': '7px 7px 0 color-mix(in srgb, var(--border) 70%, transparent)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 35%, var(--border))', '--style-hover-duration': '0.16s', '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)', '--style-hover-rest': 'none' },
  glass: { '--style-hover-transform': 'scale(1.035)', '--style-hover-shadow': 'var(--shadow-lg), inset 0 1px 0 color-mix(in srgb, #ffffff 40%, transparent)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 30%, var(--border))', '--style-hover-duration': '0.22s', '--style-hover-ease': 'cubic-bezier(0.34, 1.1, 0.64, 1)', '--style-hover-rest': 'none' },
  terminal: { '--style-hover-transform': 'scale(1)', '--style-hover-shadow': 'var(--shadow-md), 0 0 20px var(--accent-glow)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 65%, var(--border))', '--style-hover-duration': '0.14s', '--style-hover-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)', '--style-hover-rest': 'none' },
  sakura: { '--style-hover-transform': 'scale(1.03)', '--style-hover-shadow': 'var(--shadow-md), 0 4px 20px color-mix(in srgb, var(--accent) 18%, transparent)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 35%, var(--border))', '--style-hover-duration': '0.22s', '--style-hover-ease': 'cubic-bezier(0.34, 1.15, 0.64, 1)', '--style-hover-rest': 'none' },
  compact: { '--style-hover-transform': 'scale(1.008)', '--style-hover-shadow': 'var(--shadow-sm)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 30%, var(--border))', '--style-hover-duration': '0.16s', '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)', '--style-hover-rest': 'none' },
  outline: { '--style-hover-transform': 'translate(-2px, -2px)', '--style-hover-shadow': 'none', '--style-hover-border': 'color-mix(in srgb, var(--accent) 55%, var(--border))', '--style-hover-duration': '0.14s', '--style-hover-ease': 'cubic-bezier(0.4, 0, 0.2, 1)', '--style-hover-rest': 'none' },
  soft: { '--style-hover-transform': 'scale(1.02)', '--style-hover-shadow': 'var(--shadow-md)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 22%, var(--border))', '--style-hover-duration': '0.2s', '--style-hover-ease': 'cubic-bezier(0.34, 1.1, 0.64, 1)', '--style-hover-rest': 'none' },
  cyber: { '--style-hover-transform': 'scale(1.015)', '--style-hover-shadow': 'var(--shadow-md), 0 0 28px var(--accent-glow)', '--style-hover-border': 'color-mix(in srgb, var(--accent) 65%, var(--border))', '--style-hover-duration': '0.16s', '--style-hover-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)', '--style-hover-rest': 'none' },
};

// ── CSS block extraction ──
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
      if (ch === '{') { depth += 1; inBlock = true; }
      else if (ch === '}') {
        depth -= 1;
        if (inBlock && depth === 0) { j += 1; break; }
      }
      j += 1;
    }
    const chunk = source.slice(selStart, j);
    const brace = chunk.indexOf('{');
    if (brace === -1) { i += 1; continue; }
    blocks.push({
      selector: chunk.slice(0, brace).trim(),
      body: chunk.slice(brace + 1, -1).trim(),
    });
    i = j;
  }
  return blocks;
}

function isAnyDataUiStyle(selector) {
  const re = /\[data-ui-style="([^"]+)"\]/g;
  let m;
  while ((m = re.exec(selector)) !== null) {
    if (ALL_STYLES.includes(m[1])) return m[1];
  }
  return null;
}

function hasForeignStyle(selector, style) {
  const re = /\[data-ui-style="([^"]+)"\]/g;
  let m;
  while ((m = re.exec(selector)) !== null) {
    if (m[1] !== style) return true;
  }
  return false;
}

function belongsToStyleExactly(selector, style) {
  if (!/\[data-ui-style=/.test(selector)) return false;
  if (!selector.includes(`data-ui-style="${style}"`)) return false;
  if (hasForeignStyle(selector, style)) return false;
  return true;
}

function isTokenOnlyBlock(body) {
  const lines = body.split(';').map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((line) => /^\s*--[\w-]+\s*:/.test(line));
}

function stripImportant(body) {
  return body.replace(/\s*!important/g, '');
}

function injectHoverTokens(body, style) {
  const tokens = HOVER_TOKENS[style];
  if (!tokens) return body;
  const extra = Object.entries(tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${body}\n${extra}`;
}

// ── Main ──
function main() {
  // Read sources
  const sharedCss = fs.readFileSync(path.join(templates, 'shell.shared.css'), 'utf8');
  const baseCss = fs.readFileSync(path.join(templates, 'shell.base.css'), 'utf8');
  const surfacesCss = fs.readFileSync(path.join(templates, 'shell.surfaces.css'), 'utf8');
  const enrichmentCss = fs.readFileSync(path.join(templates, 'enrichment.base.css'), 'utf8');
  const presetsRaw = fs.readFileSync(path.join(templates, 'shell.style-presets.css'), 'utf8');
  const pagesRaw = fs.readFileSync(path.join(templates, 'shell.style-pages.css'), 'utf8');

  const presetBlocks = extractCssBlocks(presetsRaw);
  const pageBlocks = extractCssBlocks(pagesRaw);

  // Classify presets blocks: token-only vs decorative
  const presetsTokens = [];
  const presetsDeco = [];
  for (const b of presetBlocks) {
    if (isTokenOnlyBlock(b.body)) {
      presetsTokens.push(b);
    } else {
      presetsDeco.push(b);
    }
  }

  // Classify pages blocks
  const pagesDeco = pageBlocks;

  // ── Build merged CSS (default style only) ──
  const merged = [
    '/* ═══════════════════════════════════════════════════════════',
    '   Shell Merged CSS — @layer tokens, base, surfaces, styles;',
    '   Generated by scripts/build-merged-css.mjs',
    '   Default style: ' + DEFAULT_STYLE,
    '   Other styles stored in shell.style-data.json for on-demand injection.',
    '   ═══════════════════════════════════════════════════════════ */',
    '',
  ];

  // @layer tokens — CSS custom properties
  merged.push('@layer tokens {');
  // Shared & neutral tokens (no style-specific selectors)
  merged.push(sharedCss);
  merged.push('');
  // All style token declarations (only --var: value; blocks)
  for (const b of presetsTokens) {
    merged.push(`${b.selector} {`);
    merged.push(b.body);
    merged.push('}');
    merged.push('');
  }
  merged.push('}');
  merged.push('');

  // @layer base — structural styles
  merged.push('@layer base {');
  merged.push(baseCss);
  merged.push('');
  merged.push(enrichmentCss);
  merged.push('}');
  merged.push('');

  // @layer surfaces — shape tokens
  merged.push('@layer surfaces {');
  merged.push(surfacesCss);
  merged.push('}');
  merged.push('');

  // @layer styles — default style decorative overrides
  merged.push('@layer styles {');
  for (const b of presetsDeco) {
    merged.push(`${b.selector} {`);
    merged.push(stripImportant(b.body));
    merged.push('}');
    merged.push('');
  }
  for (const b of pagesDeco) {
    merged.push(`${b.selector} {`);
    merged.push(stripImportant(b.body));
    merged.push('}');
    merged.push('');
  }
  merged.push('}');
  merged.push('');

  const mergedPath = path.join(templates, 'shell.merged.css');
  fs.writeFileSync(mergedPath, merged.join('\n'), 'utf8');
  console.log(`Built ${mergedPath}`);

  // ── Build per-style JSON data (for on-demand injection) ──
  // For each non-default style, collect:
  //   1. Token blocks from presetsTokens
  //   2. Decorative blocks from presetsDeco
  //   3. Decorative blocks from pagesDeco
  const styleData = {};

  for (const style of ALL_STYLES) {
    if (style === DEFAULT_STYLE) continue;
    const parts = [];

    // Tokens
    for (const b of presetsTokens) {
      if (belongsToStyleExactly(b.selector, style)) {
        const body = injectHoverTokens(b.body, style);
        parts.push(`${b.selector} {\n${body}\n}`);
      }
    }

    // Presets decorative
    for (const b of presetsDeco) {
      if (belongsToStyleExactly(b.selector, style)) {
        const body = stripImportant(b.body);
        parts.push(`${b.selector} {\n${body}\n}`);
      }
    }

    // Pages decorative
    for (const b of pagesDeco) {
      if (belongsToStyleExactly(b.selector, style)) {
        const body = stripImportant(b.body);
        parts.push(`${b.selector} {\n${body}\n}`);
      }
    }

    if (parts.length > 0) {
      styleData[style] = parts.join('\n\n');
    } else {
      styleData[style] = '';
    }
  }

  const jsonPath = path.join(templates, 'shell.style-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(styleData, null, 2), 'utf8');
  console.log(`Built ${jsonPath}`);

  // ── Also generate individual style sheets (backward compat) ──
  fs.mkdirSync(outDir, { recursive: true });

  function buildPerStyleSheet(style) {
    const parts = [];

    // Tokens
    for (const b of presetsTokens) {
      if (belongsToStyleExactly(b.selector, style)) {
        // Rewrite: drop data-ui-style from selector
        let sel = b.selector.replace(
          new RegExp(`\\[data-ui-style="${style}"\\]\\s*`, 'g'), ''
        ).trim();
        if (sel === '' || sel === ':root') sel = ':root';
        const body = injectHoverTokens(b.body, style);
        parts.push(`${sel} {\n${body}\n}`);
      }
    }

    // Decoratives
    for (const b of [...presetsDeco, ...pagesDeco]) {
      if (belongsToStyleExactly(b.selector, style)) {
        let sel = b.selector
          .replace(new RegExp(`html\\[data-ui-style="${style}"\\]\\s*`, 'g'), '')
          .replace(new RegExp(`\\[data-ui-style="${style}"\\]\\[data-theme=`, 'g'), '[data-theme=')
          .replace(new RegExp(`\\[data-ui-style="${style}"\\]\\s*`, 'g'), '')
          .replace(/\s*!important/g, '')
          .trim();
        if (!sel) continue;
        parts.push(`${sel} {\n${stripImportant(b.body)}\n}`);
      }
    }

    return `/* UI 风格包 · ${style} */\n\n${parts.join('\n\n')}\n`;
  }

  for (const style of ALL_STYLES) {
    const css = buildPerStyleSheet(style);
    fs.writeFileSync(path.join(outDir, `${style}.css`), css, 'utf8');
    console.log(`Built styles/${style}.css`);
  }

  // Build backward-compat HTML
  const styleSheetsHtml = ALL_STYLES.map((style) => {
    const css = fs.readFileSync(path.join(outDir, `${style}.css`), 'utf8');
    const disabled = style === DEFAULT_STYLE ? '' : ' disabled';
    return `<style data-ui-style-sheet="${style}"${disabled}>\n${css}</style>`;
  }).join('\n');

  const htmlPath = path.join(templates, 'shell.style-sheets.html');
  fs.writeFileSync(htmlPath, styleSheetsHtml, 'utf8');
  console.log('Built shell.style-sheets.html');
  console.log(`Default style: ${DEFAULT_STYLE}`);
}

main();
