#!/usr/bin/env node
/**
 * Validate tutorial source or assembled index.html
 * Usage:
 *   node scripts/validate-tutorial.mjs --dir <project>/courses/<slug>
 *   node scripts/validate-tutorial.mjs --dir <project>/courses/<slug> --strict
 */
import path from 'path';
import { loadDefaults } from './lib/ui-styles.mjs';
import { SKILL_ROOT } from './lib/paths.mjs';
import { validateCourse } from './lib/validate-course.mjs';
import { validateChapters } from './lib/validate-chapter.mjs';
import { validateIndex } from './lib/validate-index.mjs';

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

const defaults = loadDefaults(SKILL_ROOT);

// 1) course.json + welcome/quiz/theme
const courseResult = validateCourse({ dir, defaults, strict, err, warn });

let course = null;
if (courseResult) {
  course = courseResult.course;

  // 2) chapter HTML files
  validateChapters({
    dir,
    course,
    requiredBlocks: courseResult.requiredBlocks,
    domainType: courseResult.domainType,
    expectCjk: courseResult.expectCjk,
    quizHtmlForQuality: courseResult.quizHtmlForQuality,
    welcomeHtmlForQuality: courseResult.welcomeHtmlForQuality,
    strict,
    err,
    warn,
  });
}

// 3) index.html
validateIndex({ dir, course, err, warn });

// report
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
