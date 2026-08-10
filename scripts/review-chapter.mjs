#!/usr/bin/env node
/**
 * Gate 2: chapter quality review
 * Usage:
 *   node scripts/review-chapter.mjs --dir courses/my-course
 *   node scripts/review-chapter.mjs --dir courses/my-course --chapter basics-01-foo
 *   node scripts/review-chapter.mjs --dir courses/my-course --strict
 *   node scripts/review-chapter.mjs --dir courses/my-course --write-json  # 仅调试时落盘
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadQualityConfig,
  getChapterOutlineEntry,
  reviewChapter,
} from './lib/chapter-quality.mjs';
import { info, warn, error, success, plain } from './lib/log.mjs';
import { friendlyError, printFriendlyErrors } from './lib/error-help.mjs';

function getChapterPhaseId(course, chapterId) {
  for (const phase of course.outline || []) {
    for (const ch of phase.chapters || []) {
      if (ch.id === chapterId) return phase.phaseId;
    }
  }
  return null;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');

function parseArgs(argv) {
  const opts = { dir: null, chapter: null, strict: false, writeJson: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = path.resolve(argv[++i]);
    else if (argv[i] === '--chapter') opts.chapter = argv[++i];
    else if (argv[i] === '--strict') opts.strict = true;
    else if (argv[i] === '--write-json') opts.writeJson = true;
  }
  if (!opts.dir) {
    error(
      'Usage: node review-chapter.mjs --dir <tutorial-dir> [--chapter <id>] [--strict] [--write-json]'
    );
    process.exit(1);
  }
  return opts;
}

/** Gate 2 报告仅输出到终端；默认不落盘 courses/<slug>/reviews/ */
function cleanupReviewsDir(reviewsDir, keep) {
  if (keep || !fs.existsSync(reviewsDir)) return;
  for (const name of fs.readdirSync(reviewsDir)) {
    fs.unlinkSync(path.join(reviewsDir, name));
  }
  fs.rmdirSync(reviewsDir);
}

function main() {
  const opts = parseArgs(process.argv);
  const config = loadQualityConfig(SKILL_ROOT);
  const coursePath = path.join(opts.dir, 'course.json');
  if (!fs.existsSync(coursePath)) {
    error('Missing course.json');
    process.exit(1);
  }
  const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
  const quizHtml = fs.existsSync(path.join(opts.dir, 'quiz.partial.html'))
    ? fs.readFileSync(path.join(opts.dir, 'quiz.partial.html'), 'utf8')
    : '';
  const welcomeHtml = fs.existsSync(path.join(opts.dir, 'welcome.partial.html'))
    ? fs.readFileSync(path.join(opts.dir, 'welcome.partial.html'), 'utf8')
    : '';
  const quizAndWelcome = quizHtml + welcomeHtml;

  const chapterIds = [];
  if (opts.chapter) {
    chapterIds.push(opts.chapter);
  } else {
    const chaptersDir = path.join(opts.dir, 'chapters');
    if (fs.existsSync(chaptersDir)) {
      fs.readdirSync(chaptersDir)
        .filter((f) => f.endsWith('.html'))
        .forEach((f) => chapterIds.push(f.replace(/\.html$/, '')));
    }
  }

  if (!chapterIds.length) {
    info('No chapters to review.');
    process.exit(0);
  }

  const reviewsDir = path.join(opts.dir, 'reviews');
  if (opts.writeJson) fs.mkdirSync(reviewsDir, { recursive: true });

  let errorCount = 0;
  let warnCount = 0;
  const allErrors = [];
  const allWarnings = [];
  const allSuggestions = [];

  info(`Review chapters: ${opts.dir}${opts.strict ? ' (strict)' : ''}\n`);

  for (const chapterId of chapterIds.sort()) {
    const chFile = path.join(opts.dir, 'chapters', `${chapterId}.html`);
    if (!fs.existsSync(chFile)) {
      info(`  ✗ ${chapterId}: missing chapters/${chapterId}.html`);
      errorCount++;
      continue;
    }
    const html = fs.readFileSync(chFile, 'utf8');
    const outlineChapter = getChapterOutlineEntry(course, chapterId);
    const report = reviewChapter({
      html,
      chapterId,
      outlineChapter,
      quizHtml: quizAndWelcome,
      quizzes: course.quizzes,
      config,
      terms: course.terms || {},
      phaseId: getChapterPhaseId(course, chapterId),
    });

    if (opts.writeJson) {
      fs.writeFileSync(
        path.join(reviewsDir, `${chapterId}.json`),
        JSON.stringify(report, null, 2),
        'utf8'
      );
    }

    const status = report.passed ? 'OK' : 'FAIL';
    info(`[${status}] ${chapterId}`);
    report.errors.forEach((e) => {
      errorCount++;
    });
    report.warnings.forEach((w) => {
      warnCount++;
      if (opts.strict) errorCount++;
    });
    report.suggestions.forEach((s) => {}); // suggestions 不计数

    // 收集本章友好化错误
    for (const e of report.errors) {
      allErrors.push(friendlyError(e, chapterId));
    }
    for (const w of report.warnings) {
      allWarnings.push(friendlyError(w, chapterId));
    }
    for (const s of report.suggestions) {
      allSuggestions.push({ label: chapterId, text: s });
    }

    if (report.errors.length || report.warnings.length || report.suggestions.length) {
      // 仍先输出简版摘要
      report.errors.forEach((e) => info(`  ✗ ${e}`));
      report.warnings.forEach((w) => info(`  ⚠ ${w}`));
      report.suggestions.forEach((s) => info(`  · ${s}`));
      info('');
    }
  }

  cleanupReviewsDir(reviewsDir, opts.writeJson);

  // 友好化汇总输出
  if (allErrors.length || allWarnings.length) {
    info('\n' + '='.repeat(60));
    info('详细修复指南');
    info('='.repeat(60));
    printFriendlyErrors(allErrors, allWarnings);
  }

  if (allSuggestions.length) {
    info('\n💡 改进建议 (Suggestions)\n' + '─'.repeat(60));
    for (const s of allSuggestions) {
      info(`  [${s.label}] ${s.text}`);
    }
    info();
  }

  if (errorCount > 0) {
    info(`\nReview failed (${errorCount} issue(s)${opts.strict && warnCount ? ', strict mode' : ''})`);
    process.exit(1);
  }
  info(`\nReview OK (${chapterIds.length} chapter(s)${warnCount ? `, ${warnCount} warning(s)` : ''})`);
}

main();
