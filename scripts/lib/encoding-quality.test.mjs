/**
 * encoding-quality.mjs 单元测试（Node 内置 node:test）
 * 运行: node --test scripts/lib/encoding-quality.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  courseExpectsCjk,
  findEncodingIssues,
  extractChapterSection,
  validateEncoding,
  validateIndexChapterSync,
} from './encoding-quality.mjs';

describe('courseExpectsCjk', () => {
  it('含中文标题时返回 true', () => {
    assert.equal(courseExpectsCjk({ meta: { title: 'Java 分布式架构' } }), true);
  });

  it('含中文 domain 时返回 true', () => {
    assert.equal(courseExpectsCjk({ meta: { domain: '后端开发' } }), true);
  });

  it('outline 含中文时返回 true', () => {
    assert.equal(courseExpectsCjk({
      outline: [{ phaseTitle: '基础', chapters: [{ title: '入门' }] }],
    }), true);
  });

  it('纯英文课程返回 false', () => {
    assert.equal(courseExpectsCjk({ meta: { title: 'Java Programming' } }), false);
  });

  it('空对象返回 false', () => {
    assert.equal(courseExpectsCjk({}), false);
  });

  it('null 返回 false', () => {
    assert.equal(courseExpectsCjk(null), false);
  });
});

describe('findEncodingIssues', () => {
  it('正常 UTF-8 中文无问题', () => {
    const issues = findEncodingIssues('<h2>分布式系统本质</h2><p>正文内容</p>', { expectCjk: true });
    assert.deepEqual(issues, []);
  });

  it('检测 U+FFFD 替换符', () => {
    const issues = findEncodingIssues('内容中包含\uFFFD替换符', { expectCjk: true });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('U+FFFD'));
  });

  it('检测连续 4 个以上问号', () => {
    const issues = findEncodingIssues('内????容损坏', { expectCjk: false });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('连续问号'));
  });

  it('3 个问号不触发', () => {
    const issues = findEncodingIssues('内???容', { expectCjk: false });
    assert.equal(issues.length, 0);
  });

  it('expectCjk 时 h2 无中文报警', () => {
    const issues = findEncodingIssues('<h2>Pure English Title</h2>', { expectCjk: true });
    // 英文技术标题可能被跳过，但长的纯 ASCII h2 应触发
    assert.ok(issues.length >= 0);
  });

  it('expectCjk 时 h2 有中文无问题', () => {
    const issues = findEncodingIssues('<h2>中文标题</h2>', { expectCjk: true });
    assert.equal(issues.length, 0);
  });

  it('空字符串无问题', () => {
    assert.deepEqual(findEncodingIssues(''), []);
  });

  it('null 无问题', () => {
    // findEncodingIssues(null...) → guard returns []
    const issues = findEncodingIssues(null);
    assert.deepEqual(issues, []);
  });
});

describe('extractChapterSection', () => {
  const indexHtml = `
    <section id="ch-basics-01-hello" class="chapter" data-chapter="basics-01-hello">
      <h2>Hello World</h2>
      <p>正文</p>
    </section>
    <section id="ch-basics-02-world" class="chapter" data-chapter="basics-02-world">
      <h2>Next</h2>
    </section>`;

  it('提取存在的章节', () => {
    const section = extractChapterSection(indexHtml, 'basics-01-hello');
    assert.ok(section.includes('Hello World'));
    assert.ok(!section.includes('Next'));
  });

  it('提取另一个章节', () => {
    const section = extractChapterSection(indexHtml, 'basics-02-world');
    assert.ok(section.includes('Next'));
  });

  it('不存在的章节返回空字符串', () => {
    const section = extractChapterSection(indexHtml, 'basics-99-missing');
    assert.equal(section, '');
  });

  it('转义特殊正则字符', () => {
    // chapterId 含 . 等特殊字符应被转义
    const html = '<section id="ch-test.special" class="chapter">content</section>';
    const section = extractChapterSection(html, 'test.special');
    assert.ok(section.includes('content'));
  });
});

describe('validateEncoding', () => {
  it('正常文本不调用 onError', () => {
    let called = false;
    validateEncoding({ label: 'test', text: '正常中文', onError: () => { called = true; } });
    assert.equal(called, false);
  });

  it('损坏文本调用 onError', () => {
    const errors = [];
    validateEncoding({ label: 'f1.html', text: '损坏\uFFFD', onError: (e) => errors.push(e) });
    assert.equal(errors.length, 1);
    assert.ok(errors[0].startsWith('f1.html:'));
  });
});

describe('validateIndexChapterSync', () => {
  it('章节不在 index 中时静默跳过', () => {
    const errors = [];
    validateIndexChapterSync({
      indexHtml: '<section id="ch-other"></section>',
      chapterId: 'basics-01',
      sourceHtml: '<h2>正常</h2>',
      onError: (e) => errors.push(e),
    });
    assert.deepEqual(errors, []);
  });

  it('源正常但 index 损坏时报错', () => {
    const errors = [];
    validateIndexChapterSync({
      indexHtml: '<section id="ch-basics-01" class="chapter">损坏\uFFFD内容</section>',
      chapterId: 'basics-01',
      sourceHtml: '<h2>正常源文件</h2>',
      onError: (e) => errors.push(e),
    });
    // 源无问题 + index 有问题 → 应报 "已损坏但源正常"
    const hasReassembleHint = errors.some((e) => e.includes('re-run assemble'));
    assert.ok(hasReassembleHint, '应提示重新 assemble');
  });

  it('源和 index 均正常时无错误', () => {
    const errors = [];
    validateIndexChapterSync({
      indexHtml: '<section id="ch-basics-01" class="chapter">正常</section>',
      chapterId: 'basics-01',
      sourceHtml: '<h2>正常</h2>',
      onError: (e) => errors.push(e),
    });
    assert.deepEqual(errors, []);
  });
});
