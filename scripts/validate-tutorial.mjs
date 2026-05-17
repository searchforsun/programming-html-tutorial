#!/usr/bin/env node
/**
 * Validate tutorial source or assembled index.html
 * Usage:
 *   node scripts/validate-tutorial.mjs --dir courses/my-course
 *   node scripts/validate-tutorial.mjs --dir examples/minimal-course --strict
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRequiredBlocks, checkChapterHtml } from './lib/chapter-blocks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');

const dir = process.argv.includes('--dir')
  ? path.resolve(process.argv[process.argv.indexOf('--dir') + 1])
  : null;
const strict = process.argv.includes('--strict');

if (!dir) {
  console.error('Usage: node validate-tutorial.mjs --dir <tutorial-dir> [--strict]');
  process.exit(1);
}

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

const defaults = JSON.parse(
  fs.readFileSync(path.join(SKILL_ROOT, 'config/defaults.json'), 'utf8')
);

const coursePath = path.join(dir, 'course.json');
const indexPath = path.join(dir, 'index.html');
if (!fs.existsSync(coursePath)) err('Missing course.json');
if (!fs.existsSync(indexPath)) err('Missing index.html (run assemble-index.mjs)');

let course;
if (fs.existsSync(coursePath)) {
  try {
    course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
  } catch (e) {
    err('course.json parse error: ' + e.message);
  }
}

if (course) {
  if (!course.meta?.slug) err('meta.slug required');
  if (!course.outline?.length) err('outline required');
  const phases = course.outline.map((p) => p.phaseId);
  for (const id of ['basics', 'practice', 'advanced']) {
    if (!phases.includes(id)) err(`outline missing phaseId: ${id}`);
  }
  const generic = ['基础', '实践', '进阶'];
  const titles = course.outline.map((p) => p.phaseTitle);
  if (titles.length === 3 && titles.every((t, i) => t === generic[i])) {
    warn('phaseTitle 均为「基础/实践/进阶」，建议领域化（见 phase-design-prompts）');
  }

  const domainType = course.meta?.domainType || 'B';
  const requiredBlocks = getRequiredBlocks(defaults, domainType);

  const allIds = new Set();
  for (const phase of course.outline) {
    for (const ch of phase.chapters || []) {
      if (allIds.has(ch.id)) err(`duplicate chapter id: ${ch.id}`);
      allIds.add(ch.id);
      const chFile = path.join(dir, 'chapters', `${ch.id}.html`);
      if (!fs.existsSync(chFile)) {
        const msg = `missing chapters/${ch.id}.html`;
        if (strict) err(msg);
        else warn(msg);
        continue;
      }
      const chHtml = fs.readFileSync(chFile, 'utf8');
      const missingBlocks = checkChapterHtml(chHtml, requiredBlocks);
      if (missingBlocks.length) {
        err(`chapters/${ch.id}.html missing blocks (domainType ${domainType}): ${missingBlocks.join(', ')}`);
      }
      const termCount = (chHtml.match(/class="term"/g) || []).length;
      if (termCount < 3) {
        warn(`chapters/${ch.id}.html has ${termCount} terms (recommended ≥3)`);
      }
    }
  }
  if (!fs.existsSync(path.join(dir, 'theme.css'))) warn('missing theme.css');
  if (!fs.existsSync(path.join(dir, 'welcome.partial.html'))) warn('missing welcome.partial.html');
}

if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('id="toast"')) err('index.html missing #toast');
  if (!html.includes('id="term-modal"')) err('index.html missing #term-modal');
  if (!html.includes('id="course-data"')) err('index.html missing #course-data');
  if (html.includes('THEME_KEYWORDS')) err('index.html still contains THEME_KEYWORDS (stale shell)');
  const dataMatch = html.match(/<script id="course-data"[^>]*>([\s\S]*?)<\/script>/);
  if (dataMatch) {
    try {
      const embedded = JSON.parse(dataMatch[1]);
      if (embedded.meta?.shellVersion !== defaults.shellVersion) {
        warn(
          `shellVersion is ${embedded.meta?.shellVersion}, expected ${defaults.shellVersion} — re-run assemble`
        );
      }
    } catch (e) {
      err('embedded course-data JSON invalid');
    }
  }
}

console.log(`Validate: ${dir}${strict ? ' (strict)' : ''}`);
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((w) => console.log('  ⚠', w));
}
if (errors.length) {
  console.log('\nErrors:');
  errors.forEach((e) => console.log('  ✗', e));
  process.exit(1);
}
console.log('\nOK (0 errors' + (warnings.length ? `, ${warnings.length} warnings` : '') + ')');
