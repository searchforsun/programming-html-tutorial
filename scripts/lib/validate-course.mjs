/**
 * Validate course.json structure and associated partials (welcome/quiz/theme).
 */
import fs from 'fs';
import path from 'path';
import { getRequiredBlocks } from './chapter-blocks.mjs';
import { courseExpectsCjk, validateEncoding } from './encoding-quality.mjs';

export function validateCourse({ dir, defaults, strict, err, warn }) {
  const coursePath = path.join(dir, 'course.json');
  if (!fs.existsSync(coursePath)) {
    err('Missing course.json');
    return null;
  }

  let course;
  try {
    course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
  } catch (e) {
    err('course.json parse error: ' + e.message);
    return null;
  }

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
  const expectCjk = courseExpectsCjk(course);

  // quiz.partial.html
  const quizPartialPath = path.join(dir, 'quiz.partial.html');
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

  // welcome.partial.html
  const welcomePath = path.join(dir, 'welcome.partial.html');
  const welcomeHtmlForQuality =
    fs.existsSync(welcomePath) ? fs.readFileSync(welcomePath, 'utf8') : '';

  // theme.css
  if (!fs.existsSync(path.join(dir, 'theme.css'))) warn('missing theme.css');

  // welcome.partial.html structural checks
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

  return { course, requiredBlocks, expectCjk, quizHtmlForQuality, welcomeHtmlForQuality, domainType };
}
