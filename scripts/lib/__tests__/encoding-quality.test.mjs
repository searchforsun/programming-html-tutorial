import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  findEncodingIssues,
  courseExpectsCjk,
  extractChapterSection,
} from '../encoding-quality.mjs';

describe('findEncodingIssues', () => {
  it('returns empty array for clean text', () => {
    const issues = findEncodingIssues('<p>正常中文内容</p>');
    assert.deepStrictEqual(issues, []);
  });

  it('returns empty array for empty string', () => {
    assert.deepStrictEqual(findEncodingIssues(''), []);
  });

  it('detects Unicode replacement character', () => {
    const issues = findEncodingIssues('这是损坏的文本\uFFFD继续');
    assert.ok(issues.some((s) => s.includes('U+FFFD')));
  });

  it('detects consecutive question marks', () => {
    const issues = findEncodingIssues('输出????可能损坏');
    assert.ok(issues.some((s) => s.includes('连续问号')));
  });

  it('detects CJK-free h2 when expectCjk is true', () => {
    // 纯数字/符号标题（无中文、无英文），长度 >4，触发无中文检测
    const html = '<h2>01 — — —</h2><p>内容</p>';
    const issues = findEncodingIssues(html, { expectCjk: true });
    assert.ok(issues.some((s) => s.includes('无中文')));
  });

  it('does not flag short ASCII h2 in CJK mode', () => {
    const html = '<h2>API</h2><p>内容</p>';
    const issues = findEncodingIssues(html, { expectCjk: true });
    assert.ok(!issues.some((s) => s.includes('无中文')));
  });
});

describe('courseExpectsCjk', () => {
  it('returns true for Chinese title', () => {
    assert.ok(courseExpectsCjk({ meta: { title: 'Spring Boot 实战指南' } }));
  });

  it('returns true for Chinese outline', () => {
    assert.ok(
      courseExpectsCjk({
        outline: [{ phaseTitle: '基础篇', chapters: [{ title: '快速入门' }] }],
      })
    );
  });

  it('returns false for all-English course', () => {
    assert.ok(!courseExpectsCjk({ meta: { title: 'Getting Started' } }));
  });

  it('returns false for empty course', () => {
    assert.ok(!courseExpectsCjk({}));
  });
});

describe('extractChapterSection', () => {
  it('extracts section by chapterId', () => {
    const html = '<section id="ch-basics-01"><h2>Title</h2><p>content</p></section><section id="ch-basics-02">other</section>';
    const section = extractChapterSection(html, 'basics-01');
    assert.ok(section.includes('Title'));
    assert.ok(section.includes('content'));
    assert.ok(!section.includes('other'));
  });

  it('escapes regex special characters in chapterId', () => {
    const html = '<section id="ch-test.abc+def"><p>match</p></section>';
    const section = extractChapterSection(html, 'test.abc+def');
    assert.ok(section.includes('match'));
  });

  it('returns empty string for missing chapter', () => {
    assert.strictEqual(extractChapterSection('<section id="ch-a">x</section>', 'ch-b'), '');
  });
});
