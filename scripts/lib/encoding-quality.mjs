/**
 * Detect UTF-8 corruption / stale assemble in Chinese tutorial HTML.
 */

/** Course is treated as Chinese-primary when title/domain/outline use CJK. */
export function courseExpectsCjk(course) {
  const parts = [
    course?.meta?.title,
    course?.meta?.domain,
    ...(course?.outline || []).map((p) => p.phaseTitle),
    ...(course?.outline || []).flatMap((p) => (p.chapters || []).map((c) => c.title)),
  ].filter(Boolean);
  return parts.some((s) => /[\u4e00-\u9fff]/.test(s));
}

/**
 * @returns {string[]} human-readable issues
 */
export function findEncodingIssues(text, { expectCjk = false } = {}) {
  const issues = [];
  if (!text) return issues;

  if (text.includes('\uFFFD')) {
    issues.push('含 UTF-8 替换符 (U+FFFD)，文件可能在错误编码下保存过');
  }

  const qm = text.match(/\?{4,}/g);
  if (qm) {
    issues.push(`含连续问号 (${qm.length} 处，如「${qm[0].slice(0, 12)}…」)，常见于 PowerShell/错误编码写坏中文`);
  }

  if (expectCjk) {
    const h2Matches = [...text.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    for (const m of h2Matches) {
      const plain = m[1].replace(/<[^>]+>/g, '').trim();
      if (plain && !/[\u4e00-\u9fff]/.test(plain) && /[a-zA-Z]/.test(plain)) {
        // English-only h2 in CN course — often OK for practice-01; skip if mostly ASCII tech title
        continue;
      }
      if (plain && !/[\u4e00-\u9fff]/.test(plain) && plain.length > 4) {
        issues.push(`章标题 h2 无中文：「${plain.slice(0, 40)}」`);
        break;
      }
    }
  }

  return issues;
}

export function extractChapterSection(html, chapterId) {
  const re = new RegExp(
    `<section\\s+id="ch-${chapterId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?</section>`,
    'i'
  );
  const m = html.match(re);
  return m ? m[0] : '';
}

/**
 * @param {object} opts
 * @param {string} opts.label - e.g. chapters/foo.html
 * @param {string} opts.text
 * @param {boolean} [opts.expectCjk]
 * @param {(msg: string) => void} opts.onError
 */
export function validateEncoding({ label, text, expectCjk, onError }) {
  for (const issue of findEncodingIssues(text, { expectCjk })) {
    onError(`${label}: ${issue}`);
  }
}

/**
 * After assemble, each outline chapter in index should not be more corrupted than source.
 */
export function validateIndexChapterSync({
  indexHtml,
  chapterId,
  sourceHtml,
  expectCjk,
  onError,
}) {
  const inIndex = extractChapterSection(indexHtml, chapterId);
  if (!inIndex) {
    return;
  }
  validateEncoding({
    label: `index.html#ch-${chapterId}`,
    text: inIndex,
    expectCjk,
    onError,
  });

  const srcIssues = findEncodingIssues(sourceHtml, { expectCjk });
  const idxIssues = findEncodingIssues(inIndex, { expectCjk });
  if (srcIssues.length === 0 && idxIssues.length > 0) {
    onError(
      `index.html#ch-${chapterId} 已损坏但 chapters/${chapterId}.html 正常 — 请 re-run assemble-index.mjs`
    );
  }
}
