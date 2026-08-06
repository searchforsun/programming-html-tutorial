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
import {
  loadQualityConfig,
  getChapterOutlineEntry,
  getChapterPhaseId,
  reviewChapter,
} from './lib/chapter-quality.mjs';
import { SKILL_ROOT } from './lib/paths.mjs';

function parseArgs(argv) {
  const opts = { dir: null, chapter: null, strict: false, writeJson: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = path.resolve(argv[++i]);
    else if (argv[i] === '--chapter') opts.chapter = argv[++i];
    else if (argv[i] === '--strict') opts.strict = true;
    else if (argv[i] === '--write-json') opts.writeJson = true;
  }
  if (!opts.dir) {
    console.error(
      'Usage: node review-chapter.mjs --dir <tutorial-dir> [--chapter <id>] [--strict] [--write-json]'
    );
    process.exit(1);
  }
  return opts;
}

/** Gate 2 报告仅输出到终端；默认不落盘 courses/<slug>/reviews/ */
function cleanupReviewsDir(reviewsDir, keep) {
  if (keep || !fs.existsSync(reviewsDir)) return;
  // 安全检查：仅清理名为 reviews 的目录
  if (path.basename(reviewsDir) !== 'reviews') {
    console.warn(`cleanupReviewsDir: path not named reviews, skipping: ${reviewsDir}`);
    return;
  }
  fs.rmSync(reviewsDir, { recursive: true, force: true });
}

function main() {
  const opts = parseArgs(process.argv);
  const config = loadQualityConfig(SKILL_ROOT);
  const coursePath = path.join(opts.dir, 'course.json');
  if (!fs.existsSync(coursePath)) {
    console.error('Missing course.json');
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
    console.log('No chapters to review.');
    process.exit(0);
  }

  const reviewsDir = path.join(opts.dir, 'reviews');
  if (opts.writeJson) fs.mkdirSync(reviewsDir, { recursive: true });

  let errorCount = 0;
  let warnCount = 0;

  console.log(`Review chapters: ${opts.dir}${opts.strict ? ' (strict)' : ''}\n`);

  for (const chapterId of chapterIds.sort()) {
    const chFile = path.join(opts.dir, 'chapters', `${chapterId}.html`);
    if (!fs.existsSync(chFile)) {
      console.log(`  ✗ ${chapterId}: missing chapters/${chapterId}.html`);
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
    console.log(`[${status}] ${chapterId}`);
    report.errors.forEach((e) => {
      console.log(`  ✗ ${e}`);
      errorCount++;
    });
    report.warnings.forEach((w) => {
      console.log(`  ⚠ ${w}`);
      warnCount++;
      if (opts.strict) errorCount++;
    });
    report.suggestions.forEach((s) => console.log(`  · ${s}`));
    if (report.errors.length || report.warnings.length || report.suggestions.length) {
      console.log('');
    }
  }

  cleanupReviewsDir(reviewsDir, opts.writeJson);

  if (errorCount > 0) {
    console.log(`\nReview failed (${errorCount} issue(s)${opts.strict && warnCount ? ', strict mode' : ''})`);
    process.exit(1);
  }
  console.log(`\nReview OK (${chapterIds.length} chapter(s)${warnCount ? `, ${warnCount} warning(s)` : ''})`);
}

main();
