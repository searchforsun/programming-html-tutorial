/**
 * Validate assembled index.html.
 */
import fs from 'fs';
import path from 'path';
import { courseExpectsCjk, validateEncoding, validateIndexChapterSync } from './encoding-quality.mjs';
import { loadDefaults } from './ui-styles.mjs';
import { SKILL_ROOT } from './paths.mjs';

export function validateIndex({ dir, course, err, warn }) {
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    err('Missing index.html (run assemble-index.mjs)');
    return;
  }

  const defaults = loadDefaults(SKILL_ROOT);
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
