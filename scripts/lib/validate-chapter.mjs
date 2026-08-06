/**
 * Validate individual chapter HTML files.
 */
import fs from 'fs';
import path from 'path';
import {
  loadQualityConfig,
  getChapterOutlineEntry,
  getChapterPhaseId,
  reviewChapter,
  countTerms,
  extractTermIds,
  isTheoryChapter,
} from './chapter-quality.mjs';
import { checkChapterHtml } from './chapter-blocks.mjs';
import { validateEncoding } from './encoding-quality.mjs';
import { SKILL_ROOT } from './paths.mjs';

export function validateChapters({
  dir,
  course,
  requiredBlocks,
  domainType,
  expectCjk,
  quizHtmlForQuality,
  welcomeHtmlForQuality,
  strict,
  err,
  warn,
}) {
  const allIds = new Set();
  const qualityConfig = strict ? loadQualityConfig(SKILL_ROOT) : null;

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
}
