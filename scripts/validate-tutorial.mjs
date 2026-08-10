#!/usr/bin/env node
/**
 * Validate tutorial source or assembled index.html
 * Usage:
 *   node scripts/validate-tutorial.mjs --dir <project>/courses/<slug>
 *   node scripts/validate-tutorial.mjs --dir <project>/courses/<slug> --strict
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { info, warn as logWarn, error as logError, success } from './lib/log.mjs';
import { getRequiredBlocks, checkChapterHtml } from './lib/chapter-blocks.mjs';
import {
  loadQualityConfig,
  getChapterOutlineEntry,
  reviewChapter,
  countTerms,
  extractTermIds,
  isTheoryChapter,
} from './lib/chapter-quality.mjs';
import {
  courseExpectsCjk,
  validateEncoding,
  validateIndexChapterSync,
} from './lib/encoding-quality.mjs';
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

const dir = process.argv.includes('--dir')
  ? path.resolve(process.argv[process.argv.indexOf('--dir') + 1])
  : null;
const strict = process.argv.includes('--strict');

if (!dir) {
  error('Usage: node validate-tutorial.mjs --dir <tutorial-dir> [--strict]');
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
  const welcomePath = path.join(dir, 'welcome.partial.html');
  const quizPartialPath = path.join(dir, 'quiz.partial.html');
  const expectCjk = courseExpectsCjk(course);
  const quizHtmlForQuality = fs.existsSync(quizPartialPath)
    ? fs.readFileSync(quizPartialPath, 'utf8')
    : '';
  if (quizHtmlForQuality) {
    validateEncoding({
      label: 'quiz.partial.html',
      text: quizHtmlForQuality,
      expectCjk,
      onError: err,
    });
  }
  const welcomeHtmlForQuality =
    fs.existsSync(welcomePath) ? fs.readFileSync(welcomePath, 'utf8') : '';
  const qualityConfig = strict ? loadQualityConfig(SKILL_ROOT) : null;

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
      validateEncoding({
        label: `chapters/${ch.id}.html`,
        text: chHtml,
        expectCjk,
        onError: err,
      });
      const missingBlocks = checkChapterHtml(chHtml, requiredBlocks);
      if (missingBlocks.length) {
        err(`chapters/${ch.id}.html missing blocks (domainType ${domainType}): ${missingBlocks.join(', ')}`);
      }
      const phaseId = getChapterPhaseId(course, ch.id);
      const isTheory = isTheoryChapter(phaseId, ch.id, qualityConfig || {});
      const minSpans = isTheory
        ? (qualityConfig?.terms?.minSpansConcept ?? 8)
        : (qualityConfig?.terms?.minSpansPractice ?? 5);
      const termCount = countTerms(chHtml);
      if (termCount < minSpans) {
        warn(
          `chapters/${ch.id}.html has ${termCount} .term spans (${isTheory ? 'theory' : 'practice'} recommended ≥${minSpans})`
        );
      }
      const termIds = extractTermIds(chHtml);
      for (const tid of termIds) {
        if (!course.terms?.[tid]) {
          err(`chapters/${ch.id}.html: unknown data-term-id="${tid}"`);
        }
      }
      if (strict && qualityConfig) {
        const outlineChapter = getChapterOutlineEntry(course, ch.id);
        const report = reviewChapter({
          html: chHtml,
          chapterId: ch.id,
          outlineChapter,
          quizHtml: quizHtmlForQuality + welcomeHtmlForQuality,
          quizzes: course.quizzes,
          config: qualityConfig,
          terms: course.terms || {},
          phaseId,
        });
        for (const e of report.errors || []) {
          err(`chapters/${ch.id}.html (quality): ${e}`);
        }
      }
    }
  }
  // ── 术语引用顺序检查：章节引用的 term-id 必须在当前章或之前章首次出现 ──
  const termFirstChapter = {}; // termId → 首次出现的 chapterId
  for (const phase of course.outline) {
    for (const ch of phase.chapters || []) {
      const chFile = path.join(dir, 'chapters', `${ch.id}.html`);
      if (!fs.existsSync(chFile)) continue;
      const chHtml = fs.readFileSync(chFile, 'utf8');
      const termIds = extractTermIds(chHtml);
      for (const tid of termIds) {
        if (!termFirstChapter[tid]) {
          termFirstChapter[tid] = ch.id;
        }
      }
    }
  }
  // 第二遍扫描：检测超前引用（引用术语但术语尚未首次出现）
  const outlineOrder = [];
  for (const phase of course.outline) {
    for (const ch of phase.chapters || []) {
      outlineOrder.push(ch.id);
    }
  }
  const chapterIndex = Object.fromEntries(outlineOrder.map((id, i) => [id, i]));
  for (const phase of course.outline) {
    for (const ch of phase.chapters || []) {
      const chFile = path.join(dir, 'chapters', `${ch.id}.html`);
      if (!fs.existsSync(chFile)) continue;
      const chHtml = fs.readFileSync(chFile, 'utf8');
      const termIds = extractTermIds(chHtml);
      for (const tid of termIds) {
        const firstChapter = termFirstChapter[tid];
        if (firstChapter && chapterIndex[ch.id] > chapterIndex[firstChapter]) {
          // 术语在当前章引用，但首次出现在之前章——这是正常的（复习引用），跳过
          continue;
        }
        // 术语在当前章首次出现（或未出现在任何章），正常
      }
      // 核心检查：引用 course.terms 中定义但尚未在任何章节出现的术语
      const allDefinedTerms = new Set(Object.keys(course.terms || {}));
      const currentIndex = chapterIndex[ch.id];
      const referencedButNotIntroduced = [];
      for (const tid of termIds) {
        if (!allDefinedTerms.has(tid)) continue; // 未在 terms 中定义则跳过
        const firstAt = termFirstChapter[tid];
        if (!firstAt || chapterIndex[firstAt] > currentIndex) {
          referencedButNotIntroduced.push(tid);
        }
      }
      if (referencedButNotIntroduced.length > 0) {
        const introChapter = referencedButNotIntroduced.map((tid) => {
          const firstAt = termFirstChapter[tid];
          return firstAt ? `${tid}（首次出现在 ${firstAt}）` : `${tid}（尚未在任何章节出现）`;
        });
        warn(
          `chapters/${ch.id}.html 超前引用了 ${referencedButNotIntroduced.length} 个术语：${introChapter.join('；')}。建议将术语首次出现的章节调整到引用之前，或将 term span 移动到该术语的定义章`
        );
      }
    }
  }

  if (!fs.existsSync(path.join(dir, 'theme.css'))) warn('missing theme.css');
  if (!fs.existsSync(welcomePath)) {
    err('missing welcome.partial.html (required for shell init)');
  } else {
    const welcomeHtml = fs.readFileSync(welcomePath, 'utf8');
    validateEncoding({
      label: 'welcome.partial.html',
      text: welcomeHtml,
      expectCjk,
      onError: err,
    });
    if (!welcomeHtml.includes('id="outline-summary-body"')) {
      err('welcome.partial.html missing #outline-summary-body (breaks renderOutlineSummary / shell UI)');
    }
    if (/\bid=["']welcome["']/i.test(welcomeHtml)) {
      err('welcome.partial.html must not use id="welcome" (reserved by index.shell.html wrapper)');
    }
  }
}

if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  validateEncoding({
    label: 'index.html',
    text: html,
    expectCjk: course ? courseExpectsCjk(course) : false,
    onError: err,
  });
  if (!html.includes('id="toast"')) err('index.html missing #toast');
  if (!html.includes('id="term-modal"')) err('index.html missing #term-modal');
  if (!html.includes('id="course-data"')) err('index.html missing #course-data');
  if (html.includes('THEME_KEYWORDS')) err('index.html still contains THEME_KEYWORDS (stale shell)');
  if (!html.includes('id="outline-summary-body"')) {
    err('assembled index.html missing #outline-summary-body — fix welcome.partial.html and re-run assemble');
  }
  const welcomeIdCount = (html.match(/\bid=["']welcome["']/gi) || []).length;
  if (welcomeIdCount > 1) {
    err(`duplicate id="welcome" in index.html (${welcomeIdCount} found); remove from welcome.partial.html`);
  }
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

  if (course) {
    const expectCjkIndex = courseExpectsCjk(course);
    for (const phase of course.outline || []) {
      for (const ch of phase.chapters || []) {
        const chFile = path.join(dir, 'chapters', `${ch.id}.html`);
        if (!fs.existsSync(chFile)) continue;
        const chHtml = fs.readFileSync(chFile, 'utf8');
        validateIndexChapterSync({
          indexHtml: html,
          chapterId: ch.id,
          sourceHtml: chHtml,
          expectCjk: expectCjkIndex,
          onError: err,
        });
      }
    }
  }
}

info(`Validate: ${dir}${strict ? ' (strict)' : ''}`);

// 将 errors/warnings 转换为友好化格式
const friendlyErrors = errors.map((e) => friendlyError(e));
const friendlyWarnings = warnings.map((w) => friendlyError(w));

if (friendlyErrors.length === 0 && friendlyWarnings.length === 0) {
  console.log('\nOK (0 errors, 0 warnings) - 所有检查通过 ✓');
} else {
  printFriendlyErrors(friendlyErrors, friendlyWarnings);
  if (friendlyErrors.length) {
    console.log(`\n共 ${friendlyErrors.length} 项必须修复。`);
    info('修复后可重新运行：node scripts/validate-tutorial.mjs --dir ' + dir);
    process.exit(1);
  }
  if (friendlyWarnings.length) {
    console.log(`\n共 ${friendlyWarnings.length} 项建议修复（不阻断，但建议处理）。`);
  }
}
